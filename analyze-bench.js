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
  if (!clientPath || clientPath === 'none' || clientPath === 'null') {
    console.log('=== Client-side crypto ===');
    console.log('(Skipped - no client benchmark file provided)');
    return;
  }
  
  if (!fs.existsSync(clientPath)) {
    console.log('=== Client-side crypto ===');
    console.log(`(Skipped - file not found: ${clientPath})`);
    return;
  }
  
  const raw = fs.readFileSync(clientPath, 'utf8');
  const data = JSON.parse(raw);

  console.log('=== Client-side crypto ===');

  const envEntry = data.find((d) => d.op === 'env');
  if (envEntry) {
    console.log('Environment:');
    console.log('  userAgent:', envEntry.userAgent || '');
    console.log('  language:', envEntry.language || '');
    console.log('  hardwareConcurrency:', envEntry.hardwareConcurrency || 'n/a');
    console.log('  deviceMemory (GB):', envEntry.deviceMemory || 'n/a');
    if (envEntry.screen) {
      console.log(
        '  screen:',
        `${envEntry.screen.width || 'n/a'}x${envEntry.screen.height || 'n/a'}`,
      );
    }
    if (envEntry.timezone) {
      console.log('  timezone:', envEntry.timezone);
    }
  }

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

  const incrByNInit = {};
  const incrByNUpdate = {};
  data.forEach((d) => {
    if (d.op === 'merkle-incremental' && typeof d.N === 'number') {
      if (!incrByNInit[d.N]) incrByNInit[d.N] = [];
      if (!incrByNUpdate[d.N]) incrByNUpdate[d.N] = [];
      if (typeof d.initMs === 'number') incrByNInit[d.N].push(d.initMs);
      if (typeof d.updateMs === 'number') incrByNUpdate[d.N].push(d.updateMs);
    }
  });
  if (Object.keys(incrByNInit).length) {
    console.log('\nIncremental Merkle init/update ms by N (median / p95):');
    Object.keys(incrByNInit)
      .map((n) => parseInt(n, 10))
      .sort((a, b) => a - b)
      .forEach((N) => {
        const initArr = incrByNInit[N] || [];
        const updArr = incrByNUpdate[N] || [];
        console.log(
          N,
          'init',
          initArr.length ? `${median(initArr).toFixed(2)} / ${p95(initArr).toFixed(2)}` : 'n/a',
          'update',
          updArr.length ? `${median(updArr).toFixed(2)} / ${p95(updArr).toFixed(2)}` : 'n/a',
        );
      });
  }

  const loginByN = {};
  data.forEach((d) => {
    if (d.op === 'login-e2e' && typeof d.N === 'number' && typeof d.totalMs === 'number') {
      if (!loginByN[d.N]) loginByN[d.N] = [];
      loginByN[d.N].push(d.totalMs);
    }
  });
  if (Object.keys(loginByN).length) {
    console.log('\nEnd-to-end login-style benchmark ms by N (median / p95):');
    Object.keys(loginByN)
      .map((n) => parseInt(n, 10))
      .sort((a, b) => a - b)
      .forEach((N) => {
        const arr = loginByN[N];
        console.log(N, median(arr).toFixed(2), '/', p95(arr).toFixed(2));
      });
  }
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

  const failedAnchors = [];
  const individualLatencies = [];
  const individualGasUsed = [];
  
  // Group batch transactions by batch size (itemsUpdated)
  const batchBySize = {}; // { batchSize: { latencies: [], gasUsed: [], itemsUpdated: [] } }
  
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
    
    // Track failed transactions separately
    if (d.success === false) {
      failedAnchors.push(d);
      return; // Don't include failed transactions in success metrics
    }
    
    // Separate batch vs individual transactions
    const isBatch = d.batch === true;
    const itemsUpdated = isBatch && typeof d.itemsUpdated === 'number' ? d.itemsUpdated : 1;
    
    // Only count successful transactions for metrics
    if (typeof d.latencyMs === 'number') {
      if (isBatch) {
        // Group by batch size
        if (!batchBySize[itemsUpdated]) {
          batchBySize[itemsUpdated] = { latencies: [], gasUsed: [], itemsUpdated: [] };
        }
        batchBySize[itemsUpdated].latencies.push(d.latencyMs);
        batchBySize[itemsUpdated].itemsUpdated.push(itemsUpdated);
      } else {
        individualLatencies.push(d.latencyMs);
      }
      latencies.push(d.latencyMs); // Also keep combined for overall stats
    }
    if (typeof d.gasUsed === 'string') {
      const g = parseInt(d.gasUsed, 10);
      if (!Number.isNaN(g)) {
        if (isBatch) {
          if (!batchBySize[itemsUpdated]) {
            batchBySize[itemsUpdated] = { latencies: [], gasUsed: [], itemsUpdated: [] };
          }
          batchBySize[itemsUpdated].gasUsed.push(g);
        } else {
          individualGasUsed.push(g);
        }
        gasUsed.push(g); // Also keep combined for overall stats
      }
    }
  });

  console.log('\n=== Blockchain anchoring ===');
  if (anchorCount === 0) {
    console.log('No anchor entries found in server log.');
  } else {
    const successfulCount = latencies.length;
    const totalBatchTransactions = Object.values(batchBySize).reduce((sum, group) => sum + group.latencies.length, 0);
    console.log(`Total anchor operations: ${anchorCount} (${successfulCount} successful, ${failedAnchors.length} failed)`);
    console.log(`  - Individual transactions: ${individualLatencies.length}`);
    console.log(`  - Batch transactions: ${totalBatchTransactions}`);
    
    // Individual transaction metrics
    if (individualLatencies.length > 0) {
      console.log('\n' + '─'.repeat(70));
      console.log('Individual/Per-Update Anchoring:');
      console.log('─'.repeat(70));
      const indMedianLatency = median(individualLatencies);
      const indP95Latency = p95(individualLatencies);
      console.log(`  Transaction latency: median = ${indMedianLatency.toFixed(2)} ms, p95 = ${indP95Latency.toFixed(2)} ms`);
      
      if (individualGasUsed.length > 0) {
        const indAvgGas = individualGasUsed.reduce((a, b) => a + b, 0) / individualGasUsed.length;
        const indMedianGas = median(individualGasUsed);
        console.log(`  Gas per transaction: avg = ${indAvgGas.toFixed(2)}, median = ${indMedianGas.toFixed(2)}`);
        console.log(`  Gas per update: ${indAvgGas.toFixed(2)} (1 update per transaction)`);
        console.log(`  Amortized latency per update: ${(indMedianLatency / 1).toFixed(2)} ms`);
      }
    }
    
    // Batch transaction metrics by size (automatically detected)
    const batchSizes = Object.keys(batchBySize).map(Number).sort((a, b) => a - b);
    if (batchSizes.length > 0) {
      console.log('\n' + '─'.repeat(90));
      console.log('Batch Anchoring (by batch size - automatically detected):');
      console.log('─'.repeat(90));
      console.log('Batch | Tx Latency (ms)      | Gas/Tx          | Gas/Update        | Amortized Latency/Update (ms)');
      console.log('Size  | median      p95      | median    p95   | median      p95   | median            p95');
      console.log('─'.repeat(90));
      
      batchSizes.forEach(size => {
        const group = batchBySize[size];
        if (group.latencies.length === 0) return;
        
        const medianLatency = median(group.latencies);
        const p95Latency = p95(group.latencies);
        
        let medianGas = 0, p95Gas = 0, avgGas = 0;
        if (group.gasUsed.length > 0) {
          medianGas = median(group.gasUsed);
          p95Gas = p95(group.gasUsed);
          avgGas = group.gasUsed.reduce((a, b) => a + b, 0) / group.gasUsed.length;
        }
        
        const gasPerUpdateMedian = medianGas / size;
        const gasPerUpdateP95 = p95Gas / size;
        const amortizedLatencyMedian = medianLatency / size;
        const amortizedLatencyP95 = p95Latency / size;
        
        console.log(
          `  ${String(size).padStart(3)} | ` +
          `${medianLatency.toFixed(2).padStart(7)} ${p95Latency.toFixed(2).padStart(7)} | ` +
          `${medianGas.toFixed(0).padStart(6)} ${p95Gas.toFixed(0).padStart(6)} | ` +
          `${gasPerUpdateMedian.toFixed(2).padStart(7)} ${gasPerUpdateP95.toFixed(2).padStart(7)} | ` +
          `${amortizedLatencyMedian.toFixed(2).padStart(7)} ${amortizedLatencyP95.toFixed(2).padStart(7)}`
        );
      });
    }
    
    // Comparison table showing improvements (with median and p95)
    if (individualLatencies.length > 0 && batchSizes.length > 0) {
      const indMedianGas = individualGasUsed.length > 0 ? median(individualGasUsed) : 0;
      const indP95Gas = individualGasUsed.length > 0 ? p95(individualGasUsed) : 0;
      const indMedianLatency = median(individualLatencies);
      const indP95Latency = p95(individualLatencies);
      
      console.log('\n' + '─'.repeat(100));
      console.log('Batching Efficiency Analysis (vs Individual):');
      console.log('─'.repeat(100));
      console.log('Batch | Gas Savings (%)        | Amortized Latency Improvement (%)');
      console.log('Size  | median      p95         | median            p95');
      console.log('─'.repeat(100));
      console.log(`Indiv  |     0.00      0.00     |        0.00           0.00 (baseline)`);
      
      batchSizes.forEach(size => {
        const group = batchBySize[size];
        if (group.latencies.length === 0 || group.gasUsed.length === 0) return;
        
        const medianLatency = median(group.latencies);
        const p95Latency = p95(group.latencies);
        const medianGas = median(group.gasUsed);
        const p95Gas = p95(group.gasUsed);
        
        const gasPerUpdateMedian = medianGas / size;
        const gasPerUpdateP95 = p95Gas / size;
        const amortizedLatencyMedian = medianLatency / size;
        const amortizedLatencyP95 = p95Latency / size;
        
        const gasSavingsMedian = indMedianGas > 0 ? ((indMedianGas - gasPerUpdateMedian) / indMedianGas * 100) : 0;
        const gasSavingsP95 = indP95Gas > 0 ? ((indP95Gas - gasPerUpdateP95) / indP95Gas * 100) : 0;
        const amortizedImprovementMedian = indMedianLatency > 0 ? ((indMedianLatency - amortizedLatencyMedian) / indMedianLatency * 100) : 0;
        const amortizedImprovementP95 = indP95Latency > 0 ? ((indP95Latency - amortizedLatencyP95) / indP95Latency * 100) : 0;
        
        console.log(
          `  ${String(size).padStart(3)} | ` +
          `${gasSavingsMedian.toFixed(2).padStart(7)} ${gasSavingsP95.toFixed(2).padStart(7)}     | ` +
          `${amortizedImprovementMedian.toFixed(2).padStart(7)} ${amortizedImprovementP95.toFixed(2).padStart(7)}`
        );
      });
      
      // Summary insights with both median and p95
      if (batchSizes.length > 0) {
        const largestBatch = Math.max(...batchSizes);
        const largestGroup = batchBySize[largestBatch];
        if (largestGroup.latencies.length > 0 && largestGroup.gasUsed.length > 0) {
          const largestMedianGas = median(largestGroup.gasUsed);
          const largestP95Gas = p95(largestGroup.gasUsed);
          const largestMedianLatency = median(largestGroup.latencies);
          const largestP95Latency = p95(largestGroup.latencies);
          const largestGasPerUpdateMedian = largestMedianGas / largestBatch;
          const largestGasPerUpdateP95 = largestP95Gas / largestBatch;
          const largestAmortizedLatencyMedian = largestMedianLatency / largestBatch;
          const largestAmortizedLatencyP95 = largestP95Latency / largestBatch;
          
          console.log('\n' + '─'.repeat(100));
          console.log('Key Insights (Largest Batch Size):');
          console.log('─'.repeat(100));
          if (indMedianGas > 0) {
            const maxGasSavingsMedian = ((indMedianGas - largestGasPerUpdateMedian) / indMedianGas * 100).toFixed(1);
            const maxGasSavingsP95 = ((indP95Gas - largestGasPerUpdateP95) / indP95Gas * 100).toFixed(1);
            console.log(`• Batch size ${largestBatch} reduces gas cost per update:`);
            console.log(`  Median: ${maxGasSavingsMedian}% (${indMedianGas.toFixed(0)} → ${largestGasPerUpdateMedian.toFixed(0)} gas)`);
            console.log(`  P95:    ${maxGasSavingsP95}% (${indP95Gas.toFixed(0)} → ${largestGasPerUpdateP95.toFixed(0)} gas)`);
          }
          if (indMedianLatency > 0) {
            const maxAmortizedImprovementMedian = ((indMedianLatency - largestAmortizedLatencyMedian) / indMedianLatency * 100).toFixed(1);
            const maxAmortizedImprovementP95 = ((indP95Latency - largestAmortizedLatencyP95) / indP95Latency * 100).toFixed(1);
            console.log(`• Batch size ${largestBatch} improves amortized latency per update:`);
            console.log(`  Median: ${maxAmortizedImprovementMedian}% (${(indMedianLatency / 1000).toFixed(2)}s → ${(largestAmortizedLatencyMedian / 1000).toFixed(2)}s)`);
            console.log(`  P95:    ${maxAmortizedImprovementP95}% (${(indP95Latency / 1000).toFixed(2)}s → ${(largestAmortizedLatencyP95 / 1000).toFixed(2)}s)`);
            console.log(`  Transaction latency: ${(largestMedianLatency / 1000).toFixed(2)}s (median), ${(largestP95Latency / 1000).toFixed(2)}s (p95) for ${largestBatch} updates`);
          }
        }
      }
    }
    
    if (failedAnchors.length > 0) {
      console.log(`\n⚠️  Warning: ${failedAnchors.length} transactions reverted. Check contract or parameters.`);
    }
  }
}

if (process.argv.length < 3) {
  // eslint-disable-next-line no-console
  console.error('Usage: node analyze-bench.js [securevault-bench-client.json|none] <server.log>');
  console.error('  For blockchain-only analysis: node analyze-bench.js none server.log');
  process.exit(1);
}

const clientPath = process.argv[2] || 'none';
const serverPath = process.argv[3] || process.argv[2]; // If only one arg, assume it's server.log

if (!serverPath || serverPath === 'none') {
  console.error('Error: server.log path is required');
  process.exit(1);
}

analyzeClient(clientPath);
analyzeServer(serverPath);
analyzeAnchor(serverPath);


