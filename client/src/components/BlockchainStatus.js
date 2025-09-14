import React, { useEffect, useState } from 'react';
import { blockchainAPI } from '../services/api';

const BlockchainStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await blockchainAPI.status();
      setStatus(res.ethereum || null);
    } catch (e) {
      setError(e.message || 'Failed to load blockchain status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-secondary-200 rounded-lg p-4">
        <div className="text-sm text-secondary-600">Loading blockchain status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-danger-200 rounded-lg p-4">
        <div className="text-sm text-danger-600">{error}</div>
      </div>
    );
  }

  const info = status?.networkInfo || {};

  return (
    <div className="bg-white border border-secondary-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-secondary-700">Blockchain (Sepolia)</div>
          {status?.initialized ? (
            <div className="text-xs text-secondary-500 mt-1">
              Connected · {info.network} · ChainId {info.chainId}
            </div>
          ) : (
            <div className="text-xs text-secondary-500 mt-1">Not initialized</div>
          )}
        </div>
        <button onClick={fetchStatus} className="btn-secondary text-sm">Refresh</button>
      </div>
      {status?.initialized && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div className="text-xs text-secondary-600">
            <div className="font-medium text-secondary-700">Wallet</div>
            <div className="break-all">{info.walletAddress || '-'}</div>
          </div>
          <div className="text-xs text-secondary-600">
            <div className="font-medium text-secondary-700">Balance</div>
            <div>{info.balance ? `${info.balance} ETH` : '-'}</div>
          </div>
          <div className="text-xs text-secondary-600">
            <div className="font-medium text-secondary-700">Gas Price</div>
            <div>{info.gasPrice || '-'}</div>
          </div>
          <div className="text-xs text-secondary-600">
            <div className="font-medium text-secondary-700">Contract</div>
            <div className="break-all">{info.contractAddress || '-'}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockchainStatus;


