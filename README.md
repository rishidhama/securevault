## Integrity Anchoring (Tamper-Evident Logs)

This app now supports a minimal, privacy-safe integrity anchoring flow that helps detect server-side tampering without ever putting secrets on a blockchain.

### What and why (plain English)
- Your passwords are end‑to‑end encrypted; the server cannot read them. However, a compromised server could still delete or reorder encrypted items, hide security events, or restore from an "old" backup.
- To deter this, we create a short fingerprint (hash) of batches of safe metadata (IDs + timestamps) and store only that fingerprint’s Merkle root. Optionally, that root can be published to a public blockchain. Later, we can prove the server did not silently alter history.

### What gets anchored
- Only safe data: event summaries like userId, action (CREATE/UPDATE/DELETE), resourceType, resourceId, and timestamp.
- Never secrets, never encrypted blobs.

### How it works
1. Each credential CRUD event enqueues a small, safe audit record.
2. Periodically (or on demand), the server computes a Merkle root of the queued records and persists an `AuditAnchor` document containing:
   - `merkleRoot`, `batchSize`, `anchorTime`, `previousAnchor`
3. Optionally, you can take that Merkle root and publish it on a public chain. The README keeps it off-chain by default (free). You can later extend this to post on Sepolia/Polygon.

### API
- GET `/api/integrity/status` (auth required): returns current anchor status and last persisted anchor.
- POST `/api/integrity/anchor` (auth required): forces an anchor of the current batch and stores it in `AuditAnchor`.

### Verifying integrity (concept)
- Given the event batch and the stored Merkle root, you can recompute the root. If recomputed root matches the stored one, the server didn’t tamper with those events.
- If you publish the root on-chain, the on-chain timestamp also proves when the state existed.

### What a user can do if tampering is detected
- Detect and prove: If the current server state’s recomputed root doesn’t match the last anchored root, you can demonstrate evidence of manipulation.
- Recover from trusted backups: Compare anchored roots across time, identify the last good state, and restore from backups matching those hashes.
- Escalate with proof: Share the Merkle root, the event batch, and (optionally) the on-chain tx link to auditors or admins.

### Enable/disable
- Off-chain anchoring is enabled by default via the internal service. To disable, set `BLOCKCHAIN_ANCHOR_ENABLED=false` in `server/.env`.
- Optional envs:
  - `BLOCKCHAIN_ANCHOR_ENABLED=true|false`
  - `BLOCKCHAIN_ANCHOR_INTERVAL=1000` (anchor every N events)

### Optional: publish to a real blockchain later
- Use a low-cost chain and post only the Merkle root periodically to keep costs tiny. For demos, use Sepolia (free faucets) with Alchemy/Infura.

# 🔐 SecureVault - Smart Web-Based Password Manager

A professional, full-stack password manager with **client-side AES encryption** built for your final-year project. SecureVault implements **Zero-Knowledge Architecture** where your master key never leaves your device.

![SecureVault]
![React]
![Node.js]
![MongoDB]
![AES-256]

## 🎯 Project Overview

SecureVault is a sophisticated password management system that prioritizes security through client-side encryption. Your master key and passwords are **never transmitted to the server** in plain text, ensuring complete privacy and security.

### ✨ Key Features

- **🔒 Client-Side AES-256-CBC Encryption** - All passwords encrypted before leaving your device
- **🛡️ Zero-Knowledge Architecture** - Master key never sent to server
- **🎨 Modern React UI** - Beautiful, responsive interface with TailwindCSS
- **📱 Mobile-First Design** - Works perfectly on all devices
- **🔍 Advanced Search & Filtering** - Find credentials quickly
- **⭐ Favorites System** - Mark important credentials
- **📊 Dashboard Analytics** - View vault statistics
- **🔧 Password Generator** - Generate strong, secure passwords
- **📈 Password Strength Indicator** - Real-time strength analysis
- **📤 Export Functionality** - Backup your encrypted vault
- **🎯 Category Management** - Organize credentials by type

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Node.js Backend│    │   MongoDB Atlas │
│                 │    │                 │    │                 │
│ • AES Encryption│◄──►│ • REST API      │◄──►│ • Credential    │
│ • Master Key    │    │ • Validation    │    │   Storage       │
│ • UI Components │    │ • Rate Limiting │    │ • Indexing      │
│ • State Mgmt    │    │ • Security      │    │ • Backup        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local or Atlas)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/securevault.git
   cd securevault
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/securevault
   CLIENT_URL=http://localhost:3000
   NODE_ENV=development
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health: http://localhost:5000/api/health

