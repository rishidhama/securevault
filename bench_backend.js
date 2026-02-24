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
const CONCURRENCY = parseInt(process.env.BENCH_CONCURRENCY || '10', 10); // Number of users to process in parallel

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

async function getCredentialCount(token) {
  // Use getAll=true to get accurate total count (bypasses pagination)
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
    username: `bench-${randomString(6)}@bench.com`,
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

    // Check if user has credentials (for read benchmarks)
    const credCount = await getCredentialCount(token);
    
    if (credCount === 0) {
      console.log(`\n⚠️  WARNING: User ${email} has no credentials. Read benchmarks will be empty.`);
      console.log(`   To seed credentials, run: BENCH_EMAIL=${email} node scripts/seed_benchmark_10k.js`);
      console.log(`   Or seed all users with: node scripts/seed_all_benchmark_users.js (if it exists)\n`);
    } else {
      console.log(`\n✓ User ${email} has ${credCount} credentials`);
    }

    console.log(`\n=== Benchmarking reads for ${email} (${READ_REQUESTS}x GET /api/credentials) ===`);
    // First request uses getAll=true to test full dataset fetch
    try {
      const fullRes = await fetch(`${BASE_URL}/api/credentials?getAll=true`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (fullRes.ok) {
        await fullRes.json();
      }
    } catch (err) {
      console.error(`Full dataset read error [${email}]:`, err.message);
    }
    
    // Remaining requests use paginated (default)
    for (let i = 1; i < READ_REQUESTS; i += 1) {
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
  const testMode = process.env.BENCH_MODE || 'both'; // 'individual', 'batch', or 'both'
  
  console.log(`Starting backend/blockchain benchmarks against ${BASE_URL}`);
  console.log(`Using benchmark users: ${EMAILS.join(', ')}`);
  console.log(`Test mode: ${testMode}\n`);

  if (testMode === 'individual' || testMode === 'both') {
    console.log('='.repeat(60));
    console.log('PHASE 1: Individual/Per-Update Blockchain Anchoring');
    console.log('='.repeat(60));
    console.log('(Each credential update triggers its own transaction)');
    console.log('\n⚠️  IMPORTANT: Start server with BATCH_ENABLED=false (or not set)');
    console.log('   Command: $env:ETHEREUM_ENABLED="true"; $env:BATCH_ENABLED="false"; node .\\server\\index.js >> server.log 2>&1');
    console.log('   (Note: Using >> to APPEND, not > to overwrite)\n');
    
    // Note: BATCH_ENABLED should be false or not set for individual mode
    // This is controlled server-side, so we just run the benchmark
    // The server will use individual mode if BATCH_ENABLED !== 'true'
    
    for (const email of EMAILS) {
      // eslint-disable-next-line no-await-in-loop
      await benchmarkUser(email);
    }
    
    console.log('\n✓ Individual anchoring benchmark completed.');
    console.log('\n⚠️  NEXT STEP: Restart server with BATCH_ENABLED=true');
    console.log('   Command: $env:ETHEREUM_ENABLED="true"; $env:BATCH_ENABLED="true"; node .\\server\\index.js >> server.log 2>&1');
    console.log('   (Using >> to APPEND to existing log, preserving Phase 1 results)');
    console.log('   Then run: $env:BENCH_MODE="batch"; node bench_backend.js\n');
    
    if (testMode === 'both') {
      console.log('Waiting 5 seconds before exiting (server restart required)...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return; // Exit - user needs to restart server
    }
  }

  if (testMode === 'batch' || testMode === 'both') {
    console.log('='.repeat(60));
    console.log('PHASE 2: Batch Blockchain Anchoring');
    console.log('='.repeat(60));
    console.log('(Multiple credential updates batched into single transactions)');
    console.log('\n⚠️  IMPORTANT: Server should be running with BATCH_ENABLED=true');
    console.log('   Command: $env:ETHEREUM_ENABLED="true"; $env:BATCH_ENABLED="true"; node .\\server\\index.js >> server.log 2>&1');
    console.log(`\n📊 Processing ${EMAILS.length} users with concurrency=${CONCURRENCY} (users will write concurrently to enable batching)\n`);
    
    // Wait a bit to ensure clean separation in logs
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Process users in concurrent batches to allow writes to overlap
    // This enables the batch queue to see multiple users with pending updates simultaneously
    async function processInBatches(items, fn, batchSize) {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        console.log(`\n🔄 Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} users concurrently)...`);
        await Promise.all(batch.map(email => fn(email)));
      }
    }
    
    await processInBatches(EMAILS, benchmarkUser, CONCURRENCY);
    
    console.log('\n✓ Batch anchoring benchmark completed.');
    console.log('\n💡 Tip: Larger batch sizes form when multiple users write concurrently.');
    console.log(`   With ${EMAILS.length} users and concurrency=${CONCURRENCY}, you should see batch sizes up to ${Math.min(CONCURRENCY, EMAILS.length)}.`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Backend/blockchain benchmark runs completed.');
  console.log('='.repeat(60));
  console.log('Check server.log and run: node analyze-bench.js <securevault-bench.json> server.log');
  console.log('\nThe analyzer will show separate metrics for:');
  console.log('  - Individual transactions (batch: false or missing)');
  console.log('  - Batch transactions (batch: true)');
}

main().catch((err) => {
  console.error('Fatal error in benchmark script:', err);
  process.exit(1);
});


