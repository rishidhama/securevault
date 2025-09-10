#!/usr/bin/env node

/**
 * Test Sepolia Testnet Connectivity
 * This script tests basic Ethereum connectivity without requiring full setup
 */

const { ethers } = require('ethers');
require('dotenv').config();

async function testSepoliaConnection() {
  console.log('🔗 Testing Sepolia Testnet Connectivity...\n');
  
  // Check environment variables
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  
  if (!rpcUrl) {
    console.log('❌ SEPOLIA_RPC_URL not found in .env file');
    console.log('📝 Please add: SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY');
    return;
  }
  
  if (!privateKey) {
    console.log('❌ WALLET_PRIVATE_KEY not found in .env file');
    console.log('📝 Please add: WALLET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE');
    return;
  }
  
  try {
    console.log('📡 Connecting to Sepolia testnet...');
    
    // Create provider
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    // Test basic connection
    const network = await provider.getNetwork();
    console.log(`✅ Connected to: ${network.name} (Chain ID: ${network.chainId})`);
    
    if (network.chainId !== 11155111) {
      console.log('⚠️  Warning: Expected Sepolia (Chain ID: 11155111)');
    }
    
    // Test wallet connection
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`👤 Wallet address: ${wallet.address}`);
    
    // Check balance
    const balance = await wallet.getBalance();
    console.log(`💰 Balance: ${ethers.utils.formatEther(balance)} ETH`);
    
    if (balance.lt(ethers.utils.parseEther('0.01'))) {
      console.log('⚠️  Low balance - get more ETH from faucets');
      console.log('💡 Visit: https://sepoliafaucet.com/');
    }
    
    // Test gas price
    const gasPrice = await provider.getGasPrice();
    console.log(`⛽ Gas price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} Gwei`);
    
    // Test block number
    const blockNumber = await provider.getBlockNumber();
    console.log(`📦 Current block: ${blockNumber}`);
    
    console.log('\n🎉 Sepolia connection test successful!');
    console.log('✅ Your setup is ready for blockchain operations');
    
    // Show next steps
    console.log('\n📋 Next steps:');
    console.log('1. Deploy contract: node scripts/deploy-sepolia.js');
    console.log('2. Start server: npm run server');
    console.log('3. Test API: curl http://localhost:5000/api/blockchain/status');
    
  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Check your RPC URL - it might be invalid');
    } else if (error.message.includes('unauthorized')) {
      console.log('\n💡 Check your API key - it might be invalid or expired');
    } else if (error.message.includes('rate limit')) {
      console.log('\n💡 You might have hit rate limits - try again later');
    } else if (error.message.includes('invalid private key')) {
      console.log('\n💡 Check your private key format');
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify your RPC URL is correct');
    console.log('2. Check your API key is valid');
    console.log('3. Ensure you have internet connection');
    console.log('4. Try a different RPC provider');
  }
}

// Run test
if (require.main === module) {
  testSepoliaConnection().catch(console.error);
}

module.exports = { testSepoliaConnection };



