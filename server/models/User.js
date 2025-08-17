const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  // We don't store the master key - it's client-side only
  // But we store a hash of it for validation
  masterKeyHash: {
    type: String,
    required: [true, 'Master key hash is required']
  },
  mfaEnabled: {
    type: Boolean,
    default: false
  },
  biometricEnabled: {
    type: Boolean,
    default: false
  },
  biometricCredential: {
    type: mongoose.Schema.Types.Mixed, // Allow any type of data
    default: null
  },
  mfaSecret: {
    type: String,
    select: false // Don't include in queries by default
  },
  mfaBackupCodes: [{
    code: String,
    used: { type: Boolean, default: false }
  }],
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash master key
userSchema.pre('save', async function(next) {
  if (this.isModified('masterKeyHash')) {
    this.masterKeyHash = await bcrypt.hash(this.masterKeyHash, 12);
  }
  next();
});

// Instance method to validate master key
userSchema.methods.validateMasterKey = async function(masterKey) {
  return await bcrypt.compare(masterKey, this.masterKeyHash);
};

// Instance method to check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email, includeMfaSecret = false) {
  const query = this.findOne({ email: email.toLowerCase() });
  if (includeMfaSecret) {
    return query.select('+mfaSecret'); // This will include all other fields including mfaBackupCodes
  }
  return query;
};

module.exports = mongoose.model('User', userSchema);
