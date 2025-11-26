#!/bin/bash

# Quick Deploy Script for VidyutAI Dashboard
# This script helps you deploy to Vercel quickly

echo "🚀 VidyutAI Dashboard - Quick Deploy"
echo "======================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Navigate to frontend directory
cd frontend

echo "📦 Building frontend..."
npm run build

echo ""
echo "🌐 Deploying to Vercel..."
echo ""

# Deploy to Vercel
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Go to Vercel Dashboard: https://vercel.com/dashboard"
echo "2. Add your domain 'vidyutai.in' in Settings → Domains"
echo "3. Set environment variable VITE_API_BASE_URL (if backend is separate)"
echo ""
echo "🔗 Your site will be live at: https://vidyutai.in"

