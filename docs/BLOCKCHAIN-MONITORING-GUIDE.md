# Blockchain Monitoring Guide

This guide explains how to monitor and verify that your blockchain implementation is working correctly when users perform add, delete, or update operations in SecureVault.

## Overview

SecureVault uses blockchain technology (Sepolia testnet) to provide tamper-evidence for credential operations. Every time a user adds, updates, or deletes a credential, the operation is automatically recorded on the blockchain.

## How to Monitor Blockchain Implementation

### 1. Real-time Monitoring Components

#### BlockchainMonitor Component
- **Location**: `client/src/components/BlockchainMonitor.js`
- **Purpose**: Shows real-time blockchain status and transaction history
- **Features**:
  - Live blockchain connection status
  - Network information (Sepolia testnet)
  - Wallet balance and gas prices
  - Recent transaction history
  - Auto-refresh every 30 seconds

#### BlockchainDashboard Component
- **Location**: `client/src/components/BlockchainDashboard.js`
- **Purpose**: Comprehensive blockchain activity dashboard
- **Features**:
  - Status overview cards
  - Detailed network configuration
  - Transaction history with Etherscan links
  - Educational information about blockchain integration

#### BlockchainVerifier Component
- **Location**: `client/src/components/BlockchainVerifier.js`
- **Purpose**: Verify data integrity against blockchain records
- **Features**:
  - Hash comparison between current data and blockchain
  - Integrity validation
  - Detailed verification results
  - Security warnings for compromised data

### 2. Visual Indicators

#### In AddCredential Component
- **Blockchain Status Indicator**: Shows "Blockchain Active" or "Blockchain Offline" in the header
- **Success Messages**: Different messages based on blockchain status:
  - With blockchain: "Credential added successfully! 🔗 Blockchain transaction recorded"
  - Without blockchain: "Credential added successfully!"

#### In Dashboard
- **Blockchain Monitor Panel**: Real-time status and transaction history
- **Auto-refresh**: Updates every 30 seconds to show latest blockchain activity

### 3. Backend Monitoring

#### Server Logs
The server automatically logs blockchain operations:

```javascript
// In server/routes/credentials.js
console.log(`🔗 Blockchain event logged: ${action} credential ${credentialId} for user ${userId}`, {
  txHash: result.txHash,
  etherscanUrl: result.etherscanUrl
});
```

#### Blockchain Service Status
- **Location**: `server/services/ethereum-service.js`
- **Status Endpoint**: `GET /api/blockchain/status`
- **Features**:
  - Connection status
  - Network information
  - Wallet balance
  - Contract address

### 4. How to Verify Blockchain is Working

#### Step 1: Check Blockchain Status
1. Go to the Dashboard
2. Look for the "Blockchain Monitor" panel
3. Verify status shows "✅ Connected" with green indicator
4. Check network shows "Sepolia" with correct Chain ID

#### Step 2: Perform Test Operations
1. **Add a Credential**:
   - Go to "Add Credential" page
   - Check header shows "Blockchain Active" indicator
   - Add a test credential
   - Verify success message includes "🔗 Blockchain transaction recorded"

2. **Update a Credential**:
   - Edit an existing credential
   - Verify success message includes blockchain confirmation

3. **Delete a Credential**:
   - Delete a credential
   - Verify success message includes blockchain confirmation

#### Step 3: Check Transaction History
1. In the Dashboard, scroll to "Blockchain Monitor" panel
2. Look for "Transaction History" section
3. Verify your test operations appear in the list
4. Click Etherscan links to view transactions on blockchain explorer

#### Step 4: Verify Data Integrity
1. Use the BlockchainVerifier component (if available in your UI)
2. Click "Verify Integrity" button
3. Check that verification shows "Integrity Verified" with green indicator
4. Compare current hash with stored blockchain hash

### 5. Troubleshooting

#### Blockchain Status Shows "Offline"
- **Check Environment Variables**:
  ```bash
  ETHEREUM_ENABLED=true
  SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
  WALLET_PRIVATE_KEY=your_private_key
  CONTRACT_ADDRESS=your_contract_address
  ```

- **Check Server Logs**: Look for Ethereum service initialization errors
- **Verify Network Connection**: Ensure server can reach Sepolia RPC endpoint
- **Check Wallet Balance**: Ensure wallet has sufficient ETH for gas fees

#### No Transactions Appearing
- **Check Blockchain Service**: Verify `ethereumService.initialized` is true
- **Check User ID**: Ensure user ID is being passed correctly to blockchain service
- **Check Server Logs**: Look for blockchain operation errors
- **Verify Contract**: Ensure contract is deployed and accessible

#### Verification Fails
- **Check Data Consistency**: Ensure credentials haven't been modified outside the app
- **Check Blockchain Record**: Verify blockchain has records for the user
- **Check Hash Generation**: Ensure hash generation is consistent between operations

### 6. API Endpoints for Monitoring

#### Blockchain Status
```bash
GET /api/blockchain/status
```
Returns blockchain service status and network information.

#### Transaction History
```bash
GET /api/blockchain/history/:userId
```
Returns transaction history for a specific user.

#### Verify Integrity
```bash
POST /api/blockchain/verify
Body: { userId, vaultData }
```
Verifies current data against blockchain records.

#### Network Statistics
```bash
GET /api/blockchain/stats
```
Returns detailed network statistics and contract information.

### 7. Browser Developer Tools

#### Network Tab
- Monitor API calls to `/api/blockchain/*` endpoints
- Check response status codes and data
- Verify blockchain operations are being called

#### Console Logs
- Look for blockchain-related console messages
- Check for error messages from blockchain service
- Monitor transaction confirmations

### 8. Production Monitoring

#### Health Checks
- Implement periodic blockchain status checks
- Monitor wallet balance to ensure sufficient gas fees
- Set up alerts for blockchain service failures

#### Metrics
- Track blockchain operation success rates
- Monitor transaction confirmation times
- Log gas usage and costs

#### Backup Plans
- Implement fallback mechanisms when blockchain is unavailable
- Store critical operations for later blockchain recording
- Provide user notifications about blockchain status

## Summary

The blockchain implementation in SecureVault provides comprehensive monitoring capabilities:

1. **Real-time Status**: Always visible blockchain connection status
2. **Transaction Tracking**: Complete history of all blockchain operations
3. **Integrity Verification**: Cryptographic proof of data integrity
4. **Visual Indicators**: Clear UI feedback for blockchain operations
5. **Comprehensive Logging**: Detailed server-side logging for debugging

By following this guide, you can ensure that your blockchain implementation is working correctly and providing the intended tamper-evidence functionality for your users' credential operations.
