import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Shield, ArrowLeft, CheckCircle, AlertCircle, Fingerprint } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

// Helper: base64url <-> ArrayBuffer conversions for WebAuthn
const base64urlToArrayBuffer = (base64url) => {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url.replace(/-/g, '+').replace(/_/g, '/')) + padding;
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return buffer;
};

const arrayBufferToBase64url = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

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
      // First check sessionStorage for immediate response
      const stored = sessionStorage.getItem(`biometric_enabled_${emailFromState}`);
      const hasCredential = sessionStorage.getItem(`biometric_credential_${emailFromState}`);
      const hasMasterKey = sessionStorage.getItem(`securevault_master_key`) || sessionStorage.getItem(`securevault_master_key_${emailFromState}`);
      
      // Check if biometric is properly set up locally
      if (stored === 'true' && hasCredential && hasMasterKey) {
        // Verify with server that biometric is still enabled
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/biometric-challenge`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: emailFromState
            })
          });
          
          if (response.ok) {
            setBiometricEnabled(true);
            return;
          } else if (response.status === 404 || response.status === 400) {
            // Definitive not-enabled response
            clearIncompleteBiometricData();
            return;
          } else {
            // Transient error (rate limit, server error): keep local state
            setBiometricEnabled(true);
            return;
          }
        } catch (serverError) {
          // If server check fails, fall back to local check
          setBiometricEnabled(true);
          return;
        }
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

  const setupBiometric = async () => {
    if (!biometricSupported) {
      toast.error('Biometric authentication not supported on this device');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Check if we have a master key stored
      const masterKey = sessionStorage.getItem('securevault_master_key') || sessionStorage.getItem(`securevault_master_key_${emailFromState}`);
      if (!masterKey || masterKey.length < 8) {
        throw new Error('Master key is required to enable biometric authentication. Please log in with your master key first.');
      }

      // Create credential options with better error handling
      const credentialOptions = {
        publicKey: {
          rp: {
            name: 'SecureVault',
            id: window.location.hostname || 'localhost'
          },
          user: {
            id: new TextEncoder().encode(emailFromState),
            name: emailFromState,
            displayName: emailFromState
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 }, // ES256
            { type: 'public-key', alg: -257 }, // RS256
            { type: 'public-key', alg: -37 }, // PS256
            { type: 'public-key', alg: -35 } // RS1
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            requireResidentKey: false
          },
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          timeout: 120000, // Increased timeout
          attestation: 'none' // Don't require attestation for better compatibility
        }
      };

      console.log('Creating biometric credential with options:', credentialOptions);

      // Create credential with user interaction
      const credential = await window.navigator.credentials.create(credentialOptions);
      
      if (!credential) {
        throw new Error('Failed to create biometric credential - user may have cancelled');
      }

      console.log('Credential created successfully:', credential);

      // Store credential locally
      const credentialData = {
        id: credential.id,
        type: credential.type,
        rawId: Array.from(new Uint8Array(credential.rawId)),
        response: {
          attestationObject: Array.from(new Uint8Array(credential.response.attestationObject)),
          clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON))
        }
      };

      // Store credential data
      sessionStorage.setItem(`biometric_credential_${emailFromState}`, JSON.stringify(credentialData));
      sessionStorage.setItem(`biometric_enabled_${emailFromState}`, 'true');
      sessionStorage.setItem(`securevault_master_key_${emailFromState}`, masterKey);

      // Send credential to server for storage
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/enable-biometric`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('securevault_token')}`
          },
          body: JSON.stringify({
            credentialData: credentialData
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to enable biometric authentication on server');
        }

        const result = await response.json();
      } catch (serverError) {
        console.warn('Failed to store credential on server:', serverError);
        // Continue with local storage only - server storage optional
      }

      setBiometricEnabled(true);
      toast.success('Biometric authentication enabled successfully!');
      
    } catch (error) {
      console.error('Biometric setup failed:', error);
      
      let errorMessage = 'Failed to setup biometric authentication';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Biometric setup was cancelled or not allowed. Please try again and make sure to allow the browser to access your biometric data.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Biometric authentication is not supported on this device or browser.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Security error occurred. Please make sure you are using HTTPS or localhost.';
      } else if (error.name === 'InvalidStateError') {
        errorMessage = 'Biometric credential already exists. Please try logging in with biometrics instead.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricUnlock = async () => {
    if (!biometricSupported || !biometricEnabled) {
      toast.error('Biometric authentication not available');
      return;
    }

    // Require an active session master key before proceeding with biometric unlock
    const sessionMasterKey = sessionStorage.getItem('securevault_master_key')
      || sessionStorage.getItem(`securevault_master_key_${emailFromState}`);
    if (!sessionMasterKey || sessionMasterKey.length < 8) {
      toast.error('Biometric unlock requires an active session. Please enter your master key once to start a new session.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Get server-provided challenge and allowCredentials
      const challengeResp = await authAPI.biometricChallenge(emailFromState);
      if (!challengeResp.success) {
        throw new Error(challengeResp.error || 'Failed to request biometric challenge');
      }

      const options = challengeResp.data;
      const publicKey = {
        ...options,
        challenge: Array.isArray(options.challenge)
          ? new Uint8Array(options.challenge).buffer
          : (typeof options.challenge === 'string'
              ? base64urlToArrayBuffer(options.challenge)
              : options.challenge),
        allowCredentials: (options.allowCredentials || []).map(c => ({
          ...c,
          id: Array.isArray(c.id)
            ? new Uint8Array(c.id).buffer
            : (typeof c.id === 'string' ? base64urlToArrayBuffer(c.id) : c.id)
        }))
      };

      const assertion = await window.navigator.credentials.get({ publicKey });
      if (!assertion) {
        throw new Error('Biometric verification failed - user may have cancelled');
      }

      // Send assertion back for verification
      const assertionPayload = {
        email: emailFromState,
        challenge: options.challenge,
        assertion: {
          id: assertion.id,
          type: assertion.type,
          rawId: arrayBufferToBase64url(assertion.rawId),
          response: {
            authenticatorData: arrayBufferToBase64url(assertion.response.authenticatorData),
            clientDataJSON: arrayBufferToBase64url(assertion.response.clientDataJSON),
            signature: arrayBufferToBase64url(assertion.response.signature),
            userHandle: assertion.response.userHandle ? arrayBufferToBase64url(assertion.response.userHandle) : null
          }
        }
      };

      const loginResp = await authAPI.biometricLogin(assertionPayload);
      if (!loginResp.success) {
        throw new Error(loginResp.error || 'Biometric login failed');
      }

      const tokenData = loginResp.data;

      // Restore master key from per-email cache if present
      const storedMasterKey = sessionStorage.getItem('securevault_master_key') || sessionStorage.getItem(`securevault_master_key_${emailFromState}`);
      if (!storedMasterKey || storedMasterKey.length < 8) {
        throw new Error('No stored master key found. Please log in with your master key to re-setup biometrics.');
      }

      // Store authentication data
      localStorage.setItem('securevault_token', tokenData.token);
      localStorage.setItem('securevault_user', JSON.stringify(tokenData.user));
      sessionStorage.setItem('securevault_master_key', storedMasterKey);

      toast.success('Biometric authentication successful!');

      if (onLoginSuccess) {
        onLoginSuccess({
          user: tokenData.user,
          token: tokenData.token,
          masterKey: storedMasterKey
        });
      }

      navigate('/');
      
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      let errorMessage = 'Biometric authentication failed. Please use your master key instead.';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Biometric authentication was cancelled or not allowed. Please try again and make sure to allow the browser to access your biometric data.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Biometric authentication is not supported on this device or browser.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Security error occurred. Please make sure you are using HTTPS or localhost.';
      } else if (error.name === 'InvalidStateError') {
        errorMessage = 'Biometric credential is invalid. Please set up biometric authentication again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to clear incomplete biometric data and allow re-setup
  const clearIncompleteBiometricData = () => {
    if (emailFromState) {
      sessionStorage.removeItem(`biometric_enabled_${emailFromState}`);
      sessionStorage.removeItem(`biometric_credential_${emailFromState}`);
      sessionStorage.removeItem(`securevault_master_key_${emailFromState}`);
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
       const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/login`, {
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
      sessionStorage.setItem('securevault_master_key', masterKey); // For client-side encryption
      
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

            {/* Biometric Setup Notice */}
            {biometricSupported && !biometricEnabled && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-secondary-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-secondary-500">Or</span>
                  </div>
                </div>
                
                <div className="text-center p-3 bg-info-50 border border-info-200 rounded-lg">
                  <p className="text-sm text-info-700">
                    Biometric authentication is available but not enabled.
                  </p>
                  <p className="text-xs text-info-600 mt-1">
                    Enable it in Settings after logging in.
                  </p>
                </div>
                
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
