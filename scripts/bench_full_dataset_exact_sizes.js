/* eslint-disable no-console */
// Benchmark full-dataset reads with exact vault sizes per user.
//
// Usage:
//   node scripts/bench_full_dataset_exact_sizes.js
//
// Environment:
//   BENCH_BASE_URL        - backend base URL (default: http://localhost:5000)
//   BENCH_MASTER_KEY      - benchmark master key
//   BENCH_SIZES           - comma-separated sizes (default: 10,20,50,100,250,500,1000,2500,5000)
//   BENCH_FULL_READS      - measured full-dataset requests per user (default: 10)
//   BENCH_WARMUP          - perform one unmeasured warm-up request (default: true)
//   BENCH_EMAIL_DOMAIN    - domain for generated users (default: bench.com)
//   BENCH_RUN_ID          - optional run identifier (default: reused)
//   BENCH_REUSE_USERS     - reuse the same users across runs (default: true)

const fetch = require('node-fetch');
const crypto = require('crypto');

const BASE_URL = process.env.BENCH_BASE_URL || 'http://localhost:5000';
const MASTER_KEY = process.env.BENCH_MASTER_KEY || 'BenchmarkMasterKey123!';
const SIZES = (process.env.BENCH_SIZES || '10,20,50,100,250,500,1000,2500,5000')
  .split(',')
  .map((n) => parseInt(n.trim(), 10))
  .filter((n) => Number.isFinite(n) && n > 0);
const FULL_READS = parseInt(process.env.BENCH_FULL_READS || '10', 10);
const WARMUP = (process.env.BENCH_WARMUP || 'true').toLowerCase() !== 'false';
const EMAIL_DOMAIN = process.env.BENCH_EMAIL_DOMAIN || 'bench.com';
const REUSE_USERS = (process.env.BENCH_REUSE_USERS || 'true').toLowerCase() !== 'false';
const RUN_ID = process.env.BENCH_RUN_ID || (REUSE_USERS ? 'reused' : Date.now().toString());

function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function p95(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(0.95 * (s.length - 1))];
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function deriveAuthSecret(email, masterKey) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const input = `auth:${normalizedEmail}:${masterKey}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}

function randomHex(len) {
  const chars = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < len; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function randomString(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < len; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function registerAndLogin(email) {
  const authSecret = deriveAuthSecret(email, MASTER_KEY);
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name: `Bench ${email}`, authSecret })
  });
  if (!regRes.ok && regRes.status !== 400) {
    const text = await regRes.text();
    throw new Error(`Register failed for ${email}: ${regRes.status} ${text}`);
  }

  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, authSecret })
  });
  if (!loginRes.ok) {
    const text = await loginRes.text();
    throw new Error(`Login failed for ${email}: ${loginRes.status} ${text}`);
  }
  const loginJson = await loginRes.json();
  return { token: loginJson.data.token };
}

async function withRetries(fn, label, retries = 4) {
  let attempt = 0;
  let lastError;
  while (attempt < retries) {
    attempt += 1;
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = String(err && err.message ? err.message : err);
      const retryable = /ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up|429|503/i.test(msg);
      if (!retryable || attempt >= retries) break;
      await new Promise((resolve) => setTimeout(resolve, attempt * 300));
      console.log(`Retrying ${label} (attempt ${attempt + 1}/${retries}) ...`);
    }
  }
  throw lastError;
}

async function createCredential(token, index) {
  const body = {
    title: `Exact bench #${index}`,
    username: `exact-${randomString(8)}@${EMAIL_DOMAIN}`,
    encryptedPassword: `ENC_${randomString(40)}`,
    iv: `IV_${randomString(20)}`,
    salt: `SALT_${randomString(20)}`,
    url: 'https://exact-bench.test',
    notes: '',
    category: 'ExactBenchmark',
    tags: ['bench', 'exact'],
    isFavorite: false,
    merkleRoot: randomHex(64)
  };

  const res = await fetch(`${BASE_URL}/api/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create credential failed: ${res.status} ${text}`);
  }
}

async function getCount(token) {
  const res = await fetch(`${BASE_URL}/api/credentials?sortBy=createdAt&sortOrder=desc&getAll=true`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Count fetch failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  return Array.isArray(json.data) ? json.data.length : 0;
}

async function benchmarkFullDataset(token, reads, warmup) {
  const url = `${BASE_URL}/api/credentials?sortBy=createdAt&sortOrder=desc&getAll=true`;
  const headers = { Authorization: `Bearer ${token}` };

  if (warmup) {
    await fetch(url, { method: 'GET', headers });
  }

  const times = [];
  for (let i = 0; i < reads; i += 1) {
    const start = process.hrtime.bigint();
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Full dataset read failed: ${res.status} ${text}`);
    }
    await res.json();
    const end = process.hrtime.bigint();
    times.push(Number(end - start) / 1e6);
  }
  return times;
}

async function runForSize(size) {
  const email = `bench-exact-${size}-${RUN_ID}@${EMAIL_DOMAIN}`;
  console.log(`\n=== Size ${size} (${email}) ===`);
  const { token } = await registerAndLogin(email);

  let current = await getCount(token);
  console.log(`Current count: ${current}; target: ${size}`);
  if (current > size) {
    throw new Error(`User ${email} already has ${current} credentials, which exceeds target ${size}. Use a new BENCH_RUN_ID.`);
  }

  const toCreate = size - current;
  console.log(`Seeding ${toCreate} credentials...`);
  for (let i = 0; i < toCreate; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await withRetries(() => createCredential(token, current + i + 1), `createCredential size=${size} index=${current + i + 1}`);
    if ((i + 1) % 250 === 0) console.log(`  created ${i + 1}/${toCreate}`);
  }

  const count = await getCount(token);
  console.log(`Verified count: ${count}`);

  const times = await benchmarkFullDataset(token, FULL_READS, WARMUP);
  return {
    size,
    email,
    count,
    median: median(times),
    p95: p95(times),
    avg: avg(times),
    min: Math.min(...times),
    max: Math.max(...times),
  };
}

async function main() {
  console.log(`Running exact-size full-dataset benchmark against ${BASE_URL}`);
  console.log(`Sizes: ${SIZES.join(', ')}, reads/user: ${FULL_READS}, warmup: ${WARMUP}, reuseUsers: ${REUSE_USERS}, runId: ${RUN_ID}`);

  const results = [];
  for (const size of SIZES) {
    // eslint-disable-next-line no-await-in-loop
    const row = await runForSize(size);
    results.push(row);
  }

  console.log('\n=== Full Dataset Results (Exact Sizes) ===');
  console.log('size | verified_count | median_ms | p95_ms | avg_ms | min_ms | max_ms');
  results.forEach((r) => {
    console.log(
      `${r.size} | ${r.count} | ${r.median.toFixed(2)} | ${r.p95.toFixed(2)} | ${r.avg.toFixed(2)} | ${r.min.toFixed(2)} | ${r.max.toFixed(2)}`
    );
  });
}

main().catch((err) => {
  console.error('Exact-size benchmark failed:', err);
  process.exit(1);
});

