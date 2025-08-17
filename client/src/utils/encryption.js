import CryptoJS from 'crypto-js';

/**
 * SecureVault Encryption Utilities
 * Handles client-side AES encryption/decryption using user's master key
 * Never sends the master key to the server - Zero-Knowledge Architecture
 */

class EncryptionService {
  constructor() {
    this.algorithm = 'AES-256-CBC';
    this.keySize = 256;
    this.iterations = 1000;
  }



  /**
   * Generate a random salt for key derivation
   * @returns {string} Base64 encoded salt
   */
  generateSalt() {
    try {
      const wordArray = CryptoJS.lib.WordArray.random(128/8);
      return wordArray.toString(CryptoJS.enc.Base64);
    } catch (error) {
      console.error('Salt generation error:', error);
      throw new Error('Failed to generate salt');
    }
  }

  /**
   * Generate a random initialization vector
   * @returns {string} Base64 encoded IV
   */
  generateIV() {
    try {
      const wordArray = CryptoJS.lib.WordArray.random(128/8);
      return wordArray.toString(CryptoJS.enc.Base64);
    } catch (error) {
      console.error('IV generation error:', error);
      throw new Error('Failed to generate IV');
    }
  }

  /**
   * Derive encryption key from master key and salt using PBKDF2
   * @param {string} masterKey - User's master key
   * @param {string} salt - Salt for key derivation
   * @returns {CryptoJS.lib.WordArray} Derived key
   */
  deriveKey(masterKey, salt) {
    try {
      // Ensure salt is properly formatted as WordArray
      const saltWordArray = CryptoJS.enc.Base64.parse(salt);
      
      const key = CryptoJS.PBKDF2(masterKey, saltWordArray, {
        keySize: this.keySize / 32,
        iterations: this.iterations
      });
      
      return key;
    } catch (error) {
      console.error('Key derivation error:', error);
      throw new Error('Failed to derive encryption key');
    }
  }

  /**
   * Encrypt a password using AES-256-CBC
   * @param {string} password - Plain text password to encrypt
   * @param {string} masterKey - User's master key
   * @returns {Object} Encrypted data with IV and salt
   */
  encryptPassword(password, masterKey) {
    try {
      // Validate inputs
      if (!password || password.trim() === '') {
        throw new Error('Password is required for encryption');
      }
      
      if (!masterKey || masterKey.trim() === '') {
        throw new Error('Master key is required for encryption');
      }

      // Generate salt and IV
      const salt = this.generateSalt();
      const iv = this.generateIV();
      
      // Validate generated values
      if (!salt || !iv) {
        throw new Error('Failed to generate salt or IV');
      }
      
      // Derive key from master key and salt
      const key = this.deriveKey(masterKey, salt);
      
      // Validate derived key
      if (!key || !key.sigBytes) {
        throw new Error('Failed to derive encryption key');
      }
      
      // Encrypt the password
      const encrypted = CryptoJS.AES.encrypt(password, key, {
        iv: CryptoJS.enc.Base64.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      return {
        encryptedPassword: encrypted.toString(),
        iv: iv,
        salt: salt
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error(`Failed to encrypt password: ${error.message}`);
    }
  }



  /**
   * Decrypt a password using AES-256-CBC
   * @param {string} encryptedPassword - Encrypted password
   * @param {string} masterKey - User's master key
   * @param {string} iv - Initialization vector
   * @param {string} salt - Salt used for key derivation
   * @returns {string} Decrypted password
   */
  decryptPassword(encryptedPassword, masterKey, iv, salt) {
    try {
      // Validate inputs
      if (!masterKey || masterKey.trim() === '') {
        throw new Error('Master key is required for decryption');
      }
      
      if (!encryptedPassword || !iv || !salt) {
        throw new Error('Missing encryption parameters');
      }

      // Derive key from master key and salt
      const key = this.deriveKey(masterKey, salt);
      
      // Decrypt the password
      const decrypted = CryptoJS.AES.decrypt(encryptedPassword, key, {
        iv: CryptoJS.enc.Base64.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      const result = decrypted.toString(CryptoJS.enc.Utf8);
      
      // Validate decryption result
      if (!result || result.trim() === '') {
        throw new Error('Decryption resulted in empty string - possible master key mismatch');
      }
      
      return result;
    } catch (error) {
      console.error('Decryption error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('Master key is required')) {
        throw new Error('Master key is required for decryption');
      } else if (error.message.includes('Missing encryption parameters')) {
        throw new Error('Missing encryption parameters');
      } else if (error.message.includes('empty string')) {
        throw new Error('Failed to decrypt password. Check your master key.');
      } else {
        throw new Error('Failed to decrypt password. Check your master key.');
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
      password += charset.charAt(Math.floor(Math.random() * charset.length));
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
    return CryptoJS.lib.WordArray.random(length).toString();
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
    console.error('HIBP breach check failed:', e);
    return 0;
  }
}

// Create singleton instance
const encryptionService = new EncryptionService();

export default encryptionService;
export { checkPasswordBreach }; 