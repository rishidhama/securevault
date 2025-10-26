# SecureVault Backend - Render Deployment Guide

## Step 1: Create MongoDB Atlas Database

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (free tier)
4. Create a database user
5. Get your connection string
6. Whitelist all IPs (0.0.0.0/0) for Render

## Step 2: Deploy to Render

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure the service:

### Render Configuration:
- **Name**: `securevault-backend`
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Node Version**: `18`

## Step 3: Environment Variables

Add these in Render dashboard → Environment:

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/securevault?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
CLIENT_URL=https://your-app.vercel.app
ALCHEMY_API_KEY=your-alchemy-api-key
```

## Step 4: Update Frontend

1. Go to Vercel dashboard
2. Settings → Environment Variables
3. Add: `REACT_APP_API_URL=https://your-backend.onrender.com`

## Step 5: Test Deployment

1. Check backend health: `https://your-backend.onrender.com/api/health`
2. Test frontend: `https://your-app.vercel.app`

## Troubleshooting

### Common Issues:
- **Database Connection**: Check MongoDB Atlas IP whitelist
- **CORS Errors**: Verify CLIENT_URL matches your Vercel domain
- **Build Failures**: Check Node.js version (use 18+)

### Health Check:
```bash
curl https://your-backend.onrender.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "SecureVault API is running",
  "database": {
    "status": "connected",
    "host": "cluster.mongodb.net"
  }
}
```
