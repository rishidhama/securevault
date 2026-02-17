# Benchmark Testnet Setup

This guide explains how to configure SecureVault to use Arbitrum Sepolia testnet for benchmarking.

## Quick Setup

Add these environment variables to your `.env` file:

```bash
# Enable Ethereum/blockchain features
ETHEREUM_ENABLED=true

# Arbitrum Sepolia Testnet RPC URL (free public endpoint)
ARBITRUM_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

# Your wallet private key (create a testnet wallet, never use mainnet keys!)
WALLET_PRIVATE_KEY=your_testnet_wallet_private_key_here

# Contract address (will be deployed automatically if not set)
# CONTRACT_ADDRESS=

# Use L2-optimized contract (recommended for testnet)
CONTRACT_VERSION=l2

# Enable batching for cost efficiency
BATCH_ENABLED=true
```

## Getting Testnet ETH

1. **Get Sepolia ETH** (for Arbitrum Sepolia):
   - Visit: https://sepoliafaucet.com/
   - Or: https://faucet.quicknode.com/ethereum/sepolia
   - Request testnet ETH to your wallet address

2. **Bridge to Arbitrum Sepolia**:
   - Visit: https://bridge.arbitrum.io/
   - Select "Sepolia" → "Arbitrum Sepolia"
   - Bridge your Sepolia ETH to Arbitrum Sepolia

## Network Information

- **Network Name**: Arbitrum Sepolia
- **Chain ID**: 421614
- **Explorer**: https://sepolia.arbiscan.io
- **RPC URL**: https://sepolia-rollup.arbitrum.io/rpc

## Verifying Testnet Connection

When you start the server, you should see:
```
Connected to Arbitrum Sepolia (Testnet) (Chain ID: 421614)
⚠️  TESTNET MODE - Using testnet for benchmarking
```

## Running Benchmarks

1. Start the server with testnet configuration
2. Run client-side benchmarks via the Benchmark Runner UI
3. The server will automatically log blockchain anchoring metrics to `server.log`
4. Analyze results: `node analyze-bench.js securevault-bench-client.json server.log`

## Cost Comparison

**Testnet**: Free (testnet ETH has no real value)
**Mainnet**: ~$0.005-0.01 per transaction on Arbitrum One

For benchmarking purposes, testnet is recommended to avoid costs while testing.

