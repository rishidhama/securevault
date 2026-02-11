/**
 * Batch Queue Service for Blockchain Updates
 * 
 * Collects multiple vault hash updates and sends them in batches
 * to reduce gas costs on L2 networks (Arbitrum).
 * 
 * Features:
 * - Time-based batching (flush every N seconds)
 * - Size-based batching (flush when queue reaches N items)
 * - Automatic fallback to individual updates if batch fails
 * - Per-user queue management
 */

const ethereumService = require('./ethereum-service');

class BatchQueue {
  constructor() {
    // Queue: userId -> [{ userId, vaultHash, timestamp, retries }]
    this.queue = new Map();
    
    // Configuration
    this.batchSize = parseInt(process.env.BATCH_SIZE || '10', 10); // Max items per batch
    this.batchInterval = parseInt(process.env.BATCH_INTERVAL || '5000', 10); // Flush every 5 seconds
    this.maxRetries = 3;
    
    // Flush timer
    this.flushTimer = null;
    
    // Statistics
    this.stats = {
      totalQueued: 0,
      totalBatched: 0,
      totalIndividual: 0,
      totalFailed: 0
    };
    
    // Start periodic flush
    this.startFlushTimer();
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

    // Check if batch updates are supported (L2 contract)
    const contractVersion = process.env.CONTRACT_VERSION || 'legacy';
    if (contractVersion !== 'l2') {
      // Fallback to individual update for legacy contracts
      return this.flushImmediate(userId, vaultHash);
    }

    // Add to queue
    if (!this.queue.has(userId)) {
      this.queue.set(userId, []);
    }

    const userQueue = this.queue.get(userId);
    userQueue.push({
      userId,
      vaultHash,
      timestamp: Date.now(),
      retries: 0
    });

    this.stats.totalQueued++;

    // Check if we should flush immediately (batch size reached)
    if (userQueue.length >= this.batchSize) {
      await this.flushUserQueue(userId);
    }

    return {
      success: true,
      queued: true,
      queueSize: userQueue.length
    };
  }

  /**
   * Flush a specific user's queue
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} Flush result
   */
  async flushUserQueue(userId) {
    const userQueue = this.queue.get(userId);
    if (!userQueue || userQueue.length === 0) {
      return { success: true, flushed: 0 };
    }

    // Take items from queue (up to batchSize)
    const itemsToFlush = userQueue.splice(0, this.batchSize);
    
    if (itemsToFlush.length === 0) {
      return { success: true, flushed: 0 };
    }

    try {
      // Prepare batch update
      const updates = itemsToFlush.map(item => ({
        userId: item.userId,
        vaultHash: item.vaultHash
      }));

      // Try batch update
      const result = await ethereumService.batchStoreVaultHash(updates);

      if (result.success) {
        this.stats.totalBatched += itemsToFlush.length;
        console.log(`Batch update successful: ${itemsToFlush.length} items, tx: ${result.txHash}`);
        
        return {
          success: true,
          flushed: itemsToFlush.length,
          txHash: result.txHash,
          batchSize: itemsToFlush.length
        };
      } else {
        throw new Error(result.error || 'Batch update failed');
      }

    } catch (error) {
      console.error(`Batch update failed for user ${userId}:`, error.message);
      
      // Retry logic: put items back in queue if retries < maxRetries
      const retryItems = itemsToFlush.filter(item => {
        item.retries++;
        return item.retries < this.maxRetries;
      });

      if (retryItems.length > 0) {
        // Put retry items back at the front of the queue
        this.queue.set(userId, [...retryItems, ...userQueue]);
        console.log(`Queued ${retryItems.length} items for retry`);
      } else {
        // Max retries reached, fallback to individual updates
        console.log(`Max retries reached, falling back to individual updates`);
        await this.fallbackToIndividual(itemsToFlush);
      }

      this.stats.totalFailed += itemsToFlush.length - retryItems.length;

      return {
        success: false,
        flushed: 0,
        error: error.message,
        fallback: itemsToFlush.length - retryItems.length
      };
    }
  }

  /**
   * Fallback to individual updates when batch fails
   * @param {Array} items - Items to update individually
   */
  async fallbackToIndividual(items) {
    console.log(`Falling back to individual updates for ${items.length} items`);
    
    const promises = items.map(item => 
      ethereumService.storeVaultHash(item.userId, item.vaultHash)
        .catch(err => {
          console.error(`Individual update failed for ${item.userId}:`, err.message);
          this.stats.totalFailed++;
          return { success: false, error: err.message };
        })
    );

    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    
    this.stats.totalIndividual += successful;
    console.log(`Individual updates: ${successful}/${items.length} successful`);
  }

  /**
   * Flush all user queues
   * @returns {Promise<Object>} Flush results
   */
  async flushAll() {
    const userIds = Array.from(this.queue.keys());
    const results = await Promise.allSettled(
      userIds.map(userId => this.flushUserQueue(userId))
    );

    const summary = {
      totalUsers: userIds.length,
      successful: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
      failed: results.filter(r => r.status === 'rejected' || !r.value.success).length
    };

    return summary;
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
   * Start periodic flush timer
   */
  startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(async () => {
      try {
        await this.flushAll();
      } catch (error) {
        console.error('Periodic flush error:', error.message);
      }
    }, this.batchInterval);

    console.log(`Batch queue started: flush every ${this.batchInterval}ms, batch size: ${this.batchSize}`);
  }

  /**
   * Stop flush timer
   */
  stopFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Get queue statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const queueSizes = Array.from(this.queue.entries()).map(([userId, items]) => ({
      userId,
      queueSize: items.length
    }));

    return {
      ...this.stats,
      currentQueueSizes: queueSizes,
      totalQueuedNow: queueSizes.reduce((sum, q) => sum + q.queueSize, 0),
      config: {
        batchSize: this.batchSize,
        batchInterval: this.batchInterval,
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
    const userQueue = this.queue.get(userId);
    return userQueue ? userQueue.length : 0;
  }

  /**
   * Clear queue for a specific user
   * @param {string} userId - User identifier
   */
  clearUserQueue(userId) {
    this.queue.delete(userId);
  }

  /**
   * Clear all queues
   */
  clearAll() {
    this.queue.clear();
  }
}

// Export singleton instance
module.exports = new BatchQueue();

