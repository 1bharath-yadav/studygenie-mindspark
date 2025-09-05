#!/bin/bash

# Vercel Deployment Script
# This script helps deploy the frontend to Vercel

set -e

echo "🚀 Starting Vercel deployment for Study Genie Frontend..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the frontend directory."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Build the project first to check for errors
echo "🔨 Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "🎉 Deployment complete!"
echo "📋 Don't forget to:"
echo "   1. Set up your environment variables in Vercel dashboard"
echo "   2. Update VITE_API_BASE_URL to your production backend URL"
echo "   3. Configure your custom domain if needed"
