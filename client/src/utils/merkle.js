// Simple Merkle tree (SHA-256) over canonicalized credential blobs
// Uses SubtleCrypto for hashing; returns hex root

const encoder = new TextEncoder();

async function sha256Hex(data) {
  const buffer = typeof data === 'string' ? encoder.encode(data) : data;
  const digest = await (window.crypto.subtle).digest('SHA-256', buffer);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function canonicalizeItem(cred) {
  const minimal = {
    encryptedPassword: cred.encryptedPassword || '',
    iv: cred.iv || '',
    salt: cred.salt || cred.saltRef || '',
    metadataHash: cred.title || cred.username || cred.url || cred.category
      ? undefined
      : undefined
  };
  // For metadataHash, hash minimal metadata fields to avoid PII exposure in leaves
  const metadata = {
    title: cred.title || '',
    username: cred.username || '',
    url: cred.url || '',
    category: cred.category || '',
    createdAt: cred.createdAt || '',
    updatedAt: cred.updatedAt || cred.lastModified || ''
  };
  return { minimal, metadata };
}

async function leafHash(cred) {
  const { minimal, metadata } = canonicalizeItem(cred);
  const metadataJson = JSON.stringify(metadata);
  const metadataHash = await sha256Hex(metadataJson);
  const leafJson = JSON.stringify({
    encryptedPassword: minimal.encryptedPassword,
    iv: minimal.iv,
    saltRef: minimal.salt,
    metadataHash
  });
  return sha256Hex(leafJson);
}

function pairConcatHex(a, b) {
  const enc = encoder;
  return enc.encode(a + b);
}

export async function computeMerkleRoot(credentials) {
  if (!Array.isArray(credentials) || credentials.length === 0) {
    return null;
  }
  // Compute leaf hashes
  const leaves = await Promise.all(credentials.map(leafHash));
  // Build up the tree
  let level = leaves;
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = i + 1 < level.length ? level[i + 1] : level[i]; // duplicate last if odd
      const combined = pairConcatHex(left, right);
      // eslint-disable-next-line no-await-in-loop
      const parent = await sha256Hex(combined);
      next.push(parent);
    }
    level = next;
  }
  return level[0];
}

export async function computeCanonicalSummaryHash(credentials, userId) {
  const summary = credentials.map(c => ({
    id: c._id,
    title: c.title,
    username: c.username,
    url: c.url,
    category: c.category,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt || c.lastModified
  }));
  const payload = JSON.stringify({ userId, credentialCount: credentials.length, credentials: summary });
  return sha256Hex(payload);
}


