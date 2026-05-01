const express = require('express');
const { body, validationResult } = require('express-validator');
const Credential = require('../models/Credential');
const router = express.Router();

const { authenticateToken } = require('./auth');
const ethereumService = require('../services/ethereum-service');
const blockchainDecoder = require('../services/blockchain-decoder-persistent');
const batchQueue = require('../services/batch-queue');

const credentialsListCache = new Map();
const credentialsListCacheTtlMs = 5000;
const credentialsListCacheTtlMsFullDataset = Math.max(
  credentialsListCacheTtlMs,
  parseInt(process.env.CREDENTIALS_LIST_CACHE_TTL_FULL_MS || '30000', 10) || 30000
);
const buildCredentialsCacheKey = (userId, query) => {
  const q = query || {};
  const normalized = Object.keys(q)
    .sort()
    .map((key) => `${key}=${Array.isArray(q[key]) ? q[key].join(',') : q[key]}`)
    .join('&');
  return `${String(userId)}::${normalized}`;
};
const getCachedCredentialsList = (cacheKey) => {
  const cached = credentialsListCache.get(cacheKey);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    credentialsListCache.delete(cacheKey);
    return null;
  }
  return cached.payload;
};
const setCachedCredentialsList = (cacheKey, payload, ttlMs = credentialsListCacheTtlMs) => {
  credentialsListCache.set(cacheKey, {
    payload,
    expiresAt: Date.now() + ttlMs
  });
};
const invalidateCredentialsListCacheForUser = (userId) => {
  const prefix = `${String(userId)}::`;
  for (const key of credentialsListCache.keys()) {
    if (key.startsWith(prefix)) credentialsListCache.delete(key);
  }
};

const normalizeMerkleRoot = (value) => {
  if (!value || typeof value !== 'string') return null;
  const raw = value.startsWith('0x') ? value.slice(2) : value;
  if (!/^[a-fA-F0-9]{64}$/.test(raw)) return null;
  return raw.toLowerCase();
};
const blockchainVerboseLogs = process.env.BLOCKCHAIN_VERBOSE_LOGS === 'true';

const BLOCKCHAIN_EVENT_TIMEOUT_MS = Math.max(
  0,
  parseInt(process.env.BLOCKCHAIN_EVENT_TIMEOUT_MS || '120', 10) || 120
);

const withBlockchainEventTimeout = async (operationLabel, eventPromiseFactory) => {
  try {
    const eventPromise = eventPromiseFactory();
    if (!BLOCKCHAIN_EVENT_TIMEOUT_MS) {
      return await eventPromise;
    }

    const timeoutToken = Symbol('blockchain-timeout');
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve(timeoutToken), BLOCKCHAIN_EVENT_TIMEOUT_MS);
    });

    const result = await Promise.race([eventPromise, timeoutPromise]);
    if (result !== timeoutToken) {
      return result;
    }

    // Keep blockchain side effects running in the background so anchoring still happens.
    eventPromise.catch((error) => {
      console.error(`Deferred blockchain event failed for ${operationLabel}:`, error?.message || error);
    });

    return {
      enabled: process.env.ETHEREUM_ENABLED === 'true',
      queued: process.env.BATCH_ENABLED === 'true',
      txHash: null,
      deferred: true,
      message: `Blockchain processing deferred after ${BLOCKCHAIN_EVENT_TIMEOUT_MS}ms timeout`
    };
  } catch (error) {
    console.error(`Blockchain event wrapper failed for ${operationLabel}:`, error?.message || error);
    return { enabled: process.env.ETHEREUM_ENABLED === 'true', queued: false, txHash: null, error: error.message };
  }
};

const scheduleBlockchainEvent = (operationLabel, eventPromiseFactory, onComplete) => {
  Promise.resolve()
    .then(eventPromiseFactory)
    .then((result) => {
      if (typeof onComplete === 'function') onComplete(result);
    })
    .catch((error) => {
      console.error(`Background blockchain event failed for ${operationLabel}:`, error?.message || error);
      if (typeof onComplete === 'function') {
        onComplete({ enabled: process.env.ETHEREUM_ENABLED === 'true', queued: false, txHash: null, error: error.message });
      }
    });
};

