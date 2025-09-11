#!/usr/bin/env node

const fetch = require('node-fetch');

async function testActivityAPI() {
  try {
    console.log('🧪 Testing Blockchain Activity API...\n');
    
    // Test with a mock token (this will fail authentication but show us the response structure)
    const response = await fetch('http://localhost:5000/api/blockchain/activity/68a098c34bc8dbc4fd78d240', {
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testActivityAPI();
