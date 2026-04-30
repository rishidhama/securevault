const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const mongoose = require('mongoose');
const crypto = require('crypto');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required for security');
}

// Fallback storage for non-database mode
const fallbackUsers = new Map();

const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

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
  body('authSecret')
    .notEmpty()
    .withMessage('Authentication secret is required')
    .isLength({ min: 32 })
    .withMessage('Authentication secret is too short')
];

const validateLogin = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  body('authSecret')
    .notEmpty()
    .withMessage('Authentication secret is required')
];

const generateToken = (userId) => {
  return jwt.sign(
    { userId, iat: Date.now() },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const deriveWebAuthnRpId = (req) => {
  const origin = req.get('origin');
  if (origin) {
    try {
      const originHost = new URL(origin).hostname;
      if (originHost) return originHost;
    } catch (e) {
      // Ignore malformed origin and continue with fallbacks.
    }
  }

  const forwardedHost = req.get('x-forwarded-host');
  if (forwardedHost) {
    return forwardedHost.split(',')[0].trim().split(':')[0];
  }

  const hostHeader = req.get('host');
  if (hostHeader) {
    return hostHeader.split(':')[0];
  }

  return 'localhost';
};

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

router.post('/register', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, name, authSecret } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    const user = new User({
      email,
      name,
      masterKeyHash: authSecret
    });

    await user.save();

    const token = generateToken(user._id);

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
    console.error('Registration error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to register user',
      code: 'REGISTRATION_FAILED'
    });
  }
});

router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, authSecret } = req.body;

    try {
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or master key'
        });
      }

      if (user.isLocked()) {
        const lockTime = new Date(user.lockUntil).toLocaleString();
        return res.status(423).json({
          success: false,
          error: `Account is locked due to too many failed attempts. Try again after ${lockTime}`
        });
      }

      const isValidKey = await user.validateMasterKey(authSecret).catch(() => false);
      if (!isValidKey) {
        await user.incLoginAttempts();
        return res.status(401).json({
          success: false,
          error: 'Invalid email or master key',
          code: 'INVALID_CREDENTIALS'
        });
      }

      await user.resetLoginAttempts();

      // Avoid full document validation on login (some legacy user docs may be missing required fields).
      // Only update lastLogin, and keep login working even if the document doesn't satisfy current schema.
      const now = new Date();
      await User.updateOne({ _id: user._id }, { $set: { lastLogin: now } });
      user.lastLogin = now;

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
      console.error('Login error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Database connection error. Please try again later.',
        code: 'DATABASE_CONNECTION_ERROR'
      });
    }
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to login',
      code: 'LOGIN_FAILED'
    });
  }
});

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

    const challenge = crypto.randomBytes(32);
    
    if (!global.biometricChallenges) {
      global.biometricChallenges = new Map();
    }
    
    global.biometricChallenges.set(email, {
      challenge: Array.from(challenge),
      timestamp: Date.now(),
      userId: user._id.toString()
    });

    const now = Date.now();
    for (const [key, value] of global.biometricChallenges.entries()) {
      if (now - value.timestamp > 5 * 60 * 1000) {
        global.biometricChallenges.delete(key);
      }
    }

    const responseData = {
      challenge: Array.from(challenge),
      rpId: deriveWebAuthnRpId(req),
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

    if (!global.biometricChallenges || !global.biometricChallenges.has(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired challenge'
      });
    }

    const storedChallenge = global.biometricChallenges.get(email);
    
    if (Date.now() - storedChallenge.timestamp > 5 * 60 * 1000) {
      global.biometricChallenges.delete(email);
      return res.status(400).json({
        success: false,
        error: 'Challenge expired'
      });
    }

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

    if (!user.biometricCredential) {
      return res.status(400).json({
        success: false,
        error: 'No biometric credential found for this user'
      });
    }

    if (assertion.id !== user.biometricCredential.id) {
      return res.status(400).json({
        success: false,
        error: 'Invalid biometric credential'
      });
    }
    
    global.biometricChallenges.delete(email);
    
    user.lastLogin = new Date();
    await user.save();

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
        masterKey: ''
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

