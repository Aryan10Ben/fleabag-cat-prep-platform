# Deployment Guide

Deploy **CATPrep** to [Vercel](https://vercel.com) with a managed **PostgreSQL** database.

**Repository:** [github.com/Aryan10Ben/fleabag-cat-prep-platform](https://github.com/Aryan10Ben/fleabag-cat-prep-platform)

---

## Quick deploy (recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAryan10Ben%2Ffleabag-cat-prep-platform&env=DATABASE_URL,NEXTAUTH_SECRET,NEXTAUTH_URL,SEED_DEMO_USERS&envDescription=Required%20environment%20variables%20for%20CATPrep&envLink=https%3A%2F%2Fgithub.com%2FAryan10Ben%2Ffleabag-cat-prep-platform%2Fblob%2Fmain%2F.env.example&project-name=fleabag-cat-prep&repository-name=fleabag-cat-prep-platform)

After clicking **Deploy**:

1. Create a free PostgreSQL database on [Neon](https://neon.tech) (see Step 1 below).
2. Fill in the environment variables Vercel prompts for.
3. After the first deploy succeeds, run the one-time database setup (Step 3).

---

## Step 1 — Create production PostgreSQL (Neon)

1. Sign up at [neon.tech](https://neon.tech) → **New Project** → name it `catprep`.
2. Open **Connection Details** and copy:
   - **Pooled connection** → use as `DATABASE_URL` on Vercel
   - Append `?sslmode=require` if not already present
3. Example:

```env
DATABASE_URL=postgresql://catprep_owner:YOUR_PASSWORD@ep-cool-name-12345678.us-east-2.aws.neon.tech/neondb?sslmode=require
```

> **Tip:** Use the **pooled** URL for Vercel serverless. Neon labels it “Connection pooling” in the dashboard.

---

## Step 2 — Deploy to Vercel

### Option A: One-click (GitHub already connected)

Use the **Deploy with Vercel** button in the [README](https://github.com/Aryan10Ben/fleabag-cat-prep-platform#quick-start) or import manually:

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import **Aryan10Ben/fleabag-cat-prep-platform**
3. Add environment variables (Production + Preview):

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | Neon pooled connection string | Required |
| `NEXTAUTH_SECRET` | Random 32+ char secret | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://fleabag1-cat-prep-platform.vercel.app` | Production URL |
| `SEED_DEMO_USERS` | `false` | **Do not** seed demo passwords in production |
| `NODE_ENV` | `production` | Optional — Vercel sets this automatically |

4. Click **Deploy**

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel link
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add SEED_DEMO_USERS production   # enter: false
vercel --prod
```

---

## Step 3 — Initialize the production database (one-time)

Vercel builds do **not** run migrations automatically. From your machine:

```bash
# Clone and install
git clone https://github.com/Aryan10Ben/fleabag-cat-prep-platform.git
cd fleabag-cat-prep-platform
npm install

# Point at production Neon database
export DATABASE_URL="postgresql://..."   # Neon pooled URL
export SEED_DEMO_USERS=false             # no demo accounts in prod

# Push schema + seed question bank
npx prisma db push
npm run db:seed
```

Or use the helper script:

```bash
chmod +x scripts/setup-production-db.sh
DATABASE_URL="postgresql://..." SEED_DEMO_USERS=false ./scripts/setup-production-db.sh
```

> **Warning:** `db:seed` clears all existing data. Run only on a fresh database.

### Create your own admin user (production)

After seeding without demo users, register via SQL or add a user script. Quickest path for a fresh deploy with demo content for testing:

```bash
SEED_DEMO_USERS=true npm run db:seed   # only on empty DB, then change passwords
```

For a public demo, consider a read-only demo account with a strong unique password.

---

## Step 4 — Update NEXTAUTH_URL

Production URL: `https://fleabag1-cat-prep-platform.vercel.app`

1. Vercel → **Settings → Environment Variables**
2. Set `NEXTAUTH_URL` to that exact URL (include `https://`)
3. **Redeploy** (Deployments → ⋯ → Redeploy)

Login will fail if `NEXTAUTH_URL` does not match your live domain.

---

## Step 5 — Verify

- [ ] `https://your-app.vercel.app` — landing page loads
- [ ] `/login` — sign-in works
- [ ] `/dashboard` — progress data loads (requires seeded DB)
- [ ] `/mock-tests` — catalog appears
- [ ] `/admin` — redirects non-admins to dashboard

---

## Environment variable reference

See [`.env.example`](../.env.example) for local vs production values.

| Variable | Local | Production |
|----------|-------|------------|
| `DATABASE_URL` | `postgresql://catprep:catprep@localhost:5432/catprep` | Neon pooled URL |
| `NEXTAUTH_SECRET` | any dev secret | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://fleabag1-cat-prep-platform.vercel.app` |
| `SEED_DEMO_USERS` | `true` | `false` |

---

## Custom domain

1. Vercel → **Domains** → add your domain
2. Update `NEXTAUTH_URL` to `https://yourdomain.com`
3. Redeploy

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails on Prisma | Ensure `postinstall` runs (`prisma generate`). Check `DATABASE_URL` is set in Vercel. |
| `Environment variable not found: DATABASE_URL` | Add `DATABASE_URL` in Vercel env vars, redeploy. |
| Login redirects loop | `NEXTAUTH_URL` must match live URL exactly. |
| Empty dashboard / 401 | Run `prisma db push` + `db:seed` against production DB. |
| Connection pool timeout | Use Neon **pooled** connection string, not direct. |

---

## Rollback

Vercel → **Deployments** → select a previous deployment → **Promote to Production**.
