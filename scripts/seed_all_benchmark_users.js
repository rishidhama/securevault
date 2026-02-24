/* eslint-disable no-console */
// Seed all benchmark users with credentials for benchmarking.
//
// Usage (from project root, with backend running):
//   node scripts/seed_all_benchmark_users.js
//
// Environment:
//   BENCH_BASE_URL   - base URL of backend (default: http://localhost:5000)
//   BENCH_MASTER_KEY - master key for benchmark users (default: BenchmarkMasterKey123!)
//   BENCH_CRED_COUNT - number of credentials per user (default: matches user name, e.g., 10 for benchmark10@example.com)

const fetch = require('node-fetch');
const crypto = require('crypto');

const BASE_URL = process.env.BENCH_BASE_URL || 'http://localhost:5000';
const DEFAULT_MASTER = 'BenchmarkMasterKey123!';
const MASTER_KEY = process.env.BENCH_MASTER_KEY || DEFAULT_MASTER;

const BENCHMARK_USERS = [
  { email: 'benchmark10@bench.com', targetCount: 10 },
  { email: 'benchmark50@bench.com', targetCount: 50 },
  { email: 'benchmark100@bench.com', targetCount: 100 },
  { email: 'benchmark250@bench.com', targetCount: 250 },
  { email: 'benchmark500@bench.com', targetCount: 500 },
  { email: 'benchmark1000@bench.com', targetCount: 1000 },
  { email: 'benchmark2500@bench.com', targetCount: 2500 },
  { email: 'benchmark5000@bench.com', targetCount: 5000 }
];

function deriveAuthSecret(email, masterKey) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const input = `auth:${normalizedEmail}:${masterKey}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}

function randomString(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < len; i += 1) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

async function registerIfNeeded(email, masterKey) {
  const authSecret = deriveAuthSecret(email, masterKey);
  
  // Try login first
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, authSecret })
  });

  if (loginRes.ok) {
    const json = await loginRes.json();
    if (json.success && json.data && json.data.token) {
      return { token: json.data.token, userId: json.data.user.id };
    }
  }

  // Login failed - try to register
  console.log(`  User ${email} not found, registering...`);
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      name: `Benchmark User ${email}`,
      authSecret
    })
  });

  if (!regRes.ok) {
    const text = await regRes.text();
    const errorJson = JSON.parse(text);
    if (regRes.status === 400 && errorJson.error && errorJson.error.includes('already exists')) {
      throw new Error(`User ${email} exists but authentication failed. The user was registered with a different master key.`);
    }
    throw new Error(`Registration failed for ${email}: ${regRes.status} ${regRes.statusText} - ${text}`);
  }

  const regJson = await regRes.json();
  if (!regJson.success || !regJson.data || !regJson.data.token) {
    throw new Error(`Registration response missing token for ${email}: ${JSON.stringify(regJson)}`);
  }

  console.log(`  ✓ Successfully registered ${email}`);
  return { token: regJson.data.token, userId: regJson.data.user.id };
}

async function login(email, masterKey) {
  return registerIfNeeded(email, masterKey);
}

async function getCredentialCount(token) {
  // Use getAll=true to bypass pagination and get total count from pagination metadata
  const res = await fetch(`${BASE_URL}/api/credentials?getAll=true`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET /api/credentials failed: ${res.status} ${res.statusText} - ${text}`);
  }
  const json = await res.json();
  // Use pagination.total if available, otherwise fall back to array length
  if (json.pagination && typeof json.pagination.total === 'number') {
    return json.pagination.total;
  }
  const list = json.data || [];
  return list.length;
}

async function createCredential(token, index, retries = 3) {
  const body = {
    title: `Bench #${index}`,
    username: `bench-${randomString(8)}@bench.com`,
    encryptedPassword: `ENC_${randomString(48)}`,
    iv: `IV_${randomString(24)}`,
    salt: `SALT_${randomString(24)}`,
    url: 'https://bench.test',
    notes: '',
    category: 'Benchmark',
    tags: ['bench'],
    isFavorite: false
  };

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
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
      return; // Success
    } catch (err) {
      if (attempt === retries) {
        throw err; // Last attempt failed
      }
      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function seedUser({ email, targetCount }) {
  try {
    console.log(`\n=== Seeding ${email} (target: ${targetCount} credentials) ===`);
    const { token } = await login(email, MASTER_KEY);

    let current = await getCredentialCount(token);
    console.log(`Current credential count: ${current}`);

    if (current >= targetCount) {
      console.log(`✓ Target already reached (${current} >= ${targetCount}), skipping.`);
      return;
    }

    const toCreate = targetCount - current;
    console.log(`Creating ${toCreate} additional credentials...`);

    for (let i = 0; i < toCreate; i += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await createCredential(token, current + i + 1);
        if ((i + 1) % 100 === 0 || (i + 1) === toCreate) {
          console.log(`  Created ${i + 1} / ${toCreate} credentials...`);
        }
        // Small delay to avoid overwhelming the server
        if ((i + 1) % 50 === 0) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (e) {
        console.error(`Error creating credential #${current + i + 1} after retries:`, e.message);
        // Continue instead of breaking - try to create as many as possible
        if (e.message.includes('ECONNRESET') || e.message.includes('timeout')) {
          // Wait a bit longer on connection errors
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    const finalCount = await getCredentialCount(token);
    console.log(`✓ Final credential count for ${email}: ${finalCount}`);
  } catch (err) {
    console.error(`\n❌ Error seeding ${email}:`, err.message);
    if (err.message.includes('Login failed')) {
      console.error(`   The user may not exist or was registered with a different master key.`);
      console.error(`   Make sure the user exists and uses master key: ${MASTER_KEY}`);
    }
  }
}

async function main() {
  console.log(`Seeding all benchmark users against ${BASE_URL}`);
  console.log(`Using master key: ${MASTER_KEY}\n`);

  for (const user of BENCHMARK_USERS) {
    // eslint-disable-next-line no-await-in-loop
    await seedUser(user);
  }

  console.log('\n✓ Seeding completed for all users.');
}

main().catch((err) => {
  console.error('Fatal error in seed script:', err);
  process.exit(1);
});

