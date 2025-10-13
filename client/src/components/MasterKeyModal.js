import React, { useState, useEffect } from 'react';
import { X, Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react';

const MasterKeyModal = ({ isOpen, onClose, onSubmit, isError = false, errorMessage = '' }) => {
  const [masterKey, setMasterKey] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      setMasterKey('');
      setErrors({});
    }
  }, [isOpen]);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!masterKey.trim()) {
      setErrors({ masterKey: 'Master key is required' });
      return;
    }

    if (masterKey.length < 12) {
      setErrors({ masterKey: 'Master key must be at least 12 characters long' });
      return;
    }
    
    // Check for weak master keys
    const weakKeys = ['password', '123456', 'masterkey', 'securevault'];
    if (weakKeys.includes(masterKey.toLowerCase())) {
      setErrors({ masterKey: 'Master key is too weak. Please choose a stronger password.' });
      return;
    }

    onSubmit(masterKey);
    handleClose();
  };

  const getStrengthColor = (length) => {
    if (length >= 12) return 'text-success-600';
    if (length >= 8) return 'text-warning-600';
    return 'text-danger-600';
  };

  const getStrengthText = (length) => {
    if (length >= 12) return 'Strong';
    if (length >= 8) return 'Medium';
    return 'Weak';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all duration-200 ${show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Shield className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-secondary-900">
                {isError ? 'Re-enter Master Key' : 'Enter Master Key'}
              </h2>
              <p className="text-sm text-secondary-600">
                {isError ? 'Your master key is required to decrypt passwords' : 'Enter your master key to continue'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-secondary-400 hover:text-secondary-600 rounded-lg hover:bg-secondary-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Message */}
        {isError && errorMessage && (
          <div className="p-4 bg-danger-50 border-l-4 border-danger-400">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-danger-600" />
              <p className="text-sm text-danger-700">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="masterKey" className="block text-sm font-medium text-secondary-700 mb-2">
              Master Key
            </label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                id="masterKey"
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                  errors.masterKey ? 'border-danger-500' : 'border-secondary-300'
                }`}
                placeholder="Enter your master key"
                autoComplete="current-password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.masterKey && (
              <p className="text-danger-600 text-xs mt-1">{errors.masterKey}</p>
            )}
          </div>

          {/* Password Strength Indicator */}
          {masterKey && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary-600">Strength:</span>
                <span className={`font-medium ${getStrengthColor(masterKey.length)}`}>
                  {getStrengthText(masterKey.length)}
                </span>
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-1">
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${
                    masterKey.length >= 12 ? 'bg-success-600' :
                    masterKey.length >= 8 ? 'bg-warning-600' :
                    'bg-danger-600'
                  }`}
                  style={{ width: `${Math.min((masterKey.length / 12) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="text-xs text-secondary-500 bg-secondary-50 p-3 rounded-lg">
            <p className="font-medium mb-1">Security Notice:</p>
            <ul className="space-y-1">
              <li>- Your master key is never stored on our servers</li>
              <li>- It's used only for client-side encryption/decryption</li>
              <li>- Make sure to remember it - we cannot recover it</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-secondary-700 bg-secondary-100 hover:bg-secondary-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!masterKey.trim() || masterKey.length < 12}
            >
              {isError ? 'Re-enter Key' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MasterKeyModal; 