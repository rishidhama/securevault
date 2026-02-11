// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PasswordVaultL2
 * @notice L2-optimized contract for storing vault integrity hashes on Arbitrum
 * @dev Uses bytes32 instead of strings for 10-20x gas savings on L2
 * 
 * Gas Optimizations:
 * - bytes32 instead of string: ~90% storage cost reduction
 * - Packed struct: 2 storage slots instead of 4
 * - Custom errors: ~50% cheaper than require strings
 * - Removed redundant userId from struct (it's the mapping key)
 * - Optimized event indexing with bytes32
 */
contract PasswordVaultL2 {
    // Custom errors (cheaper than require strings)
    error EmptyInput();
    error NotOwner();
    error NotFound();
    error ZeroAddress();

    // Packed struct: timestamp (uint64) + exists (bool) = 1 slot
    // vaultHash (bytes32) = 1 slot
    // Total: 2 storage slots (vs 4 in original)
    struct VaultHash {
        bytes32 vaultHash;      // Merkle root or integrity hash (32 bytes)
        uint64 timestamp;        // Block timestamp (fits in uint64 until year 2106)
        bool exists;             // Existence flag
    }

    // Mapping: userIdHash (bytes32) => VaultHash
    // userIdHash = keccak256(abi.encodePacked(userId))
    mapping(bytes32 => VaultHash) public vaults;
    
    // Track unique users (for statistics)
    mapping(bytes32 => bool) private userSeen;
    uint256 private vaultCount;

    // Events with indexed bytes32 (cheaper than string events)
    event VaultUpdated(
        bytes32 indexed userIdHash,
        bytes32 vaultHash,
        uint64 timestamp
    );
    event VaultDeleted(
        bytes32 indexed userIdHash,
        uint64 timestamp
    );

    address public owner;

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Update or create vault hash for a user
     * @param userIdHash keccak256 hash of the user ID (computed off-chain)
     * @param vaultHash Merkle root or integrity hash (32 bytes)
     * @dev Gas optimized: ~70% cheaper than string-based version
     */
    function updateVaultHash(bytes32 userIdHash, bytes32 vaultHash) external {
        if (vaultHash == bytes32(0)) revert EmptyInput();

        // Track new users for statistics
        if (!vaults[userIdHash].exists && !userSeen[userIdHash]) {
            userSeen[userIdHash] = true;
            vaultCount += 1;
        }

        // Packed struct write (2 storage slots)
        vaults[userIdHash] = VaultHash({
            vaultHash: vaultHash,
            timestamp: uint64(block.timestamp),
            exists: true
        });

        emit VaultUpdated(userIdHash, vaultHash, uint64(block.timestamp));
    }

    /**
     * @notice Get vault hash for a user
     * @param userIdHash keccak256 hash of the user ID
     * @return vaultHash The stored integrity hash
     * @return timestamp Block timestamp when last updated
     * @return exists Whether the vault exists
     */
    function getVaultHash(bytes32 userIdHash)
        external
        view
        returns (bytes32 vaultHash, uint64 timestamp, bool exists)
    {
        VaultHash memory v = vaults[userIdHash];
        return (v.vaultHash, v.timestamp, v.exists);
    }

    /**
     * @notice Admin function to delete a vault hash
     * @param userIdHash keccak256 hash of the user ID
     */
    function deleteVaultHash(bytes32 userIdHash) external onlyOwner {
        if (!vaults[userIdHash].exists) revert NotFound();
        
        delete vaults[userIdHash];
        
        if (vaultCount > 0) {
            vaultCount -= 1;
        }
        
        emit VaultDeleted(userIdHash, uint64(block.timestamp));
    }

    /**
     * @notice Get total number of unique vaults
     * @return count Number of unique users who have stored vaults
     */
    function getVaultCount() external view returns (uint256) {
        return vaultCount;
    }

    /**
     * @notice Check if a user has ever stored a vault
     * @param userIdHash keccak256 hash of the user ID
     * @return hasExisted True if user has ever stored a vault
     */
    function hasEverExisted(bytes32 userIdHash) external view returns (bool) {
        return userSeen[userIdHash];
    }

    /**
     * @notice Transfer contract ownership
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        owner = newOwner;
    }

    /**
     * @notice Batch update multiple vaults in a single transaction
     * @param userIdHashes Array of user ID hashes
     * @param vaultHashes Array of corresponding vault hashes
     * @dev Gas efficient for L2: single transaction, multiple updates
     *      Saves on transaction overhead when updating multiple users
     */
    function batchUpdateVaultHash(
        bytes32[] calldata userIdHashes,
        bytes32[] calldata vaultHashes
    ) external {
        if (userIdHashes.length != vaultHashes.length) revert EmptyInput();
        if (userIdHashes.length == 0) revert EmptyInput();

        uint64 currentTimestamp = uint64(block.timestamp);

        for (uint256 i = 0; i < userIdHashes.length; i++) {
            if (vaultHashes[i] == bytes32(0)) continue; // Skip invalid hashes

            bytes32 userIdHash = userIdHashes[i];

            // Track new users
            if (!vaults[userIdHash].exists && !userSeen[userIdHash]) {
                userSeen[userIdHash] = true;
                vaultCount += 1;
            }

            vaults[userIdHash] = VaultHash({
                vaultHash: vaultHashes[i],
                timestamp: currentTimestamp,
                exists: true
            });

            emit VaultUpdated(userIdHash, vaultHashes[i], currentTimestamp);
        }
    }
}

