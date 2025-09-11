#!/usr/bin/env node

/**
 * Test Blockchain Status API
 */

const fetch = require('node-fetch');
require('dotenv').config();

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';

async function testBlockchainStatus() {
  console.log('🧪 Testing Blockchain Status API...\n');

  try {
    // Test 1: Health endpoint
    console.log('1. Testing server health:');
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Server: ${healthData.status}\n`);

    // Test 2: Blockchain status endpoint
    console.log('2. Testing blockchain status:');
    try {
      const statusResponse = await fetch(`${API_BASE_URL}/api/blockchain/status`);
      console.log(`   Status: ${statusResponse.status}`);
      
      if (statusResponse.status === 200) {
        const statusData = await statusResponse.json();
        console.log(`   Response: ${JSON.stringify(statusData, null, 2)}`);
      } else {
        const errorData = await statusResponse.json();
        console.log(`   Error: ${JSON.stringify(errorData, null, 2)}`);
      }
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }

    // Test 3: Check server logs
    console.log('\n3. Server Status:');
    console.log('   - Server is running');
    console.log('   - Health endpoint responding');
    console.log('   - Blockchain status needs investigation');

  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

testBlockchainStatus();
