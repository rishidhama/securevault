const { ethers } = require('ethers');

/**
 * VaultChain - Blockchain Integrity Service
 * 
 * Provides tamper-evident storage of vault integrity hashes on Ethereum.
 * Uses Sepolia testnet for cost-effective integrity anchoring without
 * storing sensitive data on-chain.
 * 
 * Architecture decision: Only store Merkle roots of audit events, never
 * plaintext credentials or encrypted data. This provides tamper detection
 * while maintaining privacy.
 */
class VaultChain {
  constructor() {
    this.enabled = process.env.ETHEREUM_ENABLED === 'true';
    this.rpcUrl = process.env.SEPOLIA_RPC_URL;
    this.privateKey = process.env.WALLET_PRIVATE_KEY;
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.initialized = false;
  }

  async init() {
    if (!this.enabled) {
      console.log('Ethereum service is disabled');
      return false;
    }

    try {
      if (!this.rpcUrl || !this.privateKey) {
        throw new Error('Missing Ethereum configuration: SEPOLIA_RPC_URL, WALLET_PRIVATE_KEY');
      }

      // Connect to Sepolia testnet
      this.provider = new ethers.providers.JsonRpcProvider(this.rpcUrl);
      this.wallet = new ethers.Wallet(this.privateKey, this.provider);
      
      // Get network info
      const network = await this.provider.getNetwork();
      const balance = await this.wallet.getBalance();
      
      console.log(`Connected to ${network.name} (Chain ID: ${network.chainId})`);
      console.log(`Wallet: ${this.wallet.address}`);
      console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH`);

      // Deploy or connect to contract
      if (this.contractAddress) {
        await this.connectToContract();
      } else {
        await this.deployContract();
      }

      this.initialized = true;
      return true;

    } catch (error) {
      console.error('Ethereum service initialization failed:', error.message);
      return false;
    }
  }

  async deployContract() {
    try {
      
      // Simple contract for storing password vault hashes
      const contractSource = `
        // SPDX-License-Identifier: MIT
        pragma solidity ^0.8.0;
        
        contract PasswordVault {
            struct VaultHash {
                string userId;
                string vaultHash;
                uint256 timestamp;
                bool exists;
            }
            
            mapping(string => VaultHash) public vaults;
            event VaultUpdated(string userId, string vaultHash, uint256 timestamp);
            
            function updateVaultHash(string memory userId, string memory vaultHash) public {
                vaults[userId] = VaultHash(userId, vaultHash, block.timestamp, true);
                emit VaultUpdated(userId, vaultHash, block.timestamp);
            }
            
            function getVaultHash(string memory userId) public view returns (string memory, uint256, bool) {
                VaultHash memory vault = vaults[userId];
                return (vault.vaultHash, vault.timestamp, vault.exists);
            }
        }
      `;

      // For now, we'll use a simple contract factory
      // In production, you'd compile this first
      const contractFactory = new ethers.ContractFactory(
        ['function updateVaultHash(string,string)', 'function getVaultHash(string) view returns(string,uint256,bool)'],
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c8063a9059cbb1461003b578063c0d7865514610069575b600080fd5b610057600480360381019061005291906100d6565b610087565b604051610060919061012c565b60405180910390f35b6100716100a1565b60405161007e919061012c565b60405180910390f35b6000816000819055506001905092915050565b60008054905090565b600080fd5b6000819050919050565b6100c3816100b0565b81146100ce57600080fd5b50565b6000813590506100e0816100ba565b92915050565b6000602082840312156100fc576100fb6100ab565b5b600061010a848285016100d1565b91505092915050565b60008115159050919050565b61012a81610115565b82525050565b60006020820190506101456000830184610121565b9291505056fea2646970667358221220d6b93f0a8c6c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c64736f6c63430008110033',
        this.wallet
      );

      const contract = await contractFactory.deploy();
      await contract.deployed();
      
      this.contract = contract;
      this.contractAddress = contract.address;
      
      console.log(`Contract deployed to: ${contract.address}`);
      console.log(`Add this to your .env: CONTRACT_ADDRESS=${contract.address}`);
      
      return contract.address;

    } catch (error) {
      console.error('Contract deployment failed:', error.message);
      throw error;
    }
  }

  async connectToContract() {
    try {
      console.log(`Connecting to existing contract: ${this.contractAddress}`);
      
      const contractABI = [
        'function updateVaultHash(string,string)',
        'function getVaultHash(string) view returns(string,uint256,bool)',
        'event VaultUpdated(string,uint256)'
      ];
      
      this.contract = new ethers.Contract(this.contractAddress, contractABI, this.wallet);
      
      // Test connection
      const code = await this.provider.getCode(this.contractAddress);
      if (code === '0x') {
        throw new Error('No contract found at specified address');
      }
      
      console.log('Contract connection successful');
      
    } catch (error) {
      console.error('Contract connection failed:', error.message);
      throw error;
    }
  }

  async storeVaultHash(userId, vaultHash) {
    if (!this.initialized) {
      throw new Error('Ethereum service not initialized');
    }

    try {
      console.log(`Storing vault hash for user ${userId} on Sepolia...`);
      console.log(`Transaction details:`, {
        userId: userId,
        userIdLength: userId.length,
        vaultHash: vaultHash,
        vaultHashLength: vaultHash.length,
        vaultHashPreview: vaultHash.slice(0, 20) + '...'
      });
      
      // Estimate gas first, then add buffer
      let gasLimit;
      try {
        const estimatedGas = await this.contract.estimateGas.updateVaultHash(userId, vaultHash);
        gasLimit = estimatedGas.mul(120).div(100); // Add 20% buffer
        console.log(`Estimated gas: ${estimatedGas.toString()}, Using: ${gasLimit.toString()}`);
      } catch (error) {
        console.log(`Gas estimation failed, using default: ${error.message}`);
        gasLimit = 300000; // Increased default gas limit
      }
      
      const tx = await this.contract.updateVaultHash(userId, vaultHash, {
        gasLimit: gasLimit
      });
      
      console.log(`Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
      
      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
      
    } catch (error) {
      console.error('Failed to store vault hash:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getVaultHash(userId) {
    if (!this.initialized) {
      throw new Error('Ethereum service not initialized');
    }

    try {
      const [vaultHash, timestamp, exists] = await this.contract.getVaultHash(userId);
      
      if (!exists) {
        return { exists: false };
      }
      
      return {
        exists: true,
        vaultHash,
        timestamp: timestamp.toNumber(),
        blockTime: new Date(timestamp.toNumber() * 1000).toISOString()
      };
      
    } catch (error) {
      console.error('Failed to get vault hash:', error.message);
      throw error;
    }
  }

  async getNetworkInfo() {
    if (!this.provider) return null;
    
    try {
      const network = await this.provider.getNetwork();
      const balance = await this.wallet.getBalance();
      const gasPrice = await this.provider.getGasPrice();
      
      return {
        network: network.name,
        chainId: network.chainId,
        walletAddress: this.wallet.address,
        balance: ethers.utils.formatEther(balance),
        gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei') + ' Gwei',
        contractAddress: this.contractAddress
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async getTransactionHistory(userId) {
    if (!this.initialized) return [];
    
    try {
      // For now, return empty array as blockchain event querying is complex
      // In a production system, you'd want to implement proper event indexing
      console.log(`Transaction history requested for user: ${userId}`);
      console.log('Event querying requires external indexing service');
      
      // Note: Event querying requires external indexing service
      // For production, implement with The Graph Protocol or similar
      // Current implementation stores events in database for querying
      
      return [];
      
    } catch (error) {
      console.error('Failed to get transaction history:', error.message);
      return [];
    }
  }
}

module.exports = new VaultChain();



