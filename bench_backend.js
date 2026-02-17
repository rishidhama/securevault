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
  'benchmark10@example.com',
  'benchmark50@example.com',
  'benchmark100@example.com',
  'benchmark250@example.com',
  'benchmark500@example.com',
  'benchmark1000@example.com',
  'benchmark2500@example.com',
  'benchmark5000@example.com'
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

async function login(email, masterKey) {
  console.log(`Logging in as ${email}...`);
  const authSecret = deriveAuthSecret(email, masterKey);
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, authSecret })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login failed for ${email}: ${res.status} ${res.statusText} - ${text}`);
  }

  const json = await res.json();
  if (!json.success || !json.data || !json.data.token) {
    throw new Error(`Login response missing token for ${email}: ${JSON.stringify(json)}`);
  }

  return { token: json.data.token, userId: json.data.user.id };
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
  const body = {
    title: `Bench ${Date.now()}`,
    username: `bench-${randomString(6)}@example.com`,
    encryptedPassword: `ENC_${randomString(32)}`,
    iv: `IV_${randomString(16)}`,
    salt: `SALT_${randomString(16)}`,
    url: 'https://bench-write.test',
    notes: '',
    category: 'BenchmarkWrite',
    tags: ['bench'],
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

  const json = await res.json();
  return json.data;
}

async function benchmarkUser(email) {
  try {
    const { token } = await login(email, MASTER_KEY);

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
    console.error(`Benchmark error for ${email}:`, err.message);
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


