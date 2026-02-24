import React, { useState } from 'react';
import vaultCrypt from '../utils/encryption';
import { computeMerkleRoot } from '../utils/merkle';
import IncrementalMerkleTree from '../utils/incremental-merkle';
import { credentialsAPI } from '../services/api';
import { argon2id } from '@noble/hashes/argon2.js';

const BenchmarkRunner = ({ masterKey }) => {
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [includeArgon2, setIncludeArgon2] = useState(false);
  const [cachedCredentials, setCachedCredentials] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, operation: '' });

  const log = (entry) => {
    setLogs((prev) => [...prev, { ...entry, ts: Date.now() }]);
  };

  const logEnv = () => {
    try {
      const nav = typeof navigator !== 'undefined' ? navigator : {};
      const win = typeof window !== 'undefined' ? window : {};
      log({
        op: 'env',
        userAgent: nav.userAgent || '',
        language: nav.language || '',
        hardwareConcurrency: nav.hardwareConcurrency || null,
        deviceMemory: nav.deviceMemory || null,
        screen: {
          width: win.innerWidth || null,
          height: win.innerHeight || null,
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      });
    } catch {
      // Best-effort only
    }
  };

  const runPBKDF2 = async (iterations, isWarmup = false) => {
    if (!masterKey) {
      throw new Error('Master key required for PBKDF2 benchmark');
    }
    const salt = vaultCrypt.generateSalt();
    const t0 = performance.now();
    await vaultCrypt.deriveKey(masterKey, salt, iterations);
    const t1 = performance.now();
    log({
      op: isWarmup ? 'pbkdf2-warmup' : 'pbkdf2',
      timeMs: t1 - t0,
      iterations: iterations || vaultCrypt.iterations,
    });
  };

  const runArgon2id = (config, isWarmup = false) => {
    if (!masterKey) {
      throw new Error('Master key required for Argon2id benchmark');
    }
    
    const saltBase64 = vaultCrypt.generateSalt();
    const binary = atob(saltBase64);
    const saltBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      saltBytes[i] = binary.charCodeAt(i);
    }

    const { time = 2, mem = 64 * 1024, parallelism = 1 } = config || {};

    const passwordBytes = new TextEncoder().encode(masterKey);

    const t0 = performance.now();
    const hash = argon2id(passwordBytes, saltBytes, {
      t: time,
      m: mem,
      p: parallelism,
      dkLen: 32,
    });
    const t1 = performance.now();

    log({
      op: isWarmup ? 'argon2id-warmup' : 'argon2id',
      timeMs: t1 - t0,
      params: { time, mem, parallelism },
    });
  };

  const runEncryptDecrypt = async (isWarmup = false) => {
    if (!masterKey) {
      throw new Error('Master key required for AES-GCM benchmark');
    }
    // Performance: Initialize session vault key for benchmark (simulates real login)
    // This ensures encryption uses pre-derived key (fast) instead of PBKDF2 per encrypt
    try {
      const userSalt = vaultCrypt.getOrGenerateUserSalt('benchmark@test.com');
      await vaultCrypt.initializeSessionVaultKey(masterKey, userSalt);
    } catch (e) {
      // If initialization fails, continue with legacy format
    }
    
    const password = vaultCrypt.generatePassword(16);
    // Encrypt
    const tEnc0 = performance.now();
    const enc = await vaultCrypt.encryptPassword(password, masterKey);
    const tEnc1 = performance.now();
    log({
      op: isWarmup ? 'encrypt-warmup' : 'encrypt',
      timeMs: tEnc1 - tEnc0,
    });
    // Decrypt
    const tDec0 = performance.now();
    const plain = await vaultCrypt.decryptPasswordAsync(
      enc.encryptedPassword,
      masterKey,
      enc.iv,
      enc.salt,
    );
    const tDec1 = performance.now();
    log({
      op: isWarmup ? 'decrypt-warmup' : 'decrypt',
      timeMs: tDec1 - tDec0,
    });
    if (plain !== password) {
      log({ op: 'decrypt-mismatch', expectedLen: password.length, gotLen: plain.length });
    }
  };

  const runMerkle = async (N, isWarmup = false) => {
    let allCreds = cachedCredentials;
    let fetchMs = 0;
    
    if (!allCreds) {
      const tFetch0 = performance.now();
      const res = await credentialsAPI.listAll();
      allCreds = res.data || res || [];
      const tFetch1 = performance.now();
      fetchMs = tFetch1 - tFetch0;
      setCachedCredentials(allCreds);
    }
    
    const creds = allCreds.slice(0, N);

    const tMerkle0 = performance.now();
    await computeMerkleRoot(creds);
    const tMerkle1 = performance.now();

    log({
      op: isWarmup ? 'merkle-warmup' : 'merkle',
      N,
      fetchMs,
      merkleMs: tMerkle1 - tMerkle0,
      totalMs: fetchMs + (tMerkle1 - tMerkle0),
    });
  };

  const runIncrementalMerkle = async (N, isWarmup = false) => {
    let allCreds = cachedCredentials;
    let fetchMs = 0;
    
    if (!allCreds) {
      const tFetch0 = performance.now();
      const res = await credentialsAPI.listAll();
      allCreds = res.data || res || [];
      const tFetch1 = performance.now();
      fetchMs = tFetch1 - tFetch0;
      setCachedCredentials(allCreds);
    }
    
    const creds = allCreds.slice(0, N);

    const tree = new IncrementalMerkleTree();
    const tInit0 = performance.now();
    await tree.initFromCredentials(creds);
    const tInit1 = performance.now();

    if (creds.length > 0) {
      const testCred = creds[0];
      const tUpdate0 = performance.now();
      await tree.updateLeaf(testCred._id || testCred.id, testCred);
      const tUpdate1 = performance.now();

      log({
        op: isWarmup ? 'merkle-incremental-warmup' : 'merkle-incremental',
        N,
        fetchMs,
        initMs: tInit1 - tInit0,
        updateMs: tUpdate1 - tUpdate0,
        totalMs: fetchMs + (tInit1 - tInit0) + (tUpdate1 - tUpdate0),
      });
    }
  };

  const runLoginE2E = async (N) => {
    if (!masterKey) {
      throw new Error('Master key required for login e2e benchmark');
    }

    const t0 = performance.now();

    const userSalt = vaultCrypt.getOrGenerateUserSalt('benchmark-login@test.com');
    await vaultCrypt.initializeSessionVaultKey(masterKey, userSalt);

    let allCreds = cachedCredentials;
    let fetchMs = 0;
    
    if (!allCreds) {
      const tFetch0 = performance.now();
      const res = await credentialsAPI.listAll();
      allCreds = res.data || res || [];
      const tFetch1 = performance.now();
      fetchMs = tFetch1 - tFetch0;
      setCachedCredentials(allCreds);
    }
    
    const creds = allCreds.slice(0, N);

    const tWarm0 = performance.now();
    await vaultCrypt.warmDecryptCache(creds, masterKey);
    const tWarm1 = performance.now();

    const tMerkle0 = performance.now();
    await computeMerkleRoot(creds);
    const tMerkle1 = performance.now();

    const t1 = performance.now();

    log({
      op: 'login-e2e',
      N,
      totalMs: t1 - t0,
      fetchMs,
      warmDecryptMs: tWarm1 - tWarm0,
      merkleMs: tMerkle1 - tMerkle0,
    });
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'securevault-bench-client.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const runAll = async () => {
    if (!masterKey) {
      alert('Unlock vault first so master key is available.');
      return;
    }
    setRunning(true);
    setLogs([]);
    setCachedCredentials(null); // Clear cache at start

    try {
      logEnv();
      // PBKDF2 iteration set for primary benchmark (100k / 310k / 600k)
      const iterationSets = [100000, 310000, 600000];
      const argon2Configs = [
        { time: 2, mem: 32 * 1024, parallelism: 1 },
        { time: 3, mem: 64 * 1024, parallelism: 1 },
      ];

      // Warm-ups
      for (let i = 0; i < 3; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await runPBKDF2(310000, true);
        if (includeArgon2) {
          try {
            // eslint-disable-next-line no-await-in-loop
            await runArgon2id({ time: 2, mem: 32 * 1024, parallelism: 1 }, true);
          } catch (e) {
            // Skip if Argon2 fails
          }
        }
        // eslint-disable-next-line no-await-in-loop
        await runEncryptDecrypt(true);
        // eslint-disable-next-line no-await-in-loop
        await runMerkle(100, true);
        // eslint-disable-next-line no-await-in-loop
        await runIncrementalMerkle(100, true);
      }

      // Merkle scaling up to 5000 credentials (as reported in paper)
      const Ns = [10, 50, 100, 250, 500, 1000, 2500, 5000];
      const RUNS_PER_COMBINATION = 10; // Keep original 10 runs
      const opsPerRun = includeArgon2 ? 6 : 4; // PBKDF2, Argon2(2), Encrypt/Decrypt, Merkle, Incremental Merkle
      const totalOps = Ns.length * iterationSets.length * RUNS_PER_COMBINATION * opsPerRun;
      let currentOp = 0;
      
      for (const N of Ns) {
        // For each vault size, sweep PBKDF2 iterations
        for (const iters of iterationSets) {
          // eslint-disable-next-line no-await-in-loop
          for (let i = 0; i < RUNS_PER_COMBINATION; i += 1) {
            setProgress({ 
              current: currentOp, 
              total: totalOps, 
              operation: `PBKDF2(${iters/1000}k) - N=${N} - Run ${i+1}/${RUNS_PER_COMBINATION}` 
            });
            // eslint-disable-next-line no-await-in-loop
            await runPBKDF2(iters, false);
            currentOp += 1;
            
            if (includeArgon2) {
              // eslint-disable-next-line no-await-in-loop
              for (const cfg of argon2Configs) {
                setProgress({ 
                  current: currentOp, 
                  total: totalOps, 
                  operation: `Argon2id - N=${N} - Run ${i+1}` 
                });
                try {
                  // eslint-disable-next-line no-await-in-loop
                  await runArgon2id(cfg, false);
                  currentOp += 1;
                } catch (error) {
                  // Log error but continue with other benchmarks
                  log({
                    op: 'argon2id-error',
                    error: error.message,
                    params: cfg,
                  });
                }
              }
            }
            
            setProgress({ 
              current: currentOp, 
              total: totalOps, 
              operation: `Encrypt/Decrypt - N=${N} - Run ${i+1}` 
            });
            // eslint-disable-next-line no-await-in-loop
            await runEncryptDecrypt(false);
            currentOp += 1;
            
            setProgress({ 
              current: currentOp, 
              total: totalOps, 
              operation: `Merkle(${N}) - Run ${i+1}` 
            });
            // eslint-disable-next-line no-await-in-loop
            await runMerkle(N, false);
            currentOp += 1;
            
            setProgress({ 
              current: currentOp, 
              total: totalOps, 
              operation: `Incremental Merkle(${N}) - Run ${i+1}` 
            });
            // eslint-disable-next-line no-await-in-loop
            await runIncrementalMerkle(N, false);
            currentOp += 1;
          }
        }
      }

      // End-to-end login-style benchmark for representative sizes
      const loginSizes = [100, 1000, 5000];
      for (const N of loginSizes) {
        setProgress({ 
          current: currentOp, 
          total: totalOps + loginSizes.length, 
          operation: `E2E Login - N=${N}` 
        });
        // eslint-disable-next-line no-await-in-loop
        await runLoginE2E(N);
        currentOp += 1;
      }
      
      setProgress({ current: totalOps + loginSizes.length, total: totalOps + loginSizes.length, operation: 'Complete!' });
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(`Benchmark error: ${e.message || e}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-2">SecureVault Benchmark Runner</h2>
      <p className="text-sm text-gray-600 mb-4">
        This tool collects client-side performance data (PBKDF2, Merkle computation, fetch+Merkle) for different vault sizes.
        Run it only in development on a stable network. After it finishes, download the JSON and analyze it with a script.
      </p>
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={runAll}
          disabled={running}
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:bg-gray-400"
        >
          {running ? 'Running benchmarks…' : 'Run Benchmarks'}
        </button>
        <button
          type="button"
          onClick={download}
          disabled={logs.length === 0}
          className="px-4 py-2 rounded bg-gray-700 text-white disabled:bg-gray-400"
        >
          Download Logs
        </button>
        <label className="flex items-center gap-2 text-xs text-gray-700">
          <input
            type="checkbox"
            checked={includeArgon2}
            onChange={(e) => setIncludeArgon2(e.target.checked)}
          />
          Include Argon2id KDF benchmarks (slower)
        </label>
      </div>
      {running && progress.total > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">
              Progress: {progress.current} / {progress.total} operations
            </span>
            <span className="text-sm text-blue-700">
              {Math.round((progress.current / progress.total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2.5 mb-2">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <div className="text-xs text-blue-800">
            Current: {progress.operation}
          </div>
        </div>
      )}
      <div className="text-xs text-gray-700 border rounded p-2 bg-gray-50 max-h-64 overflow-auto">
        <pre className="whitespace-pre-wrap">
          {JSON.stringify(logs.slice(-10), null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default BenchmarkRunner;


