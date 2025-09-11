#!/usr/bin/env node

/**
 * Blockchain Implementation Test Script
 * 
 * This script helps verify that the blockchain implementation is working correctly.
 * Run this script to test blockchain connectivity and operations.
 */

const { ethers } = require('ethers');
require('dotenv').config();

// Configuration
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// Contract ABI (simplified)
const CONTRACT_ABI = [
  'function updateVaultHash(string,string)',
  'function getVaultHash(string) view returns(string,uint256,bool)',
  'function getVaultCount() view returns(uint256)',
  'event VaultUpdated(string,uint256)'
];

async function testBlockchainConnection() {
  console.log('🔍 Testing Blockchain Implementation...\n');

  // Test 1: Environment Variables
  console.log('1. Checking Environment Variables:');
  console.log(`   ETHEREUM_ENABLED: ${process.env.ETHEREUM_ENABLED}`);
  console.log(`   SEPOLIA_RPC_URL: ${SEPOLIA_RPC_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   WALLET_PRIVATE_KEY: ${WALLET_PRIVATE_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   CONTRACT_ADDRESS: ${CONTRACT_ADDRESS ? '✅ Set' : '❌ Missing'}\n`);

  if (!SEPOLIA_RPC_URL || !WALLET_PRIVATE_KEY) {
    console.log('❌ Missing required environment variables. Please check your .env file.\n');
    return false;
  }

  try {
    // Test 2: Provider Connection
    console.log('2. Testing Provider Connection:');
    const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const network = await provider.getNetwork();
    console.log(`   Network: ${network.name}`);
    console.log(`   Chain ID: ${network.chainId}`);
    console.log(`   Status: ✅ Connected\n`);

    // Test 3: Wallet Connection
    console.log('3. Testing Wallet Connection:');
    const wallet = new ethers.Wallet(WALLET_PRIVATE_KEY, provider);
    const balance = await wallet.getBalance();
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Balance: ${ethers.utils.formatEther(balance)} ETH`);
    
    if (balance.lt(ethers.utils.parseEther('0.001'))) {
      console.log(`   ⚠️  Warning: Low balance! You need at least 0.001 ETH for gas fees.\n`);
    } else {
      console.log(`   Status: ✅ Sufficient balance\n`);
    }

    // Test 4: Contract Connection
    if (CONTRACT_ADDRESS) {
      console.log('4. Testing Contract Connection:');
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
      
      // Check if contract exists
      const code = await provider.getCode(CONTRACT_ADDRESS);
      if (code === '0x') {
        console.log(`   Status: ❌ No contract found at address ${CONTRACT_ADDRESS}\n`);
        return false;
      }

      // Test contract functions
      try {
        const vaultCount = await contract.getVaultCount();
        console.log(`   Contract Address: ${CONTRACT_ADDRESS}`);
        console.log(`   Vault Count: ${vaultCount.toString()}`);
        console.log(`   Status: ✅ Contract accessible\n`);
      } catch (error) {
        console.log(`   Status: ❌ Contract function call failed: ${error.message}\n`);
        return false;
      }
    } else {
      console.log('4. Contract Connection:');
      console.log(`   Status: ⚠️  No contract address provided\n`);
    }

    // Test 5: Gas Price
    console.log('5. Checking Gas Prices:');
    const gasPrice = await provider.getGasPrice();
    console.log(`   Gas Price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} Gwei`);
    console.log(`   Status: ✅ Gas price retrieved\n`);

    console.log('🎉 All tests passed! Blockchain implementation is ready.\n');
    return true;

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}\n`);
    return false;
  }
}

async function testCredentialOperation() {
  console.log('🧪 Testing Credential Operation...\n');

  if (!CONTRACT_ADDRESS) {
    console.log('❌ Cannot test credential operation without contract address.\n');
    return false;
  }

  try {
    const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(WALLET_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    // Test data
    const testUserId = 'test-user-' + Date.now();
    const testVaultHash = '0x' + require('crypto').createHash('sha256')
      .update(JSON.stringify({ test: 'data', timestamp: Date.now() }))
      .digest('hex');

    console.log(`   Test User ID: ${testUserId}`);
    console.log(`   Test Hash: ${testVaultHash.slice(0, 20)}...`);

    // Send transaction
    console.log('   Sending transaction...');
    const tx = await contract.updateVaultHash(testUserId, testVaultHash, {
      gasLimit: 150000
    });

    console.log(`   Transaction Hash: ${tx.hash}`);
    console.log('   Waiting for confirmation...');

    const receipt = await tx.wait();
    console.log(`   Block Number: ${receipt.blockNumber}`);
    console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);

    // Verify the transaction
    const [storedHash, timestamp, exists] = await contract.getVaultHash(testUserId);
    console.log(`   Stored Hash: ${storedHash.slice(0, 20)}...`);
    console.log(`   Timestamp: ${new Date(timestamp.toNumber() * 1000).toISOString()}`);
    console.log(`   Exists: ${exists}`);

    if (exists && storedHash === testVaultHash) {
      console.log('   Status: ✅ Credential operation successful!\n');
      return true;
    } else {
      console.log('   Status: ❌ Credential operation failed!\n');
      return false;
    }

  } catch (error) {
    console.log(`❌ Credential operation test failed: ${error.message}\n`);
    return false;
  }
}

async function main() {
  console.log('🚀 SecureVault Blockchain Test Suite\n');
  console.log('=====================================\n');

  const connectionTest = await testBlockchainConnection();
  
  if (connectionTest) {
    await testCredentialOperation();
  }

  console.log('📋 Test Summary:');
  console.log('================');
  console.log('1. Check your .env file has all required variables');
  console.log('2. Ensure your wallet has sufficient ETH for gas fees');
  console.log('3. Verify your contract is deployed on Sepolia');
  console.log('4. Test the web application to see blockchain operations in action');
  console.log('\n🔗 Useful Links:');
  console.log(`   Sepolia Etherscan: https://sepolia.etherscan.io/`);
  if (CONTRACT_ADDRESS) {
    console.log(`   Your Contract: https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`);
  }
  console.log(`   Sepolia Faucet: https://sepoliafaucet.com/`);
}

// Run the tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testBlockchainConnection, testCredentialOperation };
