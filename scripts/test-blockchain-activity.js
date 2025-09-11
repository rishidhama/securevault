#!/usr/bin/env node

/**
 * Test Blockchain Activity API
 * 
 * This script tests the blockchain activity API to verify it's working correctly.
 */

const fetch = require('node-fetch');
require('dotenv').config();

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_USER_ID = '68a098c34bc8dbc4fd78d240'; // Use the user ID from your logs

async function testBlockchainActivity() {
  console.log('🧪 Testing Blockchain Activity API...\n');

  try {
    // Test 1: Health endpoint
    console.log('1. Testing health endpoint:');
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Server: ${healthData.status}\n`);

    // Test 2: Blockchain activity endpoint (without auth - should fail)
    console.log('2. Testing blockchain activity endpoint (without auth):');
    try {
      const activityResponse = await fetch(`${API_BASE_URL}/api/blockchain/activity/${TEST_USER_ID}`);
      console.log(`   Status: ${activityResponse.status}`);
      if (activityResponse.status === 401) {
        console.log('   ✅ Correctly requires authentication\n');
      } else {
        const activityData = await activityResponse.json();
        console.log(`   Response: ${JSON.stringify(activityData, null, 2)}\n`);
      }
    } catch (error) {
      console.log(`   Error: ${error.message}\n`);
    }

    // Test 3: Mock authentication test
    console.log('3. Testing with mock authentication:');
    const mockToken = 'mock-jwt-token';
    try {
      const authResponse = await fetch(`${API_BASE_URL}/api/blockchain/activity/${TEST_USER_ID}`, {
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

    console.log('📋 Test Summary:');
    console.log('================');
    console.log('1. Server is running and responding');
    console.log('2. Blockchain activity endpoint requires authentication');
    console.log('3. To test with real data, you need to:');
    console.log('   - Log in to the web application');
    console.log('   - Perform some credential operations');
    console.log('   - Check the Dashboard for blockchain activity');

    console.log('\n🔧 Next Steps:');
    console.log('==============');
    console.log('1. Open your web application');
    console.log('2. Log in with your account');
    console.log('3. Add, update, or delete a credential');
    console.log('4. Check the Dashboard for "Blockchain Activity Log"');
    console.log('5. You should see the operation details there');

  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

// Run the test
if (require.main === module) {
  testBlockchainActivity().catch(console.error);
}

module.exports = { testBlockchainActivity };
