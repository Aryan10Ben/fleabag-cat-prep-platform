# Deployment Guide

Deploy CATPrep to **Vercel** with a **PostgreSQL** database for production.

## Overview

| Component | Recommendation |
|-----------|----------------|
| Hosting | [Vercel](https://vercel.com) |
| Database | [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app) |
| Auth | NextAuth.js with secure `NEXTAUTH_SECRET` |

## 1. Prepare PostgreSQL

1. Create a PostgreSQL database on your provider.
2. Copy the connection string (pooling URL recommended for serverless).

Example:

```
postgresql://user:password@ep-xxx.region.aws.neon.tech/catprep?sslmode=require
```

## 2. Update Prisma for Production

In `prisma/schema.prisma`, change the datasource provider:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Run migrations locally against your production DB (one-time setup):

```bash
npx prisma db push
# Or for migration history:
# npx prisma migrate deploy
```

Seed production data if needed:

```bash
npm run db:seed
```

> **Warning**: The seed script clears existing data. Run only on a fresh database.

## 3. Deploy to Vercel

### Option A: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

### Option B: GitHub Integration

1. Push your repository to GitHub.
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. Vercel auto-detects Next.js settings.

## 4. Configure Environment Variables

In the Vercel project dashboard → **Settings → Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Strong random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` |
| `NODE_ENV` | `production` |

Redeploy after adding variables.

## 5. Build Settings

Vercel defaults work for Next.js. Ensure:

- **Build Command**: `npm run build` (default)
- **Install Command**: `npm install` (runs `postinstall` → `prisma generate`)
- **Output Directory**: `.next` (automatic)

## 6. Post-Deploy Checklist

- [ ] Landing page loads at production URL
- [ ] Login works with seeded or registered users
- [ ] Dashboard fetches progress and analytics
- [ ] Mock test submission saves attempts
- [ ] PYQ exam session persists across refresh
- [ ] Admin panel restricted to admin role (harden before public launch)

## Custom Domain

1. Vercel → Project → **Domains**
2. Add your domain and configure DNS records
3. Update `NEXTAUTH_URL` to match the custom domain

## CI / Preview Deployments

Preview deployments on pull requests inherit environment variables. For preview DB isolation:

- Use a separate `DATABASE_URL` for Preview environment in Vercel
- Or use Neon branch databases per preview

## Monitoring

- Enable Vercel Analytics for Web Vitals
- Connect Sentry or similar for error tracking (not included in v1.0.0)
- Monitor database connection limits on serverless PostgreSQL

## Rollback

Vercel keeps deployment history. Roll back instantly from the **Deployments** tab if a release fails.