const createBlockchainEvent = async (userId, action, credentialId, credentialData = null, merkleRoot = null) => {
  try {
    if (!process.env.ETHEREUM_ENABLED || process.env.ETHEREUM_ENABLED !== 'true') {
      return { enabled: false, queued: false, txHash: null };
    }

    const credentialMeta = credentialData ? {
      title: credentialData.title,
      category: credentialData.category,
      hasUrl: !!credentialData.url
    } : null;

    const eventTimestamp = new Date().toISOString();
    const vaultData = {
      action,
      resource: 'CREDENTIAL',
      id: credentialId,
      timestamp: eventTimestamp,
      ...credentialMeta
    };

    if (blockchainVerboseLogs) {
      console.log(`Blockchain event: ${action} credential ${credentialId}`, {
        userId,
        vaultData,
        credentialData: credentialMeta
      });
    }

    const vaultHash = normalizeMerkleRoot(merkleRoot);

    if (!vaultHash || vaultHash.length === 0) {
      throw new Error('Valid merkleRoot is required for anchoring');
    }

    // Persist as queued immediately so UI can show "Queued" even in batch mode.
    const pendingDoc = await blockchainDecoder.storePendingOperation({
      userId,
      action,
      credentialId,
      vaultData: {
        ...vaultData,
        canonicalStateVersion: 1,
        anchorSource: 'client_merkle_root'
      },
      vaultHash,
      credentialData: credentialMeta
    });

    // Use batch queue if enabled, otherwise immediate update
    const useBatch = process.env.BATCH_ENABLED === 'true';
    const result = useBatch
      ? await batchQueue.queueUpdate(userId, vaultHash)
      : await ethereumService.storeVaultHash(userId, vaultHash);

    // If blockchain service is disabled/unavailable, avoid leaving stale queued records forever.
    if (result?.reason === 'blockchain_disabled') {
      await blockchainDecoder.markSupersededByHash(userId, vaultHash);
    }
    
    if (result.success && result.txHash) {
      await blockchainDecoder.storeOperationDetails(result.txHash, {
        userId,
        action,
        credentialId,
        vaultData: {
          ...vaultData,
          canonicalStateVersion: 1,
          anchorSource: 'client_merkle_root'
        },
        vaultHash,
        blockNumber: result.blockNumber,
        credentialData: credentialMeta
      });
      await blockchainDecoder.markAnchoredForUser(userId, {
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        vaultHash,
        anchoredAt: result.blockTimestamp ? new Date(result.blockTimestamp * 1000) : undefined
      });
    }
    
    if (blockchainVerboseLogs) {
      console.log(`Blockchain event logged: ${action} credential ${credentialId}`, {
        queued: result.queued || false,
        pendingCount: typeof result.pendingCount === 'number' ? result.pendingCount : null,
        txHash: result.txHash || null,
        etherscanUrl: result.etherscanUrl || null,
        vaultHash: vaultHash
      });
    }

    return {
      enabled: true,
      queued: !!result.queued,
      pendingCount: typeof result.pendingCount === 'number' ? result.pendingCount : null,
      txHash: result.txHash || null,
      etherscanUrl: result.etherscanUrl || null,
      vaultHash,
      pendingOperationId: pendingDoc ? pendingDoc._id?.toString?.() : null
    };
  } catch (error) {
    console.error(`Blockchain event failed for ${action} credential ${credentialId}:`, error.message);
    return { enabled: true, queued: false, txHash: null, error: error.message };
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
    .optional({ checkFalsy: true })
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
    .optional({ checkFalsy: true })
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
      getAll = 'false', // Set to 'true' to bypass pagination and get all
      includeTotal = 'false'
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
    
    const shouldPaginate = getAll !== 'true';
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = shouldPaginate ? (parseInt(limit, 10) || 100) : null;
    const skip = shouldPaginate ? (pageNum - 1) * limitNum : 0;
    
    const cacheKey = buildCredentialsCacheKey(req.user.userId, req.query);
    const useListCache = req.method === 'GET' && search ? false : true;
    if (useListCache) {
      const cachedPayload = getCachedCredentialsList(cacheKey);
      if (cachedPayload) {
        if (cachedPayload.serialized) {
          return res.type('application/json').send(cachedPayload.serialized);
        }
        return res.json(cachedPayload);
      }
    }

    // Build query with pagination
    let queryBuilder = Credential.find(query)
      .select('_id title username encryptedPassword iv salt url notes category tags isFavorite createdAt lastModified')
      .sort(sortOptions)
      .lean()
      .maxTimeMS(5000); // Performance: Timeout after 5s to prevent hanging queries
    
    if (shouldPaginate && limitNum) {
      queryBuilder = queryBuilder.skip(skip).limit(limitNum + 1);
    }
    
    const resultSet = await queryBuilder;
    const hasNextPage = shouldPaginate && limitNum ? resultSet.length > limitNum : false;
    const credentials = shouldPaginate && limitNum ? resultSet.slice(0, limitNum) : resultSet;
    const hasPrevPage = shouldPaginate && limitNum ? pageNum > 1 : false;

    let totalCount = null;
    let totalPages = null;
    if (includeTotal === 'true') {
      totalCount = await Credential.countDocuments(query);
      totalPages = shouldPaginate && limitNum ? Math.ceil(totalCount / limitNum) : 1;
    }
    
    const payload = {
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
    };

    if (useListCache) {
      const shouldCacheSerialized = getAll === 'true';
      if (shouldCacheSerialized) {
        setCachedCredentialsList(
          cacheKey,
          { serialized: JSON.stringify(payload) },
          credentialsListCacheTtlMsFullDataset
        );
      } else {
        setCachedCredentialsList(cacheKey, payload, credentialsListCacheTtlMs);
      }
    }

    res.json(payload);
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
    
    const { merkleRoot, ...credentialPayload } = req.body;
    const normalizedMerkleRoot = normalizeMerkleRoot(merkleRoot);
    if (!normalizedMerkleRoot) {
      return res.status(400).json({ success: false, error: 'Valid merkleRoot is required' });
    }

    const credential = new Credential({
      ...credentialPayload,
      userId: req.user.userId
    });
    
    await credential.save();
    
    const blockchain = {
      enabled: process.env.ETHEREUM_ENABLED === 'true',
      queued: process.env.BATCH_ENABLED === 'true',
      txHash: null,
      deferred: true,
      message: 'Credential saved. Blockchain anchoring scheduled in background.'
    };
    invalidateCredentialsListCacheForUser(req.user.userId);
    blockchainDecoder.invalidateUserOperationsSummary(req.user.userId);

    scheduleBlockchainEvent(
      'CREATE',
      () => createBlockchainEvent(
        req.user.userId,
        'CREATE',
        credential._id.toString(),
        credential,
        normalizedMerkleRoot
      ),
      () => {
        // Any successful/failed background result updates queued/anchored state in DB,
        // so invalidate related summaries to keep next reads fresh.
        blockchainDecoder.invalidateUserOperationsSummary(req.user.userId);
      }
    );
    
    res.status(201).json({
      success: true,
      message: 'Credential saved successfully',
      data: credential,
      blockchain
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
    
    const { merkleRoot, ...updatePayload } = req.body;
    const normalizedMerkleRoot = normalizeMerkleRoot(merkleRoot);
    if (!normalizedMerkleRoot) {
      return res.status(400).json({ success: false, error: 'Valid merkleRoot is required' });
    }

    const credential = await Credential.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      updatePayload,
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!credential) {
      return res.status(404).json({ success: false, error: 'Credential not found' });
    }
    
    const blockchain = await withBlockchainEventTimeout(
      'UPDATE',
      () => createBlockchainEvent(
        req.user.userId,
        'UPDATE',
        credential._id.toString(),
        credential,
        normalizedMerkleRoot
      )
    );
    invalidateCredentialsListCacheForUser(req.user.userId);
    blockchainDecoder.invalidateUserOperationsSummary(req.user.userId);
    
    res.json({
      success: true,
      message: 'Credential updated successfully',
      data: credential,
      blockchain
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
    const normalizedMerkleRoot = normalizeMerkleRoot(req.body?.merkleRoot);
    if (!normalizedMerkleRoot) {
      return res.status(400).json({ success: false, error: 'Valid merkleRoot is required' });
    }

    const credential = await Credential.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });
    
    if (!credential) {
      return res.status(404).json({ success: false, error: 'Credential not found' });
    }
    
    const blockchain = await withBlockchainEventTimeout(
      'DELETE',
      () => createBlockchainEvent(
        req.user.userId,
        'DELETE',
        credential._id.toString(),
        credential,
        normalizedMerkleRoot
      )
    );
    invalidateCredentialsListCacheForUser(req.user.userId);
    blockchainDecoder.invalidateUserOperationsSummary(req.user.userId);
    
    res.json({ success: true, message: 'Credential deleted successfully', blockchain });
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
    
    invalidateCredentialsListCacheForUser(req.user.userId);
    res.json({ success: true, message: 'Category updated successfully', data: credential });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, error: 'Failed to update category', details: error.message });
  }
});

router.patch('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const credential = await Credential.findOne({ _id: req.params.id, userId: req.user.userId }).select('isFavorite');
    if (!credential) {
      return res.status(404).json({ success: false, error: 'Credential not found' });
    }

    const updatedCredential = await Credential.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: { isFavorite: !credential.isFavorite } },
      { new: true, runValidators: true }
    ).select('-__v');
    
    res.json({
      success: true,
      message: `Credential ${updatedCredential.isFavorite ? 'added to' : 'removed from'} favorites`,
      data: updatedCredential
    });
    invalidateCredentialsListCacheForUser(req.user.userId);
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
    const [totalCredentials, favoriteCredentials, categories] = await Promise.all([
      Credential.countDocuments({ userId: req.user.userId }),
      Credential.countDocuments({ userId: req.user.userId, isFavorite: true }),
      Credential.distinct('category', { userId: req.user.userId })
    ]);
    
    res.json({ success: true, data: { total: totalCredentials, favorites: favoriteCredentials, categories: categories.length } });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

module.exports = router; 