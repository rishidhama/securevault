import React, { useState } from 'react';
import { blockchainAPI } from '../services/api';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Hash,
  Clock,
  ExternalLink,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { computeMerkleRoot } from '../utils/merkle';

const BlockchainVerifier = ({ userId, credentials }) => {
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [vaultData, setVaultData] = useState(null);
  const [merkleRoot, setMerkleRoot] = useState(null);

  const generateVaultData = () => {
    if (!credentials || credentials.length === 0) {
      return null;
    }

    // Create a summary of all credentials for verification
    const vaultSummary = credentials.map(cred => ({
      id: cred._id,
      title: cred.title,
      username: cred.username,
      url: cred.url,
      category: cred.category,
      createdAt: cred.createdAt,
      updatedAt: cred.updatedAt
    }));

    return {
      userId,
      credentialCount: credentials.length,
      credentials: vaultSummary,
      timestamp: new Date().toISOString()
    };
  };

  const handleVerify = async () => {
    if (!userId) {
      toast.error('User ID is required for verification');
      return;
    }

    setVerifying(true);
    setVerificationResult(null);

    try {
      // Generate current vault data
      const currentVaultData = generateVaultData();
      setVaultData(currentVaultData);

      if (!currentVaultData) {
        toast.error('No credentials found to verify');
        setVerifying(false);
        return;
      }

      // Compute client-side Merkle root of canonicalized items
      try {
        const root = await computeMerkleRoot(credentials);
        setMerkleRoot(root);
      } catch (_) {
        setMerkleRoot(null);
      }

      // Verify against blockchain (sends both legacy summary and new merkleRoot for compatibility)
      const payload = merkleRoot ? { userId, merkleRoot, vaultData: currentVaultData } : { userId, vaultData: currentVaultData };
      const result = await blockchainAPI.verify(userId, payload);
      setVerificationResult(result.data);

      if (result.data.integrityValid) {
        toast.success('Vault integrity verified successfully!');
      } else {
        toast.error('Vault integrity compromised - data has been modified');
      }

    } catch (error) {
      console.error('Verification failed:', error);
      
      if (error.message.includes('No vault hash found')) {
        toast.error('No blockchain record found for this user');
        setVerificationResult({
          integrityValid: false,
          message: 'No blockchain record found for this user'
        });
      } else {
        toast.error('Verification failed: ' + error.message);
      }
    } finally {
      setVerifying(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-primary-600" />
        <h2 className="text-2xl font-bold text-secondary-800">Blockchain Verification</h2>
      </div>

      {/* Verification Card */}
      <div className="bg-white border border-secondary-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-secondary-800">Verify Data Integrity</h3>
            <p className="text-sm text-secondary-600">
              Check if your vault data matches the blockchain record
            </p>
          </div>
          <button
            onClick={handleVerify}
            disabled={verifying || !userId}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
            {verifying ? 'Verifying...' : 'Verify Integrity'}
          </button>
        </div>

        {verificationResult && (
          <div className={`p-4 rounded-lg border ${
            verificationResult.integrityValid 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              {verificationResult.integrityValid ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <div className={`font-medium ${
                  verificationResult.integrityValid ? 'text-green-800' : 'text-red-800'
                }`}>
                  {verificationResult.integrityValid ? 'Integrity Verified' : 'Integrity Compromised'}
                </div>
                <div className={`text-sm ${
                  verificationResult.integrityValid ? 'text-green-700' : 'text-red-700'
                }`}>
                  {verificationResult.message}
                </div>
              </div>
            </div>

            {verificationResult.lastUpdated && (
              <div className="flex items-center gap-2 text-sm text-secondary-600">
                <Clock className="w-4 h-4" />
                <span>Last blockchain update: {formatTimestamp(verificationResult.lastUpdated)}</span>
              </div>
            )}
          </div>
        )}

        {vaultData && (
          <div className="mt-4 p-4 bg-secondary-50 rounded-lg">
            <div className="text-sm font-medium text-secondary-700 mb-2">Current Vault Summary</div>
            <div className="text-sm text-secondary-600">
              <div>User ID: {vaultData.userId}</div>
              <div>Credential Count: {vaultData.credentialCount}</div>
              <div>Generated: {formatTimestamp(vaultData.timestamp)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Hash Comparison */}
      {verificationResult && (
        <div className="bg-white border border-secondary-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-secondary-800 mb-4">Hash Comparison</h3>
          
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-secondary-700 mb-1">Current Vault Hash</div>
              <div className="text-xs text-secondary-600 break-all bg-secondary-50 p-2 rounded">
                {verificationResult.currentHash}
              </div>
            </div>

            {merkleRoot && (
              <div>
                <div className="text-sm font-medium text-secondary-700 mb-1">Client Merkle Root</div>
                <div className="text-xs text-secondary-600 break-all bg-secondary-50 p-2 rounded">
                  {merkleRoot}
                </div>
              </div>
            )}

            <div>
              <div className="text-sm font-medium text-secondary-700 mb-1">Stored Blockchain Hash</div>
              <div className="text-xs text-secondary-600 break-all bg-secondary-50 p-2 rounded">
                {verificationResult.storedHash}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {verificationResult.integrityValid ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                verificationResult.integrityValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {verificationResult.integrityValid ? 'Hashes Match' : 'Hashes Do Not Match'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Information Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-blue-800 mb-1">How Verification Works</div>
            <div className="text-sm text-blue-700">
              This tool compares your current vault data with the hash stored on the blockchain. 
              If the hashes match, your data hasn't been tampered with. If they don't match, 
              it indicates that your data has been modified since the last blockchain record.
            </div>
          </div>
        </div>
      </div>

      {/* Warning Card */}
      {verificationResult && !verificationResult.integrityValid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-red-800 mb-1">Integrity Warning</div>
              <div className="text-sm text-red-700">
                Your vault data doesn't match the blockchain record. This could indicate:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Data has been modified without blockchain recording</li>
                  <li>Blockchain service was temporarily unavailable</li>
                  <li>Potential security breach</li>
                </ul>
                Please contact support if you didn't make recent changes to your vault.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockchainVerifier;
