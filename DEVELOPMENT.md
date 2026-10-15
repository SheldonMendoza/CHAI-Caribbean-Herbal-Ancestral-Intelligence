# CHAI — Development Guide (Phase 1)

CHAI (Caribbean Herbal Ancestral Intelligence), Phase 1: read-only herbal
encyclopedia API. Zero budget — free tiers only, no secrets anywhere.

## Layout

```
~/workspace/chai/
  shared/types.ts            # LOCKED shared contracts (single source of truth)
  contracts/api.md           # LOCKED REST contract
  contracts/schema.md        # LOCKED D1 schema contract
  contracts/seed-format.md   # LOCKED seed JSON format
  migrations/0001_init.sql   # core schema (locked, forward-only)
  migrations/0002_seed.sql   # GENERATED — never hand-edit (see below)
  scripts/generate-seed-sql.mjs  # seed JSON -> 0002_seed.sql generator
  data/seed-plants.json      # arrives later from the research workstream
  worker/                    # Cloudflare Worker (TypeScript)
    src/index.ts             # fetch handler + router
    src/db.ts                # D1 query helpers (derived fields computed here)
    src/validation.ts        # query-param parsing/validation
    src/rate-limit.ts        # in-memory per-IP limiter (60 req/min)
    src/security.ts          # security headers + error envelope
    src/ai/provider.ts       # Phase 1 AI SEAM: types + config + NoOp stub
    test/                    # vitest suite (in-memory SQLite, node:sqlite)
  wrangler.toml              # deployment target (Phase 1: not deployed)
```

## Local setup

```bash
cd ~/workspace/chai/worker
npm install        # vitest + typescript + @types/node only
npm test           # vitest run — 26 tests, in-memory SQLite
npm run typecheck  # tsc --noEmit (strict) — must be clean
```

No wrangler, no Cloudflare account, no network needed for build/test.

## Migrations

Migrations live in `migrations/` and apply in filename order. Forward-only.

- `0001_init.sql` — full core schema per `contracts/schema.md`. Applied in tests
  via `node:sqlite` (`DatabaseSync.exec`) against a fresh `:memory:` DB.
- `0002_seed.sql` — **generated** by `scripts/generate-seed-sql.mjs` from
  `data/seed-plants.json`. Never hand-edit; regenerate.

### Regenerating 0002 from the seed JSON

```bash
node scripts/generate-seed-sql.mjs
# reads  data/seed-plants.json   (schema: contracts/seed-format.md)
# writes migrations/0002_seed.sql
```

The script validates the seed JSON (required fields, every `source_ids` entry
resolves to a real source, evidence categories are the 6 locked values) and
exits non-zero on the first violation. SQL string escaping doubles single
quotes; empty optional strings become NULL; JSON columns are stringified.

It is idempotent: the generated SQL DELETEs all seed plant/source rows in
FK-safe order (children before parents) before re-INSERTing, so re-applying
yields the same data rows. Seed `claims` use explicit ids 1..N (safe because the
teardown deletes them first). Each plant gets an `audit_log` row (`seed.insert`).

The script was smoke-tested against a throwaway 1-plant fixture: correct
escaping (`O'Brien` -> `O''Brien`), valid SQLite, and byte-identical data rows
after applying twice. The fixture and its generated SQL were removed afterwards;
the real `data/seed-plants.json` arrives from the research workstream.

### Applying migrations later

Local SQLite sanity check (any machine with node >= 22):

```bash
node --input-type=module -e "
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
const db = new DatabaseSync('chai-local.db');
for (const f of ['migrations/0001_init.sql', 'migrations/0002_seed.sql'])
  db.exec(readFileSync(f, 'utf8'));
console.log('plants:', db.prepare('SELECT COUNT(*) n FROM plants').get().n);
"
```

Against D1 (needs wrangler auth on a connected machine — NOT this VM):

```bash
wrangler d1 execute chai-db --file migrations/0001_init.sql --remote
wrangler d1 execute chai-db --file migrations/0002_seed.sql --remote
# or: wrangler d1 migrations apply chai-db --remote
```

## Deployment steps (later phases — NOT done in Phase 1)

1. On a machine with wrangler auth: `wrangler d1 create chai-db`.
2. Copy the returned `database_id` into `wrangler.toml` (replacing `REPLACE_ME`).
3. Apply migrations to D1 (see above).
4. `wrangler deploy` (from `~/workspace/chai`, using `wrangler.toml`).
5. Smoke-test: `GET /api/health` should return `db: "connected"`.

The `[ai]` binding (`binding = "AI"`) is already declared; Workers AI is already
enabled on the account, so Phase 3 needs no enable step.

## Outstanding requirements (pending, none actionable on this VM)

- **D1 database `chai-db` does not exist yet.** Creation (`wrangler d1 create`)
  needs auth on a connected machine. `database_id` in `wrangler.toml` is
  `REPLACE_ME` until then.
- **Wrangler has no auth on this machine.** No deployments, no remote D1
  operations, no Cloudflare API calls were made or attempted in Phase 1.
- **AI binding: no action needed.** Workers AI is already enabled on the
  account (verified 2026-10-14); the `[ai]` binding is declared and unused in
  Phase 1. Phase 3 implements `WorkersAIProvider` per the comment block in
  `worker/src/ai/provider.ts`.

## Known contract deviations / schema notes (Phase 1)

Locked contracts were followed. During integration (2026-10-14) the coordinator
resolved three schema gaps by amending `contracts/schema.md` and
`migrations/0001_init.sql` (safe: nothing had been applied to a real D1 yet):

1. ~~No safety columns on `plants`~~ — RESOLVED: `plants` now carries
   `safety_summary, side_effects, interactions, pregnancy, children,
   contraindications`; the generator stores the seed safety object verbatim
   and the API returns it (empty string = "not yet documented").
2. ~~No source links on `traditional_uses`~~ — RESOLVED: new
   `traditional_use_sources` join table; generator populates it; API returns
   real `source_ids` per use.
3. ~~`evidence_assessments.source_id` singular~~ — RESOLVED: replaced with
   `evidence_assessment_sources` join table storing ALL `source_ids[]`; API
   maps back to the full array.
4. **`q` search omits "tags".** `contracts/api.md` lists tags as a search
   field, but the schema stores no tags column. Search covers common name,
   scientific name, and all recorded names (synonyms + regional), case-
   insensitive substring, with LIKE wildcards escaped. (The web client's
   local search additionally matches family/constituents/parts — documented
   in ARCHITECTURE.md; the API remains the contract.)

## API quick reference

- `GET /api/health` -> `{ ok, service: "chai-api", version: "0.1.0", phase: 1, db }`
- `GET /api/plants?q=&country=&family=&use=&evidence=&safety=true&featured=true&sort=name_asc&page=1&per_page=12`
  (`per_page` 1–50; invalid params -> `400 { error: { code: "invalid_param" } }`)
- `GET /api/plants/:slug` -> `{ data: PlantDetail }` or 404 `not_found`
- `GET /api/filters` -> countries/families/uses/evidence_levels with counts
- Cross-cutting: security headers on every response, same-origin CORS (no
  wildcard), 60 req/min per-IP rate limit -> `429` + `Retry-After`.
- Phase 1 has NO write endpoints and NO auth endpoints. `POST /api/ai/chat`
  and friends do not exist -> 404, by design.
