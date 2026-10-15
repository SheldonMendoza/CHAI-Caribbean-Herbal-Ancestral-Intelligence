# CHAI API Contract — Phase 1 (read-only)

Base URL (production, later phases): `https://<worker-subdomain>/api`
Phase 1: no deployment. The worker handler is tested locally against SQLite.

All responses are JSON. All errors use the envelope:

```json
{ "error": { "code": "not_found", "message": "No plant found for slug 'xyz'." } }
```

Error messages are safe: no stack traces, no SQL, no internal paths.

## Endpoints

### GET /api/health
Liveness + DB check.
```json
{ "ok": true, "service": "chai-api", "version": "0.1.0", "phase": 1, "db": "connected" }
```

### GET /api/plants
Search / filter / paginate the encyclopedia. Returns `PlantListResponse`.

Query params (all optional):
| param | type | description |
|---|---|---|
| `q` | string | Instant search across common name, scientific name, regional names, synonyms, tags. Case-insensitive substring. Max 120 chars. |
| `country` | string | Exact match on documented country/territory (see controlled list in `contracts/seed-format.md`). |
| `family` | string | Exact match on botanical family. |
| `use` | string | Substring match on traditional-use text. |
| `evidence` | EvidenceCategory | Plants having ≥1 assessment with this category. |
| `safety` | `true` | Only plants with `safety_flag` true (≥1 `safety_concern` assessment). Any other value ignored. |
| `featured` | `true` | Only featured plants. |
| `sort` | `name_asc` (default) \| `name_desc` \| `recently_reviewed` | Sort order. |
| `page` | int ≥ 1, default 1 | |
| `per_page` | int 1–50, default 12 | |

`PlantSummary` fields: `id, slug, common_name, scientific_name, family, countries, traditional_use_summary, claims_assessed, highest_evidence, safety_flag, featured, last_reviewed, image`.

### GET /api/plants/:slug
Full `PlantDetail` for one plant. `slug` is lowercase ASCII, hyphen-separated.
- 200 → `{ "data": PlantDetail }`
- 404 → `{ "error": { "code": "not_found", "message": "No plant found for slug '<slug>'." } }`

### GET /api/filters
Filter metadata with counts, for building the encyclopedia UI:
```json
{
  "countries": [{ "name": "Jamaica", "count": 9 }],
  "families": [{ "name": "Poaceae", "count": 1 }],
  "uses": [{ "name": "fever", "count": 3 }],
  "evidence_levels": [{ "category": "preliminary", "count": 5 }]
}
```
- `uses` is a keyword list derived from traditional-use text (lowercased significant terms), not a fixed taxonomy in Phase 1.
- `evidence_levels[].count` = number of plants having ≥1 assessment with that category.

## Reserved for Phase 3 (NOT implemented, NOT mounted in Phase 1)

| method | path | purpose |
|---|---|---|
| POST | `/api/ai/chat` | Chat completion. Body: `AIChatApiRequest`. |
| GET | `/api/ai/conversations` | List user's conversations (auth, Phase 4). |
| POST | `/api/ai/documents` | Upload research document (Phase 3). |
| GET | `/api/ai/usage` | Daily Neuron usage vs budget (Phase 3; admin). |

Phase 1 behavior if called: route does not exist → 404. The AI provider seam
(types + config + stub) lives in `worker/src/ai/` and `shared/types.ts`.

### AI free-tier facts (verified on the user's Cloudflare account, 2026-10-14)

These shape the Phase 3 implementation; Phase 1 only records them:

- Workers AI is already enabled on the account — no enable step, no terms gate.
- Free tier = **10,000 Neurons/day**, resets **00:00 UTC**, **hard limit** on free
  plans (no surprise charges possible).
- Integration is via the Workers AI binding: `env.AI.run(model, input)` with
  `[ai] binding = "AI"` in `wrangler.toml`.
- Standard models are covered. Do NOT design around models requiring a paid
  billing method: kimi-k2.6, kimi-k2.7-code, glm-5.x, deepseek-v4-flash-0731,
  deepseek-v4-pro-0813 (and siblings in those model lines).
- Phase 3 must implement budget plumbing: track daily Neuron usage, refuse new
  AI work with an honest "daily free-tier budget reached, resets 00:00 UTC"
  message when exhausted — never silently degrade, never attempt paid overage.

## Cross-cutting

- **Security headers** on every response: `Content-Security-Policy`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `X-Frame-Options: DENY`, `Permissions-Policy` (minimal).
- **Rate limiting**: 60 requests/minute per client IP across `/api/*`; on exceed → `429 { error: { code: "rate_limited", ... } }` with `Retry-After` header.
- **CORS**: same-origin only in Phase 1 (no `Access-Control-Allow-Origin: *`).
- **Pagination** envelope always present on list endpoints.
- **No write endpoints** in Phase 1. No auth endpoints in Phase 1.
