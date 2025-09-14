// VaultAPI - Centralized API client for SecureVault backend
// Handles authentication, error management, and request routing
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : 'http://localhost:5000');

// Helper function to make API requests
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get JWT token from localStorage for authenticated requests
  const token = localStorage.getItem('securevault_token');
  
  const defaultOptions = {
  headers: {
    'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    }
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || `API request failed: ${response.status}`;
    
    // Add more context for authentication errors
    if (response.status === 401) {
      throw new Error(`Authentication required: ${errorMessage}`);
    } else if (response.status === 403) {
      throw new Error(`Access denied: ${errorMessage}`);
    } else if (response.status === 503) {
      throw new Error(`Service unavailable: ${errorMessage}`);
    }
    
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  return data;
};

// Auth API endpoints
export const authAPI = {
  login: (credentials) => apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  
  register: (userData) => apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  
  profile: () => apiRequest('/api/auth/profile'),
  
  changeMasterKey: (currentMasterKey, newMasterKey) => apiRequest('/api/auth/change-master-key', {
    method: 'POST',
    body: JSON.stringify({ currentMasterKey, newMasterKey })
  }),
  
  deleteAccount: () => apiRequest('/api/auth/delete-account', {
    method: 'DELETE'
  }),
  
  enableBiometric: (credentialData) => apiRequest('/api/auth/enable-biometric', {
    method: 'POST',
    body: JSON.stringify({ credentialData })
  }),
  
  biometricChallenge: (email) => apiRequest('/api/auth/biometric-challenge', {
    method: 'POST',
    body: JSON.stringify({ email })
  }),
  
  biometricLogin: (data) => apiRequest('/api/auth/biometric-login', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  logout: () => apiRequest('/api/auth/logout', {
    method: 'POST'
  }),
  preferences: {
    get: () => apiRequest('/api/auth/preferences'),
    update: (preferences) => apiRequest('/api/auth/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences)
    })
  }
};

// MFA API endpoints
export const mfaAPI = {
  setup: () => apiRequest('/api/mfa/setup', {
    method: 'POST'
  }),
  
  verifySetup: (token) => apiRequest('/api/mfa/verify-setup', {
    method: 'POST',
    body: JSON.stringify({ token })
  }),
  
  verify: (data) => apiRequest('/api/mfa/verify', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  disable: (token) => apiRequest('/api/mfa/disable', {
    method: 'POST',
    body: JSON.stringify({ token })
  }),
  
  status: () => apiRequest('/api/mfa/status'),
  
  generateBackupCodes: (token) => apiRequest('/api/mfa/generate-backup-codes', {
    method: 'POST',
    body: JSON.stringify({ token })
  }),
  
  regenerateBackupCodes: (token) => apiRequest('/api/mfa/regenerate-backup-codes', {
    method: 'POST',
    body: JSON.stringify({ token })
  })
};

// Credentials API endpoints
export const credentialsAPI = {
  list: () => apiRequest('/api/credentials'),
  
  stats: () => apiRequest('/api/credentials/stats/overview'),
  
  categories: () => apiRequest('/api/credentials/categories/list'),
  
  create: (credential) => apiRequest('/api/credentials', {
    method: 'POST',
    body: JSON.stringify(credential)
  }),
  
  update: (id, credential) => apiRequest(`/api/credentials/${id}`, {
    method: 'PUT',
    body: JSON.stringify(credential)
  }),
  
  remove: (id) => apiRequest(`/api/credentials/${id}`, {
    method: 'DELETE'
  }),
  
  toggleFavorite: (id) => apiRequest(`/api/credentials/${id}/favorite`, {
    method: 'PATCH'
  }),
  
  updateCategory: (id, category) => apiRequest(`/api/credentials/${id}/category`, {
    method: 'PATCH',
    body: JSON.stringify({ category })
  })
};

// Billing API endpoints
export const billingAPI = {
  status: () => apiRequest('/api/billing/status'),
  checkout: (priceId) => apiRequest('/api/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ priceId })
  }),
  portal: () => apiRequest('/api/billing/portal', { method: 'POST' })
};

// Blockchain API endpoints (Sepolia)
export const blockchainAPI = {
  status: () => apiRequest('/api/blockchain/status'),
  storeVault: (userId, vaultData) => apiRequest('/api/blockchain/store-vault', {
    method: 'POST',
    body: JSON.stringify({ userId, vaultData })
  }),
  getVault: (userId) => apiRequest(`/api/blockchain/vault/${encodeURIComponent(userId)}`),
  history: (userId) => apiRequest(`/api/blockchain/history/${encodeURIComponent(userId)}`),
  activity: (userId) => apiRequest(`/api/blockchain/activity/${encodeURIComponent(userId)}`),
  verify: (userId, vaultData) => apiRequest('/api/blockchain/verify', {
    method: 'POST',
    body: JSON.stringify({ userId, vaultData })
  })
};

// Legacy integrity API removed - now using blockchain API

export default {
  auth: authAPI,
  mfa: mfaAPI,
  credentials: credentialsAPI,
  billing: billingAPI,
  blockchain: blockchainAPI
}; 