## 🔧 Development

### Project Structure

```
securevault/
├── client/                 # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # React Components
│   │   ├── services/      # API Services
│   │   ├── utils/         # Encryption Utilities
│   │   └── index.css      # TailwindCSS Styles
│   └── package.json
├── server/                 # Node.js Backend
│   ├── models/            # MongoDB Schemas
│   ├── routes/            # API Routes
│   └── index.js           # Express Server
├── package.json            # Root Dependencies
└── README.md
```

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run server           # Start backend only
npm run client           # Start frontend only

# Production
npm run build            # Build frontend for production
npm start                # Start production server

# Installation
npm run install-all      # Install all dependencies
```

## 🔐 Security Features

### Encryption Details

- **Algorithm**: AES-256-CBC
- **Key Derivation**: PBKDF2 with 1000 iterations
- **Salt Generation**: Cryptographically secure random
- **IV Generation**: Unique for each password
- **Client-Side**: All encryption/decryption happens in browser

### Security Headers

- **Helmet.js**: Comprehensive security headers
- **CORS**: Configured for secure cross-origin requests
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Server-side validation with express-validator

### Zero-Knowledge Architecture

1. **Master Key**: Stored only in browser localStorage
2. **Password Encryption**: Happens client-side before transmission
3. **Server Storage**: Only encrypted data stored in database
4. **Decryption**: Happens client-side using master key

## 📊 API Endpoints

### Authentication
- `GET /api/health` - Health check

### Credentials
- `GET /api/credentials` - Get all credentials
- `POST /api/credentials` - Create new credential
- `PUT /api/credentials/:id` - Update credential
- `DELETE /api/credentials/:id` - Delete credential
- `PATCH /api/credentials/:id/favorite` - Toggle favorite

### Analytics
- `GET /api/credentials/stats/overview` - Get vault statistics
- `GET /api/credentials/categories/list` - Get all categories

## 🎨 UI Components

### Core Components
- **Dashboard**: Main interface with stats and credential list
- **AddCredential**: Form for adding new credentials
- **Vault**: Dedicated view for all credentials
- **SettingsPage**: Security and account management
- **MasterKeyModal**: Secure master key entry
- **LoadingSpinner**: Loading states

### Features
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Mode Ready**: TailwindCSS configuration prepared
- **Accessibility**: ARIA labels and keyboard navigation
- **Toast Notifications**: User feedback with react-hot-toast
- **Icons**: Lucide React icons throughout

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **TailwindCSS** - Utility-first CSS framework
- **CryptoJS** - Client-side AES encryption
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Lucide React** - Beautiful icons

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### Development
- **Concurrently** - Run multiple commands
- **Nodemon** - Auto-restart server
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

## 📈 Database Schema

### Credential Model
```javascript
{
  title: String,              // Required, max 100 chars
  username: String,           // Required, max 200 chars
  encryptedPassword: String,  // Required, max 1000 chars
  iv: String,                // Required, max 100 chars
  salt: String,              // Required, max 100 chars
  url: String,               // Optional, max 500 chars
  notes: String,             // Optional, max 1000 chars
  category: String,          // Default: 'General'
  tags: [String],            // Array of tags
  isFavorite: Boolean,       // Default: false
  lastModified: Date,        // Auto-updated
  createdAt: Date            // Auto-generated
}
```

## 🚀 Deployment

### Environment Variables
```env
# Production
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/securevault
CLIENT_URL=https://your-domain.com
SESSION_SECRET=your-super-secret-key
JWT_SECRET=your-jwt-secret-key
```

### Build for Production
```bash
# Build frontend
cd client && npm run build

