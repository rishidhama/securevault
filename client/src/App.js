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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [pendingAnchorCount, setPendingAnchorCount] = useState(0);
  const [showAnchorResumeModal, setShowAnchorResumeModal] = useState(false);
  const [isAnchoringQueued, setIsAnchoringQueued] = useState(false);
  const [merkleTree] = useState(() => new IncrementalMerkleTree());

  useEffect(() => {
    checkAuthStatus();
    initializeTheme();
  }, []);


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
    setPendingAnchorCount(0);
    setShowAnchorResumeModal(false);
  };

  const getCurrentUserId = (u) => (u?.id || u?._id || null);

  const checkPendingAnchors = async (u) => {
    const userId = getCurrentUserId(u);
    if (!userId) return;
    try {
      const res = await blockchainAPI.operations(userId);
      const queued = res?.data?.queued || [];
      const count = Array.isArray(queued) ? queued.length : 0;
      setPendingAnchorCount(count);
      setShowAnchorResumeModal(count > 0);
    } catch {
      // Non-blocking: if blockchain endpoint fails, skip modal.
      setPendingAnchorCount(0);
      setShowAnchorResumeModal(false);
    }
  };

  const handleAnchorQueuedNow = async () => {
    try {
      setIsAnchoringQueued(true);
      const res = await blockchainAPI.flushMyBatchQueue();
      if (res?.data?.txHash) {
        toast.success('Queued updates anchored successfully.');
      } else if (res?.data?.flushed > 0) {
        toast.success('Queued updates processed.');
      } else {
        toast('No queued updates to anchor right now.');
      }
      setShowAnchorResumeModal(false);
      if (user) {
        await checkPendingAnchors(user);
      }
    } catch (error) {
      toast.error(`Failed to anchor queued updates: ${error.message || error}`);
    } finally {
      setIsAnchoringQueued(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && user) {
      checkPendingAnchors(user);
    }
  }, [isAuthenticated, user]);

  // Keep decrypt cache warm whenever we have both masterKey + credentials.
  // This prevents "Decryption not ready" during rerenders (e.g. toggling favorites).
  useEffect(() => {
    if (!masterKey || !Array.isArray(credentials) || credentials.length === 0) return;
    encryptionService.warmDecryptCache(credentials, masterKey).catch(() => {});
  }, [masterKey, credentials]);

  const loadData = async () => {
    try {
      if (isInitialAuthCheck) {
        setIsLoading(true);
      }
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Data loading timeout')), 10000)
      );
      
      const dataPromise = Promise.all([
        credentialsAPI.listAll(), // Get all credentials for initial load
        credentialsAPI.stats(),
        credentialsAPI.categories()
      ]);

      const [credentialsResponse, statsResponse, categoriesResponse] = await Promise.race([
        dataPromise,
        timeoutPromise
      ]);

      const creds = credentialsResponse.data || credentialsResponse || [];
      setCredentials(creds);
      setStats(statsResponse.data || statsResponse || { total: 0, favorites: 0, categories: 0 });
      setCategories(categoriesResponse.data || categoriesResponse || []);

      if (creds.length > 0) {
        await merkleTree.initFromCredentials(creds);
      }

      if (masterKey) {
        encryptionService.warmDecryptCache(creds, masterKey).catch(() => {});
      }
    } catch (error) {
      setCredentials([]);
      setStats({ total: 0, favorites: 0, categories: 0 });
      setCategories([]);
    } finally {
      setIsLoading(false);
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
          await checkPendingAnchors(fullUserData);
        }
      } catch (error) {
        // If profile fetch fails or times out, continue with login data
        await checkPendingAnchors(authData.user);
      }
    } catch (error) {
      setUser(authData.user);
      setMasterKey(authData.masterKey || '');
      setIsAuthenticated(true);
      await checkPendingAnchors(authData.user);
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

      const response = await credentialsAPI.create(newCredential);
      
      const newCredentialData = response.data || response;
      setCredentials(prev => [newCredentialData, ...prev]);
      setStats(prev => ({ ...prev, total: prev.total + 1 }));

      try { await encryptionService.warmDecryptCache([newCredentialData], masterKey); } catch (_) {}

      // Anchoring source of truth is server-side credentials routes.
      // Avoid duplicate client-side anchoring calls that create conflicting queue states.
      if (user?.id) {
        try {
          const credId = newCredentialData._id || newCredentialData.id;
          await merkleTree.addLeaf(credId, newCredentialData);
        } catch {
          // Non-blocking: merkle update failure shouldn't interrupt the credential flow.
        }
      }
      
      return { credential: newCredentialData, blockchain: response.blockchain || null };
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteCredential = async (id) => {
    try {
      await credentialsAPI.remove(id);
      setCredentials(prev => prev.filter(cred => cred._id !== id));
      setStats(prev => ({ ...prev, total: prev.total - 1 }));

      if (user?.id) {
        try {
          await merkleTree.deleteLeaf(id);
        } catch {
          // Non-blocking: merkle update failure shouldn't interrupt the deletion flow.
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const handleToggleFavorite = async (id) => {
    try {
      const response = await credentialsAPI.toggleFavorite(id);
      setCredentials(prev => 
        prev.map(cred => 
          cred._id === id 
            ? { ...cred, isFavorite: response.data.isFavorite }
            : cred
        )
      );
      
      const newStats = await credentialsAPI.stats();
      setStats(newStats.data || newStats);
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateCredential = async (id, updates) => {
    try {
      const response = await credentialsAPI.update(id, updates);
      let updatedCredential;
      setCredentials(prev => {
        updatedCredential = prev.find(cred => cred._id === id);
        const updated = { ...updatedCredential, ...response.data };
        return prev.map(cred => cred._id === id ? updated : cred);
      });

      if (user?.id) {
        try {
          const credId = id;
          const updated = updatedCredential ? { ...updatedCredential, ...response.data } : response.data;
          await merkleTree.updateLeaf(credId, updated);
        } catch {
          // Non-blocking: merkle update failure shouldn't interrupt the update flow.
        }
      }
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

  const filteredCredentials = credentials.filter(cred => {
    const matchesSearch = cred.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cred.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || cred.category === selectedCategory;
    const matchesFavorites = !showFavorites || cred.isFavorite;
    
    return matchesSearch && matchesCategory && matchesFavorites;
  });

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
      <div className="flex min-h-screen bg-secondary-50 flex-col">
        {showAnchorResumeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-secondary-900">Pending Batch Anchoring</h3>
              <p className="mt-2 text-sm text-secondary-700">
                You have {pendingAnchorCount} queued update{pendingAnchorCount === 1 ? '' : 's'} from a previous session.
                Anchor them now?
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAnchorResumeModal(false)}
                  disabled={isAnchoringQueued}
                >
                  Later
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleAnchorQueuedNow}
                  disabled={isAnchoringQueued}
                >
                  {isAnchoringQueued ? 'Anchoring...' : 'Anchor now'}
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-1 min-h-0">
          <Sidebar onLogout={handleLogout} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto pt-16 lg:pt-0">
          <Breadcrumbs />
          <Routes>
            <Route 
              path="/" 
              element={
                <Dashboard
                  credentials={filteredCredentials}
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
                  credentials={filteredCredentials}
                  onDeleteCredential={handleDeleteCredential}
                  onToggleFavorite={handleToggleFavorite}
                  decryptPassword={decryptPassword}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  showFavorites={showFavorites}
                  setShowFavorites={setShowFavorites}
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
        <Footer />
      </div>
    </Router>
  );
}

export default App; 