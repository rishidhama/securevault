const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const mongoose = require('mongoose');
const crypto = require('crypto');
const router = express.Router();

// JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Check if MongoDB is connected
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Validation middleware
const validateRegistration = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('masterKey')
    .notEmpty()
    .withMessage('Master key is required')
    .isLength({ min: 8 })
    .withMessage('Master key must be at least 8 characters long')
];

const validateLogin = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  body('masterKey')
    .notEmpty()
    .withMessage('Master key is required')
];

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId, iat: Date.now() },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, name, masterKey } = req.body;

    // Production mode with MongoDB
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create new user (master key is hashed in pre-save middleware)
    const user = new User({
      email,
      name,
      masterKeyHash: masterKey // This will be hashed before saving
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          mfaEnabled: user.mfaEnabled
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user'
    });
  }
});

// Login user
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, masterKey } = req.body;

    // Production mode with MongoDB
    try {
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or master key'
        });
      }

      // Check if account is locked
      if (user.isLocked()) {
        const lockTime = new Date(user.lockUntil).toLocaleString();
        return res.status(423).json({
          success: false,
          error: `Account is locked due to too many failed attempts. Try again after ${lockTime}`
        });
      }

      // Validate master key
      const isValidKey = await user.validateMasterKey(masterKey);
      if (!isValidKey) {
        // Increment failed login attempts
        await user.incLoginAttempts();
        
        return res.status(401).json({
          success: false,
          error: 'Invalid email or master key'
        });
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = generateToken(user._id);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            mfaEnabled: user.mfaEnabled,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            loginAttempts: user.loginAttempts
          },
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Database connection error. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login'
    });
  }
});

// Biometric challenge endpoint for WebAuthn
router.post('/biometric-challenge', [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Check if MongoDB is connected
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available'
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if biometric is enabled for this user
    if (!user.biometricEnabled) {
      return res.status(400).json({
        success: false,
        error: 'Biometric authentication is not enabled for this account',
        biometricEnabled: false
      });
    }

    // Generate a random challenge
    const challenge = crypto.randomBytes(32);
    
    // Store the challenge temporarily (in production, use Redis or similar)
    if (!global.biometricChallenges) {
      global.biometricChallenges = new Map();
    }
    
    // Store challenge with user email and timestamp
    global.biometricChallenges.set(email, {
      challenge: Array.from(challenge),
      timestamp: Date.now(),
      userId: user._id.toString()
    });

    // Clean up old challenges (older than 5 minutes)
    const now = Date.now();
    for (const [key, value] of global.biometricChallenges.entries()) {
      if (now - value.timestamp > 5 * 60 * 1000) {
        global.biometricChallenges.delete(key);
      }
    }

    const responseData = {
      challenge: Array.from(challenge),
      rpId: 'localhost', // Use consistent localhost for development
      userVerification: 'required',
      timeout: 60000,
      allowCredentials: user.biometricCredential ? [{
        id: user.biometricCredential.rawId || user.biometricCredential.id,
        type: user.biometricCredential.type,
        transports: ['internal']
      }] : []
    };

    res.json({
      success: true,
      message: 'Biometric challenge generated',
      data: responseData
    });
  } catch (error) {
    console.error('Biometric challenge error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate biometric challenge'
    });
  }
});

