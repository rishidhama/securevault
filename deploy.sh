#!/bin/bash

# SecureVault Deployment Script
echo "🚀 Starting SecureVault deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm run install-all

# Test build
echo "🔨 Testing build..."
cd client
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Go to https://vercel.com"
    echo "2. Import your GitHub repository"
    echo "3. Set Root Directory to 'client'"
    echo "4. Add environment variables:"
    echo "   - REACT_APP_API_URL=https://your-backend-url.vercel.app"
    echo "   - REACT_APP_BLOCKCHAIN_RPC_URL=https://eth-goerli.g.alchemy.com/v2/your-key"
    echo "5. Deploy!"
    echo ""
    echo "📚 See DEPLOYMENT.md for detailed instructions"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
