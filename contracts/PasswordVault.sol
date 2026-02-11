pragma solidity ^0.8.20;

// Stores integrity hashes for password vaults
// Only stores hashes, never plaintext or encrypted data
contract PasswordVault {
    struct VaultHash {
        string userId;
        string vaultHash;
        uint256 timestamp;
        bool exists;
    }

    mapping(string => VaultHash) public vaults;
    mapping(bytes32 => bool) private userSeen;
    uint256 private vaultCount;

    event VaultUpdated(string indexed userId, string vaultHash, uint256 timestamp);
    event VaultDeleted(string indexed userId, uint256 timestamp);

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Update or create vault hash for a user
    function updateVaultHash(string memory userId, string memory vaultHash) public {
        require(bytes(userId).length > 0, "userId empty");
        require(bytes(vaultHash).length > 0, "vaultHash empty");

        bytes32 key = keccak256(bytes(userId));
        if (!vaults[userId].exists && !userSeen[key]) {
            userSeen[key] = true;
            vaultCount += 1;
        }

        vaults[userId] = VaultHash({
            userId: userId,
            vaultHash: vaultHash,
            timestamp: block.timestamp,
            exists: true
        });

        emit VaultUpdated(userId, vaultHash, block.timestamp);
    }

    function getVaultHash(string memory userId)
        public
        view
        returns (string memory vaultHash, uint256 timestamp, bool exists)
    {
        VaultHash memory v = vaults[userId];
        return (v.vaultHash, v.timestamp, v.exists);
    }

    // Admin only - delete vault hash
    function deleteVaultHash(string memory userId) public onlyOwner {
        require(vaults[userId].exists, "not found");
        delete vaults[userId];
        if (vaultCount > 0) {
            vaultCount -= 1;
        }
        emit VaultDeleted(userId, block.timestamp);
    }

    function getVaultCount() public view returns (uint256) {
        return vaultCount;
    }

    function hasEverExisted(string memory userId) public view returns (bool) {
        return userSeen[keccak256(bytes(userId))];
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "zero addr");
        owner = newOwner;
    }
}


