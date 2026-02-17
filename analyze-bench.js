//   node analyze-bench.js securevault-bench-client.json server.log

const fs = require('fs');

function median(arr) {
  if (!arr.length) return 0;
  const a = [...arr].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

function p95(arr) {
  if (!arr.length) return 0;
  const a = [...arr].sort((x, y) => x - y);
  const idx = Math.floor(0.95 * (a.length - 1));
  return a[idx];
}

function analyzeClient(clientPath) {
  const raw = fs.readFileSync(clientPath, 'utf8');
  const data = JSON.parse(raw);

  console.log('=== Client-side crypto ===');

  const pbkdfByIter = {};
  data
    .filter((d) => d.op === 'pbkdf2' && typeof d.timeMs === 'number')
    .forEach((d) => {
      const iters = typeof d.iterations === 'number' ? d.iterations : 0;
      if (!pbkdfByIter[iters]) pbkdfByIter[iters] = [];
      pbkdfByIter[iters].push(d.timeMs);
    });

  if (Object.keys(pbkdfByIter).length) {
    console.log('PBKDF2 timings by iteration count (median / p95 in ms):');
    Object.keys(pbkdfByIter)
      .map((k) => parseInt(k, 10))
      .sort((a, b) => a - b)
      .forEach((iters) => {
        const arr = pbkdfByIter[iters];
        console.log(
          `  ${iters} iters:`,
          median(arr).toFixed(2),
          '/',
          p95(arr).toFixed(2),
        );
      });
  } else {
    console.log('No PBKDF2 entries found in client benchmark JSON.');
  }

  const argonByConfig = {};
  data
    .filter((d) => d.op === 'argon2id' && typeof d.timeMs === 'number' && d.params)
    .forEach((d) => {
      const { time, mem, parallelism } = d.params;
      const key = `t${time || 0}-m${mem || 0}-p${parallelism || 1}`;
      if (!argonByConfig[key]) argonByConfig[key] = [];
      argonByConfig[key].push(d.timeMs);
    });

  if (Object.keys(argonByConfig).length) {
    console.log('\nArgon2id timings by (time, mem, parallelism) (median / p95 in ms):');
    Object.keys(argonByConfig)
      .sort()
      .forEach((key) => {
        const arr = argonByConfig[key];
        console.log(
          `  ${key}:`,
          median(arr).toFixed(2),
          '/',
          p95(arr).toFixed(2),
        );
      });
  } else {
    console.log('\nNo Argon2id entries found in client benchmark JSON.');
  }

  const encTimes = data.filter((d) => d.op === 'encrypt').map((d) => d.timeMs);
  const decTimes = data.filter((d) => d.op === 'decrypt').map((d) => d.timeMs);
  if (encTimes.length || decTimes.length) {
    console.log('\nAES-256-GCM per-credential timings:');
  }
  if (encTimes.length) {
    console.log(
      'Encrypt password ms: median =',
      median(encTimes).toFixed(2),
      'p95 =',
      p95(encTimes).toFixed(2),
    );
  }
  if (decTimes.length) {
    console.log(
      'Decrypt password ms: median =',
      median(decTimes).toFixed(2),
      'p95 =',
      p95(decTimes).toFixed(2),
    );
  }

  const byN = {};
  data.forEach((d) => {
    if (d.op === 'merkle' && typeof d.N === 'number') {
      if (!byN[d.N]) byN[d.N] = [];
      byN[d.N].push(d.merkleMs);
    }
  });
  console.log('\nMerkle computation ms by N (median / p95):');
  Object.keys(byN)
    .map((n) => parseInt(n, 10))
    .sort((a, b) => a - b)
    .forEach((N) => {
      const arr = byN[N];
      console.log(N, median(arr).toFixed(2), '/', p95(arr).toFixed(2));
    });
}

function analyzeServer(serverPath) {
  // Read file and handle potential BOM/encoding issues
  // Try UTF-8 first, fall back to UTF-16LE if BOM detected
  let content;
  try {
    const buffer = fs.readFileSync(serverPath);
    // Check for UTF-16LE BOM (FF FE)
    if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
      content = buffer.toString('utf16le').slice(1); // Remove BOM
    } else {
      content = buffer.toString('utf8');
      // Remove UTF-8 BOM if present
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
    }
  } catch (e) {
    // Fallback to utf8
    content = fs.readFileSync(serverPath, 'utf8');
  }
  const lines = content.split(/\r?\n/); // Handle both \n and \r\n
  const getTimesPaginated = [];
  const getTimesFullDataset = [];
  const postTimes = [];
  let parsedCount = 0;
  let apiCount = 0;
  let jsonStartCount = 0;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) return;
    jsonStartCount++;
    let d;
    try {
      d = JSON.parse(trimmed);
      parsedCount++;
    } catch (e) {
      // Skip parse errors silently
      return;
    }
    if (d.op !== 'api') return;
    apiCount++;
    const url = typeof d.originalUrl === 'string' ? d.originalUrl : d.path;
    if (d.method === 'GET' && typeof url === 'string' && url.startsWith('/api/credentials')) {
      // Distinguish between paginated and full dataset requests
      if (url.includes('getAll=true')) {
        getTimesFullDataset.push(d.timeMs);
      } else if (url.includes('page=') || url.includes('limit=')) {
        getTimesPaginated.push(d.timeMs);
      } else {
        // Default requests (no params) - treat as paginated (default limit 100)
        getTimesPaginated.push(d.timeMs);
      }
    }
    if (d.method === 'POST' && typeof url === 'string' && url.startsWith('/api/credentials')) {
      postTimes.push(d.timeMs);
    }
  });

  console.log('\n=== Backend API ===');
  if (getTimesPaginated.length) {
    console.log(
      'GET /api/credentials (PAGINATED, limit=100) ms: median =',
      median(getTimesPaginated).toFixed(2),
      'p95 =',
      p95(getTimesPaginated).toFixed(2),
    );
  } else {
    console.log('No paginated GET /api/credentials entries found in server log.');
  }
  if (getTimesFullDataset.length) {
    console.log(
      'GET /api/credentials (FULL DATASET, getAll=true) ms: median =',
      median(getTimesFullDataset).toFixed(2),
      'p95 =',
      p95(getTimesFullDataset).toFixed(2),
    );
  } else {
    console.log('No full dataset GET /api/credentials entries found in server log.');
  }
  if (postTimes.length) {
    console.log(
      'POST /api/credentials ms: median =',
      median(postTimes).toFixed(2),
      'p95 =',
      p95(postTimes).toFixed(2),
    );
  } else {
    console.log('No POST /api/credentials entries found in server log.');
  }
}

