import CryptoJS from 'crypto-js';

/**
 * Derive an authentication secret from email + master key.
 * This value is sent to the server instead of the raw master key.
 * The server stores a bcrypt hash of this secret and never sees the master key.
 *
 * @param {string} email - User email
 * @param {string} masterKey - User master key (kept client-side)
 * @returns {string} hex-encoded SHA-256 auth secret
 */
export function deriveAuthSecret(email, masterKey) {
  if (!email || typeof email !== 'string') {
    throw new Error('Email is required to derive auth secret');
  }
  if (!masterKey || typeof masterKey !== 'string') {
    throw new Error('Master key is required to derive auth secret');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const input = `auth:${normalizedEmail}:${masterKey}`;
  return CryptoJS.SHA256(input).toString();
}


