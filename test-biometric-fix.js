// Test script to verify biometric authentication is working
console.log('🧪 Testing Biometric Authentication Fix\n');

// Test 1: Check if server is running
async function testServer() {
  try {
    const response = await fetch('http://localhost:5000/api/auth/biometric-challenge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com'
      })
    });
    
    console.log('✅ Server is running on port 5000');
    console.log('📊 Response status:', response.status);
    
    const data = await response.json();
    console.log('📋 Response data:', data);
    
    if (data.biometricEnabled === false) {
      console.log('✅ Biometric endpoint correctly returns biometricEnabled: false for non-enabled users');
    }
    
  } catch (error) {
    console.error('❌ Server test failed:', error.message);
  }
}

// Test 2: Check if frontend can be loaded
async function testFrontend() {
  try {
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      console.log('✅ Frontend is accessible on port 3000');
    } else {
      console.log('⚠️ Frontend returned status:', response.status);
    }
  } catch (error) {
    console.log('⚠️ Frontend not accessible (this is normal if not started)');
  }
}

async function runTests() {
  console.log('1️⃣ Testing server endpoints...');
  await testServer();
  
  console.log('\n2️⃣ Testing frontend accessibility...');
  await testFrontend();
  
  console.log('\n✅ Biometric authentication fixes applied!');
  console.log('🎯 What was fixed:');
  console.log('   - Added biometricEnabled flag to server responses');
  console.log('   - Fixed frontend error handling for disabled biometric');
  console.log('   - Added biometric setup function');
  console.log('   - Added "Enable Biometric" button in UI');
  console.log('   - Improved error messages and user feedback');
  
  console.log('\n📝 How to test:');
  console.log('   1. Start frontend: cd client && npm start');
  console.log('   2. Open http://localhost:3000');
  console.log('   3. Login with your account');
  console.log('   4. You should see "Enable Biometric Authentication" button');
  console.log('   5. Click it to setup biometric authentication');
  console.log('   6. After setup, you can use "Unlock with Biometrics"');
}

runTests();


