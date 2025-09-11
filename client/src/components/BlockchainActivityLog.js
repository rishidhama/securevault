import React, { useEffect, useState } from 'react';
import { blockchainAPI } from '../services/api';
import { 
  Activity, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  ExternalLink,
  RefreshCw,
  Hash,
  Calendar,
  User,
  Tag,
  Globe
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const BlockchainActivityLog = ({ userId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivityLog = async () => {
    try {
      setRefreshing(true);
      
      // Check if user is authenticated
      const token = localStorage.getItem('securevault_token');
      if (!token) {
        console.log('User not authenticated, skipping activity log fetch');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Fetch detailed blockchain activity
      if (userId) {
        try {
          const activityRes = await blockchainAPI.activity(userId);
          setActivities(activityRes.data || []);
        } catch (error) {
          console.log('No blockchain activity available yet');
          setActivities([]);
        }
      }
      
    } catch (error) {
      console.error('Failed to fetch activity log:', error);
      if (!error.message.includes('Authentication')) {
        toast.error('Failed to fetch blockchain activity');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    fetchActivityLog();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActivityLog, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getActionIcon = (action) => {
    const actionMap = {
      'CREATE': Plus,
      'UPDATE': Edit,
      'DELETE': Trash2
    };
    return actionMap[action] || Activity;
  };

  const getActionColor = (action) => {
    const colorMap = {
      'CREATE': 'text-green-600',
      'UPDATE': 'text-blue-600',
      'DELETE': 'text-red-600'
    };
    return colorMap[action] || 'text-gray-600';
  };

  const getActionBgColor = (action) => {
    const bgColorMap = {
      'CREATE': 'bg-green-50',
      'UPDATE': 'bg-blue-50',
      'DELETE': 'bg-red-50'
    };
    return bgColorMap[action] || 'bg-gray-50';
  };

  if (loading) {
    return (
      <div className="bg-white border border-secondary-200 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-primary-600 mr-3" />
          <span className="text-lg text-secondary-600">Loading blockchain activity...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-primary-600" />
          <h3 className="text-xl font-semibold text-secondary-800">Blockchain Activity Log</h3>
        </div>
        <button 
          onClick={fetchActivityLog}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Activity List */}
      {activities.length === 0 ? (
        <div className="bg-white border border-secondary-200 rounded-lg p-8 text-center">
          <Activity className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-secondary-700 mb-2">No Blockchain Activity Yet</h4>
          <p className="text-secondary-500 mb-4">
            Blockchain activity will appear here when you add, update, or delete credentials
          </p>
          <div className="text-sm text-secondary-400">
            Each operation is recorded on the Sepolia blockchain for tamper-evidence
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity, index) => {
            const ActionIcon = getActionIcon(activity.action);
            const actionColor = getActionColor(activity.action);
            const actionBgColor = getActionBgColor(activity.action);
            
            return (
              <div key={index} className="bg-white border border-secondary-200 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${actionBgColor}`}>
                    <ActionIcon className={`w-5 h-5 ${actionColor}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-medium text-secondary-800">
                        {activity.title || 'Credential Operation'}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${actionBgColor} ${actionColor}`}>
                        {activity.action}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-secondary-600">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3 h-3" />
                        <span>Category: {activity.category}</span>
                      </div>
                      
                      {activity.hasUrl && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-3 h-3" />
                          <span>Has URL</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimestamp(activity.timestamp)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Hash className="w-3 h-3" />
                        <span className="font-mono text-xs">
                          Block: #{activity.blockNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${activity.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <div className="text-xs text-secondary-500 font-mono">
                      {activity.txHash.slice(0, 8)}...{activity.txHash.slice(-6)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-blue-800 mb-1">How Blockchain Activity Works</div>
            <div className="text-sm text-blue-700">
              Every credential operation (add, update, delete) is automatically recorded on the Sepolia blockchain. 
              The blockchain stores a cryptographic hash of the operation details, providing tamper-evidence 
              and a permanent audit trail of all changes to your vault.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainActivityLog;
