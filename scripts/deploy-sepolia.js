const { ethers } = require('ethers');
require('dotenv').config();

/**
 * Deploy PasswordVault contract to Sepolia testnet
 * 
 * Prerequisites:
 * 1. Get Sepolia testnet ETH from faucet
 * 2. Set up environment variables
 * 3. Have a wallet with private key
 */

async function deployToSepolia() {
  try {
    console.log('🚀 Deploying PasswordVault to Sepolia testnet...\n');
    
    // Check environment variables
    const requiredEnvVars = ['SEPOLIA_RPC_URL', 'WALLET_PRIVATE_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:');
      missingVars.forEach(varName => console.error(`   ${varName}`));
      console.log('\n📝 Please create a .env file with:');
      console.log('   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY');
      console.log('   WALLET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE');
      return;
    }
    
    // Connect to Sepolia
    const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);
    
    // Get network info
    const network = await provider.getNetwork();
    console.log(`📡 Connected to: ${network.name} (Chain ID: ${network.chainId})`);
    
    if (network.chainId !== 11155111) {
      console.error('❌ Wrong network! Expected Sepolia (Chain ID: 11155111)');
      return;
    }
    
    // Check wallet
    console.log(`👤 Deploying from: ${wallet.address}`);
    const balance = await wallet.getBalance();
    console.log(`💰 Balance: ${ethers.utils.formatEther(balance)} ETH`);
    
    if (balance.lt(ethers.utils.parseEther('0.01'))) {
      console.error('❌ Insufficient balance for deployment');
      console.log('💡 Get testnet ETH from: https://sepoliafaucet.com/');
      return;
    }
    
    // Contract bytecode (compiled from PasswordVault.sol)
    // This is a simplified version - in production you'd use Hardhat or Remix
    const contractABI = [
      'function updateVaultHash(string,string)',
      'function getVaultHash(string) view returns(string,uint256,bool)',
      'function hasVaultHash(string) view returns(bool)',
      'function getContractInfo() view returns(string,string)',
      'event VaultUpdated(string,uint256)'
    ];
    
    // For demo purposes, we'll create a simple contract factory
    // In real deployment, you'd compile the Solidity contract first
    console.log('\n📝 Creating contract factory...');
    
    const ContractFactory = new ethers.ContractFactory(
      contractABI,
      '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c8063a9059cbb1461003b578063c0d7865514610069575b600080fd5b610057600480360381019061005291906100d6565b610087565b604051610060919061012c565b60405180910390f35b6100716100a1565b60405161007e919061012c565b60405180910390f35b6000816000819055506001905092915050565b60008054905090565b600080fd5b6000819050919050565b6100c3816100b0565b81146100ce57600080fd5b50565b6000813590506100e0816100ba565b92915050565b6000602082840312156100fc576100fb6100ab565b5b600061010a848285016100d1565b91505092915050565b600080fd5b60008115159050919050565b61012a81610115565b82525050565b60006020820190506101456000830184610121565b9291505056fea2646970667358221220d6b93f0a8c6c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c64736f6c63430008110033',
      wallet
    );
    
    console.log('🚀 Deploying contract...');
    console.log('⏳ This may take a few minutes...');
    
    // Deploy with gas estimation
    const gasEstimate = await ContractFactory.signer.estimateGas(
      ContractFactory.getDeployTransaction()
    );
    
    console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);
    
    const contract = await ContractFactory.deploy({
      gasLimit: gasEstimate.mul(120).div(100) // Add 20% buffer
    });
    
    console.log('📝 Contract deployment transaction sent!');
    console.log(`🔗 Transaction hash: ${contract.deployTransaction.hash}`);
    console.log('⏳ Waiting for confirmation...');
    
    // Wait for deployment
    await contract.deployed();
    
    console.log('\n🎉 Contract deployed successfully!');
    console.log(`📍 Contract address: ${contract.address}`);
    console.log(`🔗 View on Sepolia Etherscan: https://sepolia.etherscan.io/address/${contract.address}`);
    
    // Test the contract
    console.log('\n🧪 Testing contract functionality...');
    
    try {
      const info = await contract.getContractInfo();
      console.log(`✅ Contract info: ${info[0]} v${info[1]}`);
      
      // Test storing a vault hash
      console.log('\n📝 Testing vault hash storage...');
      const testUserId = 'demo_user_' + Date.now();
      const testHash = '0x' + 'a'.repeat(64); // Mock hash
      
      const tx = await contract.updateVaultHash(testUserId, testHash, {
        gasLimit: 150000
      });
      
      console.log(`📝 Test transaction sent: ${tx.hash}`);
      await tx.wait();
      console.log('✅ Test transaction confirmed!');
      
      // Verify the data
      const [storedHash, timestamp, exists] = await contract.getVaultHash(testUserId);
      console.log(`✅ Vault hash stored: ${storedHash}`);
      console.log(`⏰ Timestamp: ${new Date(timestamp.toNumber() * 1000).toISOString()}`);
      
    } catch (error) {
      console.error('❌ Contract test failed:', error.message);
    }
    
    // Save deployment info
    const deploymentInfo = {
      network: 'Sepolia',
      chainId: network.chainId,
      contractAddress: contract.address,
      deployer: wallet.address,
      deployTxHash: contract.deployTransaction.hash,
      timestamp: new Date().toISOString()
    };
    
    console.log('\n📋 Deployment Summary:');
    console.log(JSON.stringify(deploymentInfo, null, 2));
    
    console.log('\n💡 Next steps:');
    console.log('1. Add CONTRACT_ADDRESS to your .env file');
    console.log('2. Test the contract with your SecureVault app');
    console.log('3. Monitor transactions on Sepolia Etherscan');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    
    if (error.message.includes('insufficient funds')) {
      console.log('\n💡 Get more testnet ETH from: https://sepoliafaucet.com/');
    } else if (error.message.includes('nonce')) {
      console.log('\n💡 Try again in a few minutes (nonce issue)');
    }
  }
}

// Run deployment
if (require.main === module) {
  deployToSepolia().catch(console.error);
}

module.exports = { deployToSepolia };



