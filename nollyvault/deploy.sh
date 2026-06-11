#!/bin/bash
# NollyVault — One-command Vercel deployment
# Run from inside the nollyvault/ directory

set -e

echo ""
echo "  NollyVault Deploy Script"
echo "  ─────────────────────────"
echo ""

# Check we're in the right place
if [ ! -f "package.json" ]; then
  echo "ERROR: Run this from inside the nollyvault/ directory"
  exit 1
fi

# Install vercel CLI if not present
if ! command -v vercel &> /dev/null; then
  echo "Installing Vercel CLI..."
  npm install -g vercel
fi

echo "Step 1: Building to check for errors..."
npm run build

echo ""
echo "Step 2: Deploying to Vercel..."
echo "(You'll be prompted to log in on first run)"
echo ""
vercel --prod

echo ""
echo "✓ Deployed! Your app is live."
echo ""
echo "Next steps:"
echo "  1. Go to vercel.com → your project → Settings → Environment Variables"
echo "  2. Add your Supabase, Paystack, and Cloudflare keys from .env.local.example"
echo "  3. Redeploy: vercel --prod"
echo ""
