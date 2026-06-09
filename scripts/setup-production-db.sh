#!/usr/bin/env bash
# One-time production database setup. Run locally with production DATABASE_URL in .env
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Error: DATABASE_URL is not set. Export it or add to .env"
  exit 1
fi

echo "Pushing Prisma schema to production database..."
npx prisma db push

read -r -p "Seed question bank? This CLEARS existing data. (y/N): " confirm
if [[ "$confirm" =~ ^[Yy]$ ]]; then
  export SEED_DEMO_USERS="${SEED_DEMO_USERS:-false}"
  echo "Seeding with SEED_DEMO_USERS=$SEED_DEMO_USERS ..."
  npm run db:seed
else
  echo "Skipped seeding."
fi

echo "Done. Deploy or redeploy on Vercel."
