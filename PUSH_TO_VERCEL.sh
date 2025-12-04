#!/bin/bash

echo "🚀 Pushing to Vercel..."
echo ""

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"
echo ""

# Push current branch
echo "📤 Pushing to remote..."
git push origin $CURRENT_BRANCH

echo ""
echo "✅ Push complete!"
echo ""
echo "🔍 Which branch does Vercel watch?"
echo "   1. Go to: https://vercel.com/dashboard"
echo "   2. Select your project"
echo "   3. Settings → Git"
echo "   4. Check 'Production Branch'"
echo ""
echo "If Vercel watches 'main' but you're on '$CURRENT_BRANCH':"
echo "   Option 1: Merge to main: git checkout main && git merge $CURRENT_BRANCH && git push"
echo "   Option 2: Change Vercel to watch '$CURRENT_BRANCH'"
echo ""
