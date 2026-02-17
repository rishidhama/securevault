/**
 * Check wallet balance on both Sepolia and Arbitrum Sepolia
 * Usage: node scripts/check-balance.js
 */

const { ethers } = require('ethers');
require('dotenv').config();

async function checkBalances() {
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('❌ WALLET_PRIVATE_KEY not found in .env');
    process.exit(1);
  }

  const wallet = new ethers.Wallet(privateKey);
  console.log(`\n� wallet Address: ${wallet.address}\n`);

  // Check Sepolia (L1)
  try {
    const sepoliaRpc = process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
    const sepoliaProvider = new ethers.providers.JsonRpcProvider(sepoliaRpc);
    const sepoliaBalance = await sepoliaProvider.getBalance(wallet.address);
    const sepoliaNetwork = await sepoliaProvider.getNetwork();
    
    console.log('🔵 Ethereum Sepolia (L1):');
    console.log(`   Chain ID: ${sepoliaNetwork.chainId}`);
    console.log(`   Balance: ${ethers.utils.formatEther(sepoliaBalance)} ETH`);
    console.log(`   Explorer: https://sepolia.etherscan.io/address/${wallet.address}\n`);
  } catch (error) {
    console.error('❌ Failed to check Sepolia:', error.message);
  }

  // Check Arbitrum Sepolia (L2)
  try {
    const arbitrumRpc = process.env.ARBITRUM_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';
    const arbitrumProvider = new ethers.providers.JsonRpcProvider(arbitrumRpc);
    const arbitrumBalance = await arbitrumProvider.getBalance(wallet.address);
    const arbitrumNetwork = await arbitrumProvider.getNetwork();
    
    console.log('🟢 Arbitrum Sepolia (L2):');
    console.log(`   Chain ID: ${arbitrumNetwork.chainId}`);
    console.log(`   Balance: ${ethers.utils.formatEther(arbitrumBalance)} ETH`);
    console.log(`   Explorer: https://sepolia.arbiscan.io/address/${wallet.address}\n`);
    
    if (arbitrumBalance.eq(0)) {
      console.log('⚠️  WARNING: Balance is 0 on Arbitrum Sepolia!');
      console.log('   You need to bridge ETH from Sepolia to Arbitrum Sepolia:');
      console.log('   1. Visit: https://bridge.arbitrum.io/');
      console.log('   2. Connect your wallet');
      console.log('   3. Select "Sepolia" → "Arbitrum Sepolia"');
      console.log('   4. Bridge at least 0.01 ETH\n');
    }
  } catch (error) {
    console.error('❌ Failed to check Arbitrum Sepolia:', error.message);
  }
}

checkBalances().catch(console.error);


