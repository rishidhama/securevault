/* eslint-disable no-console */
// Seed a benchmark user with ~10,000 credentials via the existing backend API.
//
// Usage (from project root, with backend running):
//   node scripts/seed_benchmark_10k.js
//
// Environment:
//   BENCH_BASE_URL   - base URL of backend (default: http://localhost:5000)
//   BENCH_MASTER_KEY - master key for benchmark user (default: BenchmarkMasterKey123!)

const fetch = require('node-fetch');

const BASE_URL = process.env.BENCH_BASE_URL || 'http://localhost:5000';
const DEFAULT_MASTER = 'BenchmarkMasterKey123!';
const MASTER_KEY = process.env.BENCH_MASTER_KEY || DEFAULT_MASTER;
const EMAIL = process.env.BENCH_EMAIL || 'benchmark10000@example.com';
const TARGET_COUNT = parseInt(process.env.BENCH_TARGET_COUNT || '10000', 10);

function randomString(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < len; i += 1) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

async function registerIfNeeded() {
  // Try a login first; if it fails with 4xx, attempt registration.
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, masterKey: MASTER_KEY })
    });
    if (res.ok) {
      const json = await res.json();
      console.log(`Login succeeded for ${EMAIL}, user already exists.`);
      return json;
    }
    console.log(`Initial login failed for ${EMAIL} with status ${res.status}, attempting registration...`);
  } catch (e) {
    console.log('Login attempt errored, attempting registration...', e.message);
  }

  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: EMAIL,
      name: 'Benchmark 10k User',
      masterKey: MASTER_KEY
    })
  });
  if (!regRes.ok) {
    const text = await regRes.text();
    throw new Error(`Registration failed for ${EMAIL}: ${regRes.status} ${regRes.statusText} - ${text}`);
  }
  const regJson = await regRes.json();
  console.log(`Registered benchmark user ${EMAIL}`);
  return regJson;
}

async function login() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, masterKey: MASTER_KEY })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login failed for ${EMAIL}: ${res.status} ${res.statusText} - ${text}`);
  }
  const json = await res.json();
  if (!json.success || !json.data || !json.data.token) {
    throw new Error(`Login response missing token for ${EMAIL}: ${JSON.stringify(json)}`);
  }
  console.log(`Logged in as ${EMAIL}`);
  return { token: json.data.token, userId: json.data.user.id };
}

async function getCredentialCount(token) {
  const res = await fetch(`${BASE_URL}/api/credentials?sortBy=createdAt&sortOrder=desc`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET /api/credentials failed: ${res.status} ${res.statusText} - ${text}`);
  }
  const json = await res.json();
  const list = json.data || [];
  return list.length;
}

async function createCredential(token, index) {
  const body = {
    title: `Bench 10k #${index}`,
    username: `bench-${randomString(8)}@example.com`,
    encryptedPassword: `ENC_${randomString(48)}`,
    iv: `IV_${randomString(24)}`,
    salt: `SALT_${randomString(24)}`,
    url: 'https://bench-10k.test',
    notes: '',
    category: 'Benchmark10k',
    tags: ['bench', '10k'],
    isFavorite: false
  };

  const res = await fetch(`${BASE_URL}/api/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST /api/credentials failed: ${res.status} ${res.statusText} - ${text}`);
  }
}

async function main() {
  console.log(`Seeding benchmark user ${EMAIL} up to ${TARGET_COUNT} credentials against ${BASE_URL}`);
  await registerIfNeeded();
  const { token } = await login();

  let current = await getCredentialCount(token);
  console.log(`Current credential count: ${current}`);

  if (current >= TARGET_COUNT) {
    console.log('Target already reached, nothing to do.');
    return;
  }

  const toCreate = TARGET_COUNT - current;
  console.log(`Creating ${toCreate} additional credentials...`);

  for (let i = 0; i < toCreate; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await createCredential(token, current + i + 1);
      if ((i + 1) % 100 === 0) {
        console.log(`  Created ${i + 1} / ${toCreate} credentials...`);
      }
    } catch (e) {
      console.error(`Error creating credential #${current + i + 1}:`, e.message);
      break;
    }
  }

  const finalCount = await getCredentialCount(token);
  console.log(`Final credential count for ${EMAIL}: ${finalCount}`);
}

main().catch((err) => {
  console.error('Fatal error in seed script:', err);
  process.exit(1);
});








