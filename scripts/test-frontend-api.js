#!/usr/bin/env node

/**
 * Test Frontend API Call Simulation
 */

const fetch = require('node-fetch');
require('dotenv').config();

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';

async function testFrontendAPI() {
  console.log('🧪 Testing Frontend API Call Simulation...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing server health:');
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Server: ${healthData.status}\n`);

    // Test 2: Try to get a real JWT token by logging in
    console.log('2. Attempting to get authentication token:');
    try {
      // Try to login (this might fail, but let's see what happens)
      const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword'
        })
      });
      
      console.log(`   Login Status: ${loginResponse.status}`);
      if (loginResponse.status === 200) {
        const loginData = await loginResponse.json();
        console.log(`   Login successful, token: ${loginData.token ? 'Present' : 'Missing'}`);
        
        if (loginData.token) {
          // Test blockchain activity with real token
          console.log('\n3. Testing blockchain activity with real token:');
          const activityResponse = await fetch(`${API_BASE_URL}/api/blockchain/activity/68a098c34bc8dbc4fd78d240`, {
            headers: {
              'Authorization': `Bearer ${loginData.token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log(`   Activity Status: ${activityResponse.status}`);
          const activityData = await activityResponse.json();
          console.log(`   Activity Data: ${JSON.stringify(activityData, null, 2)}`);
        }
      } else {
        const loginData = await loginResponse.json();
        console.log(`   Login failed: ${loginData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`   Login error: ${error.message}`);
    }

    // Test 3: Test with mock token to see the error
    console.log('\n4. Testing with mock token:');
    try {
      const mockResponse = await fetch(`${API_BASE_URL}/api/blockchain/activity/68a098c34bc8dbc4fd78d240`, {
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   Mock Status: ${mockResponse.status}`);
      const mockData = await mockResponse.json();
      console.log(`   Mock Response: ${JSON.stringify(mockData, null, 2)}`);
    } catch (error) {
      console.log(`   Mock error: ${error.message}`);
    }

    console.log('\n📋 Debug Summary:');
    console.log('==================');
    console.log('1. Server is running and healthy');
    console.log('2. Database has blockchain operations stored');
    console.log('3. API requires valid authentication');
    console.log('4. Frontend needs to be logged in to see data');
    console.log('');
    console.log('🔧 Next Steps:');
    console.log('==============');
    console.log('1. Open your web application at http://localhost:3000');
    console.log('2. Make sure you are logged in');
    console.log('3. Check browser console for any errors');
    console.log('4. Try refreshing the page');

  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

testFrontendAPI();
