// Simple test to verify blockchain functionality
console.log('🧪 Testing Blockchain Integration');

// Test 1: Check if ethereum service can be loaded
try {
  const ethereumService = require('./server/services/ethereum-service');
  console.log('✅ Ethereum service loaded successfully');
  
  // Test 2: Check if blockchain routes can be loaded
  const blockchainRoutes = require('./server/routes/blockchain');
  console.log('✅ Blockchain routes loaded successfully');
  
  // Test 3: Check environment variables
  require('dotenv').config();
  console.log('Environment variables:');
  console.log('- ETHEREUM_ENABLED:', process.env.ETHEREUM_ENABLED);
  console.log('- SEPOLIA_RPC_URL:', process.env.SEPOLIA_RPC_URL ? 'Set' : 'Not set');
  console.log('- WALLET_PRIVATE_KEY:', process.env.WALLET_PRIVATE_KEY ? 'Set' : 'Not set');
  console.log('- CONTRACT_ADDRESS:', process.env.CONTRACT_ADDRESS);
  
  console.log('\n✅ All blockchain components loaded successfully!');
  console.log('🎯 Ready to demonstrate Sepolia integration');
  
} catch (error) {
  console.error('❌ Error loading blockchain components:', error.message);
  console.error(error.stack);
}


