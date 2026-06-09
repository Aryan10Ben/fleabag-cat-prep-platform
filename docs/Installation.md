# Installation Guide

This guide walks you through running CATPrep locally for development.

## Prerequisites

- **Node.js** 20.x or later
- **npm** 10+ (or pnpm/yarn)
- **Git**

PostgreSQL is required. The easiest local setup uses Docker Compose (included in this repo).

## 1. Clone the Repository

```bash
git clone https://github.com/Aryan10Ben/fleabag-cat-prep-platform.git
cd fleabag-cat-prep-platform
```

## 2. Install Dependencies

```bash
npm install
```

The `postinstall` script runs `prisma generate` automatically.

## 3. Configure Environment Variables

Copy the example file and edit values:

```bash
cp .env.example .env
```

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Prisma database connection string | `file:./dev.db` (SQLite) |
| `NEXTAUTH_SECRET` | Secret for JWT signing | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | App base URL | `http://localhost:3000` |

### Start PostgreSQL (Docker)

```bash
npm run db:up
# or: docker compose up -d
```

### Environment

```env
DATABASE_URL="postgresql://catprep:catprep@localhost:5432/catprep?schema=public"
NEXTAUTH_SECRET=your_generated_secret
NEXTAUTH_URL=http://localhost:3000
SEED_DEMO_USERS=true
```

> Set `SEED_DEMO_USERS=false` in production to skip demo accounts during seeding.

## 4. Initialize the Database

```bash
# Push schema to database
npm run db:push

# Seed topics, questions, and mock tests (demo users if SEED_DEMO_USERS=true)
npm run db:seed
```

Seeding takes a few minutes—it inserts thousands of questions and test configurations.

### Optional: Seed PYQ papers only

```bash
npx tsx prisma/seed-pyq.ts
```

## 5. Start the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## 6. Log In

After seeding, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Student | `user@test.com` | `password123` |
| Admin | `admin@test.com` | `password123` |

## Verify the Build

Before committing or deploying:

```bash
npm run lint
npm run build
```

## Troubleshooting

### `Environment variable not found: DATABASE_URL`

Ensure `.env` exists in the project root with `DATABASE_URL` set.

### Prisma client out of sync

```bash
npm run db:generate
```

### NextAuth session errors

Verify `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are set. Restart the dev server after changing `.env`.

### Seed fails mid-run

Reset the Docker database volume and re-run:

```bash
docker compose down -v
docker compose up -d
npm run db:push
npm run db:seed
```
