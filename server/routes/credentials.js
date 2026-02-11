const express = require('express');
const { body, validationResult } = require('express-validator');
const Credential = require('../models/Credential');
const router = express.Router();

const { authenticateToken } = require('./auth');
const ethereumService = require('../services/ethereum-service');
const blockchainDecoder = require('../services/blockchain-decoder-persistent');
const batchQueue = require('../services/batch-queue');

const createBlockchainEvent = async (userId, action, credentialId, credentialData = null) => {
  try {
    if (!process.env.ETHEREUM_ENABLED || process.env.ETHEREUM_ENABLED !== 'true') {
      return;
    }

    const credentialMeta = credentialData ? {
      title: credentialData.title,
      category: credentialData.category,
      hasUrl: !!credentialData.url
    } : null;

    const vaultData = {
      action,
      resource: 'CREDENTIAL',
      id: credentialId,
      timestamp: new Date().toISOString(),
      ...credentialMeta
    };

    console.log(`Blockchain event: ${action} credential ${credentialId}`, {
      userId,
      vaultData,
      credentialData: credentialMeta
    });

    const crypto = require('crypto');
    const vaultHash = crypto.createHash('sha256')
      .update(JSON.stringify(vaultData))
      .digest('hex');

    if (!vaultHash || vaultHash.length === 0) {
      throw new Error('Generated vault hash is empty');
    }

    // Use batch queue if enabled, otherwise immediate update
    const useBatch = process.env.BATCH_ENABLED === 'true';
    const result = useBatch 
      ? await batchQueue.queueUpdate(userId, vaultHash)
      : await ethereumService.storeVaultHash(userId, vaultHash);
    
    if (result.success && result.txHash) {
      await blockchainDecoder.storeOperationDetails(result.txHash, {
        userId,
        action,
        credentialId,
        vaultData,
        vaultHash,
        blockNumber: result.blockNumber,
        credentialData: credentialMeta
      });
    }
    
    console.log(`Blockchain event logged: ${action} credential ${credentialId}`, {
      queued: result.queued || false,
      queueSize: result.queueSize || null,
      txHash: result.txHash || null,
      etherscanUrl: result.etherscanUrl || null,
      vaultHash: vaultHash
    });
  } catch (error) {
    console.error(`Blockchain event failed for ${action} credential ${credentialId}:`, error.message);
  }
};

// Validation middleware for full credential updates
const validateCredential = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('username')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Username must be between 1 and 200 characters'),
  body('encryptedPassword')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Encrypted password is required and must be less than 1000 characters'),
  body('iv')
    .isLength({ min: 1, max: 100 })
    .withMessage('Initialization vector is required and must be less than 100 characters'),
  body('salt')
    .isLength({ min: 1, max: 100 })
    .withMessage('Salt is required and must be less than 100 characters'),
  body('url')
    .optional()
    .isURL()
    .withMessage('URL must be a valid URL'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  body('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isLength({ max: 30 })
    .withMessage('Each tag cannot exceed 30 characters'),
  body('isFavorite')
    .optional()
    .isBoolean()
    .withMessage('isFavorite must be a boolean')
];

// Validation middleware for partial updates (like category changes)
const validatePartialUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Username must be between 1 and 200 characters'),
  body('encryptedPassword')
    .optional()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Encrypted password must be less than 1000 characters'),
  body('iv')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Initialization vector must be less than 100 characters'),
  body('salt')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Salt must be less than 100 characters'),
  body('url')
    .optional()
    .isURL()
    .withMessage('URL must be a valid URL'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  body('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isLength({ max: 30 })
    .withMessage('Each tag cannot exceed 30 characters'),
  body('isFavorite')
    .optional()
    .isBoolean()
    .withMessage('isFavorite must be a boolean')
];

// GET all credentials with pagination support
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      search, 
      category, 
      favorite, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      page,
      limit,
      getAll = 'false' // Set to 'true' to bypass pagination and get all
    } = req.query;
    
    let query = { userId: req.user.userId };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (favorite === 'true') {
      query.isFavorite = true;
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Performance: Pagination support - default limit 200 for better performance
    // Set getAll=true to get all credentials (backward compatibility)
    const shouldPaginate = getAll !== 'true';
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = shouldPaginate ? (parseInt(limit, 10) || 100) : null;
    const skip = shouldPaginate ? (pageNum - 1) * limitNum : 0;
    
    // Get total count for pagination metadata
    const totalCount = await Credential.countDocuments(query);
    
    // Build query with pagination
    let queryBuilder = Credential.find(query)
      .select('_id title username encryptedPassword iv salt url notes category tags isFavorite createdAt lastModified')
      .sort(sortOptions)
      .lean()
      .maxTimeMS(5000); // Performance: Timeout after 5s to prevent hanging queries
    
    if (shouldPaginate && limitNum) {
      queryBuilder = queryBuilder.skip(skip).limit(limitNum);
    }
    
    const credentials = await queryBuilder;
    
    // Calculate pagination metadata
    const totalPages = shouldPaginate && limitNum ? Math.ceil(totalCount / limitNum) : 1;
    const hasNextPage = shouldPaginate && limitNum ? pageNum < totalPages : false;
    const hasPrevPage = shouldPaginate && limitNum ? pageNum > 1 : false;
    
    res.json({
      success: true,
      data: credentials,
      count: credentials.length,
      pagination: shouldPaginate ? {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      } : {
        total: totalCount,
        getAll: true
      }
    });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    res.status(500).json({
      error: 'Failed to fetch credentials',
      message: error.message
    });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const credential = await Credential.findOne({ 
      _id: req.params.id, 
      userId: req.user.userId 
    }).select('-__v');
    
    if (!credential) {
      return res.status(404).json({
        success: false,
        error: 'Credential not found'
      });
    }
    
    res.json({
      success: true,
      data: credential
    });
  } catch (error) {
    console.error('Error fetching credential:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credential'
    });
  }
});

