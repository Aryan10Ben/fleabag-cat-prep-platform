# CATPrep – Progress Driven CAT Preparation Platform

[![GitHub](https://img.shields.io/badge/GitHub-Aryan10Ben%2Ffleabag--cat--prep--platform-181717?logo=github)](https://github.com/Aryan10Ben/fleabag-cat-prep-platform)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**CATPrep** is an open-source CAT (Common Admission Test) preparation platform — structured practice, full mocks, previous-year paper simulation, and progress analytics.

| Links | |
|-------|---|
| **Repository** | [github.com/Aryan10Ben/fleabag-cat-prep-platform](https://github.com/Aryan10Ben/fleabag-cat-prep-platform) |
| **Live demo** | [fleabag1-cat-prep-platform.vercel.app](https://fleabag1-cat-prep-platform.vercel.app) |
| **Releases** | [v1.0.0](https://github.com/Aryan10Ben/fleabag-cat-prep-platform/releases/tag/v1.0.0) |
| **Issues** | [Report a bug](https://github.com/Aryan10Ben/fleabag-cat-prep-platform/issues) |

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAryan10Ben%2Ffleabag-cat-prep-platform&env=DATABASE_URL,NEXTAUTH_SECRET,NEXTAUTH_URL,SEED_DEMO_USERS&envDescription=Required%20environment%20variables&envLink=https%3A%2F%2Fgithub.com%2FAryan10Ben%2Ffleabag-cat-prep-platform%2Fblob%2Fmain%2F.env.example&project-name=fleabag-cat-prep&repository-name=fleabag-cat-prep-platform)

## Overview

CATPrep helps MBA aspirants prepare systematically by combining structured topic practice, realistic mock tests, previous-year paper simulation, and data-driven performance analytics.

**Progress-driven workflow:** formula sheets → practice → subtopic tests → section mocks → full mocks → PYQ analysis.

## Features

- **Full Mock Tests** — Timed CAT simulations with scoring and percentile estimates
- **Quant / VARC / LRDI** — Topic-wise subtopics, formula sheets, practice, and tests
- **Previous Year CAT Papers** — Slot-wise PYQ mocks (2020–2025) with CAT-style exam UI
- **Progress Tracking** — Subtopic checklists and completion states
- **Performance Analytics** — Section strengths, trends, and attempt history
- **Dashboard** — Daily goals, streaks, and quick navigation
- **CAT-inspired Exam Interface** — Section timers, palette navigation, review flags

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js, React, TypeScript, Tailwind CSS |
| **Backend** | Node.js (Next.js App Router API routes) |
| **Database** | PostgreSQL, Prisma |
| **Authentication** | JWT via NextAuth.js |
| **Deployment** | Vercel |

## Screenshots

### Landing Page
![Landing Page](./screenshots/landing.png)

### Login
![Login](./screenshots/login.png)

### Dashboard
![Dashboard](./screenshots/dashboard.png)

> More screenshots: [screenshots/CAPTURE_GUIDE.md](./screenshots/CAPTURE_GUIDE.md)

## Quick Start (Local)

```bash
git clone https://github.com/Aryan10Ben/fleabag-cat-prep-platform.git
cd fleabag-cat-prep-platform
npm install
cp .env.example .env
npm run db:up          # requires Docker
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Demo credentials** (when `SEED_DEMO_USERS=true` during seed):

| Role | Email | Password |
|------|-------|----------|
| User | `user@test.com` | `password123` |
| Admin | `admin@test.com` | `password123` |

## Deploy to Vercel (Production)

1. **Create a Neon PostgreSQL database** — [neon.tech](https://neon.tech) (free tier)
2. **Deploy** — click the **Deploy with Vercel** button above, or import [the repo](https://github.com/Aryan10Ben/fleabag-cat-prep-platform) at [vercel.com/new](https://vercel.com/new)
3. **Set environment variables** in Vercel:

| Variable | Production value |
|----------|------------------|
| `DATABASE_URL` | Neon **pooled** connection string + `?sslmode=require` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://fleabag1-cat-prep-platform.vercel.app` |
| `SEED_DEMO_USERS` | `false` |

4. **Initialize database** (one-time, from your machine):

```bash
export DATABASE_URL="your-neon-pooled-url"
npx prisma db push
SEED_DEMO_USERS=false npm run db:seed
```

5. **Redeploy** after setting `NEXTAUTH_URL` to your live Vercel URL.

Full guide: [docs/Deployment.md](./docs/Deployment.md)

## Documentation

- [Installation](./docs/Installation.md) — Local development
- [Deployment](./docs/Deployment.md) — Vercel + Neon production setup
- [Architecture](./docs/Architecture.md) — System design
- [Changelog](./CHANGELOG.md) — Release history

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:up` | Start local Postgres (Docker) |
| `npm run db:push` | Push Prisma schema |
| `npm run db:seed` | Seed questions & optional demo users |
| `npm run test:e2e` | Playwright E2E tests |

## Contributing

Contributions welcome! Open an [issue](https://github.com/Aryan10Ben/fleabag-cat-prep-platform/issues) or [pull request](https://github.com/Aryan10Ben/fleabag-cat-prep-platform/pulls).

## License

[MIT](./LICENSE) © 2026 CATPrep Contributors
