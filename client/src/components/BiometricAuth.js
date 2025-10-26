import React, { useState, useEffect } from 'react';
import { Fingerprint, Eye, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
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

const BiometricAuth = ({ onAuthenticate, onCancel, isEnabled = false, masterKey }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authMethod, setAuthMethod] = useState(null);
  const [error, setError] = useState(null);
  const [supportDetails, setSupportDetails] = useState({
    webAuthn: false,
    credentials: false,
    crypto: false,
    biometric: false
  });

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const details = {
        webAuthn: typeof window.PublicKeyCredential !== 'undefined',
        credentials: typeof window.navigator.credentials !== 'undefined',
        crypto: typeof window.crypto !== 'undefined' && typeof window.crypto.getRandomValues === 'function',
        biometric: false
      };

      setSupportDetails(details);

      // Check if Web Authentication API is supported
      if (!details.webAuthn) {
        setIsSupported(false);
        return;
      }

      // Check if biometric authentication is available
      if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
        try {
          const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          details.biometric = available;
          setSupportDetails(details);
          setIsSupported(available);

          if (available) {
            // Determine available methods
            const methods = [];
            if (typeof window.PublicKeyCredential.isConditionalMediationAvailable === 'function') {
              methods.push('fingerprint');
            }
            // Face ID is typically available on devices with TrueDepth camera
            if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
              methods.push('faceid');
            }
            setAuthMethod(methods[0] || 'fingerprint');
          }
        } catch (error) {
          console.error('Biometric availability check failed:', error);
          details.biometric = false;
          setSupportDetails(details);
          setIsSupported(false);
        }
      } else {
        setIsSupported(false);
      }
    } catch (error) {
      console.error('Biometric support check failed:', error);
      setIsSupported(false);
    }
  };

  const handleBiometricAuth = async () => {
    if (!isSupported) {
      toast.error('Biometric authentication is not supported on this device');
      return;
    }

    // Check if master key is available (required for decryption)
    if (!masterKey || masterKey.length < 8) {
      toast.error('Master key is required to setup biometric authentication');
      return;
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      // Get the current user email from localStorage
      const userEmail = localStorage.getItem('securevault_user') ? 
        JSON.parse(localStorage.getItem('securevault_user')).email : 'user@securevault.com';

      // Fetch server-provided registration (attestation) options (if exposed)
      // Fallback to local minimal options if not available
      let creationOptions;
      try {
        // Optional: if backend provides dedicated registration endpoint, call it here
        // Otherwise, construct client-side options
        creationOptions = {
          publicKey: {
            rp: { name: 'SecureVault', id: window.location.hostname || 'localhost' },
            user: { id: new TextEncoder().encode(userEmail), name: userEmail, displayName: userEmail },
            pubKeyCredParams: [
              { type: 'public-key', alg: -7 },
              { type: 'public-key', alg: -257 }
            ],
            authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', requireResidentKey: false },
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            timeout: 120000,
            attestation: 'none'
          }
        };
      } catch (_) {}

      const credential = await window.navigator.credentials.create(creationOptions);
      
      if (!credential) {
        throw new Error('Failed to create biometric credential - user may have cancelled');
      }


      // Store credential locally
      const credentialData = {
        id: credential.id,
        type: credential.type,
        rawId: arrayBufferToBase64url(credential.rawId),
        response: {
          attestationObject: arrayBufferToBase64url(credential.response.attestationObject),
          clientDataJSON: arrayBufferToBase64url(credential.response.clientDataJSON)
        }
      };

      // Store credential data
      sessionStorage.setItem(`biometric_credential_${userEmail}`, JSON.stringify(credentialData));
      sessionStorage.setItem(`biometric_enabled_${userEmail}`, 'true');
      sessionStorage.setItem(`securevault_master_key_${userEmail}`, masterKey);

      // Send credential to server for storage
      try {
        const token = localStorage.getItem('securevault_token');
        if (token) {
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/enable-biometric`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
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
          console.log('Server response:', result);
        } else {
          throw new Error('Authentication token required to enable biometric authentication');
        }
      } catch (serverError) {
        console.error('Failed to store credential on server:', serverError);
        throw serverError; // Re-throw to prevent setup if server storage fails
      }

      toast.success('Biometric authentication enabled successfully!');
      onAuthenticate(true);
      
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
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleVerifyBiometric = async () => {
    setIsAuthenticating(true);
    setError(null);

    try {
      // Get the current user email from localStorage
      const userEmail = localStorage.getItem('securevault_user') ? 
        JSON.parse(localStorage.getItem('securevault_user')).email : 'user@securevault.com';

      // Ask backend for a signed challenge and allowCredentials
      const challengeResp = await authAPI.biometricChallenge(userEmail);
      if (!challengeResp.success) {
        throw new Error(challengeResp.error || 'Failed to obtain biometric challenge');
      }

      const options = challengeResp.data;
      const publicKey = {
        ...options,
        challenge: base64urlToArrayBuffer(Array.isArray(options.challenge) ? arrayBufferToBase64url(new Uint8Array(options.challenge).buffer) : options.challenge),
        allowCredentials: (options.allowCredentials || []).map(c => ({
          ...c,
          id: typeof c.id === 'string' ? base64urlToArrayBuffer(c.id) : (Array.isArray(c.id) ? new Uint8Array(c.id).buffer : c.id)
        }))
      };

      // Perform WebAuthn assertion with server-provided challenge
      const assertion = await window.navigator.credentials.get({ publicKey });

      if (!assertion) {
        throw new Error('Biometric verification failed - user may have cancelled');
      }

      // Send assertion back to server to verify and issue JWT
      const assertionPayload = {
        email: userEmail,
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
      const userData = tokenData.user;
      localStorage.setItem('securevault_token', tokenData.token);
      localStorage.setItem('securevault_user', JSON.stringify(userData));

      // Restore master key from per-email cache if present
      const storedMaster = sessionStorage.getItem(`securevault_master_key_${userEmail}`);
      if (storedMaster) {
        sessionStorage.setItem('securevault_master_key', storedMaster);
      }

      toast.success('Biometric verification successful!');
      onAuthenticate(true);
      
    } catch (error) {
      console.error('Biometric verification failed:', error);
      
      let errorMessage = 'Biometric verification failed. Please try again.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Biometric verification was cancelled or not allowed. Please try again and make sure to allow the browser to access your biometric data.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Biometric authentication is not supported on this device or browser.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Security error occurred. Please make sure you are using HTTPS or localhost.';
      } else if (error.name === 'InvalidStateError') {
        errorMessage = 'Biometric credential is invalid. Please set up biometric authentication again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-semibold">Biometric Authentication Not Available</h3>
        </div>
        <p className="text-secondary-600 mb-4">
          Your device or browser doesn't support biometric authentication. Here's what's missing:
        </p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className={`w-4 h-4 ${supportDetails.webAuthn ? 'text-green-500' : 'text-red-500'}`} />
            <span className="text-sm">Web Authentication API: {supportDetails.webAuthn ? 'Supported' : 'Not Supported'}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className={`w-4 h-4 ${supportDetails.credentials ? 'text-green-500' : 'text-red-500'}`} />
            <span className="text-sm">Credentials API: {supportDetails.credentials ? 'Supported' : 'Not Supported'}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className={`w-4 h-4 ${supportDetails.crypto ? 'text-green-500' : 'text-red-500'}`} />
            <span className="text-sm">Crypto API: {supportDetails.crypto ? 'Supported' : 'Not Supported'}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className={`w-4 h-4 ${supportDetails.biometric ? 'text-green-500' : 'text-red-500'}`} />
            <span className="text-sm">Biometric Hardware: {supportDetails.biometric ? 'Available' : 'Not Available'}</span>
          </div>
        </div>

        <p className="text-xs text-secondary-500 mb-4">
          Biometric authentication requires a modern browser and device with fingerprint sensor or Face ID.
        </p>
        
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary">
            Use Password Instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {authMethod === 'faceid' ? (
            <Eye className="w-8 h-8 text-primary-600" />
          ) : (
            <Fingerprint className="w-8 h-8 text-primary-600" />
          )}
        </div>
        <h3 className="text-xl font-semibold mb-2">
          {isEnabled ? 'Verify Your Identity' : 'Enable Biometric Authentication'}
        </h3>
        <p className="text-secondary-600">
          {isEnabled 
            ? `Use your ${authMethod === 'faceid' ? 'Face ID' : 'fingerprint'} to access your vault`
            : `Set up ${authMethod === 'faceid' ? 'Face ID' : 'fingerprint'} for quick access`
          }
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {!isEnabled && (!masterKey || masterKey.length < 8) && (
        <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-700 rounded-lg p-3 mb-4">
          <p className="text-warning-800 dark:text-warning-200 text-sm">
            Master key is required to setup biometric authentication. Please ensure you're logged in with your master key.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={isEnabled ? handleVerifyBiometric : handleBiometricAuth}
          disabled={isAuthenticating || (!isEnabled && (!masterKey || masterKey.length < 8))}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isAuthenticating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {isEnabled ? 'Verifying...' : 'Setting up...'}
            </>
          ) : (
            <>
              {authMethod === 'faceid' ? <Eye className="w-4 h-4" /> : <Fingerprint className="w-4 h-4" />}
              {isEnabled ? 'Verify with Biometric' : (!masterKey || masterKey.length < 8) ? 'Master Key Required' : 'Enable Biometric Auth'}
            </>
          )}
        </button>

        <button
          onClick={onCancel}
          disabled={isAuthenticating}
          className="btn-secondary w-full"
        >
          Cancel
        </button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Security Note:</p>
            <p>Biometric data is stored securely on your device and never transmitted to our servers.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiometricAuth;