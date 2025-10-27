const express = require('express');
const { body, validationResult } = require('express-validator');
const Credential = require('../models/Credential');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Import credentials from JSON file
router.post('/import', authenticateToken, [
  body('credentials')
    .isArray({ min: 1 })
    .withMessage('Credentials array is required'),
  body('credentials.*.title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('credentials.*.username')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Username must be between 1 and 200 characters'),
  body('credentials.*.encryptedPassword')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Encrypted password is required'),
  body('credentials.*.iv')
    .isLength({ min: 1, max: 100 })
    .withMessage('IV is required'),
  body('credentials.*.salt')
    .isLength({ min: 1, max: 100 })
    .withMessage('Salt is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { credentials, overwrite = false } = req.body;
    const userId = req.user.userId;

    let importedCount = 0;
    let skippedCount = 0;
    let importErrors = [];

    // Process each credential
    for (let i = 0; i < credentials.length; i++) {
      const cred = credentials[i];
      
      try {
        // Check if credential already exists (by title and username for this user)
        const existing = await Credential.findOne({
          title: cred.title,
          username: cred.username,
          userId: userId
        });

        if (existing && !overwrite) {
          skippedCount++;
          continue;
        }

        if (existing && overwrite) {
          // Update existing credential
          await Credential.findByIdAndUpdate(existing._id, {
            encryptedPassword: cred.encryptedPassword,
            iv: cred.iv,
            salt: cred.salt,
            url: cred.url || '',
            notes: cred.notes || '',
            category: cred.category || 'General',
            tags: cred.tags || [],
            isFavorite: cred.isFavorite || false,
            lastModified: new Date()
          });
        } else {
          // Create new credential
          const newCredential = new Credential({
            ...cred,
            userId: userId,
            category: cred.category || 'General',
            tags: cred.tags || [],
            isFavorite: cred.isFavorite || false
          });
          await newCredential.save();
        }

        importedCount++;
      } catch (error) {
        importErrors.push({
          index: i,
          title: cred.title,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Import completed',
      data: {
        total: credentials.length,
        imported: importedCount,
        skipped: skippedCount,
        errors: importErrors
      }
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import credentials'
    });
  }
});

// Export credentials to JSON
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const { format = 'json', category, includePasswords = false } = req.query;
    const userId = req.user.userId;

    // Build query
    let query = { userId: userId };
    if (category && category !== 'all') {
      query.category = category;
    }

    // Get credentials
    const credentials = await Credential.find(query).sort({ createdAt: -1 });

    if (format === 'csv') {
      // Export as CSV
      const csvHeaders = ['Title', 'Username', 'Password', 'URL', 'Category', 'Notes', 'Tags', 'Favorite', 'Created', 'Modified'];
      let csvContent = csvHeaders.join(',') + '\n';

      credentials.forEach(cred => {
        const row = [
          `"${cred.title}"`,
          `"${cred.username}"`,
          includePasswords ? `"${cred.encryptedPassword}"` : '"***ENCRYPTED***"',
          `"${cred.url || ''}"`,
          `"${cred.category || 'General'}"`,
          `"${cred.notes || ''}"`,
          `"${cred.tags.join(';')}"`,
          cred.isFavorite ? 'Yes' : 'No',
          cred.createdAt.toISOString(),
          cred.lastModified.toISOString()
        ];
        csvContent += row.join(',') + '\n';
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="securevault-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      // Export as JSON
      const exportData = {
        exportInfo: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          totalCredentials: credentials.length,
          note: 'This file contains your encrypted credentials. Keep it secure.'
        },
        credentials: credentials.map(cred => ({
          title: cred.title,
          username: cred.username,
          encryptedPassword: cred.encryptedPassword,
          iv: cred.iv,
          salt: cred.salt,
          url: cred.url,
          notes: cred.notes,
          category: cred.category,
          tags: cred.tags,
          isFavorite: cred.isFavorite,
          createdAt: cred.createdAt,
          lastModified: cred.lastModified
        }))
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="securevault-export-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export credentials'
    });
  }
});

// Get import/export statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const totalCredentials = await Credential.countDocuments({ userId: userId });
    const categories = await Credential.distinct('category', { userId: userId });
    const totalTags = await Credential.aggregate([
      { $match: { userId: userId } },
      { $unwind: '$tags' },
      { $group: { _id: null, uniqueTags: { $addToSet: '$tags' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalCredentials,
        categories: categories.length,
        totalTags: totalTags[0]?.uniqueTags?.length || 0,
        lastExport: null, // Could track this in user profile
        lastImport: null
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

// Validate import file structure
router.post('/validate', authenticateToken, [
  body('credentials')
    .isArray({ min: 1 })
    .withMessage('Credentials array is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { credentials } = req.body;
    const validationResults = {
      valid: 0,
      invalid: 0,
      errors: []
    };

    // Validate each credential
    credentials.forEach((cred, index) => {
      const credErrors = [];

      if (!cred.title || cred.title.trim().length === 0) {
        credErrors.push('Title is required');
      } else if (cred.title.length > 100) {
        credErrors.push('Title cannot exceed 100 characters');
      }

      if (!cred.username || cred.username.trim().length === 0) {
        credErrors.push('Username is required');
      } else if (cred.username.length > 200) {
        credErrors.push('Username cannot exceed 200 characters');
      }

      // Allow either encrypted credentials OR plaintext password (for re-encryption)
      const hasEncrypted = cred.encryptedPassword && cred.iv && cred.salt;
      const hasPlaintext = cred.password;
      
      if (!hasEncrypted && !hasPlaintext) {
        credErrors.push('Either encrypted password (with iv and salt) or plaintext password is required');
      }

      if (cred.url && cred.url.length > 500) {
        credErrors.push('URL cannot exceed 500 characters');
      }

      if (cred.notes && cred.notes.length > 1000) {
        credErrors.push('Notes cannot exceed 1000 characters');
      }

      if (credErrors.length > 0) {
        validationResults.invalid++;
        validationResults.errors.push({
          index,
          title: cred.title || 'Unknown',
          errors: credErrors
        });
      } else {
        validationResults.valid++;
      }
    });

    res.json({
      success: true,
      data: validationResults
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate import file'
    });
  }
});

module.exports = router;
