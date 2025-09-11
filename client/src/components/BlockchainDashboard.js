import React, { useEffect, useState } from 'react';
import { blockchainAPI } from '../services/api';
import { 
  Activity, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink,
  RefreshCw,
  Hash,
  Calendar,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const BlockchainDashboard = ({ userId }) => {
  const [status, setStatus] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllData = async () => {
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
      
      // Fetch blockchain stats
      try {
        const statsRes = await blockchainAPI.stats();
        setStats(statsRes.data);
      } catch (error) {
        console.log('Stats not available');
      }
      
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
      
    } catch (error) {
      console.error('Failed to fetch blockchain data:', error);
      // Don't show error toast if it's an authentication issue
      if (!error.message.includes('Authentication')) {
        toast.error('Failed to fetch blockchain data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchAllData, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getStatusIcon = (status) => {
    if (status?.initialized) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <XCircle className="w-5 h-5 text-red-500" />;
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
      <div className="space-y-6">
        <div className="bg-white border border-secondary-200 rounded-lg p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-primary-600 mr-3" />
            <span className="text-lg text-secondary-600">Loading blockchain dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  const networkInfo = status?.networkInfo || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-primary-600" />
          <h2 className="text-2xl font-bold text-secondary-800">Blockchain Dashboard</h2>
        </div>
        <button 
          onClick={fetchAllData}
          disabled={refreshing}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-secondary-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            {getStatusIcon(status)}
            <div>
              <div className="text-sm font-medium text-secondary-700">Blockchain Status</div>
              <div className={`text-lg font-semibold ${getStatusColor(status)}`}>
                {getStatusText(status)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-secondary-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-sm font-medium text-secondary-700">Total Transactions</div>
              <div className="text-lg font-semibold text-secondary-800">
                {transactions.length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-secondary-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-purple-500" />
            <div>
              <div className="text-sm font-medium text-secondary-700">Wallet Balance</div>
              <div className="text-lg font-semibold text-secondary-800">
                {networkInfo.balance ? `${networkInfo.balance} ETH` : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-secondary-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Hash className="w-5 h-5 text-green-500" />
            <div>
              <div className="text-sm font-medium text-secondary-700">Network</div>
              <div className="text-lg font-semibold text-secondary-800">
                {networkInfo.network || 'Unknown'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Status */}
      <div className="bg-white border border-secondary-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-secondary-800">Blockchain Configuration</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-secondary-700 mb-1">Network Information</div>
              <div className="space-y-2 text-sm text-secondary-600">
                <div>Network: {networkInfo.network || 'N/A'}</div>
                <div>Chain ID: {networkInfo.chainId || 'N/A'}</div>
                <div>Gas Price: {networkInfo.gasPrice || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-secondary-700 mb-1">Wallet Information</div>
              <div className="space-y-2 text-sm text-secondary-600">
                <div className="break-all">Address: {networkInfo.walletAddress || 'N/A'}</div>
                <div className="break-all">Contract: {networkInfo.contractAddress || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        {networkInfo.contractAddress && (
          <div className="mt-4 pt-4 border-t border-secondary-200">
            <a
              href={`https://sepolia.etherscan.io/address/${networkInfo.contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
            >
              <ExternalLink className="w-4 h-4" />
              View Contract on Etherscan
            </a>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="bg-white border border-secondary-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-secondary-800">Recent Transactions</h3>
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
            {transactions.slice(0, 10).map((tx, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="text-sm font-medium text-secondary-700">
                      Block #{tx.blockNumber}
                    </div>
                    <div className="text-xs text-secondary-500">
                      {formatTimestamp(tx.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-secondary-600 break-all max-w-xs">
                    {tx.txHash.slice(0, 12)}...{tx.txHash.slice(-8)}
                  </div>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blockchain Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-blue-800 mb-1">How Blockchain Integration Works</div>
            <div className="text-sm text-blue-700">
              Every credential operation (add, update, delete) is automatically recorded on the Sepolia blockchain 
              for tamper-evidence. This provides cryptographic proof that your data hasn't been modified without 
              your knowledge. The blockchain stores only metadata hashes, never your actual passwords or sensitive data.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainDashboard;
