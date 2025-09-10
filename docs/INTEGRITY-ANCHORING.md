# Integrity Anchoring (Tamper‑Evident Logs)

This document explains a practical, privacy‑safe way to use blockchain concepts in SecureVault without exposing secrets or adding unnecessary complexity.

## What problem does this solve?
- Your passwords are end‑to‑end encrypted; the server cannot read them.
- But a compromised server could delete/reorder encrypted items, hide security events, or claim a different history.
- Integrity anchoring makes that kind of silent tampering detectable and provable by periodically publishing a short fingerprint (Merkle root) of safe metadata.

## What do we anchor?
Only safe summaries:
- userId
- action: CREATE | UPDATE | DELETE
- resourceType: CREDENTIAL
- resourceId (database ID)
- timestamp

We never anchor secrets or encrypted blobs. The fingerprint is a Merkle root computed from SHA‑256 hashes of these summaries.

## How it works (high level)
1. Each credential CRUD event enqueues a tiny, safe record in memory (`blockchain-anchor` service).
2. When enough events accumulate (or on demand), we compute a Merkle root and persist a single `AuditAnchor` document containing:
   - `merkleRoot`, `batchSize`, `anchorTime`, `previousAnchor`
3. Optionally, you can publish the `merkleRoot` on a public blockchain (testnet for demo, low‑fee mainnet/L2 for production). This adds a public timestamp and third‑party verifiability.

## API
- GET `/api/integrity/status` (auth): returns the service status and the latest persisted anchor.
- POST `/api/integrity/anchor` (auth): forces a new anchor from the current batch and stores it.

## Verifying integrity
- Recompute the Merkle root from the saved events and compare with the stored `merkleRoot`.
- If you published on-chain, also verify the root and timestamp via the block explorer.

## What can a user do if tampering is detected?
- Detect and prove: If today’s recomputed root doesn’t match a prior anchor, you have cryptographic proof the state was altered.
- Restore: Find the last good anchor, select the backup that reproduces that Merkle root, and restore to that point.
- Escalate: Share the Merkle root, event batch, and (if used) the on‑chain transaction link with admins/auditors.

## Configuration
Environment variables in `server/.env`:
```
BLOCKCHAIN_ANCHOR_ENABLED=true
BLOCKCHAIN_ANCHOR_INTERVAL=1000
```

## Optional: publish to a real blockchain
- Keep costs tiny by anchoring infrequently (e.g., hourly) and posting just the Merkle root.
- For demos, use Ethereum Sepolia with Alchemy or Infura (free test ETH via faucet).
- For production, pick a low‑fee EVM chain (Polygon, Base, Optimism). Store the tx hash in `AuditAnchor.blockchainTxHash` and set `blockchainNetwork` accordingly.

### Enable on‑chain publishing (Sepolia demo)
1) Deploy the minimal contract via Remix or reuse an existing audit contract that has `emitAuditEvent(string,string,string,string,string)`.
2) Add to `server/.env`:
```
ONCHAIN_PUBLISH_ENABLED=true
ONCHAIN_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/yourKey
ONCHAIN_PRIVATE_KEY=0xyour_private_key   # keep secret
ONCHAIN_CONTRACT_ADDRESS=0xYourContract
```
3) Force an anchor:
```
POST /api/integrity/anchor
```
4) Check `AuditAnchor.blockchainTxHash` and view it on Sepolia Etherscan.

## Security notes
- Do not include secrets in the summaries; only IDs and timestamps.
- Use a dedicated key/account if you later enable on‑chain publishing.
- Anchoring complements, not replaces, your encrypted storage and access controls.