function analyzeAnchor(serverPath) {
  // Read file and handle potential BOM/encoding issues
  // Try UTF-8 first, fall back to UTF-16LE if BOM detected
  let content;
  try {
    const buffer = fs.readFileSync(serverPath);
    // Check for UTF-16LE BOM (FF FE)
    if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
      content = buffer.toString('utf16le').slice(1); // Remove BOM
    } else {
      content = buffer.toString('utf8');
      // Remove UTF-8 BOM if present
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
    }
  } catch (e) {
    // Fallback to utf8
    content = fs.readFileSync(serverPath, 'utf8');
  }
  const lines = content.split(/\r?\n/); // Handle both \n and \r\n
  const latencies = [];
  const gasUsed = [];
  let anchorCount = 0;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) return;
    let d;
    try {
      d = JSON.parse(trimmed);
    } catch (e) {
      return;
    }
    if (d.op !== 'anchor') return;
    anchorCount++;
    if (typeof d.latencyMs === 'number') {
      latencies.push(d.latencyMs);
    }
    if (typeof d.gasUsed === 'string') {
      const g = parseInt(d.gasUsed, 10);
      if (!Number.isNaN(g)) gasUsed.push(g);
    }
  });

  console.log('\n=== Blockchain anchoring ===');
  if (latencies.length) {
    console.log(
      'Anchoring latency ms: median =',
      median(latencies).toFixed(2),
      'p95 =',
      p95(latencies).toFixed(2),
    );
  } else {
    console.log('No anchor entries found in server log.');
  }
  if (gasUsed.length) {
    const avgGas = gasUsed.reduce((a, b) => a + b, 0) / gasUsed.length;
    console.log('Average gas used =', avgGas.toFixed(0));
  } else {
    console.log('No gasUsed values found for anchor entries.');
  }
}

if (process.argv.length < 4) {
  // eslint-disable-next-line no-console
  console.error('Usage: node analyze-bench.js <securevault-bench-client.json> <server.log>');
  process.exit(1);
}

const clientPath = process.argv[2];
const serverPath = process.argv[3];

analyzeClient(clientPath);
analyzeServer(serverPath);
analyzeAnchor(serverPath);


