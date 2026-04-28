const encoder = new TextEncoder();

async function sha256Hex(data) {
  const buffer = typeof data === 'string' ? encoder.encode(data) : data;
  const digest = await window.crypto.subtle.digest('SHA-256', buffer);
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
  return encoder.encode(a + b);
}

async function hashPair(left, right) {
  const combined = pairConcatHex(left, right);
  return sha256Hex(combined);
}

class IncrementalMerkleTree {
  constructor() {
    this.leavesById = new Map();
    this.leafIndexMap = new Map();
    this.levels = [];
    this.root = null;
  }

  async initFromCredentials(credentials) {
    this.leavesById.clear();
    this.leafIndexMap.clear();
    this.levels = [];

    if (!Array.isArray(credentials) || credentials.length === 0) {
      this.root = null;
      return this.root;
    }

    const leaves = await Promise.all(
      credentials.map(async (cred, index) => {
        const hash = await leafHash(cred);
        const credId = cred._id || cred.id;
        this.leavesById.set(credId, hash);
        this.leafIndexMap.set(credId, index);
        return hash;
      })
    );

    if (leaves.length === 0) {
      this.root = null;
      return this.root;
    }

    let level = leaves;
    this.levels = [level];

    while (level.length > 1) {
      const pairs = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = i + 1 < level.length ? level[i + 1] : level[i];
        pairs.push({ left, right });
      }

      const next = await Promise.all(
        pairs.map(({ left, right }) => hashPair(left, right))
      );
      this.levels.push(next);
      level = next;
    }

    this.root = level[0];
    return this.root;
  }

  async updateLeaf(credId, cred) {
    const newLeafHash = await leafHash(cred);
    const oldLeafHash = this.leavesById.get(credId);

    if (oldLeafHash === newLeafHash) {
      return this.root;
    }

    if (!this.leafIndexMap.has(credId)) {
      return this.addLeaf(credId, cred);
    }

    this.leavesById.set(credId, newLeafHash);

    if (this.levels.length === 0) {
      this.levels = [[newLeafHash]];
      this.root = newLeafHash;
      return this.root;
    }

    const leafIndex = this.leafIndexMap.get(credId);
    this.levels[0][leafIndex] = newLeafHash;

    let currentIndex = leafIndex;
    for (let levelIdx = 0; levelIdx < this.levels.length - 1; levelIdx++) {
      const level = this.levels[levelIdx];
      const pairIndex = Math.floor(currentIndex / 2);
      const left = level[pairIndex * 2];
      const right = pairIndex * 2 + 1 < level.length
        ? level[pairIndex * 2 + 1]
        : level[pairIndex * 2];

      const parentHash = await hashPair(left, right);
      const nextLevel = this.levels[levelIdx + 1];
      nextLevel[pairIndex] = parentHash;
      currentIndex = pairIndex;
    }

    this.root = this.levels[this.levels.length - 1][0];
    return this.root;
  }

  async addLeaf(credId, cred) {
    const newLeafHash = await leafHash(cred);
    this.leavesById.set(credId, newLeafHash);

    if (this.levels.length === 0) {
      this.levels = [[newLeafHash]];
      this.leafIndexMap.set(credId, 0);
      this.root = newLeafHash;
      return this.root;
    }

    const newIndex = this.levels[0].length;
    this.leafIndexMap.set(credId, newIndex);
    this.levels[0].push(newLeafHash);

    let currentIndex = newIndex;
    let levelIdx = 0;

    while (levelIdx < this.levels.length - 1) {
      const level = this.levels[levelIdx];
      const pairIndex = Math.floor(currentIndex / 2);
      const left = level[pairIndex * 2];
      const right = pairIndex * 2 + 1 < level.length
        ? level[pairIndex * 2 + 1]
        : left;

      const parentHash = await hashPair(left, right);

      if (pairIndex < this.levels[levelIdx + 1].length) {
        this.levels[levelIdx + 1][pairIndex] = parentHash;
      } else {
        this.levels[levelIdx + 1].push(parentHash);
      }

      currentIndex = pairIndex;
      levelIdx++;
    }

    if (this.levels[levelIdx].length > 1) {
      const topLevel = this.levels[levelIdx];
      const left = topLevel[topLevel.length - 2];
      const right = topLevel[topLevel.length - 1];
      const newRoot = await hashPair(left, right);
      this.levels.push([newRoot]);
      this.root = newRoot;
    } else {
      this.root = this.levels[levelIdx][0];
    }

    return this.root;
  }

  async deleteLeaf(credId) {
    if (!this.leavesById.has(credId)) {
      return this.root;
    }

    this.leavesById.delete(credId);
    this.leafIndexMap.delete(credId);

    if (this.leavesById.size === 0) {
      this.levels = [];
      this.root = null;
      return this.root;
    }

    return this.rebuild();
  }

  async rebuild() {
    const credsArray = Array.from(this.leavesById.entries());
    this.leafIndexMap.clear();
    this.levels = [];

    if (credsArray.length === 0) {
      this.root = null;
      return this.root;
    }

    const leaves = credsArray.map(([id, hash], index) => {
      this.leafIndexMap.set(id, index);
      return hash;
    });

    let level = leaves;
    this.levels = [level];

    while (level.length > 1) {
      const pairs = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = i + 1 < level.length ? level[i + 1] : level[i];
        pairs.push({ left, right });
      }

      const next = await Promise.all(
        pairs.map(({ left, right }) => hashPair(left, right))
      );
      this.levels.push(next);
      level = next;
    }

    this.root = level[0];
    return this.root;
  }

  getRoot() {
    return this.root;
  }

  getLeafCount() {
    return this.leavesById.size;
  }

  clear() {
    this.leavesById.clear();
    this.leafIndexMap.clear();
    this.levels = [];
    this.root = null;
  }
}

export default IncrementalMerkleTree;
export { leafHash };

