import React from 'react';
import { Shield } from 'lucide-react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-primary-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary-600" />
            </div>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-secondary-900 mb-2">SecureVault</h2>
        <p className="text-secondary-600">Loading your secure vault...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner; 