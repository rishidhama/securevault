import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Shield, 
  User, 
  Key, 
  LogOut, 
  Trash2, 
  Download, 
  Upload,
  Lock,
  Bell,
  Database,
  Palette,
  HelpCircle,
  CreditCard,
  Users,
  Globe,
  Smartphone,
  Calendar,
  Fingerprint,
  Eye,
  Activity,
  RefreshCw,
  Menu,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import BiometricAuth from './BiometricAuth';
import BackupCodesManager from './BackupCodesManager';
import BlockchainMonitor from './BlockchainMonitor';
import BlockchainActivityLog from './BlockchainActivityLog';
import { authAPI, mfaAPI, billingAPI } from '../services/api';

const SettingsPage = ({ user, masterKey, onLogout, credentials, decryptPassword }) => {
  console.log('SettingsPage rendered with props:', {
    user: user ? 'Present' : 'Missing',
    masterKey: masterKey ? 'Present' : 'Missing',
    credentialsCount: credentials?.length || 0
  });

  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeSection, setActiveSection] = useState('account');
  const [showMasterKeyModal, setShowMasterKeyModal] = useState(false);
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [newMasterKey, setNewMasterKey] = useState('');
  const [confirmMasterKey, setConfirmMasterKey] = useState('');
  const [currentMasterKey, setCurrentMasterKey] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaQRCode, setMfaQRCode] = useState('');
  const [showDisableMFAModal, setShowDisableMFAModal] = useState(false);
  const [disableMFACode, setDisableMFACode] = useState('');
  const [showRegenerateBackupModal, setShowRegenerateBackupModal] = useState(false);
  const [regenerateBackupCode, setRegenerateBackupCode] = useState('');
  const [newBackupCodes, setNewBackupCodes] = useState([]);
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const [preferences, setPreferences] = useState({
    notifications: {
      securityAlerts: true,
      breachNotifications: true,
      weeklyReports: false
    },
    privacy: {
      analyticsOptIn: false,
      crashReports: true
    }
  });

  // Check if biometric is enabled for this user
  useEffect(() => {
    if (user?.email) {
      const stored = sessionStorage.getItem(`biometric_enabled_${user.email}`);
      setBiometricEnabled(stored === 'true');
    }
  }, [user?.email]);

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const res = await authAPI.preferences.get();
        if (res?.success && res.data) {
          setPreferences(prev => ({ ...prev, ...res.data }));
        }
      } catch (e) {
        console.warn('Failed to load preferences, using defaults');
      }
    };
    if (user) loadPreferences();
  }, [user]);

  const handleUpdatePref = async (section, key, value) => {
    const updated = {
      ...preferences,
      [section]: { ...preferences[section], [key]: value }
    };
    setPreferences(updated);
    try {
      await authAPI.preferences.update(updated);
    } catch (e) {
      toast.error('Failed to save preference');
    }
  };

  // Load existing backup codes when component mounts
  useEffect(() => {
    const loadExistingBackupCodes = async () => {
      if (!user?.email) return;
      
      // Check if user is authenticated
      const token = localStorage.getItem('securevault_token');
      if (!token) {
        console.log('No authentication token found, skipping MFA status check');
        return;
      }
      
      try {
        const response = await mfaAPI.status();
        console.log('MFA Status Response:', response.data);
        if (response.success && response.data.backupCodes) {
          console.log('Setting backup codes:', response.data.backupCodes);
          setBackupCodes(response.data.backupCodes);
        }
      } catch (error) {
        console.error('Failed to load existing backup codes:', error);
        // Don't show error to user if it's just an authentication issue
        if (error.message.includes('401') || error.message.includes('403')) {
          console.log('Authentication required for MFA status');
        }
      }
    };

    loadExistingBackupCodes();
  }, [user?.email]);
  
  // Appearance settings state - With localStorage persistence
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('securevault_theme');
    return savedTheme || 'light';
  });
  const [fontSize, setFontSize] = useState(() => {
    const savedFontSize = localStorage.getItem('securevault_font_size');
    return savedFontSize || 'medium';
  });
  const [compactMode, setCompactMode] = useState(() => {
    const savedCompactMode = localStorage.getItem('securevault_compact_mode');
    return savedCompactMode === 'true';
  });

  // Apply appearance settings on component mount
  useEffect(() => {
    // Apply current theme settings
    const root = document.documentElement;
    
    // Apply theme
    root.classList.remove('theme-light', 'theme-dark', 'theme-system');
    root.classList.add(`theme-${theme}`);
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(`theme-${systemTheme}`);
    }
    
    // Apply font size
    root.classList.remove('text-size-small', 'text-size-medium', 'text-size-large');
    root.classList.add(`text-size-${fontSize}`);
    
    // Apply compact mode
    if (compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }
  }, []); // Only run on mount

  // Separate effect for theme changes
  useEffect(() => {
    // Apply theme
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark', 'theme-system');
    root.classList.add(`theme-${theme}`);
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(`theme-${systemTheme}`);
    }
  }, [theme]);

  // Separate effect for font size changes
  useEffect(() => {
    // Apply font size to document
    const root = document.documentElement;
    root.classList.remove('text-size-small', 'text-size-medium', 'text-size-large');
    root.classList.add(`text-size-${fontSize}`);
  }, [fontSize]);

  // Separate effect for compact mode changes
  useEffect(() => {
    // Apply compact mode to document
    const root = document.documentElement;
    if (compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }
  }, [compactMode]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        const root = document.documentElement;
        root.classList.remove('theme-light', 'theme-dark');
        root.classList.add(`theme-${e.matches ? 'dark' : 'light'}`);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Auto-generate MFA secret when modal opens
  useEffect(() => {
    if (showMFAModal && !mfaSecret) {
      handleGenerateMFASecret();
    }
  }, [showMFAModal]);

  // Appearance settings handlers - With localStorage persistence
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    
    // Persist theme to localStorage
    localStorage.setItem('securevault_theme', newTheme);
    
    // Apply theme to document
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark', 'theme-system');
    root.classList.add(`theme-${newTheme}`);
    
    // For system theme, check system preference
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(`theme-${systemTheme}`);
    }
    
    toast.success(`Theme changed to ${newTheme}`);
  };

  const handleFontSizeChange = (newFontSize) => {
    setFontSize(newFontSize);
    
    // Persist font size to localStorage
    localStorage.setItem('securevault_font_size', newFontSize);
    
    // Apply font size to document
    const root = document.documentElement;
    root.classList.remove('text-size-small', 'text-size-medium', 'text-size-large');
    root.classList.add(`text-size-${newFontSize}`);
    
    toast.success(`Font size changed to ${newFontSize}`);
  };

  const handleCompactModeChange = (isCompact) => {
    setCompactMode(isCompact);
    
    // Persist compact mode to localStorage
    localStorage.setItem('securevault_compact_mode', isCompact.toString());
    
    // Apply compact mode to document
    const root = document.documentElement;
    if (isCompact) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }
    
    toast.success(`Compact mode ${isCompact ? 'enabled' : 'disabled'}`);
  };

  // Settings sections with navigation
  const settingsSections = [
    {
      id: 'account',
      name: 'Account',
      icon: <User className="w-4 h-4" />,
      description: 'Manage your account information'
    },
    {
      id: 'security',
      name: 'Security',
      icon: <Shield className="w-4 h-4" />,
      description: 'Master key, biometric auth and backup codes'
    },
    {
      id: 'blockchain',
      name: 'Blockchain',
      icon: <Activity className="w-4 h-4" />,
      description: 'Blockchain security and activity monitoring'
    },
    {
      id: 'vault',
      name: 'Vault',
      icon: <Database className="w-4 h-4" />,
      description: 'Vault management and backup'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: <Bell className="w-4 h-4" />,
      description: 'Email and security alerts'
    },
    {
      id: 'appearance',
      name: 'Appearance',
      icon: <Palette className="w-4 h-4" />,
      description: 'Theme and display settings'
    },
    {
      id: 'privacy',
      name: 'Privacy',
      icon: <Lock className="w-4 h-4" />,
      description: 'Privacy and data settings'
    },
    {
      id: 'billing',
      name: 'Billing',
      icon: <CreditCard className="w-4 h-4" />,
      description: 'Subscription and billing'
    },
    {
      id: 'support',
      name: 'Support',
      icon: <HelpCircle className="w-4 h-4" />,
      description: 'Help and support options'
    }
  ];

  const handleExportVault = async () => {
    try {
      setIsLoading(true);
      
      // Create export data
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        user: {
          email: user?.email,
          name: user?.name
        },
        credentials: credentials.map(cred => ({
          ...cred,
          password: decryptPassword(cred.encryptedPassword, cred.iv, cred.salt)
        }))
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `securevault-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Vault exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export vault');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true);
      
      // Call API to delete account
      const response = await authAPI.deleteAccount();

      if (response.success) {
        toast.success('Account deleted successfully');
        onLogout();
        navigate('/');
      } else {
        throw new Error('Failed to delete account');
      }
    } catch (error) {
      console.error('Delete account failed:', error);
      toast.error('Failed to delete account');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleChangeMasterKey = async () => {
    if (!currentMasterKey || !newMasterKey || !confirmMasterKey) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newMasterKey !== confirmMasterKey) {
      toast.error('New master keys do not match');
      return;
    }

    if (newMasterKey.length < 8) {
      toast.error('Master key must be at least 8 characters long');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await authAPI.changeMasterKey(currentMasterKey, newMasterKey);

      if (response.success) {
        toast.success('Master key changed successfully');
        setShowMasterKeyModal(false);
        setNewMasterKey('');
        setConfirmMasterKey('');
        setCurrentMasterKey('');
        // Refresh the page to update the master key state
        window.location.reload();
      } else {
        const error = response.error;
        throw new Error(error.message || 'Failed to change master key');
      }
    } catch (error) {
      console.error('Change master key failed:', error);
      toast.error(error.message || 'Failed to change master key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupMFA = async () => {
    if (!mfaCode) {
      toast.error('Please enter the verification code');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await mfaAPI.verifySetup(mfaCode);
      
      if (response.success) {
        const data = response.data;
        toast.success('Two-factor authentication enabled successfully');
        setShowMFAModal(false);
        setMfaSecret('');
        setMfaCode('');
        // Refresh the page to update the MFA state
        window.location.reload();
      } else {
        const error = response.error;
        throw new Error(error.message || 'Failed to setup MFA');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to setup MFA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMFASecret = async () => {
    try {
      const response = await mfaAPI.setup();
      
      if (response.success) {
        const data = response.data;
        
        if (data.secret && data.qrCode) {
          setMfaSecret(data.secret);
          setMfaQRCode(data.qrCode);
          if (data.backupCodes) {
            console.log('MFA Setup - Setting backup codes:', data.backupCodes);
            setBackupCodes(data.backupCodes);
          }
          toast.success('MFA secret generated. Please scan the QR code with your authenticator app.');
        } else {
          throw new Error('Invalid response format from server');
        }
      } else {
        const errorData = response.error;
        throw new Error(errorData.message || 'Failed to generate MFA secret');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to generate MFA secret');
    }
  };

  const handleDisableMFA = async () => {
    if (!disableMFACode) {
      toast.error('Please enter the verification code');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await mfaAPI.disable(disableMFACode);

      if (response.success) {
        const data = response.data;
        toast.success('Two-factor authentication disabled successfully');
        setShowDisableMFAModal(false);
        setDisableMFACode('');
        
        // Update user state with new MFA status
        if (data.user) {
          // Update the user state to reflect MFA is disabled
          // You might need to pass setUser as a prop or use a different method to update user state
          window.location.reload(); // Fallback to refresh the page
        }
      } else {
        const error = response.error;
        throw new Error(error.message || 'Failed to disable MFA');
      }
    } catch (error) {
      console.error('Disable MFA failed:', error);
      toast.error(error.message || 'Failed to disable MFA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!regenerateBackupCode) {
      toast.error('Please enter the verification code');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await mfaAPI.regenerateBackupCodes(regenerateBackupCode);

      if (response.success) {
        const data = response.data;
        setNewBackupCodes(data.backupCodes);
        setShowRegenerateBackupModal(false);
        setRegenerateBackupCode('');
        toast.success('Backup codes regenerated successfully');
      } else {
        const error = response.error;
        throw new Error(error.message || 'Failed to regenerate backup codes');
      }
    } catch (error) {
      console.error('Regenerate backup codes failed:', error);
      toast.error(error.message || 'Failed to regenerate backup codes');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'account':
        return (
          <div className="p-4 sm:p-6">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-2">Account Information</h3>
              <p className="text-sm sm:text-base text-secondary-600">Manage your account details and profile information</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4">
                <div className="bg-secondary-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Full Name</label>
                  <p className="text-secondary-900 font-medium">{user?.name || 'Not set'}</p>
                </div>
                <div className="bg-secondary-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Email Address</label>
                  <p className="text-secondary-900 font-medium">{user?.email || 'Not set'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-secondary-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Member Since</label>
                  <p className="text-secondary-900 font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                <div className="bg-secondary-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Last Login</label>
                  <p className="text-secondary-900 font-medium">
                    {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="p-4 sm:p-6">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-2">Security Settings</h3>
              <p className="text-sm sm:text-base text-secondary-600">Manage your master key, biometric authentication, and backup codes</p>
            </div>
            <div className="space-y-4 sm:space-y-6">
              {/* Master Key and MFA Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-secondary-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="w-4 h-4 text-primary-600" />
                    <label className="text-sm font-medium text-secondary-700">Master Key</label>
                  </div>
                  <p className={`text-sm font-medium ${masterKey ? 'text-success-600' : 'text-danger-600'}`}>
                    {masterKey ? 'Configured' : 'Not configured'}
                  </p>
                </div>
                <div className="bg-secondary-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-primary-600" />
                    <label className="text-sm font-medium text-secondary-700">Two-Factor Auth</label>
                  </div>
                  <p className={`text-sm font-medium ${user?.mfaEnabled ? 'text-success-600' : 'text-warning-600'}`}>
                    {user?.mfaEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div className="bg-secondary-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-primary-600" />
                    <label className="text-sm font-medium text-secondary-700">Login Attempts</label>
                  </div>
                  <p className="text-sm font-medium text-secondary-900">{user?.loginAttempts || 0}</p>
                </div>
              </div>
              
              {/* Master Key and MFA Actions */}
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowMasterKeyModal(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  Change Master Key
                </button>
                {user?.mfaEnabled ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowRegenerateBackupModal(true)}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Key className="w-4 h-4" />
                      Regenerate Backup Codes
                    </button>
                    <button 
                      onClick={() => setShowDisableMFAModal(true)}
                      className="btn-danger flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      Disable Two-Factor Authentication
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setShowMFAModal(true);
                        setMfaSecret('');
                        setMfaCode('');
                        setMfaQRCode('');
                        setBackupCodes([]);
                      }}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      Setup Two-Factor Authentication
                    </button>
                  </div>
                )}
              </div>

              {/* Biometric and Backup Codes Section */}
              <div className="space-y-4">
                <div className="bg-white border border-secondary-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        <Fingerprint className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-secondary-700">Biometric Authentication</label>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            biometricEnabled 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {biometricEnabled ? 'Enabled' : 'Not Setup'}
                          </span>
                        </div>
                        <p className="text-xs text-secondary-500">
                          {biometricEnabled 
                            ? 'Use fingerprint or Face ID for quick access' 
                            : 'Setup fingerprint or Face ID for quick access'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {biometricEnabled ? (
                        <>
                          <button
                            onClick={() => setShowBiometricModal(true)}
                            className="btn-secondary text-sm"
                          >
                            <Fingerprint className="w-4 h-4 mr-1" />
                            Manage Biometrics
                          </button>
                          <button
                            onClick={() => {
                              // Show confirmation dialog for disabling biometrics
                              if (window.confirm('Are you sure you want to disable biometric authentication? You will need to use your master key to log in.')) {
                                const userEmail = user?.email || 'unknown';
                                sessionStorage.removeItem(`biometric_enabled_${userEmail}`);
                                sessionStorage.removeItem(`biometric_credential_${userEmail}`);
                                setBiometricEnabled(false);
                                toast.success('Biometric authentication disabled');
                              }
                            }}
                            className="btn-danger text-sm"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Disable
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setShowBiometricModal(true)}
                          className="btn-primary text-sm"
                        >
                          <Fingerprint className="w-4 h-4 mr-1" />
                          Setup Biometrics
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Help text for biometrics */}
                  {!biometricEnabled && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <HelpCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          <p className="font-medium">Setup Biometrics:</p>
                          <p>You'll need to be logged in with your master key to setup biometric authentication. This allows you to unlock your vault using fingerprint or Face ID instead of typing your master key.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-white border border-secondary-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-warning-100 rounded-lg">
                        <Key className="w-4 h-4 text-warning-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-secondary-700">Backup Codes</label>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            backupCodes.length > 0 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {backupCodes.length > 0 ? 'Generated' : 'Not Generated'}
                          </span>
                        </div>
                        <p className="text-xs text-secondary-500">
                          {backupCodes.length > 0 
                            ? 'Secure backup codes for account recovery' 
                            : 'Generate secure backup codes for account recovery'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowBackupCodesModal(true)}
                        className="btn-secondary text-sm"
                      >
                        <Key className="w-4 h-4 mr-1" />
                        {backupCodes.length > 0 ? 'View Codes' : 'Generate Codes'}
                      </button>
                      {backupCodes.length > 0 && (
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to regenerate backup codes? Your old codes will become invalid.')) {
                              setShowRegenerateBackupModal(true);
                            }
                          }}
                          className="btn-warning text-sm"
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Regenerate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'vault':
        return (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Vault Management</h3>
              <p className="text-secondary-600">Manage your vault data and backup options</p>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-secondary-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-primary-600" />
                    <label className="text-sm font-medium text-secondary-700">Total Credentials</label>
                  </div>
                  <p className="text-2xl font-bold text-secondary-900">{credentials.length}</p>
                </div>
                <div className="bg-secondary-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-primary-600" />
                    <label className="text-sm font-medium text-secondary-700">Vault Size</label>
                  </div>
                  <p className="text-2xl font-bold text-secondary-900">{(credentials.length * 0.5).toFixed(1)} KB</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleExportVault}
                  disabled={isLoading}
                  className="btn-primary flex items-center justify-center gap-2 py-3"
                >
                  <Download className="w-4 h-4" />
                  {isLoading ? 'Exporting...' : 'Export Vault'}
                </button>
                <button className="btn-secondary flex items-center justify-center gap-2 py-3">
                  <Upload className="w-4 h-4" />
                  Import Vault
                </button>
              </div>
              <div className="bg-primary-50 p-4 rounded-lg">
                <p className="text-sm text-primary-700">
                  Export your vault as a JSON file for backup purposes. Keep your backup file secure.
                </p>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Notification Settings</h3>
              <p className="text-secondary-600">Configure how you want to be notified about important events</p>
            </div>
            <div className="space-y-4">
              <div className="bg-white border border-secondary-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-warning-100 rounded-lg">
                      <Bell className="w-4 h-4 text-warning-600" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-700">Security Alerts</label>
                      <p className="text-xs text-secondary-500">Get notified about security events</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={preferences.notifications.securityAlerts}
                      onChange={(e) => handleUpdatePref('notifications', 'securityAlerts', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
              <div className="bg-white border border-secondary-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-danger-100 rounded-lg">
                      <Shield className="w-4 h-4 text-danger-600" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-700">Breach Notifications</label>
                      <p className="text-xs text-secondary-500">Alert when passwords are found in breaches</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={preferences.notifications.breachNotifications}
                      onChange={(e) => handleUpdatePref('notifications', 'breachNotifications', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
              <div className="bg-white border border-secondary-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Database className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-700">Weekly Reports</label>
                      <p className="text-xs text-secondary-500">Receive weekly vault activity reports</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={preferences.notifications.weeklyReports}
                      onChange={(e) => handleUpdatePref('notifications', 'weeklyReports', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Appearance Settings</h3>
              <p className="text-secondary-600">Customize the look and feel of your SecureVault</p>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-3">Theme</label>
                  <div className="flex items-center gap-3">
                    <select 
                      value={theme}
                      onChange={(e) => handleThemeChange(e.target.value)}
                      className="flex-1 px-4 py-3 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                    <button
                      onClick={() => handleThemeChange(theme === 'light' ? 'dark' : 'light')}
                      className="px-4 py-3 bg-secondary-100 hover:bg-secondary-200 border border-secondary-200 rounded-lg transition-colors"
                      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                      <Palette className="w-4 h-4 text-secondary-600" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-3">Font Size</label>
                  <select 
                    value={fontSize}
                    onChange={(e) => handleFontSizeChange(e.target.value)}
                    className="w-full px-4 py-3 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </div>
              <div className="bg-white border border-secondary-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Palette className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-700">Compact Mode</label>
                      <p className="text-xs text-secondary-500">Reduce spacing for more content</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={compactMode}
                      onChange={(e) => handleCompactModeChange(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
              
              {/* Preview Section */}
              <div className="mt-8 p-4 bg-secondary-50 rounded-lg border border-secondary-200">
                <h4 className="text-sm font-medium text-secondary-700 mb-3">Preview</h4>
                <div className="space-y-2">
                  <p className={`text-${fontSize === 'small' ? 'sm' : fontSize === 'large' ? 'lg' : 'base'} text-secondary-600`}>
                    This is how your text will appear with the current font size setting.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                    <span className="text-sm text-secondary-500">Theme: {theme}</span>
                    <span className="text-sm text-secondary-500">-</span>
                    <span className="text-sm text-secondary-500">Font: {fontSize}</span>
                    <span className="text-sm text-secondary-500">-</span>
                    <span className="text-sm text-secondary-500">Compact: {compactMode ? 'On' : 'Off'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );



      case 'privacy':
        return (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Privacy Settings</h3>
              <p className="text-secondary-600">Control your data and privacy preferences</p>
            </div>
            <div className="space-y-4">
              <div className="bg-white border border-secondary-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary-100 rounded-lg">
                      <Database className="w-4 h-4 text-secondary-600" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-700">Analytics</label>
                      <p className="text-xs text-secondary-500">Help improve SecureVault with anonymous usage data</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={preferences.privacy.analyticsOptIn}
                      onChange={(e) => handleUpdatePref('privacy', 'analyticsOptIn', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
              <div className="bg-white border border-secondary-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-warning-100 rounded-lg">
                      <Bell className="w-4 h-4 text-warning-600" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-700">Crash Reports</label>
                      <p className="text-xs text-secondary-500">Send crash reports to help fix issues</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={preferences.privacy.crashReports}
                      onChange={(e) => handleUpdatePref('privacy', 'crashReports', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
              <div className="pt-4">
                <button className="btn-secondary flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Clear All Data
                </button>
              </div>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Billing & Subscription</h3>
              <p className="text-secondary-600">Manage your plan, payment methods and invoices</p>
            </div>
            <div className="space-y-6">
              {/* Current Plan */}
              <div className="bg-white dark:bg-gray-800 border border-secondary-200 dark:border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-primary-600" />
                    <div>
                      <div className="text-sm text-secondary-600 dark:text-gray-300">Current Plan</div>
                      <div className="text-lg font-semibold text-secondary-900 dark:text-white capitalize">Free</div>
                  </div>
                </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={async () => {
                        try {
                          const priceId = (process.env.REACT_APP_STRIPE_PRICE_PRO || '').trim();
                          if (!priceId) {
                            toast.error('Billing not configured');
                            return;
                          }
                          const res = await billingAPI.checkout(priceId);
                          window.location.href = res.data.url;
                        } catch (e) {
                          toast.error(e.message || 'Failed to start checkout');
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                    >
                      Upgrade
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const res = await billingAPI.portal();
                          window.location.href = res.data.url;
                        } catch (e) {
                          toast.error(e.message || 'Failed to open billing portal');
                        }
                      }}
                      className="px-4 py-2 bg-secondary-100 dark:bg-gray-700 hover:bg-secondary-200 dark:hover:bg-gray-600 text-secondary-700 dark:text-gray-300 font-medium rounded-lg"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              </div>

              {/* Plans */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[{id:'free',name:'Free',price:'$0',period:'/mo',features:['Unlimited local entries','Client-side encryption','Basic breach monitor','Manual backup/export']},{id:'pro',name:'Pro',price:'$4.99',period:'/mo',highlighted:true,features:['Everything in Free','Cloud backup sync','Advanced breach monitor','Priority support']},{id:'team',name:'Team',price:'$9.99',period:'/mo',features:['Everything in Pro','Multi-user vault','Team roles & permissions','Audit logs']}].map(plan => (
                  <div key={plan.id} className={`bg-white dark:bg-gray-800 border rounded-xl p-6 ${plan.highlighted ? 'border-blue-500 ring-1 ring-blue-500' : 'border-secondary-200 dark:border-gray-700'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-secondary-900 dark:text-white">{plan.name}</h4>
                      {plan.highlighted && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Popular</span>
                      )}
                    </div>
                    <div className="text-3xl font-bold text-secondary-900 dark:text-white">{plan.price}<span className="text-base font-medium text-secondary-600 dark:text-gray-300">{plan.period}</span></div>
                    <ul className="mt-4 space-y-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-secondary-700 dark:text-gray-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <button className={`mt-6 w-full px-4 py-2 rounded-lg font-medium ${plan.highlighted ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-secondary-100 dark:bg-gray-700 hover:bg-secondary-200 dark:hover:bg-gray-600 text-secondary-700 dark:text-gray-300'}`}>
                      Choose Plan
                  </button>
                </div>
                ))}
              </div>

              {/* Payment Methods */}
              <div className="bg-white dark:bg-gray-800 border border-secondary-200 dark:border-gray-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="w-5 h-5 text-secondary-600 dark:text-gray-300" />
                  <h4 className="text-lg font-semibold text-secondary-900 dark:text-white">Payment Methods</h4>
                </div>
                <div className="flex items-center justify-between p-4 border border-secondary-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <CreditCard className="w-5 h-5 text-secondary-600 dark:text-gray-300 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-secondary-900 dark:text-white truncate">Visa ---- 4242</div>
                      <div className="text-sm text-secondary-600 dark:text-gray-300 truncate">Expires 12/27</div>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 bg-secondary-100 dark:bg-gray-700 hover:bg-secondary-200 dark:hover:bg-gray-600 text-secondary-700 dark:text-gray-300 rounded-lg text-sm">Remove</button>
                </div>
                <button className="mt-4 px-4 py-2 bg-secondary-100 dark:bg-gray-700 hover:bg-secondary-200 dark:hover:bg-gray-600 text-secondary-700 dark:text-gray-300 rounded-lg">Add Payment Method</button>
              </div>

              {/* Billing History */}
              <div className="bg-white dark:bg-gray-800 border border-secondary-200 dark:border-gray-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-secondary-600 dark:text-gray-300" />
                  <h4 className="text-lg font-semibold text-secondary-900 dark:text-white">Billing History</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-secondary-600 dark:text-gray-300">
                        <th className="py-2">Invoice</th>
                        <th className="py-2">Date</th>
                        <th className="py-2">Amount</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[{ id: 'inv_001', date: '2025-07-01', amount: '$4.99', status: 'Paid' },{ id: 'inv_002', date: '2025-08-01', amount: '$4.99', status: 'Paid' }].map(row => (
                        <tr key={row.id} className="border-t border-secondary-200 dark:border-gray-700 text-secondary-900 dark:text-white">
                          <td className="py-2">{row.id}</td>
                          <td className="py-2">{row.date}</td>
                          <td className="py-2">{row.amount}</td>
                          <td className="py-2">
                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">{row.status}</span>
                          </td>
                          <td className="py-2">
                            <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary-100 dark:bg-gray-700 hover:bg-secondary-200 dark:hover:bg-gray-600 text-secondary-700 dark:text-gray-300 rounded-lg">
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'support':
        return (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Support & Help</h3>
              <p className="text-secondary-600">Get help and support for SecureVault</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="bg-white border border-secondary-200 rounded-lg p-4 hover:bg-secondary-50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <HelpCircle className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <div className="font-medium text-secondary-900">Documentation</div>
                    <div className="text-sm text-secondary-500">Read guides and tutorials</div>
                  </div>
                </div>
              </button>
              <button className="bg-white border border-secondary-200 rounded-lg p-4 hover:bg-secondary-50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success-100 rounded-lg">
                    <Users className="w-4 h-4 text-success-600" />
                  </div>
                  <div>
                    <div className="font-medium text-secondary-900">Contact Support</div>
                    <div className="text-sm text-secondary-500">Get help from our team</div>
                  </div>
                </div>
              </button>
              <button className="bg-white border border-secondary-200 rounded-lg p-4 hover:bg-secondary-50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning-100 rounded-lg">
                    <Globe className="w-4 h-4 text-warning-600" />
                  </div>
                  <div>
                    <div className="font-medium text-secondary-900">Community Forum</div>
                    <div className="text-sm text-secondary-500">Connect with other users</div>
                  </div>
                </div>
              </button>
              <button className="bg-white border border-secondary-200 rounded-lg p-4 hover:bg-secondary-50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-info-100 rounded-lg">
                    <Smartphone className="w-4 h-4 text-info-600" />
                  </div>
                  <div>
                    <div className="font-medium text-secondary-900">Mobile App</div>
                    <div className="text-sm text-secondary-500">Download for iOS/Android</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        );

      case 'blockchain':
        return (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Blockchain Security</h3>
              <p className="text-secondary-600">Monitor blockchain activity and security status</p>
            </div>
            
            <div className="space-y-6">
              {/* Blockchain Monitor */}
              <div>
                <h4 className="text-lg font-medium text-secondary-900 mb-4">Connection Status</h4>
                <BlockchainMonitor userId={user?.userId || user?._id || user?.id} />
              </div>
              
              {/* Blockchain Activity Log */}
              <div>
                <h4 className="text-lg font-medium text-secondary-900 mb-4">Activity History</h4>
                <BlockchainActivityLog userId={user?.userId || user?._id || user?.id} />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-secondary-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg hover:bg-secondary-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gradient">Settings</h1>
        </div>
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-lg hover:bg-secondary-100"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Header */}
      <div className="hidden lg:flex items-center gap-4 mb-8 pt-0">
        <button
          onClick={() => navigate('/')}
          className="btn-secondary hover:bg-secondary-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Settings</h1>
          <p className="text-secondary-600">Manage your account and preferences</p>
        </div>
      </div>

      <div className="flex gap-8 pt-16 lg:pt-0">
        {/* Settings Navigation */}
        <div className={`w-72 flex-shrink-0 fixed lg:relative z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <div className="h-screen lg:h-auto bg-white lg:card shadow-sm border-secondary-100 overflow-y-auto">
            <div className="p-4 border-b border-secondary-100">
              <h2 className="text-lg font-semibold text-secondary-900">Settings</h2>
            </div>
            <nav className="p-2">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left mb-1 ${
                    activeSection === section.id
                      ? 'bg-primary-50 text-primary-700 border border-primary-200 shadow-sm'
                      : 'text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    activeSection === section.id ? 'bg-primary-100' : 'bg-secondary-100'
                  }`}>
                    {section.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{section.name}</div>
                    <div className="text-xs text-secondary-500 mt-0.5">{section.description}</div>
                  </div>
                </button>
              ))}
            </nav>

            {/* Danger Zone */}
            <div className="border-danger-200 bg-gradient-to-br from-danger-50 to-danger-25 mt-6 shadow-sm mx-2 mb-4 lg:mx-0 lg:mb-0">
              <div className="p-4 border-b border-danger-200">
                <h3 className="text-lg font-semibold text-danger-700 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Danger Zone
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <button
                  onClick={onLogout}
                  className="btn-secondary w-full flex items-center justify-center gap-2 hover:bg-secondary-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isLoading}
                  className="btn-danger w-full flex items-center justify-center gap-2 hover:bg-danger-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 min-w-0">
          <div className="card shadow-sm border-secondary-100">
            {renderSectionContent()}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-danger-700 mb-4">Delete Account</h3>
            <p className="text-secondary-700 mb-6">
              Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary flex-1"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="btn-danger flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Master Key Modal */}
      {showMasterKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Change Master Key</h3>
            <p className="text-secondary-700 mb-6">
              Enter your current master key and choose a new one. This will re-encrypt all your passwords.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Current Master Key</label>
                                  <input
                    type="password"
                    value={currentMasterKey || ''}
                    onChange={(e) => setCurrentMasterKey(e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter current master key"
                  />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">New Master Key</label>
                                  <input
                    type="password"
                    value={newMasterKey || ''}
                    onChange={(e) => setNewMasterKey(e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter new master key"
                  />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Confirm New Master Key</label>
                                  <input
                    type="password"
                    value={confirmMasterKey || ''}
                    onChange={(e) => setConfirmMasterKey(e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Confirm new master key"
                  />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowMasterKeyModal(false);
                  setNewMasterKey('');
                  setConfirmMasterKey('');
                  setCurrentMasterKey('');
                }}
                className="btn-secondary flex-1"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleChangeMasterKey}
                className="btn-primary flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Changing...' : 'Change Master Key'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup MFA Modal */}
      {showMFAModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-secondary-800 pb-4 border-b border-secondary-200 dark:border-secondary-600">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">Setup Two-Factor Authentication</h3>
              <p className="text-secondary-700 dark:text-secondary-300 text-sm">
                Scan the QR code with your authenticator app and enter the verification code.
              </p>
            </div>
            
            <div className="pt-4 space-y-4">
              {!mfaSecret ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-secondary-600 dark:text-secondary-400">Generating MFA setup...</p>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    {mfaQRCode ? (
                      <>
                        <div className="bg-secondary-50 dark:bg-secondary-700 p-4 rounded-lg mb-4 border border-secondary-200 dark:border-secondary-600">
                          <img 
                            src={mfaQRCode} 
                            alt="QR Code for MFA" 
                            className="mx-auto mb-3"
                            style={{ width: '180px', height: '180px' }}
    

                          />
                          <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-2">
                            Secret: {mfaSecret}
                            <span className="block text-xs text-secondary-400 dark:text-secondary-500 mt-1">
                              (32 characters - standard TOTP length)
                            </span>
                          </p>
                          <p className="text-xs text-secondary-500 dark:text-secondary-400">
                            Scan this QR code with Google Authenticator, Authy, or any TOTP app
                          </p>
                        </div>
                        
                        {/* Backup Codes Display */}
                        {backupCodes.length > 0 && (
                          <div className="bg-warning-50 dark:bg-warning-900/20 p-4 rounded-lg mb-4 border border-warning-200 dark:border-warning-700">
                            <h4 className="text-sm font-medium text-warning-800 dark:text-warning-200 mb-2 flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              Backup Codes - Save These Securely!
                            </h4>
                            <p className="text-xs text-warning-700 dark:text-warning-300 mb-3">
                              Store these codes in a safe place. You can use them to access your account if you lose your authenticator device.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {backupCodes.map((codeObj, index) => (
                                <div key={index} className="bg-white dark:bg-secondary-800 px-3 py-2 rounded border border-warning-200 dark:border-warning-600">
                                  <code className="text-sm font-mono text-warning-800 dark:text-warning-200">
                                    {typeof codeObj === 'string' ? codeObj : (codeObj.code || 'Invalid Code')}
                                  </code>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-warning-600 dark:text-warning-400 mt-2">
                              Each code can only be used once
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-secondary-100 dark:bg-secondary-700 p-4 rounded-lg mb-4">
                        <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">Generating QR Code...</p>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Verification Code</label>
                    <input
                      type="text"
                      value={mfaCode || ''}
                      onChange={(e) => setMfaCode(e.target.value)}
                      className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white placeholder-secondary-500 dark:placeholder-secondary-400"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowMFAModal(false);
                  setMfaSecret('');
                  setMfaCode('');
                  setMfaQRCode('');
                  setBackupCodes([]);
                }}
                className="btn-secondary flex-1"
                disabled={isLoading}
              >
                Cancel
              </button>
              {mfaSecret && (
                <button
                  onClick={handleSetupMFA}
                  className="btn-primary flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? 'Setting up...' : 'Enable MFA'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Disable MFA Modal */}
      {showDisableMFAModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Disable Two-Factor Authentication</h3>
            <p className="text-secondary-700 mb-6">
              Enter your verification code to disable two-factor authentication.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Verification Code</label>
                <input
                  type="text"
                  value={disableMFACode || ''}
                  onChange={(e) => setDisableMFACode(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDisableMFAModal(false);
                  setDisableMFACode('');
                }}
                className="btn-secondary flex-1"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDisableMFA}
                className="btn-danger flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Disabling...' : 'Disable MFA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Backup Codes Modal */}
      {showRegenerateBackupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Regenerate Backup Codes</h3>
            
            {newBackupCodes.length === 0 ? (
              <>
                <p className="text-secondary-700 mb-6">
                  Enter your verification code to generate new backup codes.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Verification Code</label>
                    <input
                      type="text"
                      value={regenerateBackupCode || ''}
                      onChange={(e) => setRegenerateBackupCode(e.target.value)}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowRegenerateBackupModal(false);
                      setRegenerateBackupCode('');
                    }}
                    className="btn-secondary flex-1"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegenerateBackupCodes}
                    className="btn-primary flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Generating...' : 'Generate New Codes'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-warning-50 p-4 rounded-lg border border-warning-200 mb-6">
                  <h4 className="text-sm font-medium text-warning-800 mb-2">
                    New Backup Codes Generated
                  </h4>
                  <p className="text-xs text-warning-700 mb-3">
                    Your old backup codes are now invalid. Save these new codes securely!
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {newBackupCodes.map((codeObj, index) => (
                      <div key={index} className="bg-white p-2 rounded border text-xs font-mono text-center break-all">
                        {typeof codeObj === 'string' ? codeObj : (codeObj.code || 'Invalid Code')}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-warning-600 mt-2">
                    Each code can only be used once. Store them in a safe place.
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRegenerateBackupModal(false);
                      setNewBackupCodes([]);
                    }}
                    className="btn-primary flex-1"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Biometric Authentication Modal */}
      {showBiometricModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <BiometricAuth
            masterKey={masterKey}
            onAuthenticate={(success) => {
              if (success) {
                setBiometricEnabled(true);
                // Store biometric status for this user
                const userEmail = user?.email || 'unknown';
                sessionStorage.setItem(`biometric_enabled_${userEmail}`, 'true');
                toast.success('Biometric authentication enabled!');
              }
              setShowBiometricModal(false);
            }}
            onCancel={() => setShowBiometricModal(false)}
            isEnabled={biometricEnabled}
          />
        </div>
      )}

      {/* Backup Codes Modal */}
      {showBackupCodesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <BackupCodesManager
            onClose={() => setShowBackupCodesModal(false)}
            onCodesGenerated={(codes) => {
              setBackupCodes(codes);
              toast.success('Backup codes generated successfully!');
            }}
          />
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
