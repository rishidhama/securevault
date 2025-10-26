# SecureVault Deployment Guide

## Vercel Deployment (Frontend Only)

### Step 1: Deploy Frontend to Vercel

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your `securevault` repository

2. **Configure Build Settings**
   - **Root Directory**: Set to `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

3. **Environment Variables**
   Add these in Vercel dashboard → Settings → Environment Variables:
   ```
   REACT_APP_API_URL=https://your-backend-url.vercel.app
   REACT_APP_BLOCKCHAIN_RPC_URL=https://eth-goerli.g.alchemy.com/v2/your-alchemy-key
   REACT_APP_ENVIRONMENT=production
   ```

### Step 2: Deploy Backend Separately

**Option A: Render (Recommended)**
1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect your GitHub repo
4. Set Root Directory to `server`
5. Add environment variables for database and JWT

**Option B: Railway**
1. Go to [railway.app](https://railway.app)
2. Deploy from GitHub
3. Select the `server` folder
4. Configure environment variables

### Step 3: Database Setup

**MongoDB Atlas (Free)**
1. Create account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a free cluster
3. Get connection string
4. Add to backend environment variables

### Step 4: Blockchain Setup

**Alchemy (Free)**
1. Create account at [alchemy.com](https://alchemy.com)
2. Create new app on Goerli testnet
3. Get API key
4. Add to environment variables

## Quick Deploy Commands

```bash
# Install dependencies
npm run install-all

# Test build locally
cd client && npm run build

# Deploy to Vercel (after connecting repo)
vercel --prod
```

## Environment Variables Checklist

### Frontend (Vercel)
- [ ] REACT_APP_API_URL
- [ ] REACT_APP_BLOCKCHAIN_RPC_URL
- [ ] REACT_APP_ENVIRONMENT=production

### Backend (Render/Railway)
- [ ] MONGODB_URI
- [ ] JWT_SECRET
- [ ] NODE_ENV=production
- [ ] ALCHEMY_API_KEY
- [ ] STRIPE_SECRET_KEY (if using billing)

## Troubleshooting

### Common Issues:
1. **Build Fails**: Check if root directory is set to `client`
2. **API Errors**: Verify backend URL in environment variables
3. **Database Connection**: Check MongoDB connection string
4. **CORS Issues**: Ensure backend allows frontend domain

### Testing Locally:
```bash
# Start backend
cd server && npm start

# Start frontend
cd client && npm start
```

## Resume Presentation

- **Live Demo**: [your-app.vercel.app](https://your-app.vercel.app)
- **GitHub**: [github.com/yourusername/securevault](https://github.com/yourusername/securevault)
- **Tech Stack**: React, Node.js, MongoDB, Ethereum, Vercel
