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
  Tag,
  Globe
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const BlockchainActivityLog = ({ userId }) => {
  const [anchored, setAnchored] = useState([]);
  const [anchoredGroups, setAnchoredGroups] = useState([]);
  const [queued, setQueued] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivityLog = async () => {
    try {
      setRefreshing(true);
      
      const token = localStorage.getItem('securevault_token');
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      if (userId) {
        try {
          const opsRes = await blockchainAPI.operations(userId);
          const data = opsRes.data || opsRes;
          setQueued(data.queued || []);
          setAnchored(data.anchored || []);
          setAnchoredGroups(data.anchoredGroups || []);
        } catch (error) {
          setQueued([]);
          setAnchored([]);
          setAnchoredGroups([]);
        }
      }
      
    } catch (error) {
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
    
    const interval = setInterval(fetchActivityLog, 30000);
    return () => clearInterval(interval);
  }, [userId]);


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

      {/* Queued */}
      {queued.length > 0 && (
        <div className="bg-white border border-secondary-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-secondary-800 mb-3">Queued (pending anchoring)</h4>
          <div className="space-y-2">
            {queued.map((q, idx) => {
              const ActionIcon = getActionIcon(q.action);
              const actionColor = getActionColor(q.action);
              const actionBgColor = getActionBgColor(q.action);
              return (
                <div key={idx} className="flex items-start gap-3 border border-secondary-100 rounded-lg p-3">
                  <div className={`p-2 rounded-lg ${actionBgColor}`}>
                    <ActionIcon className={`w-4 h-4 ${actionColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-secondary-800 truncate">
                        {q.title || 'Credential Operation'}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${actionBgColor} ${actionColor}`}>
                        {q.action}
                      </span>
                    </div>
                    <div className="text-xs text-secondary-600 mt-1">
                      {q.category ? `Category: ${q.category}` : null}
                      {q.createdAt ? ` • ${new Date(q.createdAt).toLocaleString()}` : null}
                    </div>
                    <div className="text-[11px] text-secondary-400 font-mono mt-1 break-all">
                      {q.vaultHash}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Anchored Activity List */}
      {anchored.length === 0 && anchoredGroups.length === 0 && queued.length === 0 ? (
        <div className="bg-white border border-secondary-200 rounded-lg p-8 text-center">
          <Activity className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-secondary-700 mb-2">No Blockchain Activity Yet</h4>
          <p className="text-secondary-500 mb-4">
            Blockchain activity will appear here when you add, update, or delete credentials
          </p>
          <div className="text-sm text-secondary-400">
            Each operation is recorded on the configured blockchain network for tamper-evidence
          </div>
        </div>
      ) : anchoredGroups.length > 0 ? (
        <div className="space-y-3">
          {anchoredGroups.map((group, index) => {
            const ops = Array.isArray(group.operations) ? group.operations : [];
            const primary = ops[0] || {};
            const actionCounts = ops.reduce((acc, op) => {
              const key = op?.action || 'OTHER';
              acc[key] = (acc[key] || 0) + 1;
              return acc;
            }, {});
            const actionSummary = ['CREATE', 'UPDATE', 'DELETE']
              .filter((action) => actionCounts[action])
              .map((action) => `${action} x${actionCounts[action]}`)
              .join(' • ');
            const ActionIcon = getActionIcon(primary.action);
            const actionColor = getActionColor(primary.action);
            const actionBgColor = getActionBgColor(primary.action);
            return (
              <div key={index} className="bg-white border border-secondary-200 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${actionBgColor}`}>
                    <ActionIcon className={`w-5 h-5 ${actionColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-medium text-secondary-800">
                        {ops.length > 1 ? `${ops.length} operations anchored together` : (primary.title || 'Credential Operation')}
                      </h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-700">
                        Batch
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-secondary-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(group.timestamp * 1000).toLocaleString()}</span>
                      </div>
                      {actionSummary ? (
                        <div className="text-xs text-secondary-500">
                          {actionSummary}
                        </div>
                      ) : null}
                      <div className="flex items-center gap-2">
                        <Hash className="w-3 h-3" />
                        <span className="font-mono text-xs">
                          Block: #{group.blockNumber}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      {ops.map((op, opIndex) => {
                        const OpIcon = getActionIcon(op.action);
                        const opColor = getActionColor(op.action);
                        const opBg = getActionBgColor(op.action);
                        return (
                          <div key={`${op.credentialId || 'op'}-${opIndex}`} className="flex items-start gap-2 border border-secondary-100 rounded-lg p-2">
                            <div className={`p-1.5 rounded ${opBg}`}>
                              <OpIcon className={`w-3.5 h-3.5 ${opColor}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium text-secondary-800 truncate">
                                {op.title || 'Credential Operation'}
                              </div>
                              <div className="text-[11px] text-secondary-500">
                                {op.action}
                                {op.category ? ` • ${op.category}` : ''}
                                {op.status === 'superseded' ? ' • superseded in batch' : ''}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <a
                      href={group.etherscanUrl || `https://sepolia.arbiscan.io/tx/${group.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <div className="text-xs text-secondary-500 font-mono">
                      {group.txHash.slice(0, 8)}...{group.txHash.slice(-6)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {anchored.map((activity, index) => {
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
                        <span>{new Date(activity.timestamp * 1000).toLocaleString()}</span>
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
                      href={activity.etherscanUrl || `https://sepolia.arbiscan.io/tx/${activity.txHash}`}
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
              Every credential operation (add, update, delete) is automatically recorded on the configured blockchain
              network. The blockchain stores a cryptographic hash of the operation details, providing tamper-evidence
              and a permanent audit trail of all changes to your vault.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainActivityLog;
