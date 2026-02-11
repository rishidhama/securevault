/**
 * Batch Queue Service
 * 
 * Coalesces vault updates and flushes when there are 10-20 changes or after 30 minutes.
 * Supports both L1 and L2 contracts.
 */

const ethereumService = require('./ethereum-service');

class BatchQueue {
  constructor() {
    /**
     * Pending state per user:
     * userId -> {
     *   userId,
     *   latestVaultHash,
     *   pendingCount,       // number of distinct hash changes since last flush
     *   firstPendingAt,     // when current pending window started
     *   lastChangedAt,      // last time vaultHash changed
     *   lastSeenAt,         // last queueUpdate call time (even if no hash change)
     *   retries
     * }
     */
    this.pending = new Map();
    
    // Configuration
    this.minUpdates = parseInt(process.env.BATCH_MIN_UPDATES || '10', 10);
    this.maxUpdates = parseInt(process.env.BATCH_MAX_UPDATES || '20', 10);
    this.checkIntervalMs = parseInt(process.env.BATCH_CHECK_INTERVAL || '30000', 10);
    this.maxWaitMs = parseInt(process.env.BATCH_MAX_WAIT_MS || String(30 * 60 * 1000), 10);
    this.maxRetries = parseInt(process.env.BATCH_MAX_RETRIES || '3', 10);
    
    // Periodic check timer
    this.checkTimer = null;
    
    // Statistics
    this.stats = {
      totalQueued: 0, // queueUpdate calls
      totalChanged: 0, // distinct hash changes (pendingCount increments)
      totalBatched: 0,
      totalIndividual: 0,
      totalFailed: 0
    };
    
    // Start periodic check
    this.startCheckTimer();
  }


  /**
   * Add a vault hash update to the queue
   * @param {string} userId - User identifier
   * @param {string} vaultHash - Merkle root or integrity hash
   * @returns {Promise<Object>} Promise that resolves when queued (not when sent)
   */
  async queueUpdate(userId, vaultHash) {
    if (!ethereumService.initialized) {
      // If blockchain is disabled, just return success
      return { success: true, queued: false, reason: 'blockchain_disabled' };
    }

    if (process.env.BATCH_ENABLED !== 'true') {
      return this.flushImmediate(userId, vaultHash);
    }

    const now = Date.now();
    const existing = this.pending.get(userId);
    const prevHash = existing ? existing.latestVaultHash : null;
    const changed = prevHash !== vaultHash;

    if (!existing) {
      this.pending.set(userId, {
        userId,
        latestVaultHash: vaultHash,
        pendingCount: changed ? 1 : 0,
        firstPendingAt: changed ? now : null,
        lastChangedAt: changed ? now : null,
        lastSeenAt: now,
        retries: 0
      });
    } else {
      existing.lastSeenAt = now;
      if (changed) {
        existing.latestVaultHash = vaultHash;
        existing.pendingCount += 1;
        existing.lastChangedAt = now;
        if (!existing.firstPendingAt) existing.firstPendingAt = now;
      }
    }

    this.stats.totalQueued++;
    if (changed) this.stats.totalChanged++;

    // Flush immediately if user pendingCount hits maxUpdates (upper bound of hybrid window)
    const state = this.pending.get(userId);
    if (state && state.pendingCount >= this.maxUpdates) {
      await this.flushDueUsers({ forceUserId: userId });
    }

    return {
      success: true,
      queued: true,
      changed,
      pendingCount: state ? state.pendingCount : 0
    };
  }

  /**
   * Determine whether a user's pending state is due for flush.
   * @param {object} s - pending state
   * @param {number} now - current time
   * @returns {boolean}
   */
  _isDue(s, now) {
    if (!s || !s.latestVaultHash) return false;
    if (!s.pendingCount || s.pendingCount <= 0) return false;//only flush if there were changes
    const age = s.firstPendingAt ? (now - s.firstPendingAt) : 0;
    if (age >= this.maxWaitMs) return true;//flush if it's been too long
    //for size-based hybrid : allow flush at minUpdates 
    if (s.pendingCount >= this.minUpdates) return true;//flush if there are too many changes
    return false;//otherwise, don't flush
  }