# Start production server
npm start
```

## 🔍 Testing

### Manual Testing Checklist
- [ ] Master key entry and validation
- [ ] Add new credential with encryption
- [ ] View and decrypt passwords
- [ ] Search and filter functionality
- [ ] Favorite/unfavorite credentials
- [ ] Delete credentials
- [ ] Password generator
- [ ] Export vault functionality
- [ ] Responsive design on mobile
- [ ] Security headers verification

## 🛠️ Troubleshooting

### Master Key Decryption Issues

If you encounter "Decryption failed: Error: Failed to decrypt password. Check your master key" errors, this usually indicates one of the following issues:

1. **Master key not properly stored**: The master key may not be saved correctly in localStorage
2. **Master key corrupted**: The stored master key may have been modified or corrupted
3. **Browser storage cleared**: localStorage may have been cleared, removing the master key

#### Solutions:

1. **Re-enter your master key**: The application will automatically prompt you to re-enter your master key when decryption fails
2. **Clear browser data and log in again**: If the issue persists, try logging out and logging back in
3. **Use the debug function**: Open browser console and run `window.debugMasterKey()` to get diagnostic information

#### Debug Information

To troubleshoot master key issues, you can use the built-in debug function:

1. Open your browser's developer console (F12)
2. Run: `window.debugMasterKey()`
3. Check the console output for:
   - Master key length and existence
   - Authentication status
   - Decryption test results

#### Common Error Messages:

- `*** Master Key Required ***`: Master key is missing or empty
- `*** Master Key Error ***`: Master key validation failed
- `*** Decryption Failed ***`: General decryption error
- `*** Invalid Data ***`: Missing encryption parameters

### Other Common Issues

#### Port Already in Use
If you get a port conflict error:
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use a different port
PORT=3001 npm start
```

#### Database Connection Issues
Make sure your MongoDB instance is running and the connection string in `.env` is correct.

**MongoDB Troubleshooting:**

1. **Run the diagnostic tool:**
   ```bash
   npm run check-mongodb
   ```

2. **For Local MongoDB:**
   - **Windows**: `net start MongoDB`
   - **macOS**: `brew services start mongodb/brew/mongodb-community`
   - **Linux**: `sudo systemctl start mongod`

3. **For MongoDB Atlas:**
   - Check your IP is whitelisted
   - Verify connection string and credentials
   - Ensure network connectivity

4. **Check connection status:**
   ```bash
   curl http://localhost:5000/api/health
   ```

5. **Common issues:**
   - MongoDB service not running
   - Wrong connection string
   - Network/firewall blocking connection
   - Authentication credentials incorrect

## 📝 Project Features for Interview

### Technical Excellence
- ✅ **Full-Stack Development** - React + Node.js + MongoDB
- ✅ **Security Implementation** - AES-256-CBC encryption
- ✅ **Modern Architecture** - Zero-knowledge design
- ✅ **Professional UI/UX** - TailwindCSS with responsive design
- ✅ **API Design** - RESTful API with proper validation
- ✅ **Database Design** - MongoDB with Mongoose schemas
- ✅ **Error Handling** - Comprehensive error management
- ✅ **Code Organization** - Modular, maintainable code

### Advanced Features
- ✅ **Client-Side Encryption** - CryptoJS implementation
- ✅ **Password Strength Analysis** - Real-time strength checking
- ✅ **Search & Filtering** - Advanced credential management
- ✅ **Export Functionality** - Backup and restore capabilities
- ✅ **Responsive Design** - Mobile-first approach
- ✅ **Security Best Practices** - Helmet, CORS, rate limiting

### Interview Talking Points
1. **Security Architecture**: Explain zero-knowledge design
2. **Encryption Implementation**: Detail AES-256-CBC process
3. **Database Design**: Discuss MongoDB schema and indexing
4. **API Design**: RESTful endpoints with validation
5. **Frontend Architecture**: React hooks and state management
6. **Deployment Strategy**: Production considerations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **CryptoJS** for client-side encryption
- **TailwindCSS** for beautiful styling
- **Lucide React** for icons
- **React Hot Toast** for notifications

---

**🔐 SecureVault** - Your passwords, your control, your security.
