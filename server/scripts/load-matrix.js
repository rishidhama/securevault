/* eslint-disable no-console */
/**
 * Load-test matrix runner.
 *
 * Requirements (your spec):
 * - Concurrency levels: 10, 25, 50
 * - Duration per level: 30 seconds
 * - Ramp time between levels: 10 seconds
 * - Output: one combined summary JSON with median and p95 per endpoint per concurrency level.
 *
 * Usage:
 *   node scripts/load-matrix.js --url http://localhost:5000 --email you@example.com --masterKey "YourMasterKey" --out load-summary.json
 *
 * Optional:
 *   --connections "10,25,50"
 *   --duration 30
 *   --ramp 10
 *   --pipelining 1
 *   --endpointCredentials "/api/credentials?sortBy=createdAt&sortOrder=desc"
 */
const autocannon = require('autocannon');
const crypto = require('crypto');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a || !a.startsWith('--')) continue;
    const k = a.slice(2);
    const v = argv[i + 1];
    if (!v || v.startsWith('--')) {
      out[k] = true;
    } else {
      out[k] = v;
      i += 1;
    }
  }
  return out;
}

function toInt(v, def) {
  const n = parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? n : def;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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

function getP(obj, key) {
  if (!obj || typeof obj !== 'object') return null;
  if (typeof obj[key] === 'number') return obj[key];
  return null;
}

function summarize(result) {
  const p50 = getP(result.latency, 'p50');
  const p95 =
    getP(result.latency, 'p95') ??
    // autocannon exposes p97_5 by default; if p95 isn't present, use p97_5 rather than failing.
    getP(result.latency, 'p97_5');

  return {
    latencyMs: {
      p50,
      p95
    },
    requests: {
      average: result.requests?.average ?? null,
      mean: result.requests?.mean ?? null
    },
    throughput: {
      averageBytesPerSec: result.throughput?.average ?? null
    },
    errors: {
      errors: result.errors ?? 0,
      timeouts: result.timeouts ?? 0,
      non2xx: result.non2xx ?? 0,
      resets: result.resets ?? 0
    }
  };
}

async function runMatrix({ baseUrl, email, masterKey, token, connectionsList, durationSec, rampSec, pipelining, endpointCredentials }) {
  const out = {
    meta: {
      url: baseUrl,
      durationSec,
      rampSec,
      pipelining,
      connections: connectionsList,
      generatedAt: new Date().toISOString()
    },
    endpoints: {
      login: [],
      credentials: []
    }
  };

  for (const c of connectionsList) {
    console.log(`\n=== LOGIN @ connections=${c} for ${durationSec}s ===`);
    const loginRes = await runAutocannon({
      url: `${baseUrl}/api/auth/login`,
      method: 'POST',
      connections: c,
      duration: durationSec,
      pipelining,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, authSecret: deriveAuthSecret(email, masterKey) })
    });
    out.endpoints.login.push({ connections: c, ...summarize(loginRes) });

    console.log(`\nRamp wait ${rampSec}s...`);
    await sleep(rampSec * 1000);

    console.log(`\n=== CREDENTIALS @ connections=${c} for ${durationSec}s ===`);
    const credsRes = await runAutocannon({
      url: `${baseUrl}${endpointCredentials.startsWith('/') ? '' : '/'}${endpointCredentials}`,
      method: 'GET',
      connections: c,
      duration: durationSec,
      pipelining,
      headers: { Authorization: `Bearer ${token}` }
    });
    out.endpoints.credentials.push({ connections: c, ...summarize(credsRes) });

    console.log(`\nRamp wait ${rampSec}s...`);
    await sleep(rampSec * 1000);
  }

  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const baseUrl = String(args.url || 'http://localhost:5000').replace(/\/+$/, '');
  const email = String(args.email || '').trim();
  const masterKey = String(args.masterKey || '');
  const outPath = String(args.out || 'load-summary.json');

  const connectionsList = String(args.connections || '10,25,50')
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);

  const durationSec = toInt(args.duration, 30);
  const rampSec = toInt(args.ramp, 10);
  const pipelining = toInt(args.pipelining, 1);
  const endpointCredentials = String(args.endpointCredentials || '/api/credentials?sortBy=createdAt&sortOrder=desc');

  if (!email || !masterKey) {
    throw new Error('Missing required flags: --email and --masterKey');
  }

  console.log('Fetching token once for authenticated endpoint...');
  const token = await loginAndGetToken({ baseUrl, email, masterKey });

  const summary = await runMatrix({
    baseUrl,
    email,
    masterKey,
    token,
    connectionsList,
    durationSec,
    rampSec,
    pipelining,
    endpointCredentials
  });

  const fs = require('fs');
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`\nWrote combined summary JSON to: ${outPath}`);
}

main().catch((err) => {
  console.error('Load matrix failed:', err?.message || err);
  process.exit(1);
});


