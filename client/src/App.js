import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Shield, Lock, LogOut } from 'lucide-react';

// Components
import Dashboard from './components/Dashboard';
import AddCredential from './components/AddCredential';
import Vault from './components/Vault';
import SettingsPage from './components/SettingsPage';
import MasterKeyModal from './components/MasterKeyModal';
import LoadingSpinner from './components/LoadingSpinner';
import Sidebar from './components/Sidebar';
import Landing from './components/Landing';
import LoginEmail from './components/LoginEmail';
import LoginMasterKey from './components/LoginMasterKey';
import LoginMFA from './components/LoginMFA';
import Signup from './components/Signup';
import BiometricAuth from './components/BiometricAuth';
import BackupCodesManager from './components/BackupCodesManager';
import BreachMonitor from './components/BreachMonitor';
import SmartCategories from './components/SmartCategories';

// Services
import { credentialsAPI } from './services/api';
import encryptionService from './utils/encryption';
import { authAPI } from './services/api';

// Styles
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
  const [credentials, setCredentials] = useState([]);
  const [stats, setStats] = useState({ total: 0, favorites: 0, categories: 0 });
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFavorites, setShowFavorites] = useState(false);

  // Check authentication and initialize theme on app load
  useEffect(() => {
    checkAuthStatus();
    initializeTheme();
  }, []);



  // Initialize theme from localStorage
  const initializeTheme = () => {
    const savedTheme = localStorage.getItem('securevault_theme') || 'light';
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-light', 'theme-dark', 'theme-system');
    
    // Apply saved theme
    if (savedTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(`theme-${systemTheme}`);
    } else {
      root.classList.add(`theme-${savedTheme}`);
    }
    
    // Initialize other appearance settings
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


      if (token && storedUser && storedMasterKey) {
        // Verify token is still valid
        const response = await authAPI.profile();

        if (response.success) {
          console.log('Token valid, setting authenticated state');
          setUser(response.data.user);
          setMasterKey(storedMasterKey);
          setIsAuthenticated(true);
        } else {
          console.log('Token invalid, clearing storage');
          // Token invalid, clear storage
          clearAuthData();
        }
      } else {
        console.log('Missing required auth data, not authenticated');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      clearAuthData();
    } finally {
      setIsLoading(false);
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

  // Load credentials and stats when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [credentialsResponse, statsResponse, categoriesResponse] = await Promise.all([
        credentialsAPI.list(),
        credentialsAPI.stats(),
        credentialsAPI.categories()
      ]);

      // Handle the response structure correctly
      setCredentials(credentialsResponse.data || credentialsResponse || []);
      setStats(statsResponse.data || statsResponse || { total: 0, favorites: 0, categories: 0 });
      setCategories(categoriesResponse.data || categoriesResponse || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Set empty defaults on error
      setCredentials([]);
      setStats({ total: 0, favorites: 0, categories: 0 });
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = async (authData) => {
    
    setUser(authData.user);
    setMasterKey(authData.masterKey);
    setIsAuthenticated(true);
    
    
    // Store token in localStorage for API calls
    if (authData.token) {
      localStorage.setItem('securevault_token', authData.token);
    }
    
    // Fetch full user profile to get createdAt, lastLogin, etc.
    try {
      const profileResponse = await authAPI.profile();
      if (profileResponse.success && profileResponse.data.user) {
        const fullUserData = { ...authData.user, ...profileResponse.data.user };
        setUser(fullUserData);
        console.log('Full user profile loaded:', fullUserData);
      }
    } catch (error) {
      console.error('Failed to fetch full user profile:', error);
    }
    
    // The useEffect will handle loading data when isAuthenticated changes
  };

  const handleSignupSuccess = (authData) => {
    setUser(authData.user);
    setMasterKey(authData.masterKey);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('securevault_token');
      if (token) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
      setCredentials([]);
      setStats({ total: 0, favorites: 0, categories: 0 });
      setCategories([]);
      setSearchTerm('');
      setSelectedCategory('all');
      setShowFavorites(false);
    }
  };

  const handleAddCredential = async (credentialData) => {
    try {
      let newCredential = { ...credentialData };

      // Only encrypt if password is present and not already encrypted
      if (credentialData.password && !credentialData.encryptedPassword) {
        const encryptedData = encryptionService.encryptPassword(
          credentialData.password,
          masterKey
        );

        newCredential = {
          ...credentialData,
          encryptedPassword: encryptedData.encryptedPassword,
          iv: encryptedData.iv,
          salt: encryptedData.salt
        };

        // Remove plain text password before sending to server
        delete newCredential.password;
      } else if (credentialData.password) {
        // Remove plain text password if it exists
        delete newCredential.password;
      }

      const response = await credentialsAPI.create(newCredential);
      
      // Add the new credential to the list
      const newCredentialData = response.data || response;
      setCredentials(prev => [newCredentialData, ...prev]);
      setStats(prev => ({ ...prev, total: prev.total + 1 }));
      
      return newCredentialData;
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteCredential = async (id) => {
    try {
      await credentialsAPI.remove(id);
      setCredentials(prev => prev.filter(cred => cred._id !== id));
      setStats(prev => ({ ...prev, total: prev.total - 1 }));
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
      
      // Update stats
      const newStats = await credentialsAPI.getStats();
      setStats(newStats.data);
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateCredential = async (id, updates) => {
    try {
      const response = await credentialsAPI.update(id, updates);
      setCredentials(prev => 
        prev.map(cred => 
          cred._id === id 
            ? { ...cred, ...response.data }
            : cred
        )
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const decryptPassword = (encryptedPassword, iv, salt) => {
    try {
      return encryptionService.decryptPassword(encryptedPassword, masterKey, iv, salt);
    } catch (error) {
      console.error('Decryption failed:', error);
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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Public routes: landing, login, signup, MFA
  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginEmail />} />
          <Route path="/login/master-key" element={<LoginMasterKey onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/login/mfa" element={<LoginMFA onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/signup" element={<Signup onSignupSuccess={handleSignupSuccess} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </Router>
    );
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-secondary-50">
        <Sidebar onLogout={handleLogout} />
        <main className="flex-1 p-8 overflow-y-auto">
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
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