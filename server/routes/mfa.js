const express = require('express');
const { body, validationResult } = require('express-validator');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');
const mongoose = require('mongoose');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Check if MongoDB is connected
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Generate backup codes
const generateBackupCodes = (count = 8) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes
    const crypto = require('crypto');
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push({ code, used: false });
  }
  return codes;
};

// Setup MFA for user
router.post('/setup', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.mfaEnabled) {
      return res.status(400).json({
        success: false,
        error: 'MFA is already enabled'
      });
    }

    // Generate new secret
    const secret = speakeasy.generateSecret({
      name: `SecureVault (${user.email})`,
      issuer: 'SecureVault',
      length: 20  // 20 bytes = 32 base32 characters (standard TOTP length)
    });

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    // Save secret and backup codes
    user.mfaSecret = secret.base32;
    user.mfaBackupCodes = backupCodes;
    
    await user.save();

    // Generate QR code
    let qrCodeUrl;
    try {
      qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
      
      if (!qrCodeUrl || qrCodeUrl.length < 100) {
        throw new Error('Generated QR code appears to be invalid');
      }
    } catch (qrError) {
      // Fallback: generate QR code manually
      const manualOtpauth = `otpauth://totp/SecureVault:${user.email}?secret=${secret.base32}&issuer=SecureVault`;
      qrCodeUrl = await QRCode.toDataURL(manualOtpauth);
    }

    const response = {
      success: true,
      message: 'MFA setup successful',
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        backupCodes: backupCodes.map(bc => bc.code),
        message: 'Scan the QR code with your authenticator app and save the backup codes securely'
      }
    };

    res.json(response);
  } catch (error) {
    console.error('MFA setup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup MFA'
    });
  }
});

// Verify MFA setup
router.post('/verify-setup', authenticateToken, [
  body('token')
    .notEmpty()
    .withMessage('Token is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Token must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { token } = req.body;
    
    const user = await User.findById(req.user.userId).select('+mfaSecret');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.mfaSecret) {
      return res.status(400).json({
        success: false,
        error: 'MFA not set up. Please setup MFA first.'
      });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps (60 seconds) for clock skew
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token. Please try again.'
      });
    }

    // Enable MFA
    user.mfaEnabled = true;
    await user.save();

    res.json({
      success: true,
      message: 'MFA enabled successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          mfaEnabled: user.mfaEnabled
        }
      }
    });
  } catch (error) {
    console.error('MFA verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify MFA'
    });
  }
});

// Disable MFA
router.post('/disable', authenticateToken, [
  body('token')
    .notEmpty()
    .withMessage('Token is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Token must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { token } = req.body;
    const user = await User.findById(req.user.userId).select('+mfaSecret');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.mfaEnabled) {
      return res.status(400).json({
        success: false,
        error: 'MFA is not enabled'
      });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token. Please try again.'
      });
    }

    // Disable MFA
    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    user.mfaBackupCodes = [];
    await user.save();

    res.json({
      success: true,
      message: 'MFA disabled successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          mfaEnabled: user.mfaEnabled
        }
      }
    });
  } catch (error) {
    console.error('MFA disable error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disable MFA'
    });
  }
});

// Verify MFA token (for login)
router.post('/verify', [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  body('token')
    .notEmpty()
    .withMessage('Token is required')
    .isLength({ min: 6, max: 8 })
    .withMessage('Token must be 6-8 characters (6 for TOTP, 8 for backup codes)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, token } = req.body;
    const user = await User.findByEmail(email, true); // Include MFA secret for verification
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.mfaEnabled) {
      return res.status(400).json({
        success: false,
        error: 'MFA is not enabled for this account'
      });
    }

    // Check if it's a backup code
    const backupCode = user.mfaBackupCodes.find(bc => 
      bc.code === token && !bc.used
    );

    if (backupCode) {
      // Mark backup code as used
      backupCode.used = true;
      await user.save();
      
      res.json({
        success: true,
        message: 'Backup code verified successfully',
        data: { isBackupCode: true }
      });
      return;
    }

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'MFA token verified successfully',
      data: { isBackupCode: false }
    });
  } catch (error) {
    console.error('MFA verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify MFA'
    });
  }
});

// Check if user can use backup codes (has MFA enabled or backup codes)
router.get('/can-use-backup-codes', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const canUse = user.mfaEnabled || (user.mfaBackupCodes && user.mfaBackupCodes.length > 0);
    
    res.json({
      success: true,
      data: {
        canUse,
        mfaEnabled: user.mfaEnabled,
        hasBackupCodes: user.mfaBackupCodes && user.mfaBackupCodes.length > 0,
        backupCodesCount: user.mfaBackupCodes ? user.mfaBackupCodes.length : 0
      }
    });
  } catch (error) {
    console.error('Check backup codes availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check backup codes availability'
    });
  }
});

// Get MFA status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available. Please try again later.'
      });
    }

    const user = await User.findById(req.user.userId).select('+mfaSecret');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        mfaEnabled: user.mfaEnabled,
        hasSecret: !!user.mfaSecret,
        backupCodesCount: user.mfaBackupCodes ? user.mfaBackupCodes.length : 0,
        backupCodes: user.mfaBackupCodes ? user.mfaBackupCodes.map(bc => bc.code) : [],
        message: 'MFA status retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Get MFA status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get MFA status'
    });
  }
});



// Generate backup codes (for initial setup or when MFA is not enabled)
router.post('/generate-backup-codes', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate new backup codes
    const newBackupCodes = generateBackupCodes();
    user.mfaBackupCodes = newBackupCodes;
    
    // If MFA is not enabled, also enable it with a default secret
    if (!user.mfaEnabled) {
      const secret = speakeasy.generateSecret({
        name: `SecureVault (${user.email})`,
        issuer: 'SecureVault',
        length: 20
      });
      user.mfaSecret = secret.base32;
      user.mfaEnabled = true;
    }
    
    await user.save();

    res.json({
      success: true,
      message: 'Backup codes generated successfully',
      data: {
        backupCodes: newBackupCodes.map(bc => bc.code),
        mfaEnabled: user.mfaEnabled,
        message: 'Save these backup codes securely for account recovery.'
      }
    });
  } catch (error) {
    console.error('Backup codes generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate backup codes'
    });
  }
});

// Regenerate backup codes (requires MFA verification)
router.post('/regenerate-backup-codes', authenticateToken, [
  body('token')
    .notEmpty()
    .withMessage('Token is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Token must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { token } = req.body;
    const user = await User.findById(req.user.userId).select('+mfaSecret');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.mfaEnabled) {
      return res.status(400).json({
        success: false,
        error: 'MFA is not enabled'
      });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token. Please try again.'
      });
    }

    // Generate new backup codes
    const newBackupCodes = generateBackupCodes();
    user.mfaBackupCodes = newBackupCodes;
    await user.save();

    res.json({
      success: true,
      message: 'Backup codes regenerated successfully',
      data: {
        backupCodes: newBackupCodes.map(bc => bc.code),
        message: 'Save these new backup codes securely. Old codes are no longer valid.'
      }
    });
  } catch (error) {
    console.error('Backup codes regeneration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate backup codes'
    });
  }
});

module.exports = router;
