# SecureVault - Zero-Knowledge Password Manager

A secure password management system combining client-side encryption with blockchain-anchored integrity verification.

## Key Features

- **Zero-Knowledge Architecture**: All encryption/decryption happens client-side
- **Blockchain Integrity**: Merkle root anchoring for tamper detection
- **Multi-Factor Authentication**: TOTP, WebAuthn biometric, backup codes
- **Breach Monitoring**: HaveIBeenPwned API integration
- **Privacy-Preserving**: Only hashes stored on-chain, never sensitive data

## System Architecture

- **Frontend**: React.js with Web Crypto API
- **Backend**: Node.js/Express with MongoDB
- **Blockchain**: Ethereum Sepolia smart contracts
- **Encryption**: AES-256-GCM with PBKDF2 key derivation

## Technical Details

- **Encryption**: AES-256-GCM with unique IVs
- **Key Derivation**: PBKDF2-HMAC-SHA256 (310k iterations)
- **Integrity**: SHA-256 Merkle trees
- **Blockchain**: Ethereum Sepolia testnet
- **Database**: MongoDB for encrypted storage

## Getting Started

1. Clone this repository
2. Install dependencies: `npm run install-all`
3. Configure environment variables (see `env.example`)
4. Run development server: `npm run dev`

## Support

For questions about this project, please contact the development team.

---

## Contact & Links

-  [Resume](https://drive.google.com/file/d/1alEDqS-xwyzoSphqOT_9yGkgum0mU7Bv/view?usp=drive_link)
-  [GitHub](https://github.com/rishidhama)
-  [LinkedIn](https://www.linkedin.com/in/rishi-dhama)
-  Email: [rishidhama26@gmail.com](mailto:rishidhama26@gmail.com)