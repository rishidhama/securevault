const fetch = require('node-fetch');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_EMAIL = 'test@example.com';

// Test data
const testUser = {
  email: TEST_EMAIL,
  name: 'Test User',
  masterKey: 'testpassword123'
};

// Helper function to make requests
async function makeRequest(endpoint, method = 'GET', body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...(body && { body: JSON.stringify(body) })
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`${method} ${endpoint}:`, response.status, data);
    
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error in ${method} ${endpoint}:`, error.message);
    return { status: 'ERROR', data: { error: error.message } };
  }
}

// Test functions
async function testUserRegistration() {
  console.log('\n=== Testing User Registration ===');
  const result = await makeRequest('/api/auth/register', 'POST', testUser);
  
  if (result.status === 200 || result.status === 400 && result.data.error?.includes('already exists')) {
    console.log('✅ User registration test passed');
    return true;
  } else {
    console.log('❌ User registration test failed');
    return false;
  }
}

async function testUserLogin() {
  console.log('\n=== Testing User Login ===');
  const result = await makeRequest('/api/auth/login', 'POST', {
    email: testUser.email,
    masterKey: testUser.masterKey
  });
  
  if (result.status === 200) {
    console.log('✅ User login test passed');
    return result.data.data.token;
  } else {
    console.log('❌ User login test failed');
    return null;
  }
}

async function testBiometricChallenge(token) {
  console.log('\n=== Testing Biometric Challenge ===');
  const result = await makeRequest('/api/auth/biometric-challenge', 'POST', {
    email: testUser.email
  }, token);
  
  if (result.status === 400 && result.data.error?.includes('not enabled')) {
    console.log('✅ Biometric challenge test passed (correctly rejected)');
    return true;
  } else if (result.status === 200) {
    console.log('✅ Biometric challenge test passed');
    return true;
  } else {
    console.log('❌ Biometric challenge test failed');
    return false;
  }
}

async function testBiometricLogin(token) {
  console.log('\n=== Testing Biometric Login ===');
  const result = await makeRequest('/api/auth/biometric-login', 'POST', {
    email: testUser.email,
    assertion: { id: 'test-assertion' },
    challenge: [1, 2, 3, 4]
  }, token);
  
  if (result.status === 400 && result.data.error?.includes('not enabled')) {
    console.log('✅ Biometric login test passed (correctly rejected)');
    return true;
  } else if (result.status === 200) {
    console.log('✅ Biometric login test passed');
    return true;
  } else {
    console.log('❌ Biometric login test failed');
    return false;
  }
}

async function testEnableBiometric(token) {
  console.log('\n=== Testing Enable Biometric ===');
  const result = await makeRequest('/api/auth/enable-biometric', 'POST', {
    credentialData: {
      id: 'test-credential-id',
      type: 'public-key',
      rawId: [1, 2, 3, 4],
      response: {
        attestationObject: [5, 6, 7, 8],
        clientDataJSON: [9, 10, 11, 12]
      }
    }
  }, token);
  
  if (result.status === 200) {
    console.log('✅ Enable biometric test passed');
    return true;
  } else {
    console.log('❌ Enable biometric test failed');
    return false;
  }
}

async function testBiometricChallengeAfterEnable(token) {
  console.log('\n=== Testing Biometric Challenge After Enable ===');
  const result = await makeRequest('/api/auth/biometric-challenge', 'POST', {
    email: testUser.email
  }, token);
  
  if (result.status === 200) {
    console.log('✅ Biometric challenge test passed after enable');
    return result.data.data;
  } else {
    console.log('❌ Biometric challenge test failed after enable');
    return null;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Biometric Authentication Tests\n');
  
  try {
    // Test 1: User registration
    const registrationSuccess = await testUserRegistration();
    if (!registrationSuccess) {
      console.log('❌ Cannot proceed without user registration');
      return;
    }
    
    // Test 2: User login
    const token = await testUserLogin();
    if (!token) {
      console.log('❌ Cannot proceed without user login');
      return;
    }
    
    // Test 3: Biometric challenge (should fail - not enabled)
    await testBiometricChallenge(token);
    
    // Test 4: Biometric login (should fail - not enabled)
    await testBiometricLogin(token);
    
    // Test 5: Enable biometric
    const enableSuccess = await testEnableBiometric(token);
    if (!enableSuccess) {
      console.log('❌ Cannot proceed without enabling biometric');
      return;
    }
    
    // Test 6: Biometric challenge (should succeed - now enabled)
    const challengeData = await testBiometricChallengeAfterEnable(token);
    if (challengeData) {
      console.log('✅ Challenge data received:', {
        challengeLength: challengeData.challenge?.length,
        rpId: challengeData.rpId,
        timeout: challengeData.timeout
      });
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testUserRegistration,
  testUserLogin,
  testBiometricChallenge,
  testBiometricLogin,
  testEnableBiometric
};
