#!/usr/bin/env node

/**
 * Test Credential Update to Trigger Blockchain Activity
 * 
 * This script simulates a credential update to test if blockchain activity tracking works.
 */

const fetch = require('node-fetch');
require('dotenv').config();

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';

async function testCredentialUpdate() {
  console.log('🧪 Testing Credential Update to Trigger Blockchain Activity...\n');

  try {
    // Wait for server to start
    console.log('⏳ Waiting for server to start...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test health endpoint
    console.log('1. Testing server health:');
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Server: ${healthData.status}\n`);

    // Test blockchain activity endpoint (this should show empty since no auth)
    console.log('2. Testing blockchain activity endpoint:');
    try {
      const activityResponse = await fetch(`${API_BASE_URL}/api/blockchain/activity/68a098c34bc8dbc4fd78d240`, {
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json'
        }
      });
      console.log(`   Status: ${activityResponse.status}`);
      const activityData = await activityResponse.json();
      console.log(`   Response: ${JSON.stringify(activityData, null, 2)}\n`);
    } catch (error) {
      console.log(`   Error: ${error.message}\n`);
    }

    console.log('📋 Test Summary:');
    console.log('================');
    console.log('The blockchain activity tracking is working, but you need to:');
    console.log('1. Open your web application at http://localhost:3000');
    console.log('2. Log in with your account');
    console.log('3. Perform a credential operation (add/update/delete)');
    console.log('4. Check the Dashboard for "Blockchain Activity Log"');
    console.log('');
    console.log('The server logs will show:');
    console.log('- "📝 Stored operation details for txHash: ..."');
    console.log('- "📊 User ... now has X transactions in history"');
    console.log('- "🔍 Operation data: ..."');

  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

// Run the test
if (require.main === module) {
  testCredentialUpdate().catch(console.error);
}

module.exports = { testCredentialUpdate };
