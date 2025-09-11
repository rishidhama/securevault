import React, { useEffect, useState } from 'react';
import { blockchainAPI } from '../services/api';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  RefreshCw,
  Activity,
  Hash,
  Calendar,
  Wallet
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const BlockchainMonitor = ({ userId }) => {
  const [status, setStatus] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchBlockchainData = async () => {
    try {
      setRefreshing(true);
      
      // Check if user is authenticated
      const token = localStorage.getItem('securevault_token');
      if (!token) {
        console.log('User not authenticated, skipping blockchain data fetch');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Fetch blockchain status
      const statusRes = await blockchainAPI.status();
      setStatus(statusRes.ethereum);
      
      // Fetch transaction history if user ID is provided
      if (userId) {
        try {
          const historyRes = await blockchainAPI.history(userId);
          setTransactions(historyRes.data || []);
        } catch (error) {
          console.log('No transaction history available yet');
          setTransactions([]);
        }
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch blockchain data:', error);
      // Don't show error toast if it's an authentication issue
      if (!error.message.includes('Authentication')) {
        toast.error('Failed to fetch blockchain status');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBlockchainData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchBlockchainData, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getStatusIcon = (status) => {
    if (status?.initialized) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusText = (status) => {
    if (!status) return 'Unknown';
    if (status.enabled && status.initialized) return 'Active';
    if (status.enabled && !status.initialized) return 'Connecting...';
    return 'Disabled';
  };

  const getStatusColor = (status) => {
    if (!status) return 'text-gray-500';
    if (status.enabled && status.initialized) return 'text-green-600';
    if (status.enabled && !status.initialized) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white border border-secondary-200 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-primary-600 mr-2" />
          <span className="text-sm text-secondary-600">Loading blockchain status...</span>
        </div>
      </div>
    );
  }

  const networkInfo = status?.networkInfo || {};

  return (
    <div className="space-y-4">
      {/* Blockchain Status Card */}
      <div className="bg-white border border-secondary-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-secondary-800">Blockchain Status</h3>
          </div>
          <button 
            onClick={fetchBlockchainData}
            disabled={refreshing}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
            {getStatusIcon(status)}
            <div>
              <div className="text-sm font-medium text-secondary-700">Status</div>
              <div className={`text-sm ${getStatusColor(status)}`}>
                {getStatusText(status)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
            <Activity className="w-4 h-4 text-blue-500" />
            <div>
              <div className="text-sm font-medium text-secondary-700">Network</div>
              <div className="text-sm text-secondary-600">
                {networkInfo.network || 'Unknown'} (ID: {networkInfo.chainId || 'N/A'})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
            <Wallet className="w-4 h-4 text-purple-500" />
            <div>
              <div className="text-sm font-medium text-secondary-700">Balance</div>
              <div className="text-sm text-secondary-600">
                {networkInfo.balance ? `${networkInfo.balance} ETH` : 'N/A'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
            <Activity className="w-4 h-4 text-orange-500" />
            <div>
              <div className="text-sm font-medium text-secondary-700">Gas Price</div>
              <div className="text-sm text-secondary-600">
                {networkInfo.gasPrice || 'N/A'}
              </div>
            </div>
          </div>

        </div>

        {status?.initialized && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-secondary-700 mb-1">Wallet Address</div>
                <div className="text-xs text-secondary-600 break-all bg-secondary-50 p-2 rounded">
                  {networkInfo.walletAddress || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-secondary-700 mb-1">Contract Address</div>
                <div className="text-xs text-secondary-600 break-all bg-secondary-50 p-2 rounded">
                  {networkInfo.contractAddress || 'N/A'}
                </div>
              </div>
            </div>


            {networkInfo.contractAddress && (
              <div className="flex justify-center">
                <a
                  href={`https://sepolia.etherscan.io/address/${networkInfo.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Contract on Etherscan
                </a>
              </div>
            )}
          </div>
        )}

        {lastUpdate && (
          <div className="mt-4 pt-4 border-t border-secondary-200">
            <div className="flex items-center gap-2 text-xs text-secondary-500">
              <Clock className="w-3 h-3" />
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      {/* Transaction History */}
      {userId && (
        <div className="bg-white border border-secondary-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-secondary-800">Transaction History</h3>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-secondary-500 mb-2">No blockchain transactions yet</div>
              <div className="text-sm text-secondary-400">
                Transactions will appear here when you add, update, or delete credentials
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="text-sm font-medium text-secondary-700">
                        Transaction #{tx.blockNumber}
                      </div>
                      <div className="text-xs text-secondary-500">
                        {formatTimestamp(tx.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-secondary-600 break-all max-w-xs">
                      {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                    </div>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BlockchainMonitor;
