const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

userSchema.pre('save', async function(next) {
  if (this.isModified('masterKeyHash')) {
    const serverSalt = process.env.SERVER_SALT || 'securevault-server-salt-2025';
    const saltedKey = this.masterKeyHash + serverSalt;
    this.masterKeyHash = await bcrypt.hash(saltedKey, 12);
  }
  next();
});

userSchema.methods.validateMasterKey = async function(masterKey) {
  if (masterKey.length < 12) {
    throw new Error('Master key must be at least 12 characters');
  }
  
  const weakPasswords = ['password', '123456', 'masterkey', 'securevault'];
  if (weakPasswords.includes(masterKey.toLowerCase())) {
    throw new Error('Master key is too weak');
  }
  
  const serverSalt = process.env.SERVER_SALT || 'securevault-server-salt-2024';
  const saltedKey = masterKey + serverSalt;
  return await bcrypt.compare(saltedKey, this.masterKeyHash);
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