router.post('/enable-biometric', authenticateToken, async (req, res) => {
  try {
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

    user.biometricEnabled = true;
    
    if (credentialData) {
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

router.get('/profile', authenticateToken, async (req, res) => {
  try {
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
          biometricEnabled: user.biometricEnabled,
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

router.get('/preferences', authenticateToken, async (req, res) => {
  try {
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

router.get('/demo-status', (req, res) => {
  res.json({
    success: true,
    data: {
      mongoConnected: isMongoConnected(),
      fallbackMode: !isMongoConnected(),
      fallbackUsersCount: fallbackUsers.size,
      message: isMongoConnected() 
        ? 'Running in production mode with MongoDB' 
        : 'Running in fallback mode without database'
    }
  });
});

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Name must be at least 2 characters long'
      });
    }

    if (!isMongoConnected()) {
      const fallbackUser = Array.from(fallbackUsers.values()).find(u => u._id === req.user.userId);
      if (!fallbackUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found (Fallback Mode)'
        });
      }
      fallbackUser.name = name.trim();
      return res.json({
        success: true,
        message: 'Profile updated successfully (Fallback Mode)',
        data: {
          user: {
            id: fallbackUser._id,
            email: fallbackUser.email,
            name: fallbackUser.name,
            mfaEnabled: fallbackUser.mfaEnabled,
            lastLogin: fallbackUser.lastLogin,
            createdAt: fallbackUser.createdAt
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

router.post('/change-master-key', authenticateToken, async (req, res) => {
  try {
    const { currentAuthSecret, newAuthSecret } = req.body;
    
    if (!currentAuthSecret || !newAuthSecret) {
      return res.status(400).json({
        success: false,
        error: 'Both current and new authentication secrets are required'
      });
    }

    if (newAuthSecret.length < 32) {
      return res.status(400).json({
        success: false,
        error: 'New authentication secret is too short'
      });
    }

    if (!isMongoConnected()) {
      const fallbackUser = Array.from(fallbackUsers.values()).find(u => u._id === req.user.userId);
      if (!fallbackUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found (Fallback Mode)'
        });
      }
      if (fallbackUser.masterKeyHash !== currentMasterKey) {
        return res.status(401).json({
          success: false,
          error: 'Current master key is incorrect'
        });
      }
      fallbackUser.masterKeyHash = newMasterKey;
      return res.json({
        success: true,
        message: 'Master key changed successfully (Fallback Mode)'
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const isValidKey = await user.validateMasterKey(currentAuthSecret);
    if (!isValidKey) {
      return res.status(401).json({
        success: false,
        error: 'Current master key is incorrect'
      });
    }

    user.masterKeyHash = newAuthSecret;
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

router.post('/logout', authenticateToken, async (req, res) => {
  try {
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

router.get('/generate-mfa-secret', authenticateToken, async (req, res) => {
  try {
    const secret = crypto.randomBytes(20).toString('base64').replace(/[^A-Z2-7]/g, '').substring(0, 32);
    
    const QRCode = require('qrcode');
    const otpauth = `otpauth://totp/SecureVault:${req.user.userId}?secret=${secret}&issuer=SecureVault`;
    const qrCodeDataURL = await QRCode.toDataURL(otpauth);
    
    if (!isMongoConnected()) {
      const fallbackUser = Array.from(fallbackUsers.values()).find(u => u._id === req.user.userId);
      if (!fallbackUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found (Fallback Mode)'
        });
      }
      fallbackUser.mfaSecret = secret;
      return res.json({
        success: true,
        data: { secret, qrCode: qrCodeDataURL },
        message: 'MFA secret generated (Fallback Mode)'
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

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

router.post('/setup-mfa', authenticateToken, async (req, res) => {
  try {
    const { secret, code } = req.body;
    
    if (!secret || !code) {
      return res.status(400).json({
        success: false,
        error: 'Secret and verification code are required'
      });
    }

    const expectedCode = generateTOTP(secret);
    const backupCode = generateBackupTOTP(secret);
    
    if (code !== expectedCode && code !== backupCode) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code',
        hint: `Expected: ${expectedCode}, Backup: ${backupCode}`
      });
    }

    if (!isMongoConnected()) {
      const fallbackUser = Array.from(fallbackUsers.values()).find(u => u._id === req.user.userId);
      if (!fallbackUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found (Fallback Mode)'
        });
      }
      if (fallbackUser.mfaSecret !== secret) {
        return res.status(400).json({
          success: false,
          error: 'Invalid MFA secret'
        });
      }
      fallbackUser.mfaEnabled = true;
      return res.json({
        success: true,
        message: 'MFA enabled successfully (Fallback Mode)'
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

function generateTOTP(secret) {
  const crypto = require('crypto');
  const time = Math.floor(Date.now() / 30000);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigUInt64BE(BigInt(time), 0);
  
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(timeBuffer);
  const hash = hmac.digest();
  
  const offset = hash[hash.length - 1] & 0xf;
  const code = ((hash[offset] & 0x7f) << 24) |
               ((hash[offset + 1] & 0xff) << 16) |
               ((hash[offset + 2] & 0xff) << 8) |
               (hash[offset + 3] & 0xff);
  
  return (code % 1000000).toString().padStart(6, '0');
}

function generateBackupTOTP(secret) {
  const time = Math.floor(Date.now() / 30000);
  const simpleHash = require('crypto').createHash('md5').update(secret + time).digest('hex');
  return simpleHash.substring(0, 6);
}

router.delete('/delete-account', authenticateToken, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const fallbackUser = Array.from(fallbackUsers.values()).find(u => u._id === req.user.userId);
      if (!fallbackUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found (Fallback Mode)'
        });
      }
      fallbackUsers.delete(fallbackUser.email.toLowerCase());
      return res.json({
        success: true,
        message: 'Account deleted successfully (Fallback Mode)'
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

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

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available. Please try again later.'
      });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found. Please register first.'
      });
    }

    if (!user.biometricEnabled) {
      return res.status(400).json({
        success: false,
        error: 'Biometric authentication is not enabled for this account'
      });
    }

    const token = generateToken(user._id);
    
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
        masterKey: ''
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
