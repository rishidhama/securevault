const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth');
const mongoose = require('mongoose');
const ethereumService = require('../services/ethereum-service');
const blockchainDecoder = require('../services/blockchain-decoder-persistent');
const batchQueue = require('../services/batch-queue');
const crypto = require('crypto');

ethereumService.init().catch(console.error);

const requireSelfUser = (req, res, userId) => {
  if (!req.user?.userId || String(req.user.userId) !== String(userId)) {
    res.status(403).json({ success: false, error: 'Access denied for requested user scope' });
    return false;
  }
  return true;
};

const getExplorerBase = async () => {
  const network = await ethereumService.getNetworkInfo();
  if (network?.chainId === 42161) return 'https://arbiscan.io';
  if (network?.chainId === 421614) return 'https://sepolia.arbiscan.io';
  return 'https://sepolia.etherscan.io';
};

router.get('/status', async (req, res) => {
  try {
    const networkInfo = await ethereumService.getNetworkInfo();
    
    res.json({
      success: true,
      ethereum: {
        enabled: ethereumService.enabled,
        initialized: ethereumService.initialized,
        networkInfo
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch blockchain status' 
    });
  }
});

router.post('/store-vault', authenticateToken, async (req, res) => {
  try {
    const { userId, vaultData, merkleRoot, immediate } = req.body;
    
    if (!userId || (!vaultData && !merkleRoot)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, (vaultData or merkleRoot)'
      });
    }
    if (!requireSelfUser(req, res, userId)) return;
    
    const vaultHash = merkleRoot && typeof merkleRoot === 'string' && merkleRoot.length > 0
      ? merkleRoot
      : crypto.createHash('sha256')
        .update(JSON.stringify(vaultData))
        .digest('hex');
    
    // Use batch queue unless immediate flag is set
    let result;
    if (immediate || process.env.BATCH_ENABLED !== 'true') {
      // Immediate update (bypass queue)
      result = await ethereumService.storeVaultHash(userId, vaultHash);
    } else {
      // Queue for batch update
      result = await batchQueue.queueUpdate(userId, vaultHash);
    }
    
    if (result.success) {
      const network = await ethereumService.getNetworkInfo();
      const networkName = network?.chainId === 42161 || network?.chainId === 421614 ? 'Arbitrum' : 'Sepolia';
      const explorerBase = network?.chainId === 42161 
        ? 'https://arbiscan.io' 
        : network?.chainId === 421614
        ? 'https://sepolia.arbiscan.io'
        : 'https://sepolia.etherscan.io';
      
      res.json({
        success: true,
        message: result.queued 
          ? 'Vault hash queued for batch update' 
          : 'Vault integrity root stored on blockchain',
        data: {
          userId,
          vaultHash,
          queued: result.queued || false,
          pendingCount: typeof result.pendingCount === 'number' ? result.pendingCount : batchQueue.getQueueSize(userId),
          txHash: result.txHash || null,
          blockNumber: result.blockNumber || null,
          gasUsed: result.gasUsed || null,
          etherscanUrl: result.txHash ? `${explorerBase}/tx/${result.txHash}` : null
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/vault/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!requireSelfUser(req, res, userId)) return;
    
    const vaultData = await ethereumService.getVaultHash(userId);
    
    if (!vaultData.exists) {
      return res.status(404).json({
        success: false,
        error: 'Vault hash not found on blockchain'
      });
    }
    
    res.json({
      success: true,
      data: {
        userId,
        vaultHash: vaultData.vaultHash,
        timestamp: vaultData.timestamp,
        blockTime: vaultData.blockTime
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/history/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!requireSelfUser(req, res, userId)) return;
    
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: [] });
    }
    
    const history = await blockchainDecoder.getUserTransactionHistory(userId);
    const explorerBase = await getExplorerBase();
    
    res.json({
      success: true,
      data: history.map(tx => ({
        txHash: tx.txHash,
        timestamp: tx.timestamp,
        blockNumber: tx.blockNumber || 0,
        etherscanUrl: `${explorerBase}/tx/${tx.txHash}`
      }))
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/activity/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!requireSelfUser(req, res, userId)) return;
    
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: [] });
    }
    
    const history = await blockchainDecoder.getUserTransactionHistory(userId);
    const explorerBase = await getExplorerBase();
    
    const enhancedActivities = history.map(tx => {
      return {
        txHash: tx.txHash,
        timestamp: tx.timestamp,
        blockNumber: tx.blockNumber || 0,
        action: tx.action,
        credentialId: tx.credentialId,
        title: tx.credentialData?.title || 'Unknown',
        category: tx.credentialData?.category || 'Unknown',
        hasUrl: tx.credentialData?.hasUrl || false,
        etherscanUrl: `${explorerBase}/tx/${tx.txHash}`,
        vaultHash: tx.vaultHash
      };
    });
    
    res.json({
      success: true,
      data: enhancedActivities
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Combined operations endpoint: queued + anchored
router.get('/operations/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!requireSelfUser(req, res, userId)) return;
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: { queued: [], anchored: [] } });
    }

    const summary = await blockchainDecoder.getUserOperationsSummary(userId);
    const explorerBase = await getExplorerBase();
    const anchored = (summary.anchored || []).map((a) => ({
      ...a,
      etherscanUrl: a.txHash ? `${explorerBase}/tx/${a.txHash}` : null
    }));
    const anchoredGroups = (summary.anchoredGroups || []).map((g) => ({
      ...g,
      etherscanUrl: g.txHash ? `${explorerBase}/tx/${g.txHash}` : null
    }));
    res.json({ success: true, data: { queued: summary.queued || [], anchored, anchoredGroups } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { userId, vaultData, merkleRoot } = req.body;
    
    if (!userId || (!vaultData && !merkleRoot)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, (vaultData or merkleRoot)'
      });
    }
    if (!requireSelfUser(req, res, userId)) return;
    
    const storedData = await ethereumService.getVaultHash(userId);
    
    if (!storedData.exists) {
      return res.status(404).json({
        success: false,
        error: 'No vault hash found on blockchain for this user'
      });
    }
    
    const currentHash = merkleRoot && typeof merkleRoot === 'string' && merkleRoot.length > 0
      ? merkleRoot
      : crypto.createHash('sha256')
        .update(JSON.stringify(vaultData))
        .digest('hex');
    
    const isIntegrityValid = currentHash === storedData.vaultHash;
    
    res.json({
      success: true,
      data: {
        userId,
        integrityValid: isIntegrityValid,
        currentHash,
        storedHash: storedData.vaultHash,
        lastUpdated: storedData.blockTime,
        message: isIntegrityValid 
          ? 'Vault integrity verified - no tampering detected'
          : 'Vault integrity compromised - data has been modified'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const networkInfo = await ethereumService.getNetworkInfo();
    const batchStats = batchQueue.getStats();
    
    if (!networkInfo || networkInfo.error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch network statistics'
      });
    }
    
    const explorerBase = networkInfo.chainId === 42161 
      ? 'https://arbiscan.io' 
      : networkInfo.chainId === 421614
      ? 'https://sepolia.arbiscan.io'
      : 'https://sepolia.etherscan.io';
    
    res.json({
      success: true,
      data: {
        network: networkInfo.network,
        chainId: networkInfo.chainId,
        walletAddress: networkInfo.walletAddress,
        balance: networkInfo.balance,
        gasPrice: networkInfo.gasPrice,
        contractAddress: networkInfo.contractAddress,
        contractVersion: process.env.CONTRACT_VERSION || 'legacy',
        etherscanUrl: `${explorerBase}/address/${networkInfo.contractAddress}`,
        batchQueue: {
          enabled: process.env.BATCH_ENABLED === 'true',
          stats: batchStats
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Batch queue management endpoints
router.post('/batch/flush', authenticateToken, async (req, res) => {
  try {
    const requestedUserId = req.body?.userId;
    const currentUserId = req.user?.userId;

    // Security: users can flush only their own queue.
    if (requestedUserId && requestedUserId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: 'You can only flush your own queue'
      });
    }

    const userId = requestedUserId || currentUserId;
    let result = await batchQueue.flushUserQueue(userId);

    // If in-memory queue is empty (e.g. server restarted), anchor from persisted pending ops.
    if (!result.flushed) {
      const latestQueued = await blockchainDecoder.getLatestQueuedOperation(userId);
      if (latestQueued && latestQueued.vaultHash) {
        const txResult = await ethereumService.storeVaultHash(userId, latestQueued.vaultHash);
        if (txResult?.success && txResult?.txHash) {
          await blockchainDecoder.markAnchoredForUser(userId, {
            txHash: txResult.txHash,
            blockNumber: txResult.blockNumber,
            vaultHash: latestQueued.vaultHash
          });
          result = {
            success: true,
            flushed: 1,
            txHash: txResult.txHash,
            blockNumber: txResult.blockNumber,
            restoredFromPersistedQueue: true
          };
        }
      }
    }

    res.json({
      success: true,
      message: `Flushed queue for user ${userId}`,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/batch/stats', authenticateToken, async (req, res) => {
  try {
    const stats = batchQueue.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/batch/queue/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const queueSize = batchQueue.getQueueSize(userId);
    res.json({
      success: true,
      data: {
        userId,
        queueSize,
        queued: queueSize > 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;



