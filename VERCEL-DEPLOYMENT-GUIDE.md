# 🚀 Vercel Deployment Guide for SecureVault

## 📋 **Prerequisites**

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **MongoDB Atlas**: Set up a production MongoDB database
4. **Environment Variables**: Prepare all required environment variables

## 🔧 **Step 1: Backend Deployment**

### 1.1 Create Backend Project
```bash
# Navigate to server directory
cd server

# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy backend
vercel
```

### 1.2 Configure Backend Environment Variables
In Vercel dashboard, add these environment variables:
```
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
ETHEREUM_ENABLED=true
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_key
WALLET_PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS=your_deployed_contract_address
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

## 🎨 **Step 2: Frontend Deployment**

### 2.1 Create Frontend Project
```bash
# Navigate to client directory
cd client

# Deploy frontend
vercel
```

### 2.2 Configure Frontend Environment Variables
In Vercel dashboard, add:
```
REACT_APP_API_URL=https://your-backend-url.vercel.app
GENERATE_SOURCEMAP=false
```

## 🔗 **Step 3: Update API Configuration**

### 3.1 Update Frontend API URL
After backend deployment, update the frontend's API URL:
```bash
# In Vercel dashboard, update the environment variable:
REACT_APP_API_URL=https://your-actual-backend-url.vercel.app
```

### 3.2 Redeploy Frontend
```bash
# Trigger a new deployment
vercel --prod
```

## 📁 **Project Structure for Vercel**

```
securevault/
├── client/                 # Frontend (deployed separately)
│   ├── vercel.json
│   ├── package.json
│   └── src/
├── server/                 # Backend (deployed separately)
│   ├── vercel.json
│   ├── index.js
│   └── routes/
└── vercel.json            # Root configuration
```

## 🌐 **Deployment URLs**

After deployment, you'll have:
- **Frontend**: `https://your-frontend-url.vercel.app`
- **Backend**: `https://your-backend-url.vercel.app`

## 🔐 **Environment Variables Reference**

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/securevault
JWT_SECRET=your_super_secret_jwt_key
ETHEREUM_ENABLED=true
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_key
WALLET_PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS=0x...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend (.env)
```env
REACT_APP_API_URL=https://your-backend-url.vercel.app
GENERATE_SOURCEMAP=false
```

## 🚀 **Quick Deployment Commands**

### Deploy Backend
```bash
cd server
vercel --prod
```

### Deploy Frontend
```bash
cd client
vercel --prod
```

### Update Environment Variables
```bash
# Backend
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
# ... add all required variables

# Frontend
vercel env add REACT_APP_API_URL production
```

## ✅ **Post-Deployment Checklist**

1. ✅ Backend deployed and accessible
2. ✅ Frontend deployed and accessible
3. ✅ Environment variables configured
4. ✅ Database connection working
5. ✅ Blockchain integration working
6. ✅ API endpoints responding
7. ✅ Frontend can communicate with backend
8. ✅ Authentication working
9. ✅ Credential operations working
10. ✅ Blockchain transactions recording

## 🔧 **Troubleshooting**

### Common Issues:
1. **CORS Errors**: Ensure REACT_APP_API_URL is correct
2. **Database Connection**: Check MONGODB_URI format
3. **Blockchain Issues**: Verify RPC URL and wallet key
4. **Build Failures**: Check Node.js version compatibility

### Debug Commands:
```bash
# Check deployment logs
vercel logs

# Check environment variables
vercel env ls

# Redeploy with debug info
vercel --debug
```

## 📞 **Support**

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test API endpoints directly
4. Check browser console for errors

---

**Deployment Status**: Ready for Vercel deployment
**Last Updated**: September 11, 2025
