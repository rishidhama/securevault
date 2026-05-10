import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { Shield, Lock, LogOut } from 'lucide-react';

import Dashboard from './components/Dashboard';
import AddCredential from './components/AddCredential';
import Vault from './components/Vault';
import SettingsPage from './components/SettingsPage';
import MasterKeyModal from './components/MasterKeyModal';
import LoadingSpinner from './components/LoadingSpinner';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Landing from './components/Landing';
import LoginEmail from './components/LoginEmail';
import LoginMasterKey from './components/LoginMasterKey';
import LoginMFA from './components/LoginMFA';
import Signup from './components/Signup';
import BiometricAuth from './components/BiometricAuth';
import BackupCodesManager from './components/BackupCodesManager';
import BreachMonitor from './components/BreachMonitor';
import SmartCategories from './components/SmartCategories';
import BenchmarkRunner from './components/BenchmarkRunner';

import { credentialsAPI, blockchainAPI } from './services/api';
import encryptionService from './utils/encryption';
import { authAPI } from './services/api';
import IncrementalMerkleTree from './utils/incremental-merkle';

import './index.css';

const EMPTY_VAULT_ROOT = '0'.repeat(64);
const INITIAL_CREDENTIALS_LIMIT = 100;
const INITIAL_DECRYPT_WARM_COUNT = 20;

const runAfterFirstPaint = (fn) => {
  setTimeout(() => {
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => fn());
      return;
    }
    fn();
  }, 0);
};

const runInIdle = (fn) => {
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(fn, { timeout: 1500 });
    return;
  }
  setTimeout(fn, 0);
};

