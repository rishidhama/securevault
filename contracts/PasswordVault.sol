// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PasswordVault
 * @dev Stores per-user vault hashes on-chain for tamper-evidence. Optimized for Sepolia/testnets.
 */
contract PasswordVault {
    struct VaultHash {
        string userId;
        string vaultHash;
        uint256 timestamp;
        bool exists;
    }

    // userId (string) => vault data
    mapping(string => VaultHash) public vaults;

    // Track unique users efficiently
    mapping(bytes32 => bool) private userSeen;
    uint256 private vaultCount;

    // Events
    event VaultUpdated(string indexed userId, string vaultHash, uint256 timestamp);
    event VaultDeleted(string indexed userId, uint256 timestamp);

    // Owner (for administrative ops like delete/ownership transfer)
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Update or create a vault hash for a user
     * @param userId The user identifier (e.g., email or UUID)
     * @param vaultHash The hash (e.g., SHA-256) of the user's encrypted vault blob
     */
    function updateVaultHash(string memory userId, string memory vaultHash) public {
        require(bytes(userId).length > 0, "userId empty");
        require(bytes(vaultHash).length > 0, "vaultHash empty");

        // Increment count only when first time we see this user or record was deleted
        if (!vaults[userId].exists) {
            bytes32 key = keccak256(bytes(userId));
            if (!userSeen[key]) {
                userSeen[key] = true;
                vaultCount += 1;
            } else {
                // userSeen true but exists false -> previously deleted, re-add should count again
                vaultCount += 1;
            }
        }

        vaults[userId] = VaultHash({
            userId: userId,
            vaultHash: vaultHash,
            timestamp: block.timestamp,
            exists: true
        });

        emit VaultUpdated(userId, vaultHash, block.timestamp);
    }

    /**
     * @dev Fetch vault data for a user
     * @param userId The user identifier
     * @return vaultHash Hash string
     * @return timestamp Last updated time
     * @return exists Whether a record exists
     */
    function getVaultHash(string memory userId)
        public
        view
        returns (string memory vaultHash, uint256 timestamp, bool exists)
    {
        VaultHash memory v = vaults[userId];
        return (v.vaultHash, v.timestamp, v.exists);
    }

    /**
     * @dev Delete a user's vault hash (admin-only)
     */
    function deleteVaultHash(string memory userId) public onlyOwner {
        require(vaults[userId].exists, "not found");
        delete vaults[userId];
        // Decrement count on delete to reflect active records
        if (vaultCount > 0) {
            vaultCount -= 1;
        }
        emit VaultDeleted(userId, block.timestamp);
    }

    /**
     * @dev Returns active vault record count
     */
    function getVaultCount() public view returns (uint256) {
        return vaultCount;
    }

    /**
     * @dev Has a userId ever been seen before (created once)?
     */
    function hasEverExisted(string memory userId) public view returns (bool) {
        return userSeen[keccak256(bytes(userId))];
    }

    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "zero addr");
        owner = newOwner;
    }

    /**
     * @dev Contract info
     */
    function getContractInfo() public pure returns (string memory contractName, string memory version) {
        return ("PasswordVault", "1.1.0");
    }


