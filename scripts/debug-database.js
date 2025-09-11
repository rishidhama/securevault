#!/usr/bin/env node

/**
 * Debug Database for Blockchain Operations
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

// Define schema for blockchain operations
const blockchainOperationSchema = new mongoose.Schema({
  txHash: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  action: { type: String, required: true },
  credentialId: { type: String, required: true },
  vaultData: { type: Object, required: true },
  vaultHash: { type: String, required: true },
  blockNumber: { type: Number },
  credentialData: { type: Object },
  storedAt: { type: Date, default: Date.now }
});

const BlockchainOperation = mongoose.model('BlockchainOperation', blockchainOperationSchema);

async function debugDatabase() {
  console.log('🔍 Debugging Database for Blockchain Operations...\n');

  try {
    await connectDB();

    // Check if collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Available collections:');
    collections.forEach(col => console.log(`   - ${col.name}`));

    // Check blockchain operations
    const operations = await BlockchainOperation.find().sort({ storedAt: -1 });
    console.log(`\n📊 Total blockchain operations: ${operations.length}`);

    if (operations.length > 0) {
      console.log('\n🔍 Recent operations:');
      operations.slice(0, 5).forEach((op, index) => {
        console.log(`   ${index + 1}. ${op.action} - ${op.credentialData?.title || 'Unknown'} (${op.storedAt})`);
        console.log(`      txHash: ${op.txHash}`);
        console.log(`      userId: ${op.userId}`);
        console.log(`      blockNumber: ${op.blockNumber}`);
      });
    } else {
      console.log('\n⚠️ No blockchain operations found in database');
    }

    // Check for specific user
    const testUserId = '68a098c34bc8dbc4fd78d240';
    const userOperations = await BlockchainOperation.find({ userId: testUserId });
    console.log(`\n👤 Operations for user ${testUserId}: ${userOperations.length}`);

    if (userOperations.length > 0) {
      console.log('🔍 User operations:');
      userOperations.forEach((op, index) => {
        console.log(`   ${index + 1}. ${op.action} - ${op.credentialData?.title || 'Unknown'}`);
      });
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugDatabase();
