const crypto = require('crypto');

/**
 * Blockchain Data Decoder Service
 * 
 * This service helps decode blockchain transaction data to extract
 * operation details like action type, credential info, etc.
 */

class BlockchainDecoder {
  constructor() {
    this.operationCache = new Map(); // Cache for decoded operations
    this.transactionHistory = new Map(); // Store transaction history by userId
  }

  /**
   * Decode vault data from a hash
   * Note: This is a simplified approach. In a real implementation,
   * you'd need to store the original data alongside the hash
   */
  decodeVaultData(vaultHash, knownOperations = []) {
    // Try to find matching operation in known operations
    for (const operation of knownOperations) {
      const operationHash = this.generateVaultHash(operation);
      if (operationHash === vaultHash) {
        return operation;
      }
    }

    // If no match found, return basic info
    return {
      action: 'UNKNOWN',
      resource: 'CREDENTIAL',
      id: 'unknown',
      timestamp: new Date().toISOString(),
      title: 'Unknown Operation',
      category: 'Unknown'
    };
  }

  /**
   * Generate vault hash from operation data
   */
  generateVaultHash(vaultData) {
    return crypto.createHash('sha256')
      .update(JSON.stringify(vaultData))
      .digest('hex');
  }

  /**
   * Extract operation details from transaction
   */
  extractOperationDetails(txHash, userId, vaultHash) {
    // In a real implementation, you'd query your database
    // for the operation that generated this hash
    
    // For now, we'll create a mapping based on common patterns
    const operationInfo = {
      txHash,
      userId,
      vaultHash,
      timestamp: new Date().toISOString(),
      action: 'UPDATE', // This would be determined from your database
      title: 'Credential Operation',
      category: 'General',
      description: 'Blockchain operation recorded'
    };

    return operationInfo;
  }

  /**
   * Get operation history for a user
   */
  async getUserOperationHistory(userId) {
    // This would typically query your database for operations
    // that have been recorded on the blockchain
    
    // For now, return a mock structure
    return [
      {
        txHash: '0x386fdf0cb1c08ff264b25bb01dc278548a82835406ce9651743829fede37936c',
        userId,
        action: 'UPDATE',
        title: 'neetcode',
        category: 'education',
        timestamp: new Date().toISOString(),
        blockNumber: 9177511,
        vaultHash: '664e63095cecfd9621ad855ee3482a8706b2216d10857b53ffb70c18ddcf47a1'
      }
    ];
  }

  /**
   * Store operation details for later decoding
   */
  storeOperationDetails(txHash, operationData) {
    const operationWithTimestamp = {
      ...operationData,
      storedAt: new Date().toISOString()
    };
    
    // Store in operation cache
    this.operationCache.set(txHash, operationWithTimestamp);
    
    // Store in user's transaction history
    const userId = operationData.userId;
    if (!this.transactionHistory.has(userId)) {
      this.transactionHistory.set(userId, []);
    }
    
    const userHistory = this.transactionHistory.get(userId);
    userHistory.push({
      txHash,
      timestamp: Date.now(),
      ...operationWithTimestamp
    });
    
    // Keep only last 100 transactions per user
    if (userHistory.length > 100) {
      userHistory.splice(0, userHistory.length - 100);
    }
    
    // Debug logging
    console.log(`📝 Stored operation details for txHash: ${txHash}`);
    console.log(`📊 User ${userId} now has ${userHistory.length} transactions in history`);
    console.log(`🔍 Operation data:`, {
      action: operationData.action,
      credentialId: operationData.credentialId,
      title: operationData.credentialData?.title
    });
  }

  /**
   * Get stored operation details
   */
  getOperationDetails(txHash) {
    return this.operationCache.get(txHash);
  }

  /**
   * Get transaction history for a user
   */
  getUserTransactionHistory(userId) {
    const history = this.transactionHistory.get(userId) || [];
    console.log(`📋 Retrieved ${history.length} transactions for user ${userId}`);
    if (history.length > 0) {
      console.log(`🔍 Latest transaction:`, {
        txHash: history[history.length - 1].txHash,
        action: history[history.length - 1].action,
        title: history[history.length - 1].credentialData?.title
      });
    }
    return history;
  }

  /**
   * Clear old cache entries
   */
  clearOldCacheEntries(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const now = Date.now();
    for (const [txHash, data] of this.operationCache.entries()) {
      const age = now - new Date(data.storedAt).getTime();
      if (age > maxAge) {
        this.operationCache.delete(txHash);
      }
    }
  }
}

module.exports = new BlockchainDecoder();