// Biometric login endpoint
router.post('/biometric-login', [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  body('assertion')
    .notEmpty()
    .withMessage('Biometric assertion is required'),
  body('challenge')
    .notEmpty()
    .withMessage('Challenge is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, assertion, challenge } = req.body;

    // Check if MongoDB is connected
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available'
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if biometric is enabled for this user
    if (!user.biometricEnabled) {
      return res.status(400).json({
        success: false,
        error: 'Biometric authentication is not enabled for this account',
        biometricEnabled: false
      });
    }

    // Verify the challenge
    if (!global.biometricChallenges || !global.biometricChallenges.has(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired challenge'
      });
    }

    const storedChallenge = global.biometricChallenges.get(email);
    
    // Check if challenge is expired (5 minutes)
    if (Date.now() - storedChallenge.timestamp > 5 * 60 * 1000) {
      global.biometricChallenges.delete(email);
      return res.status(400).json({
        success: false,
        error: 'Challenge expired'
      });
    }

    // Verify challenge matches
    const receivedChallenge = new Uint8Array(challenge);
    const expectedChallenge = new Uint8Array(storedChallenge.challenge);
    
    if (receivedChallenge.length !== expectedChallenge.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid challenge'
      });
    }

    let challengeMatches = true;
    for (let i = 0; i < receivedChallenge.length; i++) {
      if (receivedChallenge[i] !== expectedChallenge[i]) {
        challengeMatches = false;
        break;
      }
    }

    if (!challengeMatches) {
      return res.status(400).json({
        success: false,
        error: 'Challenge verification failed'
      });
    }

    // Verify that the user has a stored biometric credential
    if (!user.biometricCredential) {
      return res.status(400).json({
        success: false,
        error: 'No biometric credential found for this user'
      });
    }

    // Verify the assertion ID matches the stored credential
    if (assertion.id !== user.biometricCredential.id) {
      return res.status(400).json({
        success: false,
        error: 'Invalid biometric credential'
      });
    }
    
    // Clean up the used challenge
    global.biometricChallenges.delete(email);
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Biometric login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          mfaEnabled: user.mfaEnabled
        },
        token,
        masterKey: '' // We don't have the master key in biometric login
      }
    });
  } catch (error) {
    console.error('Biometric login error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to authenticate with biometrics'
    });
  }
});

// Enable biometric authentication for user
router.post('/enable-biometric', authenticateToken, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available'
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const { credentialData } = req.body;

    // Enable biometric authentication
    user.biometricEnabled = true;
    
    // Store credential data for future authentication
    if (credentialData) {
      // Store the credential data as-is (Mixed type allows any structure)
      user.biometricCredential = credentialData;
    }
    
    await user.save();

    res.json({
      success: true,
      message: 'Biometric authentication enabled successfully',
      data: {
        biometricEnabled: true,
        credentialStored: !!credentialData
      }
    });
  } catch (error) {
    console.error('Enable biometric error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enable biometric authentication'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available. Please try again later.'
      });
    }

    const user = await User.findById(req.user.userId).select('-masterKeyHash -mfaSecret');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          mfaEnabled: user.mfaEnabled,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          preferences: user.preferences || undefined
        }
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// Get user preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available. Please try again later.'
      });
    }

    const user = await User.findById(req.user.userId).select('preferences');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    return res.json({ success: true, data: user.preferences || {} });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to load preferences' });
  }
});

// Update user preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const prefs = req.body || {};
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: { preferences: prefs } },
      { new: true }
    ).select('preferences');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    return res.json({ success: true, message: 'Preferences updated', data: user.preferences });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to update preferences' });
  }
});

// Demo mode status endpoint
router.get('/demo-status', (req, res) => {
  res.json({
    success: true,
    data: {
      mongoConnected: isMongoConnected(),
      demoMode: !isMongoConnected(),
      demoUsersCount: demoUsers.size,
      message: isMongoConnected() 
        ? 'Running in production mode with MongoDB' 
        : 'Running in demo mode without database'
    }
  });
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Name must be at least 2 characters long'
      });
    }

    // Demo mode handling when MongoDB is not connected
    if (!isMongoConnected()) {
      const demoUser = Array.from(demoUsers.values()).find(u => u._id === req.user.userId);
      if (!demoUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found (Demo Mode)'
        });
      }
      demoUser.name = name.trim();
      return res.json({
        success: true,
        message: 'Profile updated successfully (Demo Mode)',
        data: {
          user: {
            id: demoUser._id,
            email: demoUser.email,
            name: demoUser.name,
            mfaEnabled: demoUser.mfaEnabled,
            lastLogin: demoUser.lastLogin,
            createdAt: demoUser.createdAt
          }
        }
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name: name.trim() },
      { new: true, runValidators: true }
    ).select('-masterKeyHash -mfaSecret');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          mfaEnabled: user.mfaEnabled,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Change master key
