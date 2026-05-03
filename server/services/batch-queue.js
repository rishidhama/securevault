/**
 * Batch Queue Service
 *
 * In-memory: flush after BATCH_MIN_UPDATES hash changes, BATCH_MAX_UPDATES cap (immediate), or BATCH_MAX_WAIT_MS.
 * Persisted DB: flush when queued row count per user ≥ MIN, or any row older than MAX_WAIT (see decoder; uses distinct users).
 */

const ethereumService = require('./ethereum-service');
const blockchainDecoder = require('./blockchain-decoder-persistent');

class BatchQueue {
  constructor() {
    this.pending = new Map();
    this.minUpdates = parseInt(process.env.BATCH_MIN_UPDATES || '10', 10);
    this.maxUpdates = parseInt(process.env.BATCH_MAX_UPDATES || '15', 10);
    this.checkIntervalMs = parseInt(process.env.BATCH_CHECK_INTERVAL || '30000', 10);
    this.maxWaitMs = parseInt(process.env.BATCH_MAX_WAIT_MS || String(30 * 60 * 1000), 10);
    this.maxRetries = parseInt(process.env.BATCH_MAX_RETRIES || '3', 10);
    if (this.minUpdates > this.maxUpdates) {
      this.maxUpdates = this.minUpdates;
    }
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
    const dueStates = [];

    for (const s of this.pending.values()) {
      if (opts.forceUserId && s.userId !== opts.forceUserId) continue;
      if (this._isDue(s, now)) dueStates.push(s);
    }

    if (dueStates.length === 0) return { success: true, flushed: 0, mode: 'noop' };

    dueStates.sort((a, b) => (a.firstPendingAt || 0) - (b.firstPendingAt || 0));
    const slice = dueStates.slice(0, Math.max(1, this.maxUpdates));
    await this._flushIndividually(slice);
    return { success: true, flushed: slice.length, mode: 'per_user' };
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
        const updatesCoalesced = Math.max(1, s.pendingCount || 1);
        const r = await ethereumService.storeVaultHash(s.userId, s.latestVaultHash, {
          mode: 'per_user_batch',
          usersInBatch: updatesCoalesced
        });
        if (r && r.success) {
          this.stats.totalIndividual += 1;
          this.stats.totalBatched += updatesCoalesced;
          this._markFlushed(s.userId);
          if (r.txHash) {
            await blockchainDecoder.markAnchoredForUser(s.userId, {
              txHash: r.txHash,
              blockNumber: r.blockNumber,
              vaultHash: s.latestVaultHash,
              anchoredAt: r.blockTimestamp ? new Date(r.blockTimestamp * 1000) : undefined
            });
          }
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
      const updatesCoalesced = Math.max(1, s.pendingCount || 1);
      const r = await ethereumService.storeVaultHash(userId, s.latestVaultHash, {
        mode: 'per_user_batch',
        usersInBatch: updatesCoalesced
      });
      if (r && r.success) {
        this.stats.totalIndividual += 1;
        this.stats.totalBatched += updatesCoalesced;
        this._markFlushed(userId);
        if (r.txHash) {
          await blockchainDecoder.markAnchoredForUser(userId, {
            txHash: r.txHash,
            blockNumber: r.blockNumber,
            vaultHash: s.latestVaultHash,
            anchoredAt: r.blockTimestamp ? new Date(r.blockTimestamp * 1000) : undefined
          });
        }
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

  async flushPersistedCountDueUsers() {
    if (!ethereumService.initialized) {
      return { success: true, flushed: 0, mode: 'persisted-count-skip-no-eth' };
    }
    try {
      const users = await blockchainDecoder.getUsersWithQueuedCountAtLeast(this.minUpdates, this.maxUpdates);
      if (!users.length) {
        return { success: true, flushed: 0, mode: 'persisted-count-noop' };
      }

      let flushed = 0;
      for (const { userId, queuedRows } of users) {
        try {
          const latest = await blockchainDecoder.getLatestQueuedOperation(userId);
          if (!latest?.vaultHash) continue;
          // eslint-disable-next-line no-await-in-loop
          const r = await ethereumService.storeVaultHash(latest.userId, latest.vaultHash, {
            mode: 'per_user_batch',
            usersInBatch: Math.max(1, queuedRows || this.minUpdates)
          });
          if (r?.success && r?.txHash) {
            // eslint-disable-next-line no-await-in-loop
            await blockchainDecoder.markAnchoredForUser(latest.userId, {
              txHash: r.txHash,
              blockNumber: r.blockNumber,
              vaultHash: latest.vaultHash,
              anchoredAt: r.blockTimestamp ? new Date(r.blockTimestamp * 1000) : undefined
            });
            this._markFlushed(latest.userId);
            flushed += 1;
          } else {
            this.stats.totalFailed += 1;
            // eslint-disable-next-line no-console
            console.error(
              '[batch] persisted count flush failed',
              { userId: latest.userId, error: r?.error || 'no txHash' }
            );
          }
        } catch (e) {
          this.stats.totalFailed += 1;
          // eslint-disable-next-line no-console
          console.error('[batch] persisted count flush error', { userId, message: e.message });
        }
      }

      if (flushed > 0) {
        this.stats.totalIndividual += flushed;
      }
      return { success: true, flushed, mode: 'persisted-count' };
    } catch (error) {
      this.stats.totalFailed += 1;
      // eslint-disable-next-line no-console
      console.error('[batch] persisted count flush fatal', error.message);
      return { success: false, flushed: 0, mode: 'persisted-count-error', error: error.message };
    }
  }

  async flushPersistedDueUsers() {
    if (!ethereumService.initialized) {
      return { success: true, flushed: 0, mode: 'persisted-age-skip-no-eth' };
    }
    try {
      const due = await blockchainDecoder.getLatestQueuedOperationsDue(this.maxWaitMs, this.maxUpdates);
      if (!due.length) return { success: true, flushed: 0, mode: 'persisted-noop' };

      let flushed = 0;
      for (const item of due) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const r = await ethereumService.storeVaultHash(item.userId, item.vaultHash);
          if (r?.success && r?.txHash) {
            // eslint-disable-next-line no-await-in-loop
            await blockchainDecoder.markAnchoredForUser(item.userId, {
              txHash: r.txHash,
              blockNumber: r.blockNumber,
              vaultHash: item.vaultHash,
              anchoredAt: r.blockTimestamp ? new Date(r.blockTimestamp * 1000) : undefined
            });
            this._markFlushed(item.userId);
            flushed += 1;
          } else {
            this.stats.totalFailed += 1;
            // eslint-disable-next-line no-console
            console.error(
              '[batch] persisted age flush failed',
              { userId: item.userId, error: r?.error || 'no txHash' }
            );
          }
        } catch (e) {
          this.stats.totalFailed += 1;
          // eslint-disable-next-line no-console
          console.error('[batch] persisted age flush error', { userId: item.userId, message: e.message });
        }
      }

      if (flushed > 0) {
        this.stats.totalIndividual += flushed;
      }
      return { success: true, flushed, mode: 'persisted-individual' };
    } catch (error) {
      this.stats.totalFailed += 1;
      // eslint-disable-next-line no-console
      console.error('[batch] persisted age flush fatal', error.message);
      return { success: false, flushed: 0, mode: 'persisted-error', error: error.message };
    }
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
        if (process.env.BATCH_ENABLED === 'true') {
          await this.flushPersistedCountDueUsers();
        }
        await this.flushPersistedDueUsers();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Periodic flush error:', error.message);
      }
    }, this.checkIntervalMs);

    // eslint-disable-next-line no-console
    console.log(
      `Batch queue: every ${this.checkIntervalMs}ms | in-memory ${this.minUpdates}-${this.maxUpdates} | persisted ≥${this.minUpdates} rows or ${this.maxWaitMs}ms age`
    );
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

