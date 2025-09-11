#!/usr/bin/env node

/**
 * Analyze Transaction Data
 * 
 * This script analyzes the transaction data to understand what function
 * is being called and with what parameters.
 */

const { ethers } = require('ethers');
require('dotenv').config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const TRANSACTION_HASH = '0x2cdba07e2dc4f9b40ad7077622ede7fddb68cb776f70574483e7aac264c3a2c0';

// Contract ABI for the PasswordVault contract
const CONTRACT_ABI = [
  'function updateVaultHash(string,string)',
  'function getVaultHash(string) view returns(string,uint256,bool)',
  'function getVaultCount() view returns(uint256)',
  'event VaultUpdated(string,uint256)'
];

async function analyzeTransactionData() {
  console.log('🔍 Analyzing Transaction Data...\n');

  if (!SEPOLIA_RPC_URL) {
    console.log('❌ SEPOLIA_RPC_URL not set in environment variables');
    return;
  }

  try {
    const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);
    
    // Get transaction details
    const tx = await provider.getTransaction(TRANSACTION_HASH);
    
    if (!tx) {
      console.log('❌ Transaction not found');
      return;
    }

    console.log('1. Transaction Overview:');
    console.log(`   Hash: ${tx.hash}`);
    console.log(`   From: ${tx.from}`);
    console.log(`   To: ${tx.to}`);
    console.log(`   Data Length: ${tx.data.length} characters`);
    console.log(`   Gas Limit: ${tx.gasLimit.toString()}`);

    // Decode the transaction data
    console.log('\n2. Decoding Transaction Data:');
    
    try {
      // Create contract interface
      const contractInterface = new ethers.utils.Interface(CONTRACT_ABI);
      
      // Decode the transaction data
      const decoded = contractInterface.parseTransaction({ data: tx.data });
      
      if (decoded) {
        console.log(`   Function: ${decoded.name}`);
        console.log(`   Parameters:`);
        
        decoded.args.forEach((arg, index) => {
          console.log(`     [${index}]: ${arg}`);
          if (typeof arg === 'string') {
            console.log(`         Length: ${arg.length} characters`);
            console.log(`         Preview: ${arg.slice(0, 50)}${arg.length > 50 ? '...' : ''}`);
          }
        });

        // Check for potential issues
        console.log('\n3. Potential Issues Analysis:');
        
        const userId = decoded.args[0];
        const vaultHash = decoded.args[1];
        
        if (!userId || userId.length === 0) {
          console.log('   ❌ userId is empty or null');
        } else {
          console.log(`   ✅ userId: "${userId}" (${userId.length} chars)`);
        }
        
        if (!vaultHash || vaultHash.length === 0) {
          console.log('   ❌ vaultHash is empty or null');
        } else {
          console.log(`   ✅ vaultHash: "${vaultHash}" (${vaultHash.length} chars)`);
        }

        // Check if vaultHash looks like a valid SHA-256 hash
        if (vaultHash && vaultHash.length === 64 && /^[0-9a-f]+$/i.test(vaultHash)) {
          console.log('   ✅ vaultHash appears to be a valid SHA-256 hash');
        } else if (vaultHash) {
          console.log('   ⚠️  vaultHash does not appear to be a valid SHA-256 hash');
          console.log(`       Expected: 64 hex characters`);
          console.log(`       Got: ${vaultHash.length} characters`);
        }

      } else {
        console.log('   ❌ Could not decode transaction data');
        console.log(`   Raw data: ${tx.data}`);
      }

    } catch (error) {
      console.log(`   ❌ Error decoding transaction: ${error.message}`);
      console.log(`   Raw data: ${tx.data}`);
    }

    // Check contract state
    console.log('\n4. Contract State Check:');
    try {
      const contract = new ethers.Contract(tx.to, CONTRACT_ABI, provider);
      
      // Try to call a view function to see if contract is working
      const vaultCount = await contract.getVaultCount();
      console.log(`   ✅ Contract is accessible`);
      console.log(`   Current vault count: ${vaultCount.toString()}`);
      
    } catch (error) {
      console.log(`   ❌ Contract call failed: ${error.message}`);
    }

    console.log('\n📋 Analysis Summary:');
    console.log('====================');
    console.log('1. Transaction is calling updateVaultHash function');
    console.log('2. Check if userId and vaultHash parameters are valid');
    console.log('3. Verify the contract is working correctly');
    console.log('4. Check server logs for the exact error message');

  } catch (error) {
    console.error(`❌ Analysis failed: ${error.message}`);
  }
}

// Run the analysis
if (require.main === module) {
  analyzeTransactionData().catch(console.error);
}

module.exports = { analyzeTransactionData };
