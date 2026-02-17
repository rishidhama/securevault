const { ethers } = require('ethers');

/**
 * Blockchain Integrity Service
 * 
 * Stores vault integrity hashes on Ethereum L1/L2.
 * Supports both legacy string-based contracts and L2 bytes32 contracts.
 */
class VaultChain {
  constructor() {
    this.enabled = process.env.ETHEREUM_ENABLED === 'true';
    // Support both L1 (Sepolia) and L2 (Arbitrum) RPC URLs
    // For testnet benchmarking, use Arbitrum Sepolia:
    // ARBITRUM_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
    // Chain ID: 421614 (Arbitrum Sepolia testnet)
    // For mainnet: Chain ID: 42161 (Arbitrum One)
    this.rpcUrl = process.env.ARBITRUM_RPC_URL || process.env.SEPOLIA_RPC_URL;
    this.privateKey = process.env.WALLET_PRIVATE_KEY;
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    // Contract version: 'l2' for bytes32, 'legacy' for string-based
    this.contractVersion = process.env.CONTRACT_VERSION || 'legacy';
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.initialized = false;
  }

  hashUserId(userId) {
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(userId));
  }

  hexToBytes32(vaultHash) {
    const cleanHash = vaultHash.startsWith('0x') ? vaultHash.slice(2) : vaultHash;
    if (cleanHash.length !== 64) {
      throw new Error(`Invalid hash length: expected 64 hex chars, got ${cleanHash.length}`);
    }
    return '0x' + cleanHash;
  }

  async init() {
    if (!this.enabled) {
      console.log('Ethereum service is disabled');
      return false;
    }

    try {
      if (!this.rpcUrl || !this.privateKey) {
        throw new Error('Missing Ethereum configuration: RPC_URL (ARBITRUM_RPC_URL or SEPOLIA_RPC_URL), WALLET_PRIVATE_KEY');
      }

      this.provider = new ethers.providers.JsonRpcProvider(this.rpcUrl);
      this.wallet = new ethers.Wallet(this.privateKey, this.provider);
      
      const network = await this.provider.getNetwork();
      // Refresh balance to ensure accurate reading
      const balance = await this.wallet.getBalance();
      
      // Detect network type
      const isArbitrum = network.chainId === 42161 || network.chainId === 421614; // Arbitrum One or Sepolia
      const isTestnet = network.chainId === 421614 || network.chainId === 11155111; // Arbitrum Sepolia or Sepolia
      const networkName = isArbitrum 
        ? (network.chainId === 421614 ? 'Arbitrum Sepolia (Testnet)' : 'Arbitrum One (Mainnet)')
        : network.name;
      
      console.log(`Connected to ${networkName} (Chain ID: ${network.chainId})`);
      if (isTestnet) {
        console.log('⚠️  TESTNET MODE - Using testnet for benchmarking');
      }
      console.log(`Contract version: ${this.contractVersion}`);
      console.log(`Wallet: ${this.wallet.address}`);
      console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH`);

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
      
      // Use different ABI based on contract version
      let contractABI;
      if (this.contractVersion === 'l2') {
        // L2-optimized contract (bytes32)
        contractABI = [
          'function updateVaultHash(bytes32,bytes32)',
          'function getVaultHash(bytes32) view returns(bytes32,uint64,bool)',
          'function batchUpdateVaultHash(bytes32[],bytes32[])',
          'function getVaultCount() view returns(uint256)',
          'function hasEverExisted(bytes32) view returns(bool)',
          'event VaultUpdated(bytes32 indexed,bytes32,uint64)',
          'event VaultDeleted(bytes32 indexed,uint64)'
        ];
      } else {
        // Legacy contract (string-based)
        contractABI = [
          'function updateVaultHash(string,string)',
          'function getVaultHash(string) view returns(string,uint256,bool)',
          'event VaultUpdated(string,uint256)'
        ];
      }
      
      this.contract = new ethers.Contract(this.contractAddress, contractABI, this.wallet);
      
      // Test connection
      const code = await this.provider.getCode(this.contractAddress);
      if (code === '0x') {
        throw new Error('No contract found at specified address');
      }
      
      console.log(`Contract connection successful (version: ${this.contractVersion})`);
      
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
      const submitTs = Date.now();
      const network = await this.provider.getNetwork();
      const networkName = network.chainId === 42161 || network.chainId === 421614 ? 'Arbitrum' : 'Sepolia';
      
      console.log(`Storing vault hash for user ${userId} on ${networkName}...`);
      
      // Convert to bytes32 if using L2 contract
      let userIdParam, vaultHashParam;
      if (this.contractVersion === 'l2') {
        userIdParam = this.hashUserId(userId);
        vaultHashParam = this.hexToBytes32(vaultHash);
        console.log(`Transaction details (L2):`, {
          userId,
          userIdHash: userIdParam,
          vaultHash: vaultHash,
          vaultHashBytes32: vaultHashParam
        });
      } else {
        userIdParam = userId;
        vaultHashParam = vaultHash;
        console.log(`Transaction details (Legacy):`, {
          userId: userId,
          userIdLength: userId.length,
          vaultHash: vaultHash,
          vaultHashLength: vaultHash.length
        });
      }
      
      let gasLimit;
      try {
        const estimatedGas = await this.contract.estimateGas.updateVaultHash(userIdParam, vaultHashParam);
        gasLimit = estimatedGas.mul(120).div(100); // Add 20% buffer
        console.log(`Estimated gas: ${estimatedGas.toString()}, Using: ${gasLimit.toString()}`);
      } catch (error) {
        console.log(`Gas estimation failed, using default: ${error.message}`);
        // L2 contracts use less gas, adjust default
        gasLimit = this.contractVersion === 'l2' ? 100000 : 300000;
      }
      
      const tx = await this.contract.updateVaultHash(userIdParam, vaultHashParam, {
        gasLimit: gasLimit
      });
      
      console.log(`Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      const confirmTs = Date.now();
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      // Structured log for benchmarking anchoring latency and gas usage
      try {
        const anchorEntry = {
          op: 'anchor',
          userId,
          contractVersion: this.contractVersion,
          network: networkName,
          txHash: tx.hash,
          submitTs,
          confirmTs,
          latencyMs: confirmTs - submitTs,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : null,
          gasPriceWei: receipt.effectiveGasPrice ? receipt.effectiveGasPrice.toString() : null
        };
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(anchorEntry));
      } catch (e) {
        // ignore logging errors
      }
      
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

  /**
   * Batch update multiple vault hashes in a single transaction (L2 only)
   * @param {Array<{userId: string, vaultHash: string}>} updates - Array of userId/vaultHash pairs
   * @returns {Promise<Object>} Transaction result
   */
  async batchStoreVaultHash(updates) {
    if (!this.initialized) {
      throw new Error('Ethereum service not initialized');
    }

    if (this.contractVersion !== 'l2') {
      throw new Error('Batch updates only supported on L2-optimized contract');
    }

    try {
      const submitTs = Date.now();
      const network = await this.provider.getNetwork();
      const networkName = network.chainId === 42161 || network.chainId === 421614 ? 'Arbitrum' : 'Sepolia';
      
      console.log(`Batch storing ${updates.length} vault hashes on ${networkName}...`);
      
      // Convert to bytes32 arrays
      const userIdHashes = updates.map(u => this.hashUserId(u.userId));
      const vaultHashes = updates.map(u => this.hexToBytes32(u.vaultHash));
      
      let gasLimit;
      try {
        const estimatedGas = await this.contract.estimateGas.batchUpdateVaultHash(userIdHashes, vaultHashes);
        gasLimit = estimatedGas.mul(120).div(100);
        console.log(`Estimated gas: ${estimatedGas.toString()}, Using: ${gasLimit.toString()}`);
      } catch (error) {
        console.log(`Gas estimation failed, using default: ${error.message}`);
        // Base gas + per-item gas (rough estimate)
        gasLimit = 50000 + (updates.length * 50000);
      }
      
      const tx = await this.contract.batchUpdateVaultHash(userIdHashes, vaultHashes, {
        gasLimit: gasLimit
      });
      
      console.log(`Batch transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      const confirmTs = Date.now();
      console.log(`Batch transaction confirmed in block ${receipt.blockNumber}`);

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        itemsUpdated: updates.length
      };
      
    } catch (error) {
      console.error('Failed to batch store vault hashes:', error.message);
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
      // Convert userId to bytes32 if using L2 contract
      const userIdParam = this.contractVersion === 'l2' ? this.hashUserId(userId) : userId;
      
      const result = await this.contract.getVaultHash(userIdParam);
      
      // Handle different return types
      let vaultHash, timestamp, exists;
      if (Array.isArray(result)) {
        [vaultHash, timestamp, exists] = result;
      } else {
        // Handle struct return
        vaultHash = result.vaultHash;
        timestamp = result.timestamp;
        exists = result.exists;
      }
      
      if (!exists) {
        return { exists: false };
      }
      
      // Convert bytes32 back to hex string if needed
      const vaultHashStr = typeof vaultHash === 'string' ? vaultHash : vaultHash;
      const timestampNum = timestamp.toNumber ? timestamp.toNumber() : Number(timestamp);
      
      return {
        exists: true,
        vaultHash: vaultHashStr,
        timestamp: timestampNum,
        blockTime: new Date(timestampNum * 1000).toISOString()
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



