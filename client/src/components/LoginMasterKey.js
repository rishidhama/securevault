import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Shield, ArrowLeft, CheckCircle, AlertCircle, Fingerprint } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginMasterKey = ({ onLoginSuccess }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromState = location.state?.email || '';

  // State declarations
  const [masterKey, setMasterKey] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Check biometric support and if it's enabled for this user
  useEffect(() => {
    checkBiometricSupport();
    checkBiometricStatus();
  }, [emailFromState]);

  // Re-check biometric status when session changes
  useEffect(() => {
    const handleStorageChange = () => {
      checkBiometricStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const checkBiometricSupport = async () => {
    try {
      if (typeof window.PublicKeyCredential !== 'undefined' && 
          typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setBiometricSupported(available);
      }
    } catch (error) {
      console.error('Biometric support check failed:', error);
    }
  };

  const checkBiometricStatus = async () => {
    if (!emailFromState) return;
    
    try {
      // First check localStorage for immediate response
      const stored = localStorage.getItem(`biometric_enabled_${emailFromState}`);
      const hasCredential = localStorage.getItem(`biometric_credential_${emailFromState}`);
      const hasMasterKey = localStorage.getItem(`securevault_master_key`) || localStorage.getItem(`securevault_master_key_${emailFromState}`);
      
      // Check if biometric is properly set up
      if (stored === 'true' && hasCredential && hasMasterKey) {
        setBiometricEnabled(true);
        return;
      }
      
      // If biometric is marked as enabled but missing required data, clear it
      if (stored === 'true' && (!hasCredential || !hasMasterKey)) {
        clearIncompleteBiometricData();
        return;
      }
      
      setBiometricEnabled(false);
    } catch (error) {
      setBiometricEnabled(false);
    }
  };

  const handleBiometricUnlock = async () => {
    
    if (!biometricSupported || !biometricEnabled) {
      toast.error('Biometric authentication not available');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // First, get a challenge from the server
      const challengeResponse = await fetch('http://localhost:5000/api/auth/biometric-challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailFromState
        })
      });

      if (!challengeResponse.ok) {
        throw new Error('Failed to get biometric challenge');
      }

      const challengeData = await challengeResponse.json();

      if (!challengeData.success) {
        throw new Error(challengeData.error || 'Failed to get challenge');
      }

      // Convert challenge from array to ArrayBuffer
      const challengeBuffer = new Uint8Array(challengeData.data.challenge);

      // Create assertion options
      const assertionOptions = {
        challenge: challengeBuffer,
        rpId: 'localhost', // Use consistent localhost for development
        userVerification: 'required',
        timeout: 60000,
        allowCredentials: challengeData.data.allowCredentials ? challengeData.data.allowCredentials.map(cred => ({
          ...cred,
          id: new Uint8Array(cred.id)
        })) : []
      };

      // Get assertion from authenticator
      const assertion = await window.navigator.credentials.get({
        publicKey: assertionOptions,
      });

      if (!assertion) {
        throw new Error('Biometric verification failed');
      }

      // Convert assertion to base64 for transmission
      const assertionData = {
        id: assertion.id, // Use the credential ID directly (it's already base64)
        type: assertion.type,
        response: {
          authenticatorData: btoa(String.fromCharCode(...new Uint8Array(assertion.response.authenticatorData))),
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(assertion.response.clientDataJSON))),
          signature: btoa(String.fromCharCode(...new Uint8Array(assertion.response.signature)))
        }
      };

      // Send assertion to server for verification
      const loginResponse = await fetch('http://localhost:5000/api/auth/biometric-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailFromState,
          assertion: assertionData,
          challenge: Array.from(challengeBuffer)
        })
      });

      if (loginResponse.ok) {
        const data = await loginResponse.json();
        
        if (data.success) {
          // Store authentication data
          localStorage.setItem('securevault_token', data.data.token);
          localStorage.setItem('securevault_user', JSON.stringify(data.data.user));
          
          // After biometric authentication, we need to get the stored master key
          // Check if we have a stored master key for this user
          let storedMasterKey = localStorage.getItem('securevault_master_key');
          
          // If not found in general storage, try user-specific storage
          if (!storedMasterKey || storedMasterKey.length < 8) {
            storedMasterKey = localStorage.getItem(`securevault_master_key_${emailFromState}`);
          }
          
          if (storedMasterKey && storedMasterKey.length >= 8) {
            // Use the stored master key
            toast.success('Biometric authentication successful!');
            
            // Call parent callback if provided
            if (onLoginSuccess) {
              onLoginSuccess({
                user: data.data.user,
                token: data.data.token,
                masterKey: storedMasterKey
              });
            }
            
            // Navigate to dashboard
            navigate('/');
          } else {
            // No stored master key - this shouldn't happen if biometric was set up properly
            console.error('No stored master key found for biometric authentication');
            toast.error('Biometric setup incomplete. Please log in with your master key to re-setup biometrics.');
            setError('Biometric setup incomplete');
            
            // Clear the incomplete biometric data to allow re-setup
            clearIncompleteBiometricData();
          }
        } else {
          throw new Error(data.error || 'Authentication failed');
        }
      } else {
        const errorData = await loginResponse.json();
        throw new Error(errorData.error || 'Biometric authentication failed');
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      setError('Biometric authentication failed. Please use your master key instead.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to clear incomplete biometric data and allow re-setup
  const clearIncompleteBiometricData = () => {
    if (emailFromState) {
      localStorage.removeItem(`biometric_enabled_${emailFromState}`);
      localStorage.removeItem(`biometric_credential_${emailFromState}`);
      localStorage.removeItem(`securevault_master_key_${emailFromState}`);
      setBiometricEnabled(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!masterKey || masterKey.length < 8) {
        throw new Error('Master key must be at least 8 characters');
      }

      if (!emailFromState) {
        throw new Error('Email is required. Please go back and enter your email.');
      }

             // Call backend login API with correct backend URL
       const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailFromState,
          masterKey
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 423) {
          // Account locked
          throw new Error(data.error || 'Account is locked due to too many failed attempts');
        }
        throw new Error(data.error || 'Invalid email or master key');
      }

      // Check if MFA is required
      if (data.data.user.mfaEnabled) {
        // Store temporary auth data for MFA step
        localStorage.setItem('temp_auth', JSON.stringify({
          email: emailFromState,
          masterKey,
          token: data.data.token,
          user: data.data.user
        }));
        
        toast.success('MFA required. Please enter your authenticator code.');
        navigate('/login/mfa');
        return;
      }

      // No MFA required - complete login
      await completeLogin(data.data);
      
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
      localStorage.setItem('securevault_master_key', masterKey); // For client-side encryption
      
      toast.success('Login successful!');
      
      // Call parent callback if provided
      if (onLoginSuccess) {
        onLoginSuccess({
          ...authData,
          masterKey: masterKey // Include the master key in the callback
        });
      }
      
      // Navigate to dashboard
      navigate('/');
    } catch (error) {
      console.error('Login completion error:', error);
      toast.error('Failed to complete login');
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button 
          onClick={() => navigate('/login')} 
          className="mb-4 btn-secondary inline-flex items-center"
          disabled={isLoading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
        
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-3">
            <Shield className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-1">Enter Master Key</h1>
          {emailFromState && (<p className="text-secondary-600">for <span className="font-medium">{emailFromState}</span></p>)}
        </div>
        
        <div className="card">
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Master Key</label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="Enter your master key"
                    value={masterKey}
                    onChange={(e) => setMasterKey(e.target.value)}
                    required
                    autoFocus
                    disabled={isLoading}
                  />
                  <button 
                    type="button" 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-500" 
                    onClick={() => setShow(!show)}
                    disabled={isLoading}
                  >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {error && (
                  <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 mt-2 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-danger-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-danger-700 text-sm">{error}</p>
                      {error.includes('Biometric setup incomplete') && (
                        <div className="mt-2">
                          <p className="text-danger-600 text-xs mb-2">
                            This usually happens when biometric authentication was set up but the master key was lost.
                          </p>
                          <button
                            type="button"
                            onClick={clearIncompleteBiometricData}
                            className="text-xs text-danger-600 hover:text-danger-800 underline"
                          >
                            Clear biometric data and re-setup
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <p className="text-xs text-secondary-500 mt-2">Your master key never leaves your device and is never sent to our servers.</p>
              </div>
              
              <button 
                type="submit" 
                className="btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Authenticating...
                  </>
                ) : (
                  'Unlock Vault'
                )}
              </button>

            </form>
            
            {/* Biometric Unlock Option */}
            {biometricSupported && biometricEnabled && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-secondary-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-secondary-500">Or</span>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handleBiometricUnlock}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  <Fingerprint className="w-4 h-4" />
                  Unlock with Biometrics
                </button>
                
              </>
            )}
            
            {/* Security Features and Additional Info */}
            <div className="space-y-4">
              <div className="mt-4 text-sm text-secondary-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-600" /> 
                  Client-side AES-256-CBC decryption
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-600" /> 
                  Zero-knowledge architecture
                </div>
              </div>
              
              <p className="text-sm text-secondary-600 text-center">
                Need an account? <Link to="/signup" className="text-primary-600 hover:underline">Create one</Link>
              </p>
            </div>
          </>
        </div>
      </div>
    </div>
  );
};

export default LoginMasterKey;
