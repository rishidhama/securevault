/**
 * Batch Queue Service
 * 
 * Coalesces vault updates and flushes when there are 10-20 changes or after 30 minutes.
 * Supports both L1 and L2 contracts.
 */

const ethereumService = require('./ethereum-service');

class BatchQueue {
  constructor() {
    this.pending = new Map();
    this.minUpdates = parseInt(process.env.BATCH_MIN_UPDATES || '10', 10);
    this.maxUpdates = parseInt(process.env.BATCH_MAX_UPDATES || '20', 10);
    this.checkIntervalMs = parseInt(process.env.BATCH_CHECK_INTERVAL || '30000', 10);
    this.maxWaitMs = parseInt(process.env.BATCH_MAX_WAIT_MS || String(30 * 60 * 1000), 10);
    this.maxRetries = parseInt(process.env.BATCH_MAX_RETRIES || '3', 10);
    this.checkTimer = null;
    this.stats = {
      totalQueued: 0,
      totalChanged: 0,
      totalBatched: 0,
      totalIndividual: 0,
      totalFailed: 0
    };
    this.startCheckTimer();
  }


  async queueUpdate(userId, vaultHash) {
    if (!ethereumService.initialized) {
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

  _isDue(s, now) {
    if (!s || !s.latestVaultHash || !s.pendingCount) return false;
    if (s.pendingCount >= this.maxUpdates) return true;
    const age = s.firstPendingAt ? (now - s.firstPendingAt) : 0;
    if (age >= this.maxWaitMs) return true;
    return s.pendingCount >= this.minUpdates;
  }

  async flushDueUsers(opts = {}) {
    const now = Date.now();
    const contractVersion = process.env.CONTRACT_VERSION || 'legacy';
    const dueStates = [];

    for (const s of this.pending.values()) {
      if (opts.forceUserId && s.userId !== opts.forceUserId) continue;
      if (this._isDue(s, now)) dueStates.push(s);
    }

    if (dueStates.length === 0) return { success: true, flushed: 0, mode: 'noop' };

    dueStates.sort((a, b) => (a.firstPendingAt || 0) - (b.firstPendingAt || 0));
    const slice = dueStates.slice(0, Math.max(1, this.maxUpdates));

    if (contractVersion === 'l2' && slice.length > 1) {
      const updates = slice.map(s => ({ userId: s.userId, vaultHash: s.latestVaultHash }));
      try {
        const result = await ethereumService.batchStoreVaultHash(updates);
        if (!result.success) throw new Error(result.error || 'Batch update failed');

        for (const s of slice) this._markFlushed(s.userId);
        this.stats.totalBatched += slice.length;
        console.log(`Batch update: ${slice.length} users, tx: ${result.txHash}`);
        return { success: true, flushed: slice.length, mode: 'batch', txHash: result.txHash };
      } catch (error) {
        console.error('Batch update failed:', error.message);
        await this._flushIndividually(slice);
        return { success: false, flushed: slice.length, mode: 'fallback_individual', error: error.message };
      }
    }

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

  async flushUserQueue(userId) {
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

  async flushAll() {
    return this.flushDueUsers();
  }

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

  startCheckTimer() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }

    this.checkTimer = setInterval(async () => {
      try {
        if (this.getTotalPendingCount() > 0) {
          await this.flushDueUsers();
        }
      } catch (error) {
        console.error('Periodic flush error:', error.message);
      }
    }, this.checkIntervalMs);

    console.log(`Batch queue: check every ${this.checkIntervalMs}ms, flush at ${this.minUpdates}-${this.maxUpdates} updates or ${this.maxWaitMs}ms`);
  }

  stopFlushTimer() {
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

  getQueueSize(userId) {
    const s = this.pending.get(userId);
    return s ? (s.pendingCount || 0) : 0;
  }

  clearUserQueue(userId) {
    this.pending.delete(userId);
  }

  clearAll() {
    this.pending.clear();
  }
}

module.exports = new BatchQueue();

