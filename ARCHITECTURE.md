# CHAI — Caribbean Herbal Ancestral Intelligence · Architecture

**Phase 1 status (2026-10-14):** read-only plant encyclopedia. The Vite SPA is
built and verified (`tsc` clean, `50/50` vitest pass, `vite build` succeeds).
No worker, no deployment, no auth, no AI, no community posting — those are
later phases. Zero budget: free tiers only; the only external request the
frontend makes is the Google Fonts CDN stylesheet.

Tagline: *"Where Ancestral Wisdom Meets Artificial Intelligence."*

---

## 1. Repo layout

```
~/workspace/chai/
├── ARCHITECTURE.md            # this file
├── shared/
│   └── types.ts               # SINGLE SOURCE OF TRUTH — all shared contracts
├── contracts/
│   ├── api.md                 # worker REST contract (Phase 1: read-only)
│   ├── schema.md              # D1 schema + migrations contract
│   └── seed-format.md         # seed-plants.json shape + research rules
├── data/                      # (coordinator) real researched dataset lands here
├── migrations/                # (worker) 0001_init.sql, 0002_seed.sql (generated)
├── scripts/                   # (coordinator) generate-seed-sql.mjs
├── web/                       # <-- Phase 1 frontend (this build)
│   ├── index.html             # fonts, title, meta
│   ├── package.json           # react, react-dom, react-router-dom, vite,
│   │                          # typescript, @vitejs/plugin-react, vitest
│   ├── vite.config.ts         # react plugin + vitest (node env)
│   ├── tsconfig.json          # strict, noUnusedLocals/Parameters, resolveJsonModule
│   └── src/
│       ├── main.tsx           # entry
│       ├── App.tsx            # router, scroll restoration, titles, route announcer
│       ├── index.css          # design tokens + component styles
│       ├── vite-env.d.ts
│       ├── data/
│       │   └── seed-plants.json   # DEV FIXTURE (2 records) — the coordinator
│       │                          # OVERWRITES this file verbatim with the real
│       │                          # researched dataset at integration time.
│       │                          # Import path MUST stay stable.
│       ├── lib/
│       │   ├── query.ts       # pure search/filter/sort + summary derivation
│       │   │                  # (unit-tested; mirrors GET /api/plants semantics)
│       │   └── data.ts        # PlantDataSource interface, SeedDataSource
│       │                      # (default), ApiDataSource (prepared, NOT wired)
│       ├── components/
│       │   ├── ui.tsx         # Button, Card, Badge, Input, Select, Field,
│       │   │                  # EmptyState, NotDocumented, Tooltip
│       │   ├── Logo.tsx       # original inline-SVG brand mark
│       │   ├── BotanicalArt.tsx # original inline-SVG hero fallback art
│       │   ├── EvidenceBadge.tsx# the 6 evidence-category badges
│       │   ├── PlantCard.tsx  # encyclopedia card (disabled "Ask AI" + tooltip)
│       │   ├── Header.tsx     # persistent nav, global search, AI entry, mobile menu
│       │   ├── Footer.tsx     # nav, phase note, educational disclaimer
│       │   ├── PageHero.tsx   # inner-page hero band
│       │   └── BigSearch.tsx  # prominent search bar → /plants?q=
│       └── pages/
│           ├── Home.tsx           # / — 11 sections per spec
│           ├── Plants.tsx         # /plants — search, filters, A–Z, pagination
│           ├── PlantDetail.tsx    # /plants/:slug — tradition/science/safety bands
│           ├── Research.tsx       # /research — honest Phase-3 placeholder
│           ├── TraditionalKnowledge.tsx  # honest placeholder, real framing text
│           ├── Evidence.tsx       # REAL: 6-category methodology + review process
│           ├── Community.tsx      # honest Phase-4 placeholder
│           ├── About.tsx          # REAL: mission, disclaimers, methodology
│           ├── Account.tsx        # honest Phase-4 placeholder (NO login form)
│           └── NotFound.tsx       # 404
└── worker/                    # (worker subagent, Phase 1 API)
```

