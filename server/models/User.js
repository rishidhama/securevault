const mongoose = require('mongoose');
const crypto = require('crypto');
const { promisify } = require('util');
const argon2 = require('argon2');
const bcrypt = require('bcryptjs');

const pbkdf2 = promisify(crypto.pbkdf2);

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  masterKeyHash: {
    type: String,
    required: true
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
    select: false
  },
  mfaBackupCodes: [{
    code: String,
    used: { type: Boolean, default: false }
  }],
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
  },
  stripeCustomerId: {
    type: String,
    index: true
  },
  subscription: {
    id: String,
    status: String,
    priceId: String,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false }
  },
  preferences: {
    notifications: {
      securityAlerts: { type: Boolean, default: true },
      breachNotifications: { type: Boolean, default: true },
      weeklyReports: { type: Boolean, default: false }
    },
    privacy: {
      analyticsOptIn: { type: Boolean, default: false },
      crashReports: { type: Boolean, default: true }
    }
  }
}, {
  timestamps: true
});

userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

const getServerSalt = () => process.env.SERVER_SALT || 'securevault-server-salt-2025';

const hashAuthSecret = async (authSecret) => {
  const saltedKey = authSecret + getServerSalt();
  return argon2.hash(saltedKey, {
    type: argon2.argon2id,
    timeCost: parseInt(process.env.ARGON2_TIME_COST || '2', 10),
    memoryCost: parseInt(process.env.ARGON2_MEMORY_COST || '19456', 10),
    parallelism: parseInt(process.env.ARGON2_PARALLELISM || '1', 10)
  });
};

userSchema.pre('save', async function(next) {
  try {
    if (this.isModified('masterKeyHash')) {
      this.masterKeyHash = await hashAuthSecret(this.masterKeyHash);
    }
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.validateMasterKey = async function(masterKey) {
  if (masterKey.length < 12) {
    throw new Error('Master key must be at least 12 characters');
  }
  
  const weakPasswords = ['password', '123456', 'masterkey', 'securevault'];
  if (weakPasswords.includes(masterKey.toLowerCase())) {
    throw new Error('Master key is too weak');
  }
  
  const saltedKey = masterKey + getServerSalt();

  if (typeof this.masterKeyHash === 'string' && this.masterKeyHash.startsWith('$argon2')) {
    return argon2.verify(this.masterKeyHash, saltedKey);
  }

  // Backward compatibility for existing bcrypt hashes.
  return bcrypt.compare(saltedKey, this.masterKeyHash);
};

userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

userSchema.statics.findByEmail = function(email, includeMfaSecret = false) {
  const query = this.findOne({ email: email.toLowerCase() });
  if (includeMfaSecret) {
    return query.select('+mfaSecret');
  }
  return query;
};

module.exports = mongoose.model('User', userSchema);
