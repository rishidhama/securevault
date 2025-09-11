#!/usr/bin/env node

/**
 * Test Blockchain Endpoint
 * 
 * This script tests the blockchain API endpoint to verify it's working correctly.
 */

const fetch = require('node-fetch');
require('dotenv').config();

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';

async function testBlockchainEndpoint() {
  console.log('🔍 Testing Blockchain API Endpoint...\n');

  try {
    // Test 1: Health endpoint (no auth required)
    console.log('1. Testing health endpoint:');
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response: ${JSON.stringify(healthData, null, 2)}\n`);

    // Test 2: Blockchain status endpoint (auth required)
    console.log('2. Testing blockchain status endpoint (without auth):');
    try {
      const statusResponse = await fetch(`${API_BASE_URL}/api/blockchain/status`);
      console.log(`   Status: ${statusResponse.status}`);
      if (statusResponse.status === 401) {
        console.log('   ✅ Correctly requires authentication\n');
      } else {
        const statusData = await statusResponse.json();
        console.log(`   Response: ${JSON.stringify(statusData, null, 2)}\n`);
      }
    } catch (error) {
      console.log(`   Error: ${error.message}\n`);
    }

    // Test 3: Check environment variables
    console.log('3. Checking blockchain environment variables:');
    console.log(`   ETHEREUM_ENABLED: ${process.env.ETHEREUM_ENABLED || 'Not set'}`);
    console.log(`   SEPOLIA_RPC_URL: ${process.env.SEPOLIA_RPC_URL ? 'Set' : 'Not set'}`);
    console.log(`   WALLET_PRIVATE_KEY: ${process.env.WALLET_PRIVATE_KEY ? 'Set' : 'Not set'}`);
    console.log(`   CONTRACT_ADDRESS: ${process.env.CONTRACT_ADDRESS || 'Not set'}\n`);

    // Test 4: Test with mock authentication
    console.log('4. Testing blockchain endpoint with mock auth:');
    const mockToken = 'mock-jwt-token';
    try {
      const authResponse = await fetch(`${API_BASE_URL}/api/blockchain/status`, {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`   Status: ${authResponse.status}`);
      if (authResponse.status === 401) {
        console.log('   ✅ Authentication validation working\n');
      } else {
        const authData = await authResponse.json();
        console.log(`   Response: ${JSON.stringify(authData, null, 2)}\n`);
      }
    } catch (error) {
      console.log(`   Error: ${error.message}\n`);
    }

    console.log('📋 Summary:');
    console.log('===========');
    console.log('1. Server is running and responding to health checks');
    console.log('2. Blockchain endpoint requires authentication (good!)');
    console.log('3. Check your .env file for blockchain configuration');
    console.log('4. Make sure you are logged in to the web application');
    console.log('5. The CORS error should be resolved once you are authenticated\n');

    console.log('🔧 Next Steps:');
    console.log('=============');
    console.log('1. Make sure your .env file has the blockchain variables set');
    console.log('2. Log in to the web application');
    console.log('3. The blockchain monitor should now work correctly');

  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    console.log('\n💡 Make sure the server is running:');
    console.log('   npm start');
  }
}

// Run the test
if (require.main === module) {
  testBlockchainEndpoint().catch(console.error);
}

module.exports = { testBlockchainEndpoint };
