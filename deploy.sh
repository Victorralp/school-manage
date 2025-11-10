#!/bin/bash

# School Exam Management System - Vercel Deployment Script

echo "🚀 Deploying School Exam Management System to Vercel..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Build the project first
echo "📦 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    
    # Deploy to Vercel
    echo "🌐 Deploying to Vercel..."
    vercel --prod
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Deployment successful!"
        echo ""
        echo "📝 Next steps:"
        echo "1. Add your Vercel domain to Firebase authorized domains"
        echo "2. Test your deployment"
        echo "3. Share your app URL!"
        echo ""
    else
        echo "❌ Deployment failed. Check the errors above."
    fi
else
    echo "❌ Build failed. Fix the errors and try again."
fi
