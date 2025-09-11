import React, { useEffect, useState } from 'react';
import { blockchainAPI } from '../services/api';

const BlockchainDebug = ({ userId }) => {
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const debug = async () => {
      const token = localStorage.getItem('securevault_token');
      console.log('🔍 Blockchain Debug Info:');
      console.log('  userId:', userId);
      console.log('  token present:', !!token);
      console.log('  token preview:', token ? token.slice(0, 20) + '...' : 'none');
      
      setDebugInfo({
        userId,
        hasToken: !!token,
        tokenPreview: token ? token.slice(0, 20) + '...' : 'none',
        userIdType: typeof userId,
        userIdValue: userId
      });

      if (token && userId) {
        try {
          console.log('  Making API call...');
          const response = await blockchainAPI.activity(userId);
          console.log('  API response:', response);
          setDebugInfo(prev => ({ ...prev, apiResponse: response }));
        } catch (error) {
          console.log('  API error:', error);
          setDebugInfo(prev => ({ ...prev, apiError: error.message }));
        }
      }
    };

    debug();
  }, [userId]);

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-medium text-yellow-800 mb-2">🔍 Blockchain Debug Info</h3>
      <div className="text-xs text-yellow-700 space-y-1">
        <div>User ID: {debugInfo.userId || 'Not provided'}</div>
        <div>User ID Type: {debugInfo.userIdType}</div>
        <div>User ID Value: {JSON.stringify(debugInfo.userIdValue)}</div>
        <div>Token Present: {debugInfo.hasToken ? 'Yes' : 'No'}</div>
        <div>Token Preview: {debugInfo.tokenPreview}</div>
        {debugInfo.apiResponse && (
          <div>API Response: {JSON.stringify(debugInfo.apiResponse, null, 2)}</div>
        )}
        {debugInfo.apiError && (
          <div>API Error: {debugInfo.apiError}</div>
        )}
      </div>
    </div>
  );
};

export default BlockchainDebug;
