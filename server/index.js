const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const credentialRoutes = require('./routes/credentials');
const authRoutes = require('./routes/auth');
const mfaRoutes = require('./routes/mfa');
const importExportRoutes = require('./routes/import-export');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting (fixes X-Forwarded-For warning)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:5000", "http://localhost:3000"]
    },
  },
  frameguard: { action: 'deny' },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection with improved error handling
const connectDB = async () => {
  const maxRetries = 3; // Reduced retries for faster feedback
  let retryCount = 0;

  const attemptConnection = async () => {
    try {
      console.log(`🔄 Attempting MongoDB connection (attempt ${retryCount + 1}/${maxRetries})...`);
      
      // Check if MONGODB_URI is set
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        console.error('❌ MONGODB_URI environment variable is not set!');
        console.log('📝 Please create a .env file with your MongoDB connection string');
        console.log('📖 See MONGODB_SETUP.md for detailed instructions');
        return false;
      }

              // Improved connection options for better stability
        const connectionOptions = {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 15000, // 15 seconds for server selection
          socketTimeoutMS: 30000, // 30 seconds for socket operations
          connectTimeoutMS: 15000, // 15 seconds for initial connection
          maxPoolSize: 5, // Reduced pool size for development
          minPoolSize: 1, // Minimum connections
          maxIdleTimeMS: 60000, // Keep connections alive longer
          retryWrites: true,
          w: 'majority',
          heartbeatFrequencyMS: 10000 // More frequent heartbeats
        };

      await mongoose.connect(mongoUri, connectionOptions);
      
      console.log('✅ Connected to MongoDB successfully');
      console.log(`📊 Database: ${mongoose.connection.name}`);
      console.log(`🌐 Host: ${mongoose.connection.host}`);
      
      // Set up connection event listeners
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err.message);
        if (err.message.includes('ECONNREFUSED')) {
          console.log('💡 Tip: Check if MongoDB service is running');
        } else if (err.message.includes('ENOTFOUND')) {
          console.log('💡 Tip: Check your internet connection and DNS');
        } else if (err.message.includes('ETIMEDOUT')) {
          console.log('💡 Tip: Network timeout - check firewall/antivirus settings');
        }
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️  MongoDB disconnected - attempting to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected successfully');
      });

      return true;
    } catch (err) {
      console.error(`❌ MongoDB connection attempt ${retryCount + 1} failed:`, err.message);
      
      // Provide specific error guidance
      if (err.message.includes('ECONNREFUSED')) {
        console.log('💡 This usually means MongoDB is not running or not accessible');
      } else if (err.message.includes('ENOTFOUND')) {
        console.log('💡 This usually means DNS resolution failed - check your internet connection');
      } else if (err.message.includes('ETIMEDOUT')) {
        console.log('💡 This usually means network timeout - check firewall settings');
      } else if (err.message.includes('IP not whitelisted')) {
        console.log('💡 Your IP is not whitelisted in MongoDB Atlas - add your IP to the whitelist');
      } else if (err.message.includes('Authentication failed')) {
        console.log('💡 Check your MongoDB username and password in the connection string');
      }
      
      return false;
    }
  };

  // Retry logic with exponential backoff
  while (retryCount < maxRetries) {
    const success = await attemptConnection();
    if (success) {
      return;
    }
    
    retryCount++;
    if (retryCount < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s
      console.log(`⏳ Retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // If all retries failed
  console.error('❌ All MongoDB connection attempts failed');
  console.error('💥 Application cannot start without database connection');
  console.log('\n🔧 Troubleshooting steps:');
  console.log('   1. Check your internet connection');
  console.log('   2. Verify MONGODB_URI in .env file');
  console.log('   3. If using MongoDB Atlas:');
  console.log('      - Check if your IP is whitelisted');
  console.log('      - Verify username/password');
  console.log('      - Ensure cluster is running');
  console.log('   4. If using local MongoDB:');
  console.log('      - Start MongoDB service');
  console.log('      - Check if port 27017 is available');
  console.log('   5. Check firewall/antivirus settings');
  console.log('\n📖 See MONGODB_SETUP.md for detailed instructions');
  process.exit(1);
};

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/mfa', mfaRoutes);
app.use('/api/import-export', importExportRoutes);
app.use('/api/credentials', credentialRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({ 
    status: 'OK', 
    message: 'SecureVault API is running',
    database: {
      status: dbStatus,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host || 'unknown',
      name: mongoose.connection.name || 'unknown'
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 SecureVault server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
}); 