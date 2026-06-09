#!/usr/bin/env bash
# Deploy CATPrep to Vercel. Requires: vercel login OR VERCEL_TOKEN env var
set -euo pipefail

PRODUCTION_URL="https://fleabag-cat-prep.vercel.app"
PROJECT_NAME="fleabag-cat-prep"

echo "==> CATPrep Vercel deploy"
echo "    Target URL: $PRODUCTION_URL"

if ! command -v vercel &>/dev/null && ! npx vercel --version &>/dev/null 2>&1; then
  echo "Installing Vercel CLI..."
  npm i -g vercel
fi

VERCEL_CMD="npx vercel"
if [ -n "${VERCEL_TOKEN:-}" ]; then
  VERCEL_CMD="npx vercel --token $VERCEL_TOKEN"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Warning: DATABASE_URL not set locally. Ensure it is configured in Vercel dashboard."
fi

if [ -z "${NEXTAUTH_SECRET:-}" ]; then
  export NEXTAUTH_SECRET=$(openssl rand -base64 32)
  echo "Generated NEXTAUTH_SECRET for this deploy session."
fi

export NEXTAUTH_URL="${NEXTAUTH_URL:-$PRODUCTION_URL}"

echo "==> Linking project ($PROJECT_NAME)..."
$VERCEL_CMD link --yes --project "$PROJECT_NAME" 2>/dev/null || $VERCEL_CMD link --yes

echo "==> Setting production env vars (if DATABASE_URL is set)..."
if [ -n "${DATABASE_URL:-}" ]; then
  echo "$DATABASE_URL" | $VERCEL_CMD env add DATABASE_URL production --force 2>/dev/null || true
  echo "$NEXTAUTH_SECRET" | $VERCEL_CMD env add NEXTAUTH_SECRET production --force 2>/dev/null || true
  echo "$NEXTAUTH_URL" | $VERCEL_CMD env add NEXTAUTH_URL production --force 2>/dev/null || true
  echo "false" | $VERCEL_CMD env add SEED_DEMO_USERS production --force 2>/dev/null || true
fi

echo "==> Deploying to production..."
$VERCEL_CMD --prod --yes

echo ""
echo "Deploy complete. Visit: $PRODUCTION_URL"
echo "If first deploy, run: DATABASE_URL=... npx prisma db push && SEED_DEMO_USERS=false npm run db:seed"