function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);
  return (
    <nav className="text-sm text-secondary-500 mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2">
        <li><Link to="/" className="hover:underline">Home</Link></li>
        {pathnames.map((name, idx) => {
          const routeTo = '/' + pathnames.slice(0, idx + 1).join('/');
          return (
            <li key={routeTo} className="flex items-center gap-2">
              <span>/</span>
              <Link to={routeTo} className="hover:underline capitalize">{name.replace(/-/g, ' ')}</Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [masterKey, setMasterKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialAuthCheck, setIsInitialAuthCheck] = useState(true);
  const [credentials, setCredentials] = useState([]);
  const [stats, setStats] = useState({ total: 0, favorites: 0, categories: 0 });
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(INITIAL_CREDENTIALS_LIMIT);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: INITIAL_CREDENTIALS_LIMIT,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [merkleTree] = useState(() => new IncrementalMerkleTree());

  const warmDecryptCacheIncremental = async (creds, key) => {
    if (!key || !Array.isArray(creds) || creds.length === 0) return;

    const firstChunk = creds.slice(0, INITIAL_DECRYPT_WARM_COUNT);
    const remainder = creds.slice(INITIAL_DECRYPT_WARM_COUNT);

    try {
      await encryptionService.warmDecryptCache(firstChunk, key);
    } catch {
      // Non-blocking: keep UI responsive even if initial warm fails.
    }

    if (!remainder.length) return;
    runInIdle(() => {
      encryptionService.warmDecryptCache(remainder, key).catch(() => {});
    });
  };

  useEffect(() => {
    checkAuthStatus();
    initializeTheme();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);


  // Idle-timeout: clear master key and logout after inactivity
  useEffect(() => {
    const IDLE_TIMEOUT_MINUTES = 30; // adjust as needed
    const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;
    let idleTimer = null;

    const resetTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        clearAuthData();
      }, IDLE_TIMEOUT_MS);
    };

    const activityEvents = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart', 'visibilitychange'];
    activityEvents.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));

    resetTimer();

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      activityEvents.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, []);

  const initializeTheme = () => {
    const savedTheme = localStorage.getItem('securevault_theme') || 'light';
    const root = document.documentElement;
    
    root.classList.remove('theme-light', 'theme-dark', 'theme-system');
    
    if (savedTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(`theme-${systemTheme}`);
    } else {
      root.classList.add(`theme-${savedTheme}`);
    }
    
    const savedFontSize = localStorage.getItem('securevault_font_size') || 'medium';
    const savedCompactMode = localStorage.getItem('securevault_compact_mode') === 'true';
    
    root.classList.remove('text-size-small', 'text-size-medium', 'text-size-large');
    root.classList.add(`text-size-${savedFontSize}`);
    
    if (savedCompactMode) {
      root.classList.add('compact-mode');
    }
  };

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('securevault_token');
      const storedUser = localStorage.getItem('securevault_user');
      const storedMasterKey = sessionStorage.getItem('securevault_master_key');

      // If no session exists, user needs to login (master key will be entered during login)
      if (!token || !storedUser) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await authAPI.profile();

        if (response.success) {
          setUser(response.data.user);
          if (storedMasterKey) {
            setMasterKey(storedMasterKey);
          }
          setIsAuthenticated(true);
        } else {
          clearAuthData();
        }
      } catch (error) {
        if (error.message && error.message.includes('Authentication required')) {
          clearAuthData();
        } else {
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      setIsInitialAuthCheck(false);
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('securevault_token');
    localStorage.removeItem('securevault_user');
    sessionStorage.removeItem('securevault_master_key');
    localStorage.removeItem('temp_auth');
    setUser(null);
    setMasterKey('');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedCategory, showFavorites, pageSize, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadData(currentPage, { allowInitialLoading: isInitialAuthCheck });
  }, [isAuthenticated, currentPage, pageSize, debouncedSearchTerm, selectedCategory, showFavorites]);

  // Keep decrypt cache warm whenever we have both masterKey + credentials.
  // This prevents "Decryption not ready" during rerenders (e.g. toggling favorites).
  useEffect(() => {
    if (!masterKey || !Array.isArray(credentials) || credentials.length === 0) return;
    warmDecryptCacheIncremental(credentials, masterKey).catch(() => {});
  }, [masterKey, credentials]);

  const loadData = async (targetPage = 1, opts = {}) => {
    const { allowInitialLoading = false } = opts;
    try {
      if (allowInitialLoading) {
        setIsLoading(true);
      } else {
        setIsPageLoading(true);
      }
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Data loading timeout')), 10000)
      );
      
      const dataPromise = credentialsAPI.list({
        page: targetPage,
        limit: pageSize,
        includeTotal: 'true',
        ...(debouncedSearchTerm ? { search: debouncedSearchTerm } : {}),
        ...(selectedCategory !== 'all' ? { category: selectedCategory } : {}),
        ...(showFavorites ? { favorite: 'true' } : {})
      });
      const statsPromise = credentialsAPI.stats().catch(() => null);
      const categoriesPromise = credentialsAPI.categories().catch(() => null);

      const credentialsResponse = await Promise.race([
        dataPromise,
        timeoutPromise
      ]);

      const creds = credentialsResponse.data || credentialsResponse || [];
      setCredentials(creds);
      const responsePagination = credentialsResponse.pagination || {};
      setPagination({
        page: responsePagination.page || targetPage,
        limit: responsePagination.limit || pageSize,
        total: typeof responsePagination.total === 'number' ? responsePagination.total : creds.length,
        totalPages: responsePagination.totalPages || 1,
        hasNextPage: !!responsePagination.hasNextPage,
        hasPrevPage: !!responsePagination.hasPrevPage
      });
      const derivedTotal = typeof responsePagination.total === 'number' ? responsePagination.total : creds.length;
      const isUnfilteredBaseView = !debouncedSearchTerm && selectedCategory === 'all' && !showFavorites;
      const hasCompleteCredentialSet = isUnfilteredBaseView && derivedTotal <= creds.length;
      setStats((prev) => ({
        ...prev,
        total: derivedTotal,
        ...(hasCompleteCredentialSet
          ? {
              favorites: creds.filter((cred) => !!cred.isFavorite).length,
              categories: new Set(creds.map((cred) => cred.category).filter(Boolean)).size
            }
          : {})
      }));
      if (hasCompleteCredentialSet) {
        setCategories(Array.from(new Set(creds.map((cred) => cred.category).filter(Boolean))));
      }

      statsPromise.then((statsResponse) => {
        if (!statsResponse) return;
        setStats(statsResponse.data || statsResponse || { total: derivedTotal, favorites: 0, categories: 0 });
      });
      categoriesPromise.then((categoriesResponse) => {
        if (!categoriesResponse) return;
        setCategories(categoriesResponse.data || categoriesResponse || []);
      });

      runAfterFirstPaint(() => {
        if (creds.length > 0) {
          merkleTree.initFromCredentials(creds).catch(() => {
            // Non-blocking: local tree sync failure should not delay dashboard paint.
          });
          return;
        }
        merkleTree.clear();
      });

      if (masterKey) {
        warmDecryptCacheIncremental(creds, masterKey).catch(() => {});
      }
    } catch (error) {
      setCredentials([]);
      setStats({ total: 0, favorites: 0, categories: 0 });
      setCategories([]);
      setPagination({
        page: 1,
        limit: pageSize,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      });
    } finally {
      setIsLoading(false);
      setIsPageLoading(false);
      setIsInitialAuthCheck(false);
    }
  };

  const handleLoginSuccess = async (authData) => {
    try {
      if (authData.token) {
        localStorage.setItem('securevault_token', authData.token);
      }
      if (authData.user) {
        localStorage.setItem('securevault_user', JSON.stringify(authData.user));
      }
      
      setUser(authData.user);
      const masterKey = authData.masterKey || '';
      setMasterKey(masterKey);
      setIsAuthenticated(true);
      
      // Performance optimization: Initialize session vault key once per login
      // This derives the key from masterKey + userSalt using PBKDF2 ONCE
      // All subsequent encryptions use this pre-derived key (no PBKDF2 needed!)
      if (masterKey && authData.user) {
        try {
          const userIdentifier = authData.user.email || authData.user.id;
          const userSalt = encryptionService.getOrGenerateUserSalt(userIdentifier);
          await encryptionService.initializeSessionVaultKey(masterKey, userSalt);
        } catch {
          // Non-blocking: session vault key initialization may fail (e.g. legacy data). Continue with login UX.
        }
      }
      
      const profilePromise = authAPI.profile();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      );
      
      try {
        const profileResponse = await Promise.race([profilePromise, timeoutPromise]);
        if (profileResponse && profileResponse.success && profileResponse.data.user) {
          const fullUserData = { ...authData.user, ...profileResponse.data.user };
          setUser(fullUserData);
          localStorage.setItem('securevault_user', JSON.stringify(fullUserData));
        }
      } catch (error) {
        // If profile fetch fails or times out, continue with login data
      }
    } catch (error) {
      setUser(authData.user);
      setMasterKey(authData.masterKey || '');
      setIsAuthenticated(true);
    }
  };

  const handleSignupSuccess = async (authData) => {
    setUser(authData.user);
    const masterKey = authData.masterKey || '';
    setMasterKey(masterKey);
    setIsAuthenticated(true);
    
    // Initialize session vault key for new users too
    if (masterKey && authData.user) {
      try {
        const userIdentifier = authData.user.email || authData.user.id;
        const userSalt = encryptionService.getOrGenerateUserSalt(userIdentifier);
        await encryptionService.initializeSessionVaultKey(masterKey, userSalt);
      } catch {
        // Non-blocking: session vault key initialization should not break login UX.
      }
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('securevault_token');
      if (token) {
        await authAPI.logout();
      }
    } catch {
      // Non-blocking: logout should still clear local/session data even if the request fails.
    } finally {
      // Clear encryption caches for security
      encryptionService.clearCache();
      clearAuthData();
      setCredentials([]);
      setStats({ total: 0, favorites: 0, categories: 0 });
      setCategories([]);
      setSearchTerm('');
      setSelectedCategory('all');
      setShowFavorites(false);
      setCurrentPage(1);
      setPageSize(INITIAL_CREDENTIALS_LIMIT);
      setPagination({
        page: 1,
        limit: INITIAL_CREDENTIALS_LIMIT,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      });
      merkleTree.clear();
    }
  };

  const handleAddCredential = async (credentialData) => {
    try {
      let newCredential = { ...credentialData };

      // Only encrypt if password is present and not already encrypted
      if (credentialData.password && !credentialData.encryptedPassword) {
        const encryptedData = await encryptionService.encryptPassword(
          credentialData.password,
          masterKey
        );

        newCredential = {
          ...credentialData,
          encryptedPassword: encryptedData.encryptedPassword,
          iv: encryptedData.iv,
          salt: encryptedData.salt
        };

        delete newCredential.password;
      } else if (credentialData.password) {
        delete newCredential.password;
      }

      const optimisticCredential = {
        ...newCredential,
        _id: '__pending_new__',
        id: '__pending_new__',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const addNextCredentials = [optimisticCredential, ...credentials];
      const addTree = new IncrementalMerkleTree();
      const addRoot = (await addTree.initFromCredentials(addNextCredentials)) || EMPTY_VAULT_ROOT;

      const response = await credentialsAPI.create({
        ...newCredential,
        merkleRoot: addRoot
      });
      
      const newCredentialData = response.data || response;
      const nextCredentials = [newCredentialData, ...credentials];
      setCredentials(nextCredentials);
      setStats(prev => ({ ...prev, total: prev.total + 1 }));

      try { await encryptionService.warmDecryptCache([newCredentialData], masterKey); } catch (_) {}

      try {
        await merkleTree.initFromCredentials(nextCredentials);
      } catch {
        // Non-blocking: local tree sync failure shouldn't interrupt the credential flow.
      }
      setCurrentPage(1);
      await loadData(1, { allowInitialLoading: false });
      
      return { credential: newCredentialData, blockchain: response.blockchain || null };
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteCredential = async (id) => {
    try {
      const nextCredentials = credentials.filter(cred => cred._id !== id);
      const deleteTree = new IncrementalMerkleTree();
      const deleteRoot = (await deleteTree.initFromCredentials(nextCredentials)) || EMPTY_VAULT_ROOT;

      await credentialsAPI.remove(id, { merkleRoot: deleteRoot });
      setCredentials(nextCredentials);
      setStats(prev => ({ ...prev, total: prev.total - 1 }));

      try {
        await merkleTree.initFromCredentials(nextCredentials);
      } catch {
        // Non-blocking: local tree sync failure shouldn't interrupt the deletion flow.
      }
      await loadData(currentPage, { allowInitialLoading: false });
    } catch (error) {
      throw error;
    }
  };

  const handleToggleFavorite = async (id) => {
    try {
      const response = await credentialsAPI.toggleFavorite(id);
      const nextFavoriteValue = !!response?.data?.isFavorite;
      let previousFavoriteValue = false;

      setCredentials((prev) => prev.map((cred) => {
        if (cred._id === id) {
          previousFavoriteValue = !!cred.isFavorite;
          return { ...cred, isFavorite: nextFavoriteValue };
        }
        return cred;
      }));

      if (previousFavoriteValue !== nextFavoriteValue) {
        setStats((prev) => ({
          ...prev,
          favorites: Math.max(0, (prev.favorites || 0) + (nextFavoriteValue ? 1 : -1))
        }));
      }
      await loadData(currentPage, { allowInitialLoading: false });
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateCredential = async (id, updates) => {
    try {
      const existingCredential = credentials.find((cred) => cred._id === id);
      const localUpdatedCredential = existingCredential ? { ...existingCredential, ...updates } : updates;
      const nextCredentials = credentials.map((cred) => (cred._id === id ? localUpdatedCredential : cred));
      const updateTree = new IncrementalMerkleTree();
      const updateRoot = (await updateTree.initFromCredentials(nextCredentials)) || EMPTY_VAULT_ROOT;

      const response = await credentialsAPI.update(id, { ...updates, merkleRoot: updateRoot });
      const serverUpdatedCredential = response.data || response;
      const finalCredentials = credentials.map((cred) => (cred._id === id ? serverUpdatedCredential : cred));
      setCredentials(finalCredentials);

      try {
        await merkleTree.initFromCredentials(finalCredentials);
      } catch {
        // Non-blocking: local tree sync failure shouldn't interrupt the update flow.
      }
      await loadData(currentPage, { allowInitialLoading: false });
      return { credential: response.data || response, blockchain: response.blockchain || null };
    } catch (error) {
      throw error;
    }
  };

  const decryptPassword = (encryptedPassword, iv, salt) => {
    try {
      return encryptionService.decryptPassword(encryptedPassword, masterKey, iv, salt);
    } catch (error) {
      return '*** Decryption Failed ***';
    }
  };

  // Only show loading spinner during initial auth check, not during data loading
  if (isLoading && isInitialAuthCheck) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginEmail />} />
          <Route path="/login/master-key" element={<LoginMasterKey onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/login/mfa" element={<LoginMFA onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/signup" element={<Signup onSignupSuccess={handleSignupSuccess} />} />
          <Route
            path="/benchmark"
            element={(
              <div className="pt-16">
                <BenchmarkRunner masterKey={masterKey} />
              </div>
            )}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" />
        <Footer />
      </Router>
    );
  }

  return (
    <Router>
      <div className="h-screen overflow-hidden bg-secondary-50">
        <div className="flex h-full min-h-0">
          <Sidebar onLogout={handleLogout} />
          <main className="flex-1 min-h-0 overflow-y-auto p-4 pt-16 sm:p-6 sm:pt-16 lg:p-8 lg:pt-8">
          <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col">
          <div className="flex-1">
          <Breadcrumbs />
          <Routes>
            <Route 
              path="/" 
              element={
                <Dashboard
                  credentials={credentials}
                  stats={stats}
                  categories={categories}
                  onAddCredential={handleAddCredential}
                  onDeleteCredential={handleDeleteCredential}
                  onToggleFavorite={handleToggleFavorite}
                  decryptPassword={decryptPassword}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  selectedCategory={selectedCategory}
                  user={user}
                  setSelectedCategory={setSelectedCategory}
                  showFavorites={showFavorites}
                  setShowFavorites={setShowFavorites}
                  currentPage={currentPage}
                  pagination={pagination}
                  isPageLoading={isPageLoading}
                  onPageChange={setCurrentPage}
                  pageSize={pageSize}
                  onPageSizeChange={setPageSize}
                />
              } 
            />
            <Route 
              path="/add" 
              element={
                <AddCredential
                  onAddCredential={handleAddCredential}
                  categories={categories}
                />
              } 
            />
            <Route 
              path="/edit/:id" 
              element={
                <AddCredential
                  onAddCredential={handleAddCredential}
                  onUpdateCredential={handleUpdateCredential}
                  categories={categories}
                  isEdit={true}
                  credentials={credentials}
                />
              } 
            />
            <Route 
              path="/vault" 
              element={
                <Vault
                  credentials={credentials}
                  onDeleteCredential={handleDeleteCredential}
                  onToggleFavorite={handleToggleFavorite}
                  decryptPassword={decryptPassword}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  showFavorites={showFavorites}
                  setShowFavorites={setShowFavorites}
                  currentPage={currentPage}
                  pagination={pagination}
                  isPageLoading={isPageLoading}
                  onPageChange={setCurrentPage}
                  pageSize={pageSize}
                  onPageSizeChange={setPageSize}
                />
              } 
            />
            <Route 
              path="/settings" 
              element={
                <SettingsPage
                  user={user}
                  setUser={setUser}
                  masterKey={masterKey}
                  onLogout={handleLogout}
                  credentials={credentials}
                  decryptPassword={decryptPassword}
                />
              } 
            />
            <Route 
              path="/breach-monitor" 
              element={
                <BreachMonitor
                  credentials={credentials}
                  decryptPassword={decryptPassword}
                  onUpdateCredential={handleUpdateCredential}
                />
              } 
            />
            <Route 
              path="/smart-categories" 
              element={
                <SmartCategories
                  credentials={credentials}
                  onUpdateCredential={handleUpdateCredential}
                  onAddCredential={handleAddCredential}
                />
              } 
            />
            <Route
              path="/benchmark"
              element={(
                <BenchmarkRunner masterKey={masterKey} />
              )}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </div>
          <div className="mt-8">
            <Footer />
          </div>
          </div>
        </main>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#374151',
              border: '1px solid #e5e7eb',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App; 