import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, ArrowLeft, CheckCircle, AlertCircle, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { mfaAPI } from '../services/api';

const LoginMFA = ({ onLoginSuccess }) => {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBackupCode, setShowBackupCode] = useState(false);
  const [tempAuth, setTempAuth] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get temporary auth data
    const stored = localStorage.getItem('temp_auth');
    if (!stored) {
      toast.error('Authentication session expired. Please login again.');
      navigate('/login');
      return;
    }
    setTempAuth(JSON.parse(stored));
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!token || token.length !== 6) {
        throw new Error('Please enter a valid 6-digit code');
      }

      if (!tempAuth) {
        throw new Error('Authentication session expired');
      }

      // Verify MFA token
      const response = await mfaAPI.verify({
        email: tempAuth.email,
        token: token
      });

      // MFA verified - complete login
      await completeLogin(tempAuth);
      
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const completeLogin = async (authData) => {
    try {
      // Store authentication data
      localStorage.setItem('securevault_token', authData.token);
      localStorage.setItem('securevault_user', JSON.stringify(authData.user));
      localStorage.setItem('securevault_master_key', authData.masterKey);
      
      // Clear temporary auth data
      localStorage.removeItem('temp_auth');
      
      toast.success('MFA verified! Login successful.');
      
      // Call parent callback if provided
      if (onLoginSuccess) {
        onLoginSuccess(authData);
      }
      
      // Navigate to dashboard
      navigate('/');
    } catch (error) {
      console.error('Login completion error:', error);
      toast.error('Failed to complete login');
    }
  };

  const handleBackupCode = () => {
    setShowBackupCode(true);
    setError('');
  };

  const handleBackupCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!token || (token.length !== 6 && token.length !== 8)) {
        throw new Error('Please enter a valid 6-digit TOTP code or 8-character backup code');
      }

      if (!tempAuth) {
        throw new Error('Authentication session expired');
      }

      // Verify backup code
      const response = await mfaAPI.verify({
        email: tempAuth.email,
        token: token
      });

      // Backup code verified - complete login
      await completeLogin(tempAuth);
      
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!tempAuth) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button 
          onClick={() => navigate('/login')} 
          className="mb-4 btn-secondary inline-flex items-center"
          disabled={isLoading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
        </button>
        
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-3">
            <Shield className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-1">Two-Factor Authentication</h1>
          <p className="text-secondary-600">Enter your authenticator code for <span className="font-medium">{tempAuth.email}</span></p>
        </div>

        <div className="card">
          {!showBackupCode ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Authenticator Code</label>
                <input
                  type="text"
                  className="input text-center text-lg tracking-widest"
                  placeholder="000000"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                  autoFocus
                  disabled={isLoading}
                />
                <p className="text-xs text-secondary-500 mt-2">Enter the 6-digit code from your authenticator app</p>
              </div>

              {error && (
                <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-danger-600 mt-0.5 flex-shrink-0" />
                  <p className="text-danger-700 text-sm">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                className="btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Login'
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleBackupCode}
                  className="text-sm text-primary-600 hover:underline"
                  disabled={isLoading}
                >
                  <Key className="w-4 h-4 inline mr-1" />
                  Use backup code instead
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleBackupCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Backup Code</label>
                <input
                  type="text"
                  className="input text-center text-lg tracking-widest"
                  placeholder="ABCD1234"
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                  maxLength={8}
                  required
                  autoFocus
                  disabled={isLoading}
                />
                <p className="text-xs text-secondary-500 mt-2">Enter one of your 8-character backup codes</p>
              </div>

              {error && (
                <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-danger-600 mt-0.5 flex-shrink-0" />
                  <p className="text-danger-700 text-sm">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                className="btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Verify Backup Code'
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowBackupCode(false);
                    setToken('');
                    setError('');
                  }}
                  className="text-sm text-secondary-600 hover:underline"
                  disabled={isLoading}
                >
                  ← Back to authenticator code
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 p-4 bg-secondary-50 border border-secondary-200 rounded-lg">
            <h3 className="font-medium text-secondary-900 mb-2">Need help?</h3>
            <p className="text-sm text-secondary-700">
              If you're having trouble with MFA, you can use one of your backup codes. 
              Make sure you have your authenticator app ready or backup codes saved securely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginMFA;
