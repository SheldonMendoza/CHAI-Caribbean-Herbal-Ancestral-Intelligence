# CHAI — Caribbean Herbal Ancestral Intelligence

**“Where Ancestral Wisdom Meets Artificial Intelligence.”**

A Caribbean medicinal-plant knowledge platform: a database-backed plant encyclopedia,
claim-level scientific evidence assessments, a traditional knowledge library, and
AI research assistants. Built on Cloudflare Workers + D1 (free tier).

> **Status: Phase 1 (Foundation) complete.** The site, design system, database schema,
> 15 verified starter plants, and working search are built and tested. AI chat, accounts,
> community posting, and the admin UI arrive in later phases — their navigation entries
> are present but show honest "coming soon" states. Nothing here is faked.

## What's in Phase 1

- **Web app** (`web/`): React 19 + TypeScript + Vite. Homepage, plant encyclopedia with
  instant search + filters + A–Z browsing, individual plant pages with traditional-use vs
  scientific-evidence separation and working citation links.
- **API** (`worker/`): read-only Cloudflare Worker (`GET /api/health`, `/api/plants`,
  `/api/plants/:slug`, `/api/filters`) with security headers and per-IP rate limiting.
- **Database** (`migrations/`): D1 schema — plants, regional names, distribution,
  traditional uses, per-claim evidence assessments, sources, users, saved plants, audit log.
- **Seed data** (`data/seed-plants.json`): 15 Caribbean medicinal plants with verified
  scientific identities, island-attributed regional names, and honest evidence ratings.
  Every fact traces to a real retrieved source listed in `DATA_SOURCES.md`. Fields that
  could not be verified are empty ("Not yet documented") — never invented.
- **AI provider seam** (`shared/types.ts`, `worker/src/ai/provider.ts`): typed interface
  for a swappable model provider, defaulting to Cloudflare Workers AI (free tier,
  10,000 Neurons/day hard cap). Phase 3 will implement it; Phase 1 ships a stub that
  honestly reports "not connected".

## Run it locally

```bash
# Web
cd web && npm install && npm run dev      # http://localhost:5173
npm test && npm run typecheck && npm run build

# Worker API
cd worker && npm install && npm test && npm run typecheck
```

## Deploy (later phases)

1. `wrangler d1 create chai-db` → put the real `database_id` in `wrangler.toml`
   (currently `REPLACE_ME`)
2. `wrangler d1 migrations apply --remote`
3. `wrangler deploy`
4. Serve `web/dist` (Cloudflare Pages or any static host)

See `ARCHITECTURE.md` and `DEVELOPMENT.md` for full details.

## Integrity rules

- No fabricated plant names, traditions, effects, studies, citations, DOIs, or URLs.
- Evidence is assessed **per claim**, never as a blanket rating on a plant.
- Traditional use and scientific evidence are always visually separated.
- The platform is educational, not medical advice.
