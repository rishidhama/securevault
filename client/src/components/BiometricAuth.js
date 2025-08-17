import React, { useState, useEffect } from 'react';
import { Fingerprint, Eye, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

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

    // Check if credentials API is available
    if (!window.navigator.credentials) {
      toast.error('Credentials API is not supported in this browser');
      return;
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      // Check if crypto API is available
      if (!window.crypto || !window.crypto.getRandomValues) {
        toast.error('Crypto API is not supported in this browser');
        return;
      }

      // Get the current user email from localStorage or props
      const userEmail = localStorage.getItem('securevault_user') ? 
        JSON.parse(localStorage.getItem('securevault_user')).email : 'user@securevault.com';

      // Create a challenge for biometric authentication
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const publicKeyOptions = {
        challenge: challenge,
        rp: {
          name: 'SecureVault',
          id: 'localhost', // Use localhost for development to match backend
        },
        user: {
          id: new Uint8Array(16),
          name: userEmail,
          displayName: 'SecureVault User',
        },
        pubKeyCredParams: [
          {
            type: 'public-key',
            alg: -7, // ES256
          },
          {
            type: 'public-key',
            alg: -257, // RS256
          },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      };

      const credential = await window.navigator.credentials.create({
        publicKey: publicKeyOptions,
      });

      if (credential) {
        // Store the credential ID for future authentication
        // Store only the essential ID to avoid database issues
        const credentialData = {
          id: credential.id,
          type: credential.type,
          rawId: Array.from(new Uint8Array(credential.rawId)) // Convert ArrayBuffer to array for storage
          // Note: We're storing minimal data to avoid database size issues
        };

        // Store credential data in localStorage (in production, this should be stored securely)
        localStorage.setItem(`biometric_credential_${userEmail}`, JSON.stringify(credentialData));
        
        // Store biometric status for this user in localStorage for immediate use
        localStorage.setItem(`biometric_enabled_${userEmail}`, 'true');
        
        // Store the master key for this user (required for decryption after biometric login)
        if (masterKey && masterKey.length >= 8) {
          // Store master key with user-specific key to avoid conflicts
          localStorage.setItem(`securevault_master_key_${userEmail}`, masterKey);
          // Also store with the general key for backward compatibility
          localStorage.setItem('securevault_master_key', masterKey);
        } else {
          // Handle missing master key
        }
        
        // Also update the database
        try {
          const token = localStorage.getItem('securevault_token');
          
          if (token) {
            const response = await authAPI.enableBiometric(credentialData);
            
            if (!response.success) {
              throw new Error(response.error || 'Failed to enable biometric in database');
            }
            
          } else {
            throw new Error('You must be logged in to enable biometric authentication');
          }
        } catch (error) {
          // Remove the localStorage entries since database update failed
          localStorage.removeItem(`biometric_credential_${userEmail}`);
          localStorage.removeItem(`biometric_enabled_${userEmail}`);
          throw error; // Re-throw to show error to user
        }
        
        toast.success('Biometric authentication enabled successfully!');
        onAuthenticate(true);
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Authentication failed. Please try again.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Biometric authentication was cancelled or denied.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Security error occurred. Please try again.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Biometric authentication is not supported on this device.';
      } else if (error.name === 'InvalidStateError') {
        errorMessage = 'Biometric credential already exists. Please use verification instead.';
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
    // Check if credentials API is available
    if (!window.navigator.credentials) {
      toast.error('Credentials API is not supported in this browser');
      return;
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      // Check if crypto API is available
      if (!window.crypto || !window.crypto.getRandomValues) {
        toast.error('Crypto API is not supported in this browser');
        return;
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const assertionOptions = {
        challenge: challenge,
        rpId: 'localhost', // Use consistent localhost for development
        userVerification: 'required',
        timeout: 60000,
      };

      const assertion = await window.navigator.credentials.get({
        publicKey: assertionOptions,
      });

      if (assertion) {
        toast.success('Biometric verification successful!');
        onAuthenticate(true);
      }
    } catch (error) {
      console.error('Biometric verification failed:', error);
      setError('Verification failed. Please try again.');
      toast.error('Biometric verification failed');
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
            ⚠️ Master key is required to setup biometric authentication. Please ensure you're logged in with your master key.
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