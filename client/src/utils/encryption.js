import CryptoJS from 'crypto-js';


class VaultCrypt {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keySizeBits = 256;
    this.iterations = 310000; // OWASP recommended minimum for PBKDF2
    this.tagLengthBits = 128; // WebCrypto default tag length
    this._decoder = new TextDecoder();
    this._encoder = new TextEncoder();
    this._decryptCache = new Map();
    // Performance optimization: Cache derived keys to avoid repeated PBKDF2
    this._keyCache = new Map(); // Cache: masterKey+salt -> CryptoKey (for backward compatibility)
    this._baseKeyCache = null; // Cache: masterKey -> baseKey (importKey result)
    this._cachedMasterKey = null; // Track which master key is cached
    this._encodedMasterKeyCache = null; // Cache encoded master key
    this._sessionVaultKey = null; // CryptoKey derived from masterKey + userSalt
    this._sessionVaultKeySalt = null; // User salt (stored or generated deterministically)
    this._sessionMasterKey = null; // Master key for current session
  }

  _arrayBufferToBase64(buffer) {
    // Performance optimization: Use efficient conversion instead of O(n²) string concatenation
    const bytes = new Uint8Array(buffer);
    // For small buffers, direct conversion is fine
    if (bytes.length < 8192) {
      return btoa(String.fromCharCode.apply(null, bytes));
    }
    // For large buffers, process in chunks to avoid call stack limits
    const chunks = [];
    for (let i = 0; i < bytes.length; i += 8192) {
      const chunk = bytes.slice(i, i + 8192);
      chunks.push(String.fromCharCode.apply(null, chunk));
    }
    return btoa(chunks.join(''));
  }

  _base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  _randomBytes(length) {
    const array = new Uint8Array(length);
    (window.crypto || window.msCrypto).getRandomValues(array);
    return array;
  }

  generateSalt() {
    return this._arrayBufferToBase64(this._randomBytes(16));
  }

  generateIV(bytes = 12) {
    return this._arrayBufferToBase64(this._randomBytes(bytes));
  }

  async initializeSessionVaultKey(masterKey, userSalt = null) {
    if (!masterKey || typeof masterKey !== 'string') {
      throw new Error('Master key is required');
    }

    // Generate or use provided user salt
    if (!userSalt) {
      userSalt = this.generateSalt();
    }

    // Derive vault key once per session
    this._sessionVaultKey = await this.deriveKey(masterKey, userSalt);
    this._sessionVaultKeySalt = userSalt;
    this._sessionMasterKey = masterKey;

    return userSalt; // Return salt so it can be stored/retrieved
  }

  getOrGenerateUserSalt(userIdentifier) {
    const hash = CryptoJS.SHA256(`securevault-user-salt-${userIdentifier}`).toString();
    // Convert hex hash to bytes and take first 16 bytes
    const bytes = [];
    for (let i = 0; i < 32 && bytes.length < 16; i += 2) {
      bytes.push(parseInt(hash.substring(i, i + 2), 16));
    }
    return this._arrayBufferToBase64(new Uint8Array(bytes).buffer);
  }

  /**
   * Derive a WebCrypto AES-GCM CryptoKey from master key and salt using PBKDF2
   * @param {string} masterKey
   * @param {string} saltBase64
   * @param {number} [iterationsOverride] - Optional override for PBKDF2 iterations (for benchmarking/tuning)
   * @returns {Promise<CryptoKey>}
   */
  async deriveKey(masterKey, saltBase64, iterationsOverride) {
    try {
      // Input validation before expensive operations
      if (!masterKey || typeof masterKey !== 'string') {
        throw new Error('Master key is required and must be a string');
      }
      if (!saltBase64 || typeof saltBase64 !== 'string') {
        throw new Error('Salt is required and must be a string');
      }

      const iters = typeof iterationsOverride === 'number' && iterationsOverride > 0
        ? iterationsOverride
        : this.iterations;

      // Performance optimization: Check if master key changed, clear baseKey cache if so
      if (this._cachedMasterKey !== masterKey) {
        this._baseKeyCache = null;
        this._encodedMasterKeyCache = null;
        this._cachedMasterKey = masterKey;
        // Clear key cache when master key changes (security: old keys invalid)
        this._keyCache.clear();
      }

      let baseKey = this._baseKeyCache;
      if (!baseKey) {
        // Cache encoded master key to avoid re-encoding
        if (!this._encodedMasterKeyCache) {
          this._encodedMasterKeyCache = this._encoder.encode(masterKey);
        }
        baseKey = await (window.crypto.subtle).importKey(
          'raw',
          this._encodedMasterKeyCache,
          'PBKDF2',
          false,
          ['deriveKey']
        );
        this._baseKeyCache = baseKey;
      }

      const keyCacheKey = `${masterKey}|${saltBase64}|${iters}`;
      let derivedKey = this._keyCache.get(keyCacheKey);
      
      if (!derivedKey) {
        const salt = this._base64ToArrayBuffer(saltBase64);
        derivedKey = await (window.crypto.subtle).deriveKey(
          {
            name: 'PBKDF2',
            salt: salt,
            iterations: iters,
            hash: 'SHA-256'
          },
          baseKey,
          {
            name: 'AES-GCM',
            length: this.keySizeBits
          },
          false,
          ['encrypt', 'decrypt']
        );
        
        // Cache the derived key (limit cache size to prevent memory issues)
        if (this._keyCache.size >= 1000) {
          // Simple eviction: clear oldest 50% when limit reached
          const entries = Array.from(this._keyCache.entries());
          this._keyCache.clear();
          entries.slice(-500).forEach(([k, v]) => this._keyCache.set(k, v));
        }
        this._keyCache.set(keyCacheKey, derivedKey);
      }

      return derivedKey;
    } catch (error) {
      console.error('Key derivation error:', error);
      throw new Error('Failed to derive encryption key');
    }
  }

  /**
   * Encrypt a password using AES-256-GCM with authentication
   * Uses session vault key if available (new format), otherwise falls back to per-password salt (old format)
   * @param {string} password - Plain text password to encrypt
   * @param {string} masterKey - User's master key (required if session vault key not initialized)
   * @param {boolean} useLegacyFormat - Force use of legacy per-password salt format
   * @returns {Object} Encrypted data with IV, salt (optional for new format), and auth tag
   */
  async encryptPassword(password, masterKey = null, useLegacyFormat = false) {
    try {
      if (!password || password.trim() === '') {
        throw new Error('Password is required for encryption');
      }

      let key;
      let salt = null;

      if (!useLegacyFormat && this._sessionVaultKey && 
          (masterKey === null || masterKey === undefined || this._sessionMasterKey === masterKey)) {
        key = this._sessionVaultKey;
        salt = this._sessionVaultKeySalt;
      } else {
        // LEGACY FORMAT: Per-password salt (backward compatibility)
        if (!masterKey || masterKey.trim() === '') {
          throw new Error('Master key is required for encryption (or initialize session vault key first)');
        }
        salt = this.generateSalt();
        key = await this.deriveKey(masterKey, salt);
      }

      // IV is always unique per password (required for GCM security)
      const iv = this.generateIV(12);

      const ciphertextBuffer = await (window.crypto.subtle).encrypt(
        { name: 'AES-GCM', iv: this._base64ToArrayBuffer(iv), tagLength: this.tagLengthBits },
        key,
        this._encoder.encode(password)
      );
      
      return {
        encryptedPassword: this._arrayBufferToBase64(ciphertextBuffer),
        iv: iv,
        salt: salt // May be null for new format, but included for compatibility
      };
    } catch (error) {
      console.error('Encryption error:', error.message || error);
      throw new Error(`Failed to encrypt password: ${error.message || 'Unknown error'}`);
    }
  }



  /**
   * Decrypt a password using AES-256-GCM with authentication
   * @param {string} encryptedPassword - Encrypted password
   * @param {string} masterKey - User's master key
   * @param {string} iv - Initialization vector
   * @param {string} salt - Salt used for key derivation
   * @param {string} tag - Authentication tag (optional for backward compatibility)
   * @returns {string} Decrypted password
   */
  decryptPassword(encryptedPassword, masterKey, iv, salt) {
      if (!masterKey || masterKey.trim() === '') {
        throw new Error('Master key is required for decryption');
      }
      if (!encryptedPassword || !iv || !salt) {
        throw new Error('Missing encryption parameters');
      }
    const cacheKey = `${encryptedPassword}|${iv}|${salt}`;
    if (!this._decryptCache.has(cacheKey)) {
      return '*** Decrypting... ***';
    }
    return this._decryptCache.get(cacheKey);
  }

  async decryptPasswordAsync(encryptedPassword, masterKey, iv, salt) {
    let key;
    
    // NEW FORMAT: If salt matches session salt, use session vault key
    if (salt === this._sessionVaultKeySalt && this._sessionVaultKey && this._sessionMasterKey === masterKey) {
      key = this._sessionVaultKey;
    } else if (salt) {
      // LEGACY FORMAT: Per-password salt (backward compatibility)
      key = await this.deriveKey(masterKey, salt);
    } else {
      // No salt provided - try session vault key as fallback
      if (this._sessionVaultKey && this._sessionMasterKey === masterKey) {
        key = this._sessionVaultKey;
      } else {
        throw new Error('Salt is required for decryption (or session vault key must be initialized)');
      }
    }

    const plaintextBuffer = await (window.crypto.subtle).decrypt(
      { name: 'AES-GCM', iv: this._base64ToArrayBuffer(iv), tagLength: this.tagLengthBits },
      key,
      this._base64ToArrayBuffer(encryptedPassword)
    );
    return this._decoder.decode(plaintextBuffer);
  }

  async warmDecryptCache(items, masterKey, concurrency = 10) {
    if (!Array.isArray(items) || !masterKey) return;
    
    // Performance optimization: Process items in parallel with concurrency limit
    const toProcess = [];
    for (const item of items) {
      const { encryptedPassword, iv, salt } = item || {};
      if (!encryptedPassword || !iv || !salt) continue;
      const cacheKey = `${encryptedPassword}|${iv}|${salt}`;
      if (this._decryptCache.has(cacheKey)) continue;
      toProcess.push({ encryptedPassword, iv, salt, cacheKey });
    }

    // Process in batches to limit concurrency
    for (let i = 0; i < toProcess.length; i += concurrency) {
      const batch = toProcess.slice(i, i + concurrency);
      const results = await Promise.allSettled(
        batch.map(async ({ encryptedPassword, iv, salt, cacheKey }) => {
          try {
            const plaintext = await this.decryptPasswordAsync(encryptedPassword, masterKey, iv, salt);
            this._decryptCache.set(cacheKey, plaintext);
          } catch (e) {
            console.warn('Failed to warm decrypt cache for item:', e.message);
          }
        })
      );
      
      // Log failures if any
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        console.warn(`Failed to warm ${failures.length} items in decrypt cache`);
      }
    }
  }

  async validateMasterKey(masterKey, testEncrypted, testIV, testSalt) {
    try {
      // Use async version to avoid cache dependency
      await this.decryptPasswordAsync(testEncrypted, masterKey, testIV, testSalt);
      return true;
    } catch {
      return false;
    }
  }

  generatePassword(length = 16, options = {}) {
    const {
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
      excludeSimilar = true
    } = options;

    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (excludeSimilar) {
      charset = charset.replace(/[0O1Il]/g, '');
    }

    // Performance optimization: Generate random bytes in batches instead of one-by-one
    const charsetLength = charset.length;
    const randomBytes = this._randomBytes(length * 2); // Generate extra for safety
    const passwordChars = [];
    
    for (let i = 0; i < length; i++) {
      // Use modulo to get value in charset range
      passwordChars.push(charset.charAt(randomBytes[i] % charsetLength));
    }

    return passwordChars.join('');
  }

  calculatePasswordStrength(password) {
    let score = 0;
    const feedback = [];

    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (password.length < 8) feedback.push('Password should be at least 8 characters long');
    if (!/[a-z]/.test(password)) feedback.push('Add lowercase letters');
    if (!/[A-Z]/.test(password)) feedback.push('Add uppercase letters');
    if (!/[0-9]/.test(password)) feedback.push('Add numbers');
    if (!/[^A-Za-z0-9]/.test(password)) feedback.push('Add special characters');

    let strength = 'weak';
    if (score >= 6) strength = 'very-strong';
    else if (score >= 5) strength = 'strong';
    else if (score >= 4) strength = 'medium';
    else if (score >= 2) strength = 'weak';

    return {
      score,
      strength,
      feedback,
      maxScore: 7
    };
  }

  hashString(input) {
    if (!input || typeof input !== 'string') {
      throw new Error('Input is required and must be a string');
    }
    return CryptoJS.SHA256(input).toString();
  }

  generateRandomString(length = 32) {
    return this._arrayBufferToBase64(this._randomBytes(length));
  }

  /**
   * Clear all caches (should be called on logout for security)
   */
  clearCache() {
    this._decryptCache.clear();
    this._keyCache.clear();
    this._baseKeyCache = null;
    this._cachedMasterKey = null;
    this._encodedMasterKeyCache = null;
    // Clear session vault key
    this._sessionVaultKey = null;
    this._sessionVaultKeySalt = null;
    this._sessionMasterKey = null;
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats() {
    return {
      decryptCacheSize: this._decryptCache.size,
      keyCacheSize: this._keyCache.size,
      hasBaseKeyCache: this._baseKeyCache !== null,
      hasEncodedMasterKeyCache: this._encodedMasterKeyCache !== null
    };
  }
}

