/**
 * Deployment script for PasswordVaultL2 contract on Arbitrum
 * 
 * Usage:
 *   node scripts/deploy-l2.js
 * 
 * Environment variables required:
 *   - ARBITRUM_RPC_URL: RPC endpoint for Arbitrum network
 *   - WALLET_PRIVATE_KEY: Private key of deployer wallet
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function deployL2Contract() {
  // Load environment variables
  require('dotenv').config();

  const rpcUrl = process.env.ARBITRUM_RPC_URL || process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.WALLET_PRIVATE_KEY;

  if (!rpcUrl || !privateKey) {
    console.error('Missing required environment variables:');
    console.error('  - ARBITRUM_RPC_URL (or SEPOLIA_RPC_URL)');
    console.error('  - WALLET_PRIVATE_KEY');
    process.exit(1);
  }

  try {
    // Connect to network
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const network = await provider.getNetwork();

    console.log(`\n=== Deploying PasswordVaultL2 Contract ===`);
    console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`Deployer: ${wallet.address}`);

    // Check balance
    const balance = await wallet.getBalance();
    console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH`);

    if (balance.lt(ethers.utils.parseEther('0.01'))) {
      console.warn('\n⚠️  Warning: Low balance. You may need more ETH for deployment.');
    }

    // Read contract source
    const contractPath = path.join(__dirname, '../contracts/PasswordVaultL2.sol');
    const contractSource = fs.readFileSync(contractPath, 'utf8');

    console.log('\n📄 Contract source loaded');
    console.log(`   Size: ${contractSource.length} bytes`);

    // For production, you'd compile with Hardhat/Foundry
    // This is a simplified example - in practice, use compiled bytecode
    console.log('\n⚠️  Note: This script requires compiled bytecode.');
    console.log('   For production deployment, use:');
    console.log('   - Hardhat: npx hardhat run scripts/deploy-l2.js --network arbitrumSepolia');
    console.log('   - Foundry: forge script scripts/DeployL2.s.sol --rpc-url $ARBITRUM_RPC_URL');
    console.log('   - Remix IDE: https://remix.ethereum.org');

    // Example ABI (for reference)
    const contractABI = [
      'constructor()',
      'function updateVaultHash(bytes32,bytes32)',
      'function getVaultHash(bytes32) view returns(bytes32,uint64,bool)',
      'function batchUpdateVaultHash(bytes32[],bytes32[])',
      'function getVaultCount() view returns(uint256)',
      'function hasEverExisted(bytes32) view returns(bool)',
      'function deleteVaultHash(bytes32)',
      'function transferOwnership(address)',
      'event VaultUpdated(bytes32 indexed,bytes32,uint64)',
      'event VaultDeleted(bytes32 indexed,uint64)'
    ];

    console.log('\n📋 Contract ABI:');
    contractABI.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item}`);
    });

    console.log('\n✅ Deployment script ready');
    console.log('\nNext steps:');
    console.log('1. Compile contract: npx hardhat compile');
    console.log('2. Deploy: npx hardhat run scripts/deploy-l2.js --network arbitrumSepolia');
    console.log('3. Update .env: CONTRACT_ADDRESS=<deployed_address>');
    console.log('4. Set CONTRACT_VERSION=l2 in .env');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run deployment
if (require.main === module) {
  deployL2Contract()
    .then(() => {
      console.log('\n✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { deployL2Contract };