**Isolation rule:** this frontend never reads, inspects, or references anything
outside `~/workspace/chai/`. `shared/types.ts` is imported relatively
(`../../shared/types`) and type-checked via `tsconfig.json` `include`.

---

## 2. Design system

**Palette (strict, green-led):**

| Token | Value | Use |
|---|---|---|
| `--chai-green` | `#087A52` | primary actions |
| `--chai-green-deep` | `#145C43` | lush green, dark text accents |
| `--chai-green-dark` | `#0B3D2C` | hero / footer / dark bands |
| `--chai-gold` | `#F2C14E` | island gold — featured, tradition band, CTAs |
| `--chai-coral` | `#E96B48` | coral orange — accents |
| `--chai-coral-dark` | `#B84A2D` | coral darkened for AA contrast w/ white text |
| `--chai-cream` | `#F7F4E9` | warm natural cream — page background |
| `--chai-charcoal` | `#20342B` | body text |
| `--chai-white` | `#FFFFFF` | cards, surfaces |

**Typography:** Fraunces (headings) + Inter (body) via Google Fonts CDN, with
system fallbacks (`Georgia, serif` / `-apple-system, … sans-serif`). No other
webfonts; zero icon fonts (inline SVG only).

**Logo:** original inline SVG (`components/Logo.tsx`) — a botanical leaf whose
veins resolve into knowledge-network nodes (gold midrib/veins, central
synthesis node). Full lockup reads "CHAI" + "Caribbean Herbal Ancestral
Intelligence". No palm trees, no beach/tourism clichés, no heavy gradients, no
generic AI-template look.

**Tokens:** all colors, fonts, radii, shadows, and layout widths are CSS custom
properties on `:root` in `src/index.css`. Evidence badges use the `badgeClass`
hooks from `shared/types.ts` (`ev-strong`, `ev-moderate`, `ev-preliminary`,
`ev-traditional`, `ev-insufficient`, `ev-safety`) mapped to AA-contrast
background/foreground pairs.

**Components:** `Button` (primary/accent/gold/outline/outline-light/disabled),
`Card`/`CardBody`, `Badge` (+ `EvidenceBadge` for the 6 categories),
`Input`/`Select`/`Field`, `EmptyState`, `NotDocumented` (inline "Not yet
documented"), `Tooltip` (hover/focus, `role="tooltip"`, `aria-describedby`).

**Responsive:** desktop / tablet / mobile breakpoints (1024 / 860 / 560px);
grids collapse 4→2→1, header collapses to a hamburger-driven panel, hero
stacks. **Accessible:** skip link, semantic landmarks (`header`/`main`/`nav`/
`footer`), per-route `<title>` updates + `aria-live` route announcer, visible
`:focus-visible` rings, labeled form controls, `alt` text / `role="img"` on
artwork, decorative SVGs `aria-hidden`, keyboard-operable gallery, menu, and
A–Z buttons. Color contrast checked: white on `#087A52` ≈ 4.8:1, charcoal on
cream ≈ 13:1, gold badges use charcoal text.

**Honesty rules (enforced in code, not just copy):**
- No fake AI chat anywhere. `/research` is a full-page "coming in Phase 3"
  statement; "Ask AI" buttons render `disabled` with tooltip *"Available when
  AI is connected in Phase 3"*.
- No login form. `/account` and `/community` are honest Phase-4 placeholders.
- No lorem ipsum, no placeholder graphics for real content. Missing images get
  a flat-green initial tile (never a fake photo); empty fields render "Not yet
  documented".
- Draft (unverified) assessments are shown with a *"Draft — awaiting reviewer
  verification"* badge — never hidden, never presented as verified.

---

## 3. Frontend data flow

```
seed-plants.json (fixture now, real dataset at integration)
        │  import (stable path: src/data/seed-plants.json)
        ▼
lib/query.ts  — pure functions: normalizeParams, matchesQuery, matchesFilters,
                searchPlants, toSummary, filterByLetter, buildFilterOptions,
                useKeywords, resolvePlantSources, sourcesByIds
        │  (unit-tested; mirrors contracts/api.md + schema.md derived fields)
        ▼
lib/data.ts   — PlantDataSource interface
                ├─ SeedDataSource (DEFAULT): wraps query.ts over the seed bundle
                └─ ApiDataSource: fetch /api/* — implemented, NOT referenced
                   anywhere; the production switch is one line:
                   `export const dataSource = new ApiDataSource();`
        ▼
pages/        — consume `dataSource` (async) or sync helpers; never touch JSON
```

**Search semantics** (match `GET /api/plants`): `q` = case-insensitive
substring over common/scientific name, regional names, synonyms, family,
traditional-use text, constituents, parts used; `country`/`family` exact;
`use` substring; `evidence` = plant has ≥1 assessment in category; `safety`
only when literally `true`; `featured` only when literally `true`; sorts
`name_asc` (default) / `name_desc` / `recently_reviewed`; `page` ≥ 1,
`per_page` clamped 1–50 (default 12); out-of-range pages clamp to the last
page; pagination envelope always returned.

**Known deviation:** `api.md` says `q` covers "tags", but `seed-format.md`
defines no tags field — there is nothing to match. The implementation searches
a documented superset (family, constituents, parts used) instead.

**PlantSummary derivation** (per `schema.md`): `countries` ← distribution;
`claims_assessed` ← assessment count; `highest_evidence` ← `highestEvidence()`
(max `EVIDENCE_RANK`, null when none); `safety_flag` ← any `safety_concern`;
`image` ← first image by position.

**Seed fixture:** `web/src/data/seed-plants.json` currently holds a minimal
**2-record development fixture** (fever-grass, cerasee) strictly conforming to
the seed schema — empty unverified fields, `reviewer_status: "draft"`, honest
fixture notes in source records. **The coordinator overwrites this file
verbatim with the real 15-plant researched dataset at integration; the import
path must not change.** A `note` field at the top of the fixture says this;
the real dataset will replace it.

**A–Z browsing:** not an API param — `/plants` fetches a wide page
(`per_page: 50`) and applies `filterByLetter()` client-side with local
pagination (labeled "A–Z mode: browsing locally").

---

## 4. Worker API summary (from `contracts/api.md` — Phase 1, read-only)

Base: `https://<worker-subdomain>/api`. JSON everywhere; errors use
`{ "error": { "code", "message" } }` (safe messages only).

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | liveness + DB check → `{ok, service:"chai-api", version, phase, db}` |
| GET | `/api/plants` | search/filter/paginate → `PlantListResponse` (params per §3) |
| GET | `/api/plants/:slug` | full `PlantDetail` → `{data}` / 404 `not_found` |
| GET | `/api/filters` | `FiltersResponse`: countries, families, uses (keyword-derived), evidence_levels |

**Reserved for Phase 3 (NOT mounted in Phase 1; 404 if called):**
`POST /api/ai/chat`, `GET /api/ai/conversations`, `POST /api/ai/documents`,
`GET /api/ai/usage`.

**Cross-cutting:** security headers on every response (CSP, `nosniff`,
`strict-origin-when-cross-origin`, `DENY`, minimal `Permissions-Policy`);
60 req/min/IP rate limiting → `429 {error:{code:"rate_limited"}}` +
`Retry-After`; same-origin CORS only; no write endpoints; no auth endpoints in
Phase 1.

---

## 5. D1 / migrations summary (from `contracts/schema.md`)

Database: Cloudflare D1 (SQLite). Forward-only versioned migrations in
`migrations/`, applied in filename order.

| File | Purpose | Owner |
|---|---|---|
| `migrations/0001_init.sql` | full core schema: all tables, indexes, constraints | worker subagent |
| `migrations/0002_seed.sql` | 15-plant seed, **generated** from `data/seed-plants.json` by `scripts/generate-seed-sql.mjs` — never hand-edited | coordinator |

**Tables:** `plants` (core record), `plant_names` (synonyms + regional names),
`distribution` (documented countries), `traditional_uses`, `sources` (citation
registry), `plant_sources` (M2M), `claims` (one row per medicinal claim),
`evidence_assessments` (per-claim, CHECK-constrained to the 6 categories),
`plant_images` (Wikimedia hotlinks + license metadata), `users` (minimal,
auth-ready; `password_hash` NULL until Phase 4), `saved_plants`, `audit_log`.

**Derived fields** (computed in the API layer, never stored): `countries`,
`claims_assessed`, `highest_evidence`, `safety_flag`, `image`,
`sources` (union of plant + assessment links). The frontend's `toSummary()`
implements the same derivation for the seed bundle.

---

## 6. AI provider seam

**Phase 1 ships TYPES + CONFIG + STUB ONLY.** No model calls, no routes, no
secrets.

- **Types** (`shared/types.ts`): `AIProviderId` (`'workers-ai'`),
  `AIResearchMode` (`quick`/`web`/`deep`/`document`), `AIStatus`,
  `AIProviderConfig`, `AIChatMessage`, `AIPlantContext`, `AICitation`,
  `AIChatRequest`/`AIChatResponse`, `AIUsageSnapshot`, the `AIProvider`
  interface, and reserved REST shapes `AIChatApiRequest`/`AIChatApiResponse`.
- **Config** (`DEFAULT_AI_CONFIG`): provider `workers-ai`, binding `AI`,
  model **`@cf/meta/llama-3.1-8b-instruct`**, `maxTokens` 1024, `temperature`
  0.3, `timeoutMs` 60000, `maxHistoryTurns` 20, `dailyNeuronBudget` **10000**.
- **Stub contract:** `chat()` throws `AIUnavailableError {code:
  'ai_not_connected'}` with an honest "coming in Phase 3" message; `usage()`
  returns a zeroed snapshot.
- **Phase 3 target:** Cloudflare Workers AI via `env.AI.run(model, input)`
  with `[ai] binding = "AI"` in `wrangler.toml` (binding already enabled on
  the account — no setup step). Free tier = **10,000 Neurons/day, resets
  00:00 UTC, HARD cap on free plans** (no surprise charges possible). Phase 3
  must track daily usage and refuse new AI work with an honest "daily
  free-tier budget reached, resets 00:00 UTC" message when exhausted — never
  silently degrade, never attempt paid overage.
- **Model rule:** default to standard free-tier models only. **Never** design
  around models requiring a paid billing method: kimi-k2.6, kimi-k2.7-code,
  glm-5.x, deepseek-v4-flash-0731, deepseek-v4-pro-0813 (and siblings in those
  lines).
- **Frontend seam:** the only AI surface in Phase 1 is the disabled "Ask AI"
  button (tooltip: "Available when AI is connected in Phase 3") and the
  `/research` placeholder page. When Phase 3 ships, these wire to
  `POST /api/ai/chat` (`AIChatApiRequest`).

---

## 7. Verification (Phase 1 frontend)

- `npx tsc --noEmit` — **clean** (strict, `noUnusedLocals`, `noUnusedParameters`)
- `npx vitest run` — **50/50 pass** (`tests/query.test.ts`, `tests/evidence.test.ts`, `tests/data-source.test.ts`)
- `npx vite build` — **succeeds** (`dist/` emitted)

**Could NOT be verified:** visual rendering in a real browser (no browser
available in this build environment) — layout, responsive breakpoints, and
color rendering were implemented from the design system but not seen.
Recommended: open the built `dist/index.html` (via `vite preview` or static
serve) and check hero, encyclopedia filters, plant detail bands, and mobile
menu before integration sign-off.