router.post('/change-master-key', authenticateToken, async (req, res) => {
  try {
    const { currentMasterKey, newMasterKey } = req.body;
    
    if (!currentMasterKey || !newMasterKey) {
      return res.status(400).json({
        success: false,
        error: 'Both current and new master keys are required'
      });
    }

    if (newMasterKey.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New master key must be at least 8 characters long'
      });
    }

    // Demo mode handling when MongoDB is not connected
    if (!isMongoConnected()) {
      const demoUser = Array.from(demoUsers.values()).find(u => u._id === req.user.userId);
      if (!demoUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found (Demo Mode)'
        });
      }
      if (demoUser.masterKeyHash !== currentMasterKey) {
        return res.status(401).json({
          success: false,
          error: 'Current master key is incorrect'
        });
      }
      demoUser.masterKeyHash = newMasterKey;
      return res.json({
        success: true,
        message: 'Master key changed successfully (Demo Mode)'
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current master key
    const isValidKey = await user.validateMasterKey(currentMasterKey);
    if (!isValidKey) {
      return res.status(401).json({
        success: false,
        error: 'Current master key is incorrect'
      });
    }

    // Update master key hash
    user.masterKeyHash = newMasterKey; // Will be hashed in pre-save
    await user.save();

    res.json({
      success: true,
      message: 'Master key changed successfully'
    });
  } catch (error) {
    console.error('Master key change error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change master key'
    });
  }
});

// Logout (client-side token removal, but we can blacklist if needed)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a production app, you might want to blacklist the token
    // For now, just return success - client removes token
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to logout'
    });
  }
});

// Generate MFA secret
router.get('/generate-mfa-secret', authenticateToken, async (req, res) => {
  try {
    // Generate a random secret for TOTP
    // Use base64 instead of base32 since Node.js doesn't have built-in base32
    const secret = crypto.randomBytes(20).toString('base64').replace(/[^A-Z2-7]/g, '').substring(0, 32);
    
    // Generate QR code for the secret
    const QRCode = require('qrcode');
    const otpauth = `otpauth://totp/SecureVault:${req.user.userId}?secret=${secret}&issuer=SecureVault`;
    const qrCodeDataURL = await QRCode.toDataURL(otpauth);
    
    // Demo mode handling when MongoDB is not connected
    if (!isMongoConnected()) {
      const demoUser = Array.from(demoUsers.values()).find(u => u._id === req.user.userId);
      if (!demoUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found (Demo Mode)'
        });
      }
      demoUser.mfaSecret = secret;
      return res.json({
        success: true,
        data: { secret, qrCode: qrCodeDataURL },
        message: 'MFA secret generated (Demo Mode)'
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Store the secret temporarily (in production, you'd want to encrypt this)
    user.mfaSecret = secret;
    await user.save();

    res.json({
      success: true,
      data: { secret, qrCode: qrCodeDataURL },
      message: 'MFA secret generated'
    });
  } catch (error) {
    console.error('Generate MFA secret error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate MFA secret'
    });
  }
});

// Setup MFA
router.post('/setup-mfa', authenticateToken, async (req, res) => {
  try {
    const { secret, code } = req.body;
    
    if (!secret || !code) {
      return res.status(400).json({
        success: false,
        error: 'Secret and verification code are required'
      });
    }

    // Simple TOTP validation (in production, use a proper library like speakeasy)
    const expectedCode = generateTOTP(secret);
    const demoCode = generateDemoTOTP(secret);
    
    if (code !== expectedCode && code !== demoCode) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code',
        hint: `Expected: ${expectedCode}, Demo: ${demoCode}`
      });
    }

    // Demo mode handling when MongoDB is not connected
    if (!isMongoConnected()) {
      const demoUser = Array.from(demoUsers.values()).find(u => u._id === req.user.userId);
      if (!demoUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found (Demo Mode)'
        });
      }
      if (demoUser.mfaSecret !== secret) {
        return res.status(400).json({
          success: false,
          error: 'Invalid MFA secret'
        });
      }
      demoUser.mfaEnabled = true;
      return res.json({
        success: true,
        message: 'MFA enabled successfully (Demo Mode)'
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.mfaSecret !== secret) {
      return res.status(400).json({
        success: false,
        error: 'Invalid MFA secret'
      });
    }

    // Enable MFA
    user.mfaEnabled = true;
    await user.save();

    res.json({
      success: true,
      message: 'MFA enabled successfully'
    });
  } catch (error) {
    console.error('Setup MFA error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup MFA'
    });
  }
});

