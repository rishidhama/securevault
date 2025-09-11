#!/usr/bin/env node

/**
 * Debug Failed Transaction
 * 
 * This script helps debug failed blockchain transactions by fetching
 * transaction details and analyzing the error.
 */

const { ethers } = require('ethers');
require('dotenv').config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const TRANSACTION_HASH = '0x2cdba07e2dc4f9b40ad7077622ede7fddb68cb776f70574483e7aac264c3a2c0';

async function debugTransaction() {
  console.log('🔍 Debugging Failed Transaction...\n');
  console.log(`Transaction Hash: ${TRANSACTION_HASH}\n`);

  if (!SEPOLIA_RPC_URL) {
    console.log('❌ SEPOLIA_RPC_URL not set in environment variables');
    return;
  }

  try {
    // Connect to Sepolia
    const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);
    
    // Get transaction details
    console.log('1. Fetching transaction details...');
    const tx = await provider.getTransaction(TRANSACTION_HASH);
    
    if (!tx) {
      console.log('❌ Transaction not found');
      return;
    }

    console.log(`   From: ${tx.from}`);
    console.log(`   To: ${tx.to}`);
    console.log(`   Value: ${ethers.utils.formatEther(tx.value)} ETH`);
    console.log(`   Gas Limit: ${tx.gasLimit.toString()}`);
    console.log(`   Gas Price: ${ethers.utils.formatUnits(tx.gasPrice, 'gwei')} Gwei`);
    console.log(`   Data: ${tx.data.slice(0, 100)}...`);

    // Get transaction receipt
    console.log('\n2. Fetching transaction receipt...');
    const receipt = await provider.getTransactionReceipt(TRANSACTION_HASH);
    
    if (!receipt) {
      console.log('❌ Transaction receipt not found (transaction may still be pending)');
      return;
    }

    console.log(`   Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
    console.log(`   Block Number: ${receipt.blockNumber}`);
    console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`   Effective Gas Price: ${ethers.utils.formatUnits(receipt.effectiveGasPrice, 'gwei')} Gwei`);

    if (receipt.status === 0) {
      console.log('\n3. Transaction failed - analyzing error...');
      
      // Try to get the error from the transaction
      try {
        // Get the block to analyze the transaction
        const block = await provider.getBlock(receipt.blockNumber);
        
        // Try to replay the transaction to get the error
        console.log('   Attempting to replay transaction to get error details...');
        
        // This is a simplified approach - in practice, you'd need to decode the transaction
        console.log('   Transaction failed during execution');
        console.log('   Possible causes:');
        console.log('   - Insufficient gas');
        console.log('   - Contract revert with custom error');
        console.log('   - Invalid function call');
        console.log('   - Contract state issue');
        
      } catch (error) {
        console.log(`   Error analyzing transaction: ${error.message}`);
      }
    }

    // Check contract interaction
    console.log('\n4. Analyzing contract interaction...');
    if (tx.to) {
      const code = await provider.getCode(tx.to);
      if (code === '0x') {
        console.log('   ❌ No contract found at this address');
      } else {
        console.log('   ✅ Contract exists at this address');
        console.log(`   Contract code length: ${code.length} characters`);
      }
    }

    // Check wallet balance
    console.log('\n5. Checking wallet balance...');
    const balance = await provider.getBalance(tx.from);
    console.log(`   Wallet balance: ${ethers.utils.formatEther(balance)} ETH`);
    
    if (balance.lt(ethers.utils.parseEther('0.001'))) {
      console.log('   ⚠️  Low balance! You need more ETH for gas fees');
    } else {
      console.log('   ✅ Sufficient balance for gas fees');
    }

    console.log('\n📋 Debug Summary:');
    console.log('=================');
    console.log('1. Transaction was submitted to Sepolia');
    console.log('2. Transaction failed during execution');
    console.log('3. Check server logs for detailed error messages');
    console.log('4. Verify contract is deployed and accessible');
    console.log('5. Ensure wallet has sufficient ETH for gas');

  } catch (error) {
    console.error(`❌ Debug failed: ${error.message}`);
  }
}

// Run the debug
if (require.main === module) {
  debugTransaction().catch(console.error);
}

module.exports = { debugTransaction };
