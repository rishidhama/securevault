/* eslint-disable no-console */
/**
 * Concurrent load tests for SecureVault.
 *
 * Examples:
 *   node scripts/load-test.js login --url http://localhost:5000 --email a@b.com --masterKey "MyMasterKey123!"
 *   node scripts/load-test.js credentials --url http://localhost:5000 --email a@b.com --masterKey "MyMasterKey123!" --connections 50 --duration 20
 *
 * Notes:
 * - Uses the real `/api/auth/login` endpoint and then benchmarks an authenticated endpoint.
 * - Prints autocannon summary (p50/p95/throughput/errors).
 */
const autocannon = require('autocannon');
const crypto = require('crypto');

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a) continue;
    if (!a.startsWith('--')) {
      out._.push(a);
      continue;
    }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

function deriveAuthSecret(email, masterKey) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const input = `auth:${normalizedEmail}:${masterKey}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}

async function loginAndGetToken({ baseUrl, email, masterKey }) {
  const authSecret = deriveAuthSecret(email, masterKey);
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, authSecret })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.success || !json?.data?.token) {
    const msg = json?.error || json?.message || `Login failed: ${res.status}`;
    throw new Error(msg);
  }
  return json.data.token;
}

function runAutocannon(opts) {
  return new Promise((resolve, reject) => {
    const inst = autocannon(opts, (err, result) => {
      if (err) return reject(err);
      return resolve(result);
    });
    autocannon.track(inst, { renderProgressBar: true });
  });
}

function toInt(v, def) {
  const n = parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? n : def;
}

function writeJsonIfRequested(result, outPath) {
  if (!outPath) return;
  const fs = require('fs');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`\nWrote JSON report to: ${outPath}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];

  const baseUrl = String(args.url || 'http://localhost:5000').replace(/\/+$/, '');
  const connections = toInt(args.connections, 20);
  const duration = toInt(args.duration, 15);
  const pipelining = toInt(args.pipelining, 1);
  const warmupConnections = toInt(args.warmupConnections, Math.min(10, connections));
  const warmupDuration = toInt(args.warmupDuration, 5);
  const outJson = args.out || '';

  if (!cmd || (cmd !== 'login' && cmd !== 'credentials')) {
    console.log('Usage: node scripts/load-test.js <login|credentials> [--flags]');
    console.log('Flags:');
    console.log('  --url http://localhost:5000');
    console.log('  --email user@example.com --masterKey "MasterKey..."');
    console.log('  --connections 50 --duration 20 --pipelining 1');
    console.log('  --warmupConnections 10 --warmupDuration 5');
    console.log('  --out report.json   (optional)');
    process.exit(1);
  }

  const email = String(args.email || '').trim();
  const masterKey = String(args.masterKey || '');

  if (!email || !masterKey) {
    throw new Error('Missing required flags: --email and --masterKey');
  }

  if (cmd === 'login') {
    console.log(`Target: ${baseUrl}/api/auth/login`);
    console.log(`Connections=${connections}, Duration=${duration}s, Pipelining=${pipelining}`);

    console.log('\nWarmup...');
    await runAutocannon({
      url: `${baseUrl}/api/auth/login`,
      method: 'POST',
      connections: warmupConnections,
      duration: warmupDuration,
      pipelining,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, authSecret: deriveAuthSecret(email, masterKey) })
    });

    console.log('\nRun...');
    const result = await runAutocannon({
      url: `${baseUrl}/api/auth/login`,
      method: 'POST',
      connections,
      duration,
      pipelining,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, authSecret: deriveAuthSecret(email, masterKey) })
    });
    writeJsonIfRequested(result, outJson);
    return;
  }

  const token = await loginAndGetToken({ baseUrl, email, masterKey });
  const endpoint = String(args.endpoint || '/api/credentials?sortBy=createdAt&sortOrder=desc');
  const fullUrl = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  console.log(`Auth OK. Target: ${fullUrl}`);
  console.log(`Connections=${connections}, Duration=${duration}s, Pipelining=${pipelining}`);

  console.log('\nWarmup...');
  await runAutocannon({
    url: fullUrl,
    method: 'GET',
    connections: warmupConnections,
    duration: warmupDuration,
    pipelining,
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log('\nRun...');
  const result = await runAutocannon({
    url: fullUrl,
    method: 'GET',
    connections,
    duration,
    pipelining,
    headers: { Authorization: `Bearer ${token}` }
  });
  writeJsonIfRequested(result, outJson);
}

main().catch((err) => {
  console.error('Load test failed:', err?.message || err);
  process.exit(1);
});