// Simple TOTP generation function (for demo purposes)
function generateTOTP(secret) {
  // This is a simplified TOTP implementation
  // In production, use a proper library like speakeasy
  const crypto = require('crypto');
  const time = Math.floor(Date.now() / 30000); // 30-second window
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigUInt64BE(BigInt(time), 0);
  
  // Create HMAC-SHA1 hash
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(timeBuffer);
  const hash = hmac.digest();
  
  // Generate 6-digit code
  const offset = hash[hash.length - 1] & 0xf;
  const code = ((hash[offset] & 0x7f) << 24) |
               ((hash[offset + 1] & 0xff) << 16) |
               ((hash[offset + 2] & 0xff) << 8) |
               (hash[offset + 3] & 0xff);
  
  return (code % 1000000).toString().padStart(6, '0');
}

// For demo purposes, also generate a predictable code for testing
function generateDemoTOTP(secret) {
  // Generate a predictable code for demo/testing
  const time = Math.floor(Date.now() / 30000);
  const simpleHash = require('crypto').createHash('md5').update(secret + time).digest('hex');
  return simpleHash.substring(0, 6);
}

// Delete account
router.delete('/delete-account', authenticateToken, async (req, res) => {
  try {
    // Demo mode handling when MongoDB is not connected
    if (!isMongoConnected()) {
      const demoUser = Array.from(demoUsers.values()).find(u => u._id === req.user.userId);
      if (!demoUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found (Demo Mode)'
        });
      }
      demoUsers.delete(demoUser.email.toLowerCase());
      return res.json({
        success: true,
        message: 'Account deleted successfully (Demo Mode)'
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Delete the user
    await User.findByIdAndDelete(req.user.userId);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
});

// Biometric authentication endpoint
router.post('/biometric-auth', [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  body('biometricVerified')
    .notEmpty()
    .withMessage('Biometric verification is required')
], async (req, res) => {
  try {
    console.log('Biometric authentication called:', req.body);
    
    const { email, biometricVerified } = req.body;
    
    if (!biometricVerified) {
      return res.status(400).json({
        success: false,
        error: 'Biometric verification failed'
      });
    }

    // Check if MongoDB is connected
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available. Please try again later.'
      });
    }

    // Find real user in database
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found. Please register first.'
      });
    }

    // Check if biometric is enabled for this user
    if (!user.biometricEnabled) {
      return res.status(400).json({
        success: false,
        error: 'Biometric authentication is not enabled for this account'
      });
    }

    // Generate JWT token with real user ID
    const token = generateToken(user._id);
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    res.json({
      success: true,
      message: 'Biometric authentication successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          mfaEnabled: user.mfaEnabled,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        },
        token: token,
        masterKey: '' // Master key is stored client-side only
      }
    });
  } catch (error) {
    console.error('Biometric authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Biometric authentication failed'
    });
  }
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