router.post('/', authenticateToken, validateCredential, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const credential = new Credential({
      ...req.body,
      userId: req.user.userId
    });
    
    await credential.save();
    
    createBlockchainEvent(req.user.userId, 'CREATE', credential._id.toString(), credential);
    
    res.status(201).json({
      success: true,
      message: 'Credential saved successfully',
      data: credential
    });
  } catch (error) {
    console.error('Error creating credential:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create credential',
      message: error.message
    });
  }
});

router.put('/:id', authenticateToken, validatePartialUpdate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const credential = await Credential.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!credential) {
      return res.status(404).json({ success: false, error: 'Credential not found' });
    }
    
    createBlockchainEvent(req.user.userId, 'UPDATE', credential._id.toString(), credential);
    
    res.json({
      success: true,
      message: 'Credential updated successfully',
      data: credential
    });
  } catch (error) {
    console.error('Error updating credential:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      userId: req.user.userId,
      credentialId: req.params.id,
      requestBody: req.body
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update credential',
      details: error.message
    });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const credential = await Credential.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });
    
    if (!credential) {
      return res.status(404).json({ success: false, error: 'Credential not found' });
    }
    
    createBlockchainEvent(req.user.userId, 'DELETE', credential._id.toString(), credential);
    
    res.json({ success: true, message: 'Credential deleted successfully' });
  } catch (error) {
    console.error('Error deleting credential:', error);
    res.status(500).json({ success: false, error: 'Failed to delete credential' });
  }
});

router.patch('/:id/category', authenticateToken, [
  body('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const credential = await Credential.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { category: req.body.category || null },
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!credential) {
      return res.status(404).json({ success: false, error: 'Credential not found' });
    }
    
    res.json({ success: true, message: 'Category updated successfully', data: credential });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, error: 'Failed to update category', details: error.message });
  }
});

router.patch('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const credential = await Credential.findOne({ _id: req.params.id, userId: req.user.userId });
    
    if (!credential) {
      return res.status(404).json({ success: false, error: 'Credential not found' });
    }
    
    await credential.toggleFavorite();
    
    res.json({
      success: true,
      message: `Credential ${credential.isFavorite ? 'added to' : 'removed from'} favorites`,
      data: credential
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle favorite status' });
  }
});

router.get('/categories/list', authenticateToken, async (req, res) => {
  try {
    const categories = await Credential.distinct('category', { userId: req.user.userId });
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const totalCredentials = await Credential.countDocuments({ userId: req.user.userId });
    const favoriteCredentials = await Credential.countDocuments({ userId: req.user.userId, isFavorite: true });
    const categories = await Credential.distinct('category', { userId: req.user.userId });
    
    res.json({ success: true, data: { total: totalCredentials, favorites: favoriteCredentials, categories: categories.length } });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

module.exports = router; 