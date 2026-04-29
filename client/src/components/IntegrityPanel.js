import React, { useEffect, useState } from 'react';
import { blockchainAPI } from '../services/api';
import { Shield, RefreshCw, Link as LinkIcon, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

const IntegrityPanel = () => {
  const [status, setStatus] = useState(null);
  const [lastAnchor, setLastAnchor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getExplorerBase = (chainId) => {
    const id = chainId === undefined || chainId === null ? '' : String(chainId);
    if (id === '421614') return 'https://sepolia.arbiscan.io';
    if (id === '42161') return 'https://arbiscan.io';
    if (id === '11155111') return 'https://sepolia.etherscan.io';
    return 'https://sepolia.arbiscan.io';
  };

  const loadStatus = async () => {
    try {
      const res = await blockchainAPI.status();
      const eth = res?.ethereum || null;
      if (eth) {
        setStatus(eth);
        const info = eth.networkInfo || {};
        // We don't track "last anchor" events here; we surface the currently configured contract/network info.
        setLastAnchor({
          contract: info.contractAddress || eth.contract,
          network: info.network || eth.network,
          chainId: info.chainId,
          balance: info.balance || eth.balance
        });
      }
    } catch (e) {
      // Ignore silently in UI
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleAnchor = async () => {
    try {
      setIsLoading(true);
      // For blockchain, we can't manually "anchor" - it happens automatically
      // Instead, let's refresh the status
      await loadStatus();
      toast.success('Blockchain status refreshed');
    } catch (e) {
      toast.error(e.message || 'Failed to refresh blockchain status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-secondary-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary-600" />
          <div className="text-sm font-medium text-secondary-700">Data Integrity</div>
        </div>
        <button onClick={handleAnchor} disabled={isLoading} className="btn-primary text-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          {isLoading ? 'Refreshing...' : 'Refresh Status'}
        </button>
      </div>
      <div className="text-xs text-secondary-600">
        <div className="mb-2">
          Real-time blockchain anchoring for tamper-evidence.
        </div>
        {status && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-secondary-700">
            <div>Enabled: <span className="font-medium">{status.enabled ? 'Yes' : 'No'}</span></div>
            <div>Network: <span className="font-medium">{status.networkInfo?.network || '—'}</span></div>
            <div>
              Wallet: <span className="font-medium">
                {status.networkInfo?.walletAddress
                  ? `${status.networkInfo.walletAddress.slice(0, 6)}...${status.networkInfo.walletAddress.slice(-4)}`
                  : '—'}
              </span>
            </div>
          </div>
        )}
        {lastAnchor && (
          <div className="mt-3 p-3 bg-secondary-50 rounded border border-secondary-200">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3 h-3" />
              <span className="text-secondary-700">Blockchain Status</span>
            </div>
            <div className="break-all text-[11px] text-secondary-700">Contract: {lastAnchor.contract}</div>
            <div className="text-[11px] text-secondary-600">Network: {lastAnchor.network} - Balance: {lastAnchor.balance} ETH</div>
            {lastAnchor.contract && (
              <div className="mt-1">
                <a
                  className="inline-flex items-center gap-1 text-primary-700 underline"
                  href={`${getExplorerBase(lastAnchor.chainId)}/address/${lastAnchor.contract}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <LinkIcon className="w-3 h-3" /> View Contract on Explorer
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrityPanel;


