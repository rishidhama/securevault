import React, { useState } from 'react';
import vaultCrypt from '../utils/encryption';
import { computeMerkleRoot } from '../utils/merkle';
import IncrementalMerkleTree from '../utils/incremental-merkle';
import { credentialsAPI } from '../services/api';

const BenchmarkRunner = ({ masterKey }) => {
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);

  const log = (entry) => {
    setLogs((prev) => [...prev, { ...entry, ts: Date.now() }]);
  };

  const runPBKDF2 = async (iterations) => {
    if (!masterKey) {
      throw new Error('Master key required for PBKDF2 benchmark');
    }
    const salt = vaultCrypt.generateSalt();
    const t0 = performance.now();
    await vaultCrypt.deriveKey(masterKey, salt, iterations);
    const t1 = performance.now();
    log({
      op: 'pbkdf2',
      timeMs: t1 - t0,
      iterations: iterations || vaultCrypt.iterations,
    });
  };

  const runEncryptDecrypt = async () => {
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
      op: 'encrypt',
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
      op: 'decrypt',
      timeMs: tDec1 - tDec0,
    });
    if (plain !== password) {
      log({ op: 'decrypt-mismatch', expectedLen: password.length, gotLen: plain.length });
    }
  };

  const runMerkle = async (N) => {
    const tFetch0 = performance.now();
    const res = await credentialsAPI.listAll();
    const allCreds = res.data || res || [];
    const creds = allCreds.slice(0, N);
    const tFetch1 = performance.now();

    const tMerkle0 = performance.now();
    await computeMerkleRoot(creds);
    const tMerkle1 = performance.now();

    log({
      op: 'merkle',
      N,
      fetchMs: tFetch1 - tFetch0,
      merkleMs: tMerkle1 - tMerkle0,
      totalMs: (tFetch1 - tFetch0) + (tMerkle1 - tMerkle0),
    });
  };

  const runIncrementalMerkle = async (N) => {
    const tFetch0 = performance.now();
    const res = await credentialsAPI.listAll();
    const allCreds = res.data || res || [];
    const creds = allCreds.slice(0, N);
    const tFetch1 = performance.now();

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
        op: 'merkle-incremental',
        N,
        fetchMs: tFetch1 - tFetch0,
        initMs: tInit1 - tInit0,
        updateMs: tUpdate1 - tUpdate0,
        totalMs: (tFetch1 - tFetch0) + (tInit1 - tInit0) + (tUpdate1 - tUpdate0),
      });
    }
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

    try {
      // PBKDF2 iteration set for primary benchmark (100k / 310k / 600k)
      const iterationSets = [100000, 310000, 600000];

      // Warm-ups
      for (let i = 0; i < 3; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await runPBKDF2(310000);
        await runEncryptDecrypt();
        await runMerkle(100);
      }

      // Merkle scaling up to 5000 credentials (as reported in paper)
      const Ns = [10, 50, 100, 250, 500, 1000, 2500, 5000];
      for (const N of Ns) {
        // For each vault size, sweep PBKDF2 iterations
        for (const iters of iterationSets) {
          // eslint-disable-next-line no-await-in-loop
          for (let i = 0; i < 10; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            await runPBKDF2(iters);
            // eslint-disable-next-line no-await-in-loop
            await runEncryptDecrypt();
            // eslint-disable-next-line no-await-in-loop
            await runMerkle(N);
            // eslint-disable-next-line no-await-in-loop
            await runIncrementalMerkle(N);
          }
        }
      }
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
      </div>
      <div className="text-xs text-gray-700 border rounded p-2 bg-gray-50 max-h-64 overflow-auto">
        <pre className="whitespace-pre-wrap">
          {JSON.stringify(logs.slice(-10), null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default BenchmarkRunner;


