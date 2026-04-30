//   BENCH_MASTER_KEY - master key for benchmark users (default: BenchmarkMasterKey123!)
//   BENCH_EMAILS     - comma-separated list of benchmark emails
//   BENCH_READS      - number of GET /api/credentials calls per user (default: 50)
//   BENCH_WRITES     - number of POST /api/credentials calls per user for write tests (default: 10)


const fetch = require('node-fetch');
const crypto = require('crypto');

const BASE_URL = process.env.BENCH_BASE_URL || 'http://localhost:5000';
const DEFAULT_MASTER = 'BenchmarkMasterKey123!';
const MASTER_KEY = process.env.BENCH_MASTER_KEY || DEFAULT_MASTER;
const DEFAULT_EMAILS = [
  'benchmark10@bench.com',
  'benchmark50@bench.com',
  'benchmark100@bench.com',
  'benchmark250@bench.com',
  'benchmark500@bench.com',
  'benchmark1000@bench.com',
  'benchmark2500@bench.com',
  'benchmark5000@bench.com'
];
const EMAILS = (process.env.BENCH_EMAILS || '').trim()
  ? process.env.BENCH_EMAILS.split(',').map(e => e.trim())
  : DEFAULT_EMAILS;

const READ_REQUESTS = parseInt(process.env.BENCH_READS || '50', 10);
const WRITE_REQUESTS = parseInt(process.env.BENCH_WRITES || '10', 10);

function deriveAuthSecret(email, masterKey) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const input = `auth:${normalizedEmail}:${masterKey}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}

async function registerIfNeeded(email, masterKey) {
  // Try login first
  const authSecret = deriveAuthSecret(email, masterKey);
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, authSecret })
  });

  if (loginRes.ok) {
    const json = await loginRes.json();
    if (json.success && json.data && json.data.token) {
      console.log(`User ${email} already exists, login successful.`);
      return { token: json.data.token, userId: json.data.user.id };
    }
  }

  // Login failed - could be user doesn't exist OR wrong password
  // Try to register to check if user exists
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
    
    // If user already exists, the password/authSecret is wrong
    if (regRes.status === 400 && errorJson.error && errorJson.error.includes('already exists')) {
      throw new Error(`User ${email} exists but authentication failed. The user may have been registered with a different master key. Please check the master key or delete and recreate the user.`);
    }
    
    throw new Error(`Registration failed for ${email}: ${regRes.status} ${regRes.statusText} - ${text}`);
  }

  const regJson = await regRes.json();
  if (!regJson.success || !regJson.data || !regJson.data.token) {
    throw new Error(`Registration response missing token for ${email}: ${JSON.stringify(regJson)}`);
  }

  console.log(`Successfully registered ${email}`);
  return { token: regJson.data.token, userId: regJson.data.user.id };
}

async function login(email, masterKey) {
  return registerIfNeeded(email, masterKey);
}

async function getCredentials(token) {
  const res = await fetch(`${BASE_URL}/api/credentials?sortBy=createdAt&sortOrder=desc`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET /api/credentials failed: ${res.status} ${res.statusText} - ${text}`);
  }
  const json = await res.json();
  return json.data || [];
}

function randomString(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < len; i += 1) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

async function createCredential(token) {
  const merkleRoot = crypto.randomBytes(32).toString('hex');
  const body = {
    title: `Bench ${Date.now()}`,
    username: `bench-${randomString(6)}@bench.com`,
    encryptedPassword: `ENC_${randomString(32)}`,
    iv: `IV_${randomString(16)}`,
    salt: `SALT_${randomString(16)}`,
    url: 'https://bench-write.test',
    notes: '',
    category: 'BenchmarkWrite',
    tags: ['bench'],
    isFavorite: false,
    merkleRoot
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

  const json = await res.json();
  return json.data;
}

async function benchmarkUser(email) {
  try {
    const { token } = await login(email, MASTER_KEY);

    // Check if user has credentials (for read benchmarks)
    const creds = await getCredentials(token);
    const credCount = Array.isArray(creds) ? creds.length : 0;
    
    if (credCount === 0) {
      console.log(`\n⚠️  WARNING: User ${email} has no credentials. Read benchmarks will be empty.`);
      console.log(`   To seed credentials, run: BENCH_EMAIL=${email} node scripts/seed_benchmark_10k.js`);
      console.log(`   Or seed all users with: node scripts/seed_all_benchmark_users.js (if it exists)\n`);
    } else {
      console.log(`\n✓ User ${email} has ${credCount} credentials`);
    }

    console.log(`\n=== Benchmarking reads for ${email} (${READ_REQUESTS}x GET /api/credentials) ===`);
    for (let i = 0; i < READ_REQUESTS; i += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await getCredentials(token);
      } catch (err) {
        console.error(`Read error [${email}] #${i + 1}:`, err.message);
      }
    }

    console.log(`\n=== Benchmarking writes for ${email} (${WRITE_REQUESTS}x POST /api/credentials) ===`);
    for (let i = 0; i < WRITE_REQUESTS; i += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await createCredential(token);
      } catch (err) {
        console.error(`Write error [${email}] #${i + 1}:`, err.message);
      }
    }

    console.log(`Completed benchmark for ${email}`);
  } catch (err) {
    console.error(`\n❌ Benchmark error for ${email}:`, err.message);
    if (err.message.includes('already exists') || err.message.includes('authentication failed')) {
      console.error(`\n   SOLUTION: The user exists but was registered with a different master key.`);
      console.error(`   Option 1: Delete the user from the database and let this script recreate it.`);
      console.error(`   Option 2: Use the correct master key that was used during registration.`);
      console.error(`   Option 3: Update the user's masterKeyHash in MongoDB to match: ${deriveAuthSecret(email, MASTER_KEY)}\n`);
    }
  }
}

async function main() {
  console.log(`Starting backend/blockchain benchmarks against ${BASE_URL}`);
  console.log(`Using benchmark users: ${EMAILS.join(', ')}`);

  for (const email of EMAILS) {
    // eslint-disable-next-line no-await-in-loop
    await benchmarkUser(email);
  }

  console.log('\nBackend/blockchain benchmark runs completed.');
  console.log('Check server.log and run: node analyze-bench.js <securevault-bench.json> server.log');
}

main().catch((err) => {
  console.error('Fatal error in benchmark script:', err);
  process.exit(1);
});


