const crypto = require('crypto');
const mongoose = require('mongoose');

const blockchainOperationSchema = new mongoose.Schema({
  txHash: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  action: { type: String, required: true },
  credentialId: { type: String, required: true },
  vaultData: { type: Object, required: true },
  vaultHash: { type: String, required: true },
  blockNumber: { type: Number },
  credentialData: { type: Object },
  storedAt: { type: Date, default: Date.now }
});
blockchainOperationSchema.index({ userId: 1, storedAt: -1 });
blockchainOperationSchema.index({ userId: 1, txHash: 1 });

const BlockchainOperation = mongoose.model('BlockchainOperation', blockchainOperationSchema);

// Pending operations: queued in batch mode (or awaiting txHash persistence).
const pendingOperationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  action: { type: String, required: true },
  credentialId: { type: String, required: true },
  vaultData: { type: Object, required: true },
  vaultHash: { type: String, required: true, index: true },
  credentialData: { type: Object },
  status: { type: String, enum: ['queued', 'anchored', 'superseded'], default: 'queued', index: true },
  txHash: { type: String, default: null },
  blockNumber: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now, index: true },
  anchoredAt: { type: Date, default: null }
});

pendingOperationSchema.index({ userId: 1, status: 1, createdAt: -1 });
pendingOperationSchema.index({ userId: 1, status: 1, anchoredAt: -1, txHash: 1 });
const BlockchainPendingOperation = mongoose.model('BlockchainPendingOperation', pendingOperationSchema);

/**
 * Persistent Blockchain Decoder Service
 * 
 * This service stores blockchain operation details in the database
 * so they persist across server restarts.
 */

class PersistentBlockchainDecoder {
  constructor() {
    this.operationCache = new Map(); // Cache for decoded operations
    this.userSummaryCache = new Map();
    this.userSummaryCacheTtlMs = 5000;
  }

  invalidateUserOperationsSummary(userId) {
    if (!userId) return;
    this.userSummaryCache.delete(String(userId));
  }

  async storePendingOperation(operationData) {
    try {
      const doc = await BlockchainPendingOperation.create({
        userId: operationData.userId,
        action: operationData.action,
        credentialId: operationData.credentialId,
        vaultData: operationData.vaultData,
        vaultHash: operationData.vaultHash,
        credentialData: operationData.credentialData || null,
        status: 'queued'
      });
      this.invalidateUserOperationsSummary(operationData.userId);
      return doc;
    } catch (error) {
      console.error('Failed to store pending operation:', error.message);
      return null;
    }
  }

  async markAnchoredForUser(userId, opts) {
    try {
      const { txHash, blockNumber, vaultHash, anchoredAt } = opts || {};
      if (!userId || !txHash) return { anchored: 0, superseded: 0 };
      const anchoredAtDate = anchoredAt ? new Date(anchoredAt) : new Date();

      // If we know which vaultHash was anchored, anchor that and supersede older queued hashes.
      if (vaultHash) {
        const anchoredRes = await BlockchainPendingOperation.updateMany(
          { userId, status: 'queued', vaultHash },
          { $set: { status: 'anchored', txHash, blockNumber: blockNumber || null, anchoredAt: anchoredAtDate } }
        );
        const supersededRes = await BlockchainPendingOperation.updateMany(
          { userId, status: 'queued', vaultHash: { $ne: vaultHash } },
          { $set: { status: 'superseded', txHash, blockNumber: blockNumber || null, anchoredAt: anchoredAtDate } }
        );
        this.invalidateUserOperationsSummary(userId);
        return { anchored: anchoredRes.modifiedCount || 0, superseded: supersededRes.modifiedCount || 0 };
      }

      // Fallback: anchor all queued items for the user.
      const res = await BlockchainPendingOperation.updateMany(
        { userId, status: 'queued' },
        { $set: { status: 'anchored', txHash, blockNumber: blockNumber || null, anchoredAt: anchoredAtDate } }
      );
      this.invalidateUserOperationsSummary(userId);
      return { anchored: res.modifiedCount || 0, superseded: 0 };
    } catch (error) {
      console.error('Failed to mark anchored operations:', error.message);
      return { anchored: 0, superseded: 0 };
    }
  }

