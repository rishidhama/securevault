// API configuration - supports both development and production
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
    throw new Error(errorData.error || `API request failed: ${response.status}`);
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
  })
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
  getAll: () => apiRequest('/api/credentials'),
  
  getCredentials: () => apiRequest('/api/credentials'),
  
  getStats: () => apiRequest('/api/credentials/stats/overview'),
  
  getCategories: () => apiRequest('/api/credentials/categories/list'),
  
  create: (credential) => apiRequest('/api/credentials', {
    method: 'POST',
    body: JSON.stringify(credential)
  }),
  
  createCredential: (credential) => apiRequest('/api/credentials', {
    method: 'POST',
    body: JSON.stringify(credential)
  }),
  
  update: (id, credential) => apiRequest(`/api/credentials/${id}`, {
    method: 'PUT',
    body: JSON.stringify(credential)
  }),
  
  updateCredential: (id, credential) => apiRequest(`/api/credentials/${id}`, {
    method: 'PUT',
    body: JSON.stringify(credential)
  }),
  
  delete: (id) => apiRequest(`/api/credentials/${id}`, {
    method: 'DELETE'
  }),
  
  deleteCredential: (id) => apiRequest(`/api/credentials/${id}`, {
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

export default {
  auth: authAPI,
  mfa: mfaAPI,
  credentials: credentialsAPI
}; 