#!/bin/bash

# 🚀 SecureVault Vercel Deployment Script
# This script helps deploy both frontend and backend to Vercel

echo "🚀 Starting SecureVault deployment to Vercel..."
echo "================================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel. Please login first:"
    vercel login
fi

echo ""
echo "📋 Deployment Options:"
echo "1. Deploy Backend Only"
echo "2. Deploy Frontend Only"
echo "3. Deploy Both (Recommended)"
echo "4. Exit"
echo ""

read -p "Choose an option (1-4): " choice

case $choice in
    1)
        echo "🔧 Deploying Backend..."
        cd server
        vercel --prod
        echo "✅ Backend deployment complete!"
        echo "📝 Don't forget to:"
        echo "   - Set environment variables in Vercel dashboard"
        echo "   - Update REACT_APP_API_URL in frontend"
        ;;
    2)
        echo "🎨 Deploying Frontend..."
        cd client
        vercel --prod
        echo "✅ Frontend deployment complete!"
        echo "📝 Don't forget to:"
        echo "   - Set REACT_APP_API_URL environment variable"
        echo "   - Ensure backend is deployed and accessible"
        ;;
    3)
        echo "🚀 Deploying Both Frontend and Backend..."
        
        echo "🔧 Deploying Backend..."
        cd server
        vercel --prod
        BACKEND_URL=$(vercel ls | grep server | head -1 | awk '{print $2}')
        echo "✅ Backend deployed at: https://$BACKEND_URL"
        
        echo ""
        echo "🎨 Deploying Frontend..."
        cd ../client
        vercel --prod
        FRONTEND_URL=$(vercel ls | grep client | head -1 | awk '{print $2}')
        echo "✅ Frontend deployed at: https://$FRONTEND_URL"
        
        echo ""
        echo "🎉 Deployment Complete!"
        echo "======================"
        echo "Frontend: https://$FRONTEND_URL"
        echo "Backend:  https://$BACKEND_URL"
        echo ""
        echo "📝 Next Steps:"
        echo "1. Update environment variables in Vercel dashboard"
        echo "2. Set REACT_APP_API_URL to: https://$BACKEND_URL"
        echo "3. Test the application"
        ;;
    4)
        echo "👋 Exiting deployment script"
        exit 0
        ;;
    *)
        echo "❌ Invalid option. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "📚 For detailed instructions, see: VERCEL-DEPLOYMENT-GUIDE.md"