  async markSupersededByHash(userId, vaultHash) {
    try {
      if (!userId || !vaultHash) return 0;
      const res = await BlockchainPendingOperation.updateMany(
        { userId, status: 'queued', vaultHash },
        { $set: { status: 'superseded', anchoredAt: new Date() } }
      );
      this.invalidateUserOperationsSummary(userId);
      return res.modifiedCount || 0;
    } catch (error) {
      console.error('Failed to mark superseded operations:', error.message);
      return 0;
    }
  }

  async storeOperationDetails(txHash, operationData) {
    try {
      const operationWithTimestamp = {
        ...operationData,
        storedAt: new Date()
      };

      await BlockchainOperation.findOneAndUpdate(
        { txHash },
        {
          $setOnInsert: {
            txHash,
            userId: operationData.userId,
            action: operationData.action,
            credentialId: operationData.credentialId,
            vaultData: operationData.vaultData,
            vaultHash: operationData.vaultHash,
            blockNumber: operationData.blockNumber,
            credentialData: operationData.credentialData,
            storedAt: new Date()
          }
        },
        { upsert: true, new: false, setDefaultsOnInsert: true }
      );

      this.operationCache.set(txHash, operationWithTimestamp);
      this.invalidateUserOperationsSummary(operationData.userId);

      console.log(`Stored operation details for txHash: ${txHash}`);

      return true;
    } catch (error) {
      console.error('Failed to store operation details:', error.message);
      return false;
    }
  }

  getOperationDetails(txHash) {
    return this.operationCache.get(txHash);
  }

  async getUserTransactionHistory(userId) {
    try {
      const operations = await BlockchainOperation.find({ userId })
        .select('txHash blockNumber action credentialId vaultData vaultHash credentialData storedAt')
        .sort({ storedAt: -1 })
        .limit(100)
        .lean();

      console.log(`Retrieved ${operations.length} transactions for user ${userId}`);

      return operations.map(op => ({
        txHash: op.txHash,
        timestamp: Math.floor(op.storedAt.getTime() / 1000),
        blockNumber: op.blockNumber || 0,
        action: op.action,
        credentialId: op.credentialId,
        vaultData: op.vaultData,
        vaultHash: op.vaultHash,
        credentialData: op.credentialData,
        storedAt: op.storedAt
      }));
    } catch (error) {
      console.error('Failed to get user transaction history:', error.message);
      return [];
    }
  }

  async getUserPendingOperations(userId) {
    try {
      const ops = await BlockchainPendingOperation.find({ userId, status: 'queued' })
        .select('status action credentialId vaultHash credentialData createdAt')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();
      return ops.map(op => ({
        status: op.status,
        action: op.action,
        credentialId: op.credentialId,
        vaultHash: op.vaultHash,
        title: op.credentialData?.title || 'Unknown',
        category: op.credentialData?.category || 'Unknown',
        hasUrl: op.credentialData?.hasUrl || false,
        createdAt: op.createdAt
      }));
    } catch (error) {
      console.error('Failed to get pending operations:', error.message);
      return [];
    }
  }

  async getUserAnchoredOperations(userId) {
    try {
      const anchoredFromPending = await BlockchainPendingOperation.find({ userId, status: 'anchored' })
        .select('txHash blockNumber action credentialId vaultHash credentialData anchoredAt createdAt')
        .sort({ anchoredAt: -1, createdAt: -1 })
        .limit(100)
        .lean();

      return anchoredFromPending.map(op => ({
        txHash: op.txHash,
        timestamp: Math.floor((op.anchoredAt || op.createdAt).getTime() / 1000),
        blockNumber: op.blockNumber || 0,
        action: op.action,
        credentialId: op.credentialId,
        vaultHash: op.vaultHash,
        credentialData: op.credentialData || null,
        title: op.credentialData?.title || 'Unknown',
        category: op.credentialData?.category || 'Unknown',
        hasUrl: op.credentialData?.hasUrl || false
      }));
    } catch (error) {
      console.error('Failed to get anchored operations:', error.message);
      return [];
    }
  }

