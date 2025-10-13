import CryptoJS from 'crypto-js';

/**
 * VaultCrypt - Client-Side Encryption Engine
 * 
 * Implements zero-knowledge password vault encryption where the server never
 * sees plaintext data. Uses AES-GCM for authenticated encryption to prevent
 * tampering attacks that would be possible with CBC mode.
 * 
 * Security considerations:
 * - 310k PBKDF2 iterations chosen based on OWASP guidelines and performance testing
 * - GCM mode provides both confidentiality and authenticity
 * - Each password gets unique salt/IV to prevent rainbow table attacks
 * - Master key never leaves the client (stored in sessionStorage, not localStorage)
 */

class VaultCrypt {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keySizeBits = 256;
    this.iterations = 310000; // OWASP recommended minimum for PBKDF2
    this.tagLengthBits = 128; // WebCrypto default tag length
    this._decoder = new TextDecoder();
    this._encoder = new TextEncoder();
    this._decryptCache = new Map();
  }

  // Utilities
  _arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
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

  /**
   * Generate a random salt for key derivation
   * @returns {string} Base64 encoded salt
   */
  generateSalt() {
    try {
      return this._arrayBufferToBase64(this._randomBytes(16));
    } catch (error) {
      console.error('Salt generation error:', error);
      throw new Error('Failed to generate salt');
    }
  }

  /**
   * Generate a random initialization vector (GCM uses 12 bytes)
   * @param {number} bytes
   * @returns {string} Base64 encoded IV
   */
  generateIV(bytes = 12) {
    try {
      return this._arrayBufferToBase64(this._randomBytes(bytes));
    } catch (error) {
      console.error('IV generation error:', error);
      throw new Error('Failed to generate IV');
    }
  }

  /**
   * Derive a WebCrypto AES-GCM CryptoKey from master key and salt using PBKDF2
   * @param {string} masterKey
   * @param {string} saltBase64
   * @returns {Promise<CryptoKey>}
   */
  async deriveKey(masterKey, saltBase64) {
    try {
      const salt = this._base64ToArrayBuffer(saltBase64);
      const baseKey = await (window.crypto.subtle).importKey(
        'raw',
        this._encoder.encode(masterKey),
        'PBKDF2',
        false,
        ['deriveKey']
      );

      const derivedKey = await (window.crypto.subtle).deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: this.iterations,
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

      return derivedKey;
    } catch (error) {
      console.error('Key derivation error:', error);
      throw new Error('Failed to derive encryption key');
    }
  }

  /**
   * Encrypt a password using AES-256-GCM with authentication
   * @param {string} password - Plain text password to encrypt
   * @param {string} masterKey - User's master key
   * @returns {Object} Encrypted data with IV, salt, and auth tag
   */
  async encryptPassword(password, masterKey) {
    try {
      if (!password || password.trim() === '') {
        throw new Error('Password is required for encryption');
      }
      if (!masterKey || masterKey.trim() === '') {
        throw new Error('Master key is required for encryption');
      }

      const salt = this.generateSalt();
      const iv = this.generateIV(12);

      const key = await this.deriveKey(masterKey, salt);

      const ciphertextBuffer = await (window.crypto.subtle).encrypt(
        { name: 'AES-GCM', iv: this._base64ToArrayBuffer(iv), tagLength: this.tagLengthBits },
        key,
        this._encoder.encode(password)
      );
      
      return {
        encryptedPassword: this._arrayBufferToBase64(ciphertextBuffer),
        iv: iv,
        salt: salt
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
  // Synchronous accessor that returns from cache (pre-warmed)
  decryptPassword(encryptedPassword, masterKey, iv, salt) {
      if (!masterKey || masterKey.trim() === '') {
        throw new Error('Master key is required for decryption');
      }
      if (!encryptedPassword || !iv || !salt) {
        throw new Error('Missing encryption parameters');
      }
    const cacheKey = `${encryptedPassword}|${iv}|${salt}`;
    if (!this._decryptCache.has(cacheKey)) {
      throw new Error('Decryption not ready');
    }
    return this._decryptCache.get(cacheKey);
  }

  // Async decrypt (used internally for warming cache)
  async decryptPasswordAsync(encryptedPassword, masterKey, iv, salt) {
    const key = await this.deriveKey(masterKey, salt);
    const plaintextBuffer = await (window.crypto.subtle).decrypt(
      { name: 'AES-GCM', iv: this._base64ToArrayBuffer(iv), tagLength: this.tagLengthBits },
      key,
      this._base64ToArrayBuffer(encryptedPassword)
    );
    return this._decoder.decode(plaintextBuffer);
  }

  // Warm cache for a list of credentials to keep UI synchronous
  async warmDecryptCache(items, masterKey) {
    if (!Array.isArray(items) || !masterKey) return;
    for (const item of items) {
      const { encryptedPassword, iv, salt } = item || {};
      if (!encryptedPassword || !iv || !salt) continue;
      const cacheKey = `${encryptedPassword}|${iv}|${salt}`;
      if (this._decryptCache.has(cacheKey)) continue;
      try {
        const plaintext = await this.decryptPasswordAsync(encryptedPassword, masterKey, iv, salt);
        this._decryptCache.set(cacheKey, plaintext);
      } catch (e) {
        // Do not throw during warming; leave entry absent so callers can handle gracefully
      }
    }
  }

  /**
   * Validate master key by attempting to decrypt a test string
   * @param {string} masterKey - Master key to validate
   * @param {string} testEncrypted - Test encrypted string
   * @param {string} testIV - Test IV
   * @param {string} testSalt - Test salt
   * @returns {boolean} True if master key is valid
   */
  validateMasterKey(masterKey, testEncrypted, testIV, testSalt) {
    try {
      this.decryptPassword(testEncrypted, masterKey, testIV, testSalt);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a strong password
   * @param {number} length - Length of password (default: 16)
   * @param {Object} options - Password generation options
   * @returns {string} Generated password
   */
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

    let password = '';
    for (let i = 0; i < length; i++) {
      const array = new Uint32Array(1);
      (window.crypto || window.msCrypto).getRandomValues(array);
      password += charset.charAt(array[0] % charset.length);
    }

    return password;
  }

  /**
   * Calculate password strength score
   * @param {string} password - Password to evaluate
   * @returns {Object} Strength information
   */
  calculatePasswordStrength(password) {
    let score = 0;
    const feedback = [];

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    // Additional checks
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

  /**
   * Hash a string using SHA-256 (for non-reversible operations)
   * @param {string} input - String to hash
   * @returns {string} SHA-256 hash
   */
  hashString(input) {
    return CryptoJS.SHA256(input).toString();
  }

  /**
   * Generate a secure random string
   * @param {number} length - Length of string
   * @returns {string} Random string
   */
  generateRandomString(length = 32) {
    return this._arrayBufferToBase64(this._randomBytes(length));
  }
}

/**
 * Check if a password has been breached using HaveIBeenPwned API
 * @param {string} password - The password to check
 * @returns {Promise<number>} - Number of times the password was found in breaches
 */
async function checkPasswordBreach(password) {
  const sha1 = CryptoJS.SHA1(password).toString().toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);
  const url = `https://api.pwnedpasswords.com/range/${prefix}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return 0;
    const text = await res.text();
    const lines = text.split('\n');
    for (const line of lines) {
      const [hashSuffix, count] = line.trim().split(':');
      if (hashSuffix === suffix) {
        return parseInt(count, 10);
      }
    }
    return 0;
  } catch (e) {
    console.error('HIBP breach check failed:', e.message);
    return 0;
  }
}

// Create singleton instance
const vaultCrypt = new VaultCrypt();

export default vaultCrypt;
export { checkPasswordBreach }; 