# 🔐 Vercel Environment Variables Template

## Backend Environment Variables

Add these to your Vercel backend project:

```env
# Node Environment
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/securevault

# JWT Secret (generate a strong secret)
JWT_SECRET=your_super_secret_jwt_key_here

# Ethereum/Blockchain Configuration
ETHEREUM_ENABLED=true
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_project_id
WALLET_PRIVATE_KEY=your_wallet_private_key_here
CONTRACT_ADDRESS=0xYourDeployedContractAddress

# Stripe Configuration (for billing)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## Frontend Environment Variables

Add these to your Vercel frontend project:

```env
# API URL (update after backend deployment)
REACT_APP_API_URL=https://your-backend-url.vercel.app

# Build Configuration
GENERATE_SOURCEMAP=false
```

## 🚀 Quick Deployment Steps

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy Backend
```bash
cd server
vercel --prod
```

### 4. Deploy Frontend
```bash
cd client
vercel --prod
```

### 5. Set Environment Variables
- Go to Vercel dashboard
- Select your project
- Go to Settings → Environment Variables
- Add all variables from the template above

### 6. Update API URL
- After backend deployment, copy the backend URL
- Update `REACT_APP_API_URL` in frontend environment variables
- Redeploy frontend

## 🔧 Troubleshooting

### Common Issues:
1. **CORS Errors**: Ensure `REACT_APP_API_URL` is correct
2. **Database Connection**: Check `MONGODB_URI` format
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