  async getUserAnchoredOperationGroups(userId) {
    try {
      const ops = await BlockchainPendingOperation.find({
        userId,
        status: { $in: ['anchored', 'superseded'] },
        txHash: { $ne: null }
      })
        .select('txHash blockNumber vaultHash status action credentialId credentialData createdAt anchoredAt')
        .sort({ anchoredAt: -1, createdAt: -1 })
        .limit(300)
        .lean();

      const groupsByTx = new Map();
      for (const op of ops) {
        const txHash = op.txHash;
        if (!txHash) continue;

        const opTimestamp = op.anchoredAt || op.createdAt;
        if (!groupsByTx.has(txHash)) {
          groupsByTx.set(txHash, {
            txHash,
            blockNumber: op.blockNumber || 0,
            timestamp: Math.floor(opTimestamp.getTime() / 1000),
            vaultHash: op.vaultHash,
            operations: []
          });
        }

        const group = groupsByTx.get(txHash);
        if ((op.blockNumber || 0) > (group.blockNumber || 0)) {
          group.blockNumber = op.blockNumber || 0;
        }
        const groupTsMs = group.timestamp * 1000;
        if (opTimestamp.getTime() > groupTsMs) {
          group.timestamp = Math.floor(opTimestamp.getTime() / 1000);
        }

        group.operations.push({
          status: op.status,
          action: op.action,
          credentialId: op.credentialId,
          vaultHash: op.vaultHash,
          title: op.credentialData?.title || 'Unknown',
          category: op.credentialData?.category || 'Unknown',
          hasUrl: op.credentialData?.hasUrl || false,
          createdAt: op.createdAt
        });
      }

      return Array.from(groupsByTx.values()).sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get anchored operation groups:', error.message);
      return [];
    }
  }

  async getLatestQueuedOperation(userId) {
    try {
      const op = await BlockchainPendingOperation.findOne({ userId, status: 'queued' })
        .sort({ createdAt: -1 });
      if (!op) return null;
      return {
        userId: op.userId,
        action: op.action,
        credentialId: op.credentialId,
        vaultHash: op.vaultHash,
        createdAt: op.createdAt
      };
    } catch (error) {
      console.error('Failed to get latest queued operation:', error.message);
      return null;
    }
  }

  async getLatestQueuedOperationsDue(maxAgeMs, limitUsers = 20) {
    try {
      const cutoff = new Date(Date.now() - maxAgeMs);
      const dueQueued = await BlockchainPendingOperation.find({
        status: 'queued',
        createdAt: { $lte: cutoff }
      })
        .sort({ createdAt: 1 })
        .limit(limitUsers * 5);

      if (!dueQueued.length) return [];

      const userIds = Array.from(new Set(dueQueued.map((op) => op.userId))).slice(0, limitUsers);
      const latestByUser = await Promise.all(
        userIds.map(async (userId) => {
          const latest = await BlockchainPendingOperation.findOne({ userId, status: 'queued' })
            .sort({ createdAt: -1 });
          if (!latest) return null;
          return {
            userId,
            vaultHash: latest.vaultHash,
            createdAt: latest.createdAt
          };
        })
      );

      return latestByUser.filter(Boolean);
    } catch (error) {
      console.error('Failed to get due queued operations:', error.message);
      return [];
    }
  }

  async getUserOperationsSummary(userId, options = {}) {
    const cacheEnabled = options.cache !== false;
    const cacheKey = String(userId);
    const now = Date.now();

    if (cacheEnabled) {
      const cached = this.userSummaryCache.get(cacheKey);
      if (cached && cached.expiresAt > now) {
        return cached.data;
      }
    }

    const [queued, anchored, anchoredGroups] = await Promise.all([
      this.getUserPendingOperations(userId),
      this.getUserAnchoredOperations(userId),
      this.getUserAnchoredOperationGroups(userId)
    ]);
    const summary = { queued, anchored, anchoredGroups };

    if (cacheEnabled) {
      this.userSummaryCache.set(cacheKey, {
        data: summary,
        expiresAt: now + this.userSummaryCacheTtlMs
      });
    }

    return summary;
  }

  async getAllOperations() {
    try {
      const operations = await BlockchainOperation.find().sort({ storedAt: -1 });
      console.log(`Total operations in database: ${operations.length}`);
      return operations;
    } catch (error) {
      console.error('Failed to get all operations:', error.message);
      return [];
    }
  }

  clearOldCacheEntries(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const now = Date.now();
    for (const [txHash, operation] of this.operationCache.entries()) {
      if (now - operation.timestamp > maxAge) {
        this.operationCache.delete(txHash);
      }
    }
  }
}

module.exports = new PersistentBlockchainDecoder();
