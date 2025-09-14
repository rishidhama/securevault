import React, { useEffect, useState } from 'react';
import { blockchainAPI } from '../services/api';
import { Shield, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

const BlockchainStatusSummary = ({ userId }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activityCount, setActivityCount] = useState(0);

  useEffect(() => {
    const fetchBlockchainStatus = async () => {
      try {
        // Check if user is authenticated
        const token = localStorage.getItem('securevault_token');
        if (!token || !userId) {
          setLoading(false);
          return;
        }

        // Fetch blockchain status
        try {
          const statusRes = await blockchainAPI.status();
          setStatus(statusRes);
        } catch (error) {
          console.log('Blockchain status not available:', error.message);
          // Set a default status indicating blockchain is not available
          setStatus({
            initialized: false,
            connected: false,
            error: 'Blockchain service not available'
          });
        }

        // Fetch activity count
        try {
          const activityRes = await blockchainAPI.activity(userId);
          setActivityCount(activityRes.data?.length || 0);
        } catch (error) {
          // Activity might not be available yet
          setActivityCount(0);
        }

      } catch (error) {
        console.error('Failed to fetch blockchain status:', error);
        setStatus({
          initialized: false,
          connected: false,
          error: 'Failed to connect to blockchain service'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBlockchainStatus();
  }, [userId]);

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Loading blockchain status...</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const isActive = status?.initialized && status?.connected;
  const hasActivity = activityCount > 0;
  const hasError = status?.error;

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isActive ? 'bg-green-100' : 'bg-yellow-100'}`}>
            <Shield className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-yellow-600'}`} />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Blockchain Security</h3>
            <p className="text-sm text-gray-600">
              {isActive ? 'Active' : hasError ? 'Service Unavailable' : 'Offline'} - {hasActivity ? `${activityCount} operations recorded` : 'No activity yet'}
            </p>
            {hasError && (
              <p className="text-xs text-yellow-600 mt-1">
                {hasError}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isActive && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Secured</span>
            </div>
          )}
          
          {!isActive && (
            <div className="flex items-center gap-1 text-sm text-yellow-600">
              <AlertCircle className="w-4 h-4" />
              <span>{hasError ? 'Unavailable' : 'Offline'}</span>
            </div>
          )}
          
          <a
            href="/settings"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Details</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default BlockchainStatusSummary;