// Performance optimization: Cache breach check results
const _breachCache = new Map(); // Cache: password hash -> breach count
const _breachCacheMaxSize = 1000; // Limit cache size

/**
 * Check if a password has been breached using HaveIBeenPwned API
 * @param {string} password - The password to check
 * @returns {Promise<number>} - Number of times the password was found in breaches
 */
async function checkPasswordBreach(password) {
  if (!password || typeof password !== 'string') {
    return 0;
  }

  // Performance optimization: Cache breach results to avoid redundant API calls
  const sha1 = CryptoJS.SHA1(password).toString().toUpperCase();
  
  // Check cache first
  if (_breachCache.has(sha1)) {
    return _breachCache.get(sha1);
  }

  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);
  const url = `https://api.pwnedpasswords.com/range/${prefix}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      _breachCache.set(sha1, 0);
      return 0;
    }
    const text = await res.text();
    const lines = text.split('\n');
    let breachCount = 0;
    for (const line of lines) {
      const [hashSuffix, count] = line.trim().split(':');
      if (hashSuffix === suffix) {
        breachCount = parseInt(count, 10);
        break;
      }
    }
    
    // Cache the result (with size limit)
    if (_breachCache.size >= _breachCacheMaxSize) {
      // Simple eviction: clear oldest 50%
      const entries = Array.from(_breachCache.entries());
      _breachCache.clear();
      entries.slice(-Math.floor(_breachCacheMaxSize / 2)).forEach(([k, v]) => _breachCache.set(k, v));
    }
    _breachCache.set(sha1, breachCount);
    
    return breachCount;
  } catch (e) {
    console.error('HIBP breach check failed:', e.message);
    _breachCache.set(sha1, 0); // Cache failure as 0 to avoid retrying immediately
    return 0;
  }
}

const vaultCrypt = new VaultCrypt();

export default vaultCrypt;
export { checkPasswordBreach };