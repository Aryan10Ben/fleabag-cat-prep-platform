# Screenshot Capture Guide

Use this checklist to generate marketing screenshots for the CATPrep README and GitHub repository.

## Before You Start

1. Start the app locally: `npm run dev`
2. Seed the database: `npm run db:seed`
3. Log in as `user@test.com` / `password123`
4. Use **light mode** or **dark mode** consistently across all captures (dark mode recommended for brand consistency)

## Browser & Resolution Settings

| Setting | Recommended Value |
|---------|-------------------|
| Browser | Chrome or Edge (latest) |
| Window size | **1440 × 900** (desktop) |
| Device pixel ratio | 2× (Retina) for crisp PNGs |
| Export format | PNG |
| Export width | **1440px** wide (scale 2× → 2880px effective) |

### Chrome DevTools Setup

1. Open DevTools (`F12` or `Cmd+Option+I`)
2. Toggle device toolbar (`Cmd+Shift+M`)
3. Set dimensions to **1440 × 900**
4. Set zoom to **100%**
5. Hide DevTools before capturing

### Capture Methods

- **macOS**: `Cmd+Shift+4` → drag to select the browser content area (exclude browser chrome)
- **Chrome extension**: [GoFullPage](https://gofullpage.com) for full-page shots (use sparingly)
- **Built-in**: Browser → Share → Screenshot (Safari)

## Naming Convention

Save all files to this folder (`screenshots/`) using **lowercase kebab-case**:

```
landing.png
login.png
dashboard.png
quant.png
varc.png
lrdi.png
previous-year.png
mock-test.png
performance.png
profile.png
```

## Required Screenshots

### Checklist

| File | Page URL | What to Capture | Status |
|------|----------|-----------------|--------|
| `landing.png` | `/` | Hero with Start CTA | ☑ |
| `login.png` | `/login` | Split-screen login form | ☑ |
| `dashboard.png` | `/dashboard` | Daily goals, streak flame, progress cards, section links | ☑ |
| `quant.png` | `/quant` | Quant topic grid with subtopic cards | ☐ |
| `varc.png` | `/varc` | VARC topic list and progress indicators | ☐ |
| `lrdi.png` | `/lrdi` | LRDI topic list | ☐ |
| `previous-year.png` | `/pyq` | PYQ paper cards (year/slot grid) | ☐ |
| `mock-test.png` | `/mock-tests` | Mock test catalog OR active exam UI | ☐ |
| `performance.png` | `/performance` | Analytics charts and section breakdown | ☐ |
| `profile.png` | `/profile` | User profile and settings | ☐ |

### Page-Specific Tips

#### Dashboard (`dashboard.png`)
- Wait for the loading animation to finish
- Ensure streak count and daily goal rings are visible
- Include the sidebar for context

#### Quant / VARC / LRDI
- Capture the full topic grid—scroll to include at least 6 subtopic cards
- Show progress checkmarks if available

#### Previous Year Papers (`previous-year.png`)
- Navigate to `/pyq`
- Capture the paper selection grid with year and slot labels

#### Mock Test (`mock-test.png`)
- **Option A**: `/mock-tests` catalog view (recommended for README)
- **Option B**: Mid-exam screenshot from `/mock-tests/[testId]` showing timer and question palette (advanced)

#### Performance (`performance.png`)
- Complete at least one mock or PYQ attempt first so charts have data
- Capture section strength/weakness cards

#### Profile (`profile.png`)
- Show name, email, and streak on `/profile`

## Optional Bonus Screenshots

| File | Page | Use Case |
|------|------|----------|
| `pyq-exam.png` | `/pyq/[paperId]/exam` | Showcase CAT exam UI |
| `admin.png` | `/admin` | Developer documentation |

> `landing.png` and `login.png` are now part of the required set and included in the README.

## Quality Checklist

Before committing screenshots:

- [ ] No browser UI (tabs, address bar, bookmarks) visible
- [ ] No personal/sensitive data beyond demo seed content
- [ ] Consistent theme (all light or all dark)
- [ ] Text is readable at README display size
- [ ] PNG files are under 500 KB each (compress with [TinyPNG](https://tinypng.com) if needed)
- [ ] Filenames match the table above exactly

## Updating README

After capturing, verify images render in `README.md`:

```bash
# From project root — open README preview in your editor
# or serve locally:
npx serve . && open http://localhost:3000/README.md
```

Replace `./screenshots/*.png` paths in README if you add new images.
