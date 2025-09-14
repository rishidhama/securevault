const crypto = require('crypto');
const mongoose = require('mongoose');

// Define schema for blockchain operations
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

const BlockchainOperation = mongoose.model('BlockchainOperation', blockchainOperationSchema);

/**
 * Persistent Blockchain Decoder Service
 * 
 * This service stores blockchain operation details in the database
 * so they persist across server restarts.
 */

class PersistentBlockchainDecoder {
  constructor() {
    this.operationCache = new Map(); // Cache for decoded operations
  }

  /**
   * Store operation details in database
   */
  async storeOperationDetails(txHash, operationData) {
    try {
      const operationWithTimestamp = {
        ...operationData,
        storedAt: new Date()
      };

      // Store in database idempotently (avoid duplicate key errors on txHash)
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

      // Also store in cache for quick access
      this.operationCache.set(txHash, operationWithTimestamp);

      console.log(`Stored operation details for txHash: ${txHash}`);

      return true;
    } catch (error) {
      console.error('Failed to store operation details:', error.message);
      return false;
    }
  }

  /**
   * Get stored operation details
   */
  getOperationDetails(txHash) {
    return this.operationCache.get(txHash);
  }

  /**
   * Get transaction history for a user from database
   */
  async getUserTransactionHistory(userId) {
    try {
      const operations = await BlockchainOperation.find({ userId })
        .sort({ storedAt: -1 })
        .limit(100);

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

  /**
   * Get all operations (for debugging)
   */
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

  /**
   * Clear old cache entries
   */
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
