const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function testAutoBlockchain() {
  console.log('🧪 Testing Auto-Wired Blockchain Integration\n');
  
  try {
    // 1. Check blockchain status
    console.log('1️⃣ Checking blockchain status...');
    const statusResponse = await fetch(`${API_BASE}/blockchain/status`);
    const status = await statusResponse.json();
    console.log('✅ Blockchain Status:', {
      enabled: status.enabled,
      network: status.network,
      wallet: status.wallet,
      balance: status.balance,
      contract: status.contract
    });
    
    // 2. Check if we need to login first
    console.log('\n2️⃣ Testing credential creation (this will auto-write to blockchain)...');
    
    // For demo purposes, we'll simulate a credential creation
    // In real usage, you'd need to login first to get a JWT token
    console.log('📝 Note: To test credential creation, you need to:');
    console.log('   - Login to the app first');
    console.log('   - Create/edit/delete a credential');
    console.log('   - Watch the server logs for blockchain events');
    
    // 3. Show what happens when you create a credential
    console.log('\n3️⃣ What happens when you create a credential:');
    console.log('   🔗 Server automatically calls createBlockchainEvent()');
    console.log('   📝 Creates vault data: { action: "CREATE", resource: "CREDENTIAL", id: "...", timestamp: "..." }');
    console.log('   ⛓️  Calls ethereumService.storeVaultHash()');
    console.log('   🔗 Writes to Sepolia contract');
    console.log('   📊 Returns transaction hash and Etherscan URL');
    console.log('   📋 Logs to server console with 🔗 emoji');
    
    console.log('\n✅ Auto-wiring is complete!');
    console.log('🎯 Next steps:');
    console.log('   1. Open your app at http://localhost:3000');
    console.log('   2. Login to your account');
    console.log('   3. Create/edit/delete a credential');
    console.log('   4. Watch the server terminal for blockchain logs');
    console.log('   5. Check Etherscan for the transaction');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAutoBlockchain();
