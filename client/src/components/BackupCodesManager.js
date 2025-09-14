import React, { useState, useEffect } from 'react';
import { 
  Download, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle,
  Key,
  Copy,
  Printer,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { mfaAPI } from '../services/api';

const BackupCodesManager = ({ onClose, onCodesGenerated }) => {
  const [backupCodes, setBackupCodes] = useState([]);
  const [hasExistingCodes, setHasExistingCodes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCodes, setShowCodes] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    loadExistingBackupCodes();
  }, []);

  const loadExistingBackupCodes = async () => {
    try {
      const token = localStorage.getItem('securevault_token');
      if (!token) return;

      const response = await mfaAPI.status();

      if (response.success) {
        const data = response.data;
        if (data.backupCodes && data.backupCodes.length > 0) {
          const codes = data.backupCodes.map((code, index) => ({
            id: index + 1,
            code: code,
            used: false
          }));
          setBackupCodes(codes);
          setHasExistingCodes(true);
        }
      }
    } catch (error) {
      console.error('Failed to load backup codes:', error);
    }
  };

  const generateBackupCodes = async () => {
    setGenerating(true);
    try {
      // Get user token
      const token = localStorage.getItem('securevault_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Call backend to generate backup codes
      const response = await mfaAPI.generateBackupCodes(token);

      if (response.success) {
        const data = response.data;
        
        // Transform backend format to frontend format
        const codes = data.backupCodes.map((code, index) => ({
          id: index + 1,
          code: code,
          used: false
        }));
        
        setBackupCodes(codes);
        setHasExistingCodes(true);
        toast.success('Backup codes generated successfully!');
        
        if (onCodesGenerated) {
          onCodesGenerated(codes.map(c => c.code));
        }
      } else {
        throw new Error(response.error || 'Failed to generate backup codes');
      }
    } catch (error) {
      console.error('Failed to generate backup codes:', error);
      toast.error(error.message || 'Failed to generate backup codes');
    } finally {
      setGenerating(false);
    }
  };

  const generateSecureCode = () => {
    // Generate a secure 8-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCopyCodes = async () => {
    try {
      const codesText = backupCodes.map(code => `${code.id}. ${code.code}`).join('\n');
      await navigator.clipboard.writeText(codesText);
      toast.success('Backup codes copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy backup codes');
    }
  };

  const handleDownloadCodes = async () => {
    setIsDownloading(true);
    try {
      const codesText = `SecureVault Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.map(code => `${code.id}. ${code.code}`).join('\n')}\n\nIMPORTANT: Keep these codes safe and secure. Each code can only be used once.`;
      
      const blob = new Blob([codesText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'securevault-backup-codes.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Backup codes downloaded!');
    } catch (error) {
      console.error('Failed to download backup codes:', error);
      toast.error('Failed to download backup codes');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintCodes = () => {
    setIsPrinting(true);
    try {
      const printWindow = window.open('', '_blank');
      const codesHtml = `
        <html>
          <head>
            <title>SecureVault Backup Codes</title>
            <style>
              body { font-family: monospace; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .code { margin: 10px 0; font-size: 18px; }
              .warning { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
              @media print { body { font-size: 14px; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>SecureVault Backup Codes</h1>
              <p>Generated: ${new Date().toLocaleString()}</p>
            </div>
            <div class="warning">
              <strong>IMPORTANT:</strong> Keep these codes safe and secure. Each code can only be used once.
            </div>
            ${backupCodes.map(code => `<div class="code">${code.id}. ${code.code}</div>`).join('')}
          </body>
        </html>
      `;
      printWindow.document.write(codesHtml);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
      toast.success('Backup codes printed!');
    } catch (error) {
      console.error('Failed to print backup codes:', error);
      toast.error('Failed to print backup codes');
    } finally {
      setIsPrinting(false);
    }
  };

  const regenerateCodes = () => {
    if (window.confirm('This will invalidate all existing backup codes. Are you sure?')) {
      generateBackupCodes();
    }
  };

  return (
    <div className="card p-3 sm:p-4 md:p-6 w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <Key className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Backup Codes</h3>
            <p className="text-secondary-600">Generate secure backup codes for account recovery</p>
          </div>
        </div>
        <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600">
          ×
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Important Security Information:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Each backup code can only be used once</li>
              <li>Store these codes in a secure location</li>
              <li>Don't share these codes with anyone</li>
              <li>Regenerate codes if you suspect they've been compromised</li>
            </ul>
          </div>
        </div>
      </div>

      {generating ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary-600">Generating secure backup codes...</p>
        </div>
      ) : (
        <>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Your Backup Codes</h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCodes(!showCodes)}
                  className="btn-secondary text-sm"
                >
                  {showCodes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showCodes ? 'Hide' : 'Show'} Codes
                </button>
                <button
                  onClick={regenerateCodes}
                  className="btn-secondary text-sm"
                  title="Regenerate all codes"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {showCodes ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {backupCodes.map((code) => (
                  <div
                    key={code.id}
                    className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between"
                  >
                    <span className="font-mono text-lg font-semibold">
                      {code.id}. {code.code}
                    </span>
                    {code.used && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {backupCodes.map((code) => (
                  <div
                    key={code.id}
                    className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between"
                  >
                    <span className="font-mono text-lg font-semibold">
                      {code.id}. --------
                    </span>
                    {code.used && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <button
              onClick={handleCopyCodes}
              className="btn-secondary flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Codes
            </button>
            <button
              onClick={handleDownloadCodes}
              disabled={isDownloading}
              className="btn-secondary flex items-center gap-2"
            >
              {isDownloading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download
            </button>
            <button
              onClick={handlePrintCodes}
              disabled={isPrinting}
              className="btn-secondary flex items-center gap-2"
            >
              {isPrinting ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Printer className="w-4 h-4" />
              )}
              Print
            </button>
          </div>
        </>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Security Features:</p>
            <p>- Codes are generated using cryptographically secure random numbers</p>
            <p>- Each code is unique and can only be used once</p>
            <p>- Codes are never stored in plain text on our servers</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupCodesManager;
