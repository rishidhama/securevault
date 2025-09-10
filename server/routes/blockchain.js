const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth');
const ethereumService = require('../services/ethereum-service');
const crypto = require('crypto');

// Initialize Ethereum service
ethereumService.init().catch(console.error);

// GET blockchain status and network info
router.get('/status', authenticateToken, async (req, res) => {
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

// POST store vault hash on blockchain
router.post('/store-vault', authenticateToken, async (req, res) => {
  try {
    const { userId, vaultData } = req.body;
    
    if (!userId || !vaultData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, vaultData'
      });
    }
    
    // Create hash of vault data
    const vaultHash = crypto.createHash('sha256')
      .update(JSON.stringify(vaultData))
      .digest('hex');
    
    // Store on Sepolia blockchain
    const result = await ethereumService.storeVaultHash(userId, vaultHash);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Vault hash stored on Sepolia blockchain',
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

// GET vault hash from blockchain
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

// GET transaction history for a user
router.get('/history/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const history = await ethereumService.getTransactionHistory(userId);
    
    res.json({
      success: true,
      data: history.map(tx => ({
        ...tx,
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

// POST verify vault integrity
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { userId, vaultData } = req.body;
    
    if (!userId || !vaultData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, vaultData'
      });
    }
    
    // Get stored hash from blockchain
    const storedData = await ethereumService.getVaultHash(userId);
    
    if (!storedData.exists) {
      return res.status(404).json({
        success: false,
        error: 'No vault hash found on blockchain for this user'
      });
    }
    
    // Calculate current hash
    const currentHash = crypto.createHash('sha256')
      .update(JSON.stringify(vaultData))
      .digest('hex');
    
    // Compare hashes
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

// GET blockchain network statistics
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



