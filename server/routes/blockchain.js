const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth');
const mongoose = require('mongoose');
const ethereumService = require('../services/ethereum-service');
const blockchainDecoder = require('../services/blockchain-decoder-persistent');
const crypto = require('crypto');

ethereumService.init().catch(console.error);

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
    const { userId, vaultData, merkleRoot } = req.body;
    
    if (!userId || (!vaultData && !merkleRoot)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, (vaultData or merkleRoot)'
      });
    }
    
    const vaultHash = merkleRoot && typeof merkleRoot === 'string' && merkleRoot.length > 0
      ? merkleRoot
      : crypto.createHash('sha256')
        .update(JSON.stringify(vaultData))
        .digest('hex');
    
    const result = await ethereumService.storeVaultHash(userId, vaultHash);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Vault integrity root stored on Sepolia blockchain',
        data: {
          userId,
          vaultHash,
          txHash: result.txHash,
          blockNumber: result.blockNumber,
          gasUsed: result.gasUsed,
          etherscanUrl: `https://sepolia.etherscan.io/tx/${result.txHash}`
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
    
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: [] });
    }
    
    const history = await blockchainDecoder.getUserTransactionHistory(userId);
    
    res.json({
      success: true,
      data: history.map(tx => ({
        txHash: tx.txHash,
        timestamp: tx.timestamp,
        blockNumber: tx.blockNumber || 0,
        etherscanUrl: `https://sepolia.etherscan.io/tx/${tx.txHash}`
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
    
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: [] });
    }
    
    const history = await blockchainDecoder.getUserTransactionHistory(userId);
    
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
        etherscanUrl: `https://sepolia.etherscan.io/tx/${tx.txHash}`,
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

router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { userId, vaultData, merkleRoot } = req.body;
    
    if (!userId || (!vaultData && !merkleRoot)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, (vaultData or merkleRoot)'
      });
    }
    
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
    
    if (!networkInfo || networkInfo.error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch network statistics'
      });
    }
    
    res.json({
      success: true,
      data: {
        network: networkInfo.network,
        chainId: networkInfo.chainId,
        walletAddress: networkInfo.walletAddress,
        balance: networkInfo.balance,
        gasPrice: networkInfo.gasPrice,
        contractAddress: networkInfo.contractAddress,
        etherscanUrl: `https://sepolia.etherscan.io/address/${networkInfo.contractAddress}`
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



