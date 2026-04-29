const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : 'http://localhost:5000');

export const apiRequest = async (endpoint, options = {}) => {
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  
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
    const errorMessage = errorData.error || errorData.message || `API request failed: ${response.status}`;
    
    if (response.status === 401) {
      throw new Error(token ? `Authentication required: ${errorMessage}` : `Please log in to access this resource: ${errorMessage}`);
    }
    if (response.status === 403) throw new Error(`Access denied: ${errorMessage}`);
    if (response.status === 503) throw new Error(`Service unavailable: ${errorMessage}`);
    
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  return data;
};

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
  
  changeMasterKey: (currentAuthSecret, newAuthSecret) =>
    apiRequest('/api/auth/change-master-key', {
    method: 'POST',
      body: JSON.stringify({ currentAuthSecret, newAuthSecret })
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

export const credentialsAPI = {
  list: (options = {}) => {
    // Support pagination: { page, limit } or { getAll: true } for backward compatibility
    const params = new URLSearchParams();
    if (options.getAll) {
      params.append('getAll', 'true');
    } else {
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);
    }
    // Preserve other query params
    if (options.search) params.append('search', options.search);
    if (options.category) params.append('category', options.category);
    if (options.favorite) params.append('favorite', options.favorite);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    
    const queryString = params.toString();
    return apiRequest(`/api/credentials${queryString ? `?${queryString}` : ''}`);
  },
  
  // Helper method to get all credentials (backward compatibility)
  listAll: () => apiRequest('/api/credentials?getAll=true'),
  
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

export const billingAPI = {
  status: () => apiRequest('/api/billing/status'),
  checkout: (priceId) => apiRequest('/api/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ priceId })
  }),
  portal: () => apiRequest('/api/billing/portal', { method: 'POST' })
};

export const blockchainAPI = {
  status: () => apiRequest('/api/blockchain/status'),
  stats: () => apiRequest('/api/blockchain/stats'),
  storeVault: (userId, payload) => apiRequest('/api/blockchain/store-vault', {
    method: 'POST',
    body: JSON.stringify({ userId, ...payload })
  }),
  getVault: (userId) => apiRequest(`/api/blockchain/vault/${encodeURIComponent(userId)}`),
  history: (userId) => apiRequest(`/api/blockchain/history/${encodeURIComponent(userId)}`),
  activity: (userId) => apiRequest(`/api/blockchain/activity/${encodeURIComponent(userId)}`),
  operations: (userId) => apiRequest(`/api/blockchain/operations/${encodeURIComponent(userId)}`),
  flushMyBatchQueue: () => apiRequest('/api/blockchain/batch/flush', {
    method: 'POST',
    body: JSON.stringify({})
  }),
  verify: (userId, payload) => apiRequest('/api/blockchain/verify', {
    method: 'POST',
    body: JSON.stringify({ userId, ...payload })
  })
};

export const importExportAPI = {
  import: (credentials, overwrite = false) => apiRequest('/api/import-export/import', {
    method: 'POST',
    body: JSON.stringify({ credentials, overwrite })
  }),
  
  export: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/import-export/export${queryString ? `?${queryString}` : ''}`);
  },
  
  validate: (credentials) => apiRequest('/api/import-export/validate', {
    method: 'POST',
    body: JSON.stringify({ credentials })
  }),
  
  stats: () => apiRequest('/api/import-export/stats')
};

export default {
  auth: authAPI,
  mfa: mfaAPI,
  credentials: credentialsAPI,
  billing: billingAPI,
  blockchain: blockchainAPI,
  importExport: importExportAPI
}; 