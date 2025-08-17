# Deployment Guide for SecureVault

## Overview

This guide will help you deploy SecureVault to Vercel (frontend) and Render (backend) for production use.

## Environment Configuration

### Frontend (Vercel)

1. **Create `.env` file in the `client` directory:**
   ```bash
   # For development
   REACT_APP_API_URL=http://localhost:5000
   
   # For production (your Render backend URL)
   REACT_APP_API_URL=https://your-app-name.onrender.com
   ```

2. **Vercel Environment Variables:**
   - Go to your Vercel project settings
   - Add environment variable: `REACT_APP_API_URL`
   - Set value to your Render backend URL

### Backend (Render)

1. **Create `.env` file in the root directory:**
   ```bash
   # MongoDB Connection
   MONGODB_URI=your_mongodb_connection_string
   
   # JWT Secret
   JWT_SECRET=your_super_secret_jwt_key_change_in_production
   
   # Client URL (your Vercel frontend URL)
   CLIENT_URL=https://your-app-name.vercel.app
   
   # Port (Render will set this automatically)
   PORT=10000
   ```

2. **Render Environment Variables:**
   - Go to your Render service settings
   - Add the same environment variables as above

## Deployment Steps

### 1. Backend Deployment (Render)

1. **Connect your GitHub repository to Render**
2. **Create a new Web Service**
3. **Configure the service:**
   - **Name**: `securevault-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: Leave empty (root of repo)

4. **Set Environment Variables** (as listed above)

5. **Deploy**

### 2. Frontend Deployment (Vercel)

1. **Connect your GitHub repository to Vercel**
2. **Configure the project:**
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

3. **Set Environment Variables:**
   - `REACT_APP_API_URL`: Your Render backend URL

4. **Deploy**

## API Configuration

The application now uses a centralized API configuration that automatically:

- **Development**: Uses `http://localhost:5000`
- **Production**: Uses `REACT_APP_API_URL` environment variable
- **Fallback**: Uses `window.location.origin` if no environment variable is set

## CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000` (development)
- Your Vercel frontend URL (production)

## Security Considerations

1. **JWT Secret**: Use a strong, random secret in production
2. **MongoDB**: Use MongoDB Atlas with proper security settings
3. **Environment Variables**: Never commit sensitive data to version control
4. **HTTPS**: Both Vercel and Render provide HTTPS by default

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure `CLIENT_URL` is set correctly in backend
2. **API Connection**: Verify `REACT_APP_API_URL` is set correctly in frontend
3. **MongoDB Connection**: Check your MongoDB Atlas network access settings
4. **Build Failures**: Ensure all dependencies are in `package.json`

### Debugging

1. **Check Render logs** for backend errors
2. **Check Vercel logs** for frontend build issues
3. **Use browser console** to debug API calls
4. **Verify environment variables** are set correctly

## Production Checklist

- [ ] MongoDB Atlas configured with proper security
- [ ] JWT secret is strong and unique
- [ ] Environment variables set in both Vercel and Render
- [ ] CORS configured correctly
- [ ] HTTPS enabled (automatic with Vercel/Render)
- [ ] Error logging configured
- [ ] Performance monitoring set up
- [ ] Backup strategy implemented

## Monitoring

1. **Render**: Built-in monitoring and logs
2. **Vercel**: Built-in analytics and performance monitoring
3. **MongoDB Atlas**: Database monitoring and alerts
4. **Application**: Consider adding error tracking (Sentry, etc.)

## Scaling

- **Render**: Automatically scales based on traffic
- **Vercel**: Global CDN with automatic scaling
- **MongoDB Atlas**: Can be upgraded to higher tiers as needed

## Support

If you encounter issues:
1. Check the logs in both Vercel and Render
2. Verify all environment variables are set correctly
3. Test the API endpoints directly
4. Check browser console for frontend errors
