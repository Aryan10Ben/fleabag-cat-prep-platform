# Changelog

All notable changes to CATPrep are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-09

### Added

- Landing page and credential-based login via NextAuth.js
- User dashboard with daily goals, streak tracking, and motivational quotes
- **Quant**, **VARC**, and **LRDI** section hubs with subtopic navigation
- Per-subtopic formula sheets, practice sessions, and topic tests
- Full mock test simulator with timed sections and result pages
- Previous Year CAT (PYQ) papers with CAT-style exam interface
  - Section timers (VARC → DILR → QA)
  - Question palette, review flags, and session persistence
  - Post-exam analysis with section-wise breakdown
- Performance analytics page with trends and section insights
- User profile page
- Admin panel for question upload and AI-assisted generation (heuristic MVP)
- REST API routes for tests, questions, topics, progress, and analytics
- Prisma schema with comprehensive models (users, questions, attempts, PYQ, analytics)
- Database seed with demo users, 100+ questions per subtopic, and mock tests
- Dark mode support with system preference detection

### Improvements

- CAT-inspired exam UI for mocks and PYQ with section locking
- KaTeX math rendering for Quant questions
- Responsive sidebar layout with section-aware navigation
- Progress checklist per subtopic (formula → practice → test → revision)

### Known Limitations

- **Database**: Requires PostgreSQL. Use `docker compose up -d` for local development (see [Installation Guide](./docs/Installation.md)).
- **Authentication**: Credentials-only auth; no OAuth providers configured yet.
- **Similar Question Generator**: Admin tool uses heuristic templates, not a live LLM API.
- **PYQ content**: Seed data uses representative questions; not official IIM question papers.
- **Percentile estimates**: Mock percentiles are simulated, not calibrated against real CAT data.
- **Screenshots**: README screenshot placeholders require manual capture (see [CAPTURE_GUIDE](./screenshots/CAPTURE_GUIDE.md)).
- **Type safety**: Some API routes use loose typing; strict typing is planned for v1.1.
- **Mobile UX**: Exam interface is optimized for desktop; mobile polish is incomplete.
- **Admin authorization**: Admin routes should be hardened with role-based middleware before public deployment.

[1.0.0]: https://github.com/YOUR_USERNAME/cat-prep-platform/releases/tag/v1.0.0