  /**
   * Flush due users.
   * - L2: try batch across multiple users (up to maxUpdates users per tx); fallback to individual.
   * - L1: individual updates only (still coalesced).
   *
   * @param {{forceUserId?: string}} opts
   */
  async flushDueUsers(opts = {}) {
    const now = Date.now();
    const contractVersion = process.env.CONTRACT_VERSION || 'legacy';

    // Build list of due user states
    const dueStates = [];
    for (const s of this.pending.values()) {
      if (opts.forceUserId && s.userId !== opts.forceUserId) continue;
      if (this._isDue(s, now)) dueStates.push(s);
    }
    if (dueStates.length === 0) return { success: true, flushed: 0, mode: 'noop' };

    // Sort by oldest pending window first
    dueStates.sort((a, b) => (a.firstPendingAt || 0) - (b.firstPendingAt || 0));

    // Limit per flush cycle (avoid giant tx / long loop). Use maxUpdates as a natural cap.
    const slice = dueStates.slice(0, Math.max(1, this.maxUpdates));

    if (contractVersion === 'l2' && slice.length > 1) {
      // Try L2 batch update (multi-user)
      const updates = slice.map(s => ({ userId: s.userId, vaultHash: s.latestVaultHash }));
      try {
        const result = await ethereumService.batchStoreVaultHash(updates);
        if (!result.success) throw new Error(result.error || 'Batch update failed');

        // Mark flushed
        for (const s of slice) this._markFlushed(s.userId);
        this.stats.totalBatched += slice.length;
        // eslint-disable-next-line no-console
        console.log(`Batch update successful: ${slice.length} users, tx: ${result.txHash}`);
        return { success: true, flushed: slice.length, mode: 'batch', txHash: result.txHash };
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Batch update failed:`, error.message);
        // Fallback to individual (coalesced)
        await this._flushIndividually(slice);
        return { success: false, flushed: slice.length, mode: 'fallback_individual', error: error.message };
      }
    }

    // L1 or single-user: flush individually
    await this._flushIndividually(slice);
    return { success: true, flushed: slice.length, mode: 'individual' };
  }

  _markFlushed(userId) {
    const s = this.pending.get(userId);
    if (!s) return;
    s.pendingCount = 0;
    s.firstPendingAt = null;
    s.lastChangedAt = null;
    s.retries = 0;
    // keep latestVaultHash and lastSeenAt for observability
  }

  async _flushIndividually(states) {
    const promises = states.map(async (s) => {
      try {
        const r = await ethereumService.storeVaultHash(s.userId, s.latestVaultHash);
        if (r && r.success) {
          this.stats.totalIndividual += 1;
          this._markFlushed(s.userId);
        } else {
          this.stats.totalFailed += 1;
        }
        return r;
      } catch (e) {
        this.stats.totalFailed += 1;
        return { success: false, error: e.message };
      }
    });
    await Promise.allSettled(promises);
  }

  /**
   * Flush a specific user's pending update (if due or forced by caller).
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} Flush result
   */
  async flushUserQueue(userId) {
    // For API callers, treat as "force flush if there are pending changes"
    const s = this.pending.get(userId);
    if (!s || !s.pendingCount) return { success: true, flushed: 0 };
    try {
      const r = await ethereumService.storeVaultHash(userId, s.latestVaultHash);
      if (r && r.success) {
        this.stats.totalIndividual += 1;
        this._markFlushed(userId);
      } else {
        this.stats.totalFailed += 1;
      }
      return { success: !!(r && r.success), flushed: r && r.success ? 1 : 0, txHash: r ? r.txHash : null };
    } catch (e) {
      this.stats.totalFailed += 1;
      return { success: false, flushed: 0, error: e.message };
    }
  }

  /**
   * Flush all user queues
   * @returns {Promise<Object>} Flush results
   */
  async flushAll() {
    return this.flushDueUsers();
  }

  /**
   * Flush immediately (bypass queue) - for legacy contracts or urgent updates
   * @param {string} userId - User identifier
   * @param {string} vaultHash - Vault hash
   * @returns {Promise<Object>} Update result
   */
  async flushImmediate(userId, vaultHash) {
    try {
      const result = await ethereumService.storeVaultHash(userId, vaultHash);
      this.stats.totalIndividual++;
      return result;
    } catch (error) {
      this.stats.totalFailed++;
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Start periodic due-check timer.
   * Important: this does NOT flush unless there are pending changes.
   */
  startCheckTimer() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }

    this.checkTimer = setInterval(async () => {
      try {
        // Only act if there is anything pending at all
        if (this.getTotalPendingCount() > 0) {
          await this.flushDueUsers();
        }
      } catch (error) {
        console.error('Periodic flush error:', error.message);
      }
    }, this.checkIntervalMs);

    console.log(
      `Batch queue started: check every ${this.checkIntervalMs}ms, hybrid window ${this.minUpdates}-${this.maxUpdates} updates or ${this.maxWaitMs}ms`
    );
  }

  /**
   * Stop check timer
   */
  stopFlushTimer() {
    // Back-compat name
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  getTotalPendingCount() {
    let total = 0;
    for (const s of this.pending.values()) total += (s.pendingCount || 0);
    return total;
  }

  /**
   * Get queue statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const pendingUsers = Array.from(this.pending.values()).map((s) => ({
      userId: s.userId,
      pendingCount: s.pendingCount || 0,
      firstPendingAt: s.firstPendingAt,
      lastChangedAt: s.lastChangedAt,
      lastSeenAt: s.lastSeenAt
    }));

    return {
      ...this.stats,
      pendingUsers,
      totalPendingNow: this.getTotalPendingCount(),
      config: {
        minUpdates: this.minUpdates,
        maxUpdates: this.maxUpdates,
        checkIntervalMs: this.checkIntervalMs,
        maxWaitMs: this.maxWaitMs,
        maxRetries: this.maxRetries
      }
    };
  }

  /**
   * Get queue size for a specific user
   * @param {string} userId - User identifier
   * @returns {number} Queue size
   */
  getQueueSize(userId) {
    const s = this.pending.get(userId);
    return s ? (s.pendingCount || 0) : 0;
  }

  /**
   * Clear queue for a specific user
   * @param {string} userId - User identifier
   */
  clearUserQueue(userId) {
    this.pending.delete(userId);
  }

  /**
   * Clear all queues
   */
  clearAll() {
    this.pending.clear();
  }
}

// Export singleton instance
module.exports = new BatchQueue();

