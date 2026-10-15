# CHAI D1 Schema Contract — Phase 1

Database: Cloudflare D1 (SQLite). Migrations are versioned SQL files in
`migrations/`, applied in filename order. D1 has no `IF NOT EXISTS` needs
beyond standard SQLite; keep migrations forward-only and idempotent-safe.

## Migration numbering (locked)

| file | purpose | owner |
|---|---|---|
| `migrations/0001_init.sql` | Full core schema: all tables, indexes, constraints | worker subagent |
| `migrations/0002_seed.sql` | Seed data for the 15-plant starter catalog, GENERATED from `data/seed-plants.json` by `scripts/generate-seed-sql.mjs` — never hand-edited | coordinator (generated) |

Phase 2+ will continue with `0003_*.sql`, etc.

## Tables

### plants
| col | type | notes |
|---|---|---|
| id | TEXT PK | stable id, e.g. `'fever-grass'` |
| slug | TEXT UNIQUE NOT NULL | URL slug, lowercase ASCII hyphens |
| common_name | TEXT NOT NULL | |
| scientific_name | TEXT NOT NULL | binomial, e.g. `Cymbopogon citratus` |
| scientific_name_authorship | TEXT | e.g. `(DC.) Stapf` |
| family | TEXT NOT NULL | botanical family |
| botanical_description | TEXT | |
| identification | TEXT | how to identify the plant |
| parts_used | TEXT | JSON array of strings |
| constituents | TEXT | JSON array of `{name, note}` |
| cultural_background | TEXT | |
| traditional_use_summary | TEXT | 1–2 sentence card summary |
| disambiguation_note | TEXT | e.g. confusion with similarly-named plants |
| safety_summary | TEXT | safety overview (from seed `safety.summary`) |
| side_effects | TEXT | |
| interactions | TEXT | drug/herb interactions |
| pregnancy | TEXT | pregnancy and breastfeeding cautions |
| children | TEXT | child-safety information |
| contraindications | TEXT | |
| reviewer_status | TEXT NOT NULL DEFAULT 'draft' | `draft` \| `verified` |
| featured | INTEGER NOT NULL DEFAULT 0 | 0/1 |
| last_reviewed | TEXT | ISO date `YYYY-MM-DD` |
| created_at | TEXT NOT NULL | UTC ISO timestamp |

### plant_names — synonyms + regional names
| col | type | notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| plant_id | TEXT NOT NULL → plants(id) | |
| name | TEXT NOT NULL | |
| name_type | TEXT NOT NULL | `synonym` \| `regional` |
| region | TEXT | island/country attribution (regional names only) |
| notes | TEXT | |

Index: `(plant_id)`, `(name)`.

### distribution — documented countries/territories
| col | type | notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| plant_id | TEXT NOT NULL → plants(id) | |
| country | TEXT NOT NULL | controlled vocabulary (see seed-format.md) |
| status | TEXT | `native` \| `introduced` \| `cultivated` \| `naturalized` \| `unknown` |
| note | TEXT | |

Index: `(plant_id)`, `(country)`.

### traditional_uses
| col | type | notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| plant_id | TEXT NOT NULL → plants(id) | |
| use_text | TEXT NOT NULL | documented traditional use |
| countries | TEXT | JSON array of country names |
| preparation | TEXT | documented preparation method |

### traditional_use_sources — sources documenting a traditional use
`traditional_use_id INTEGER → traditional_uses(id), source_id TEXT → sources(id), PRIMARY KEY (traditional_use_id, source_id)`

### sources — source registry / citation store
| col | type | notes |
|---|---|---|
| id | TEXT PK | e.g. `'src-powo-cymbopogon-citratus'` |
| title | TEXT NOT NULL | |
| authors | TEXT | |
| year | INTEGER | |
| journal | TEXT | |
| doi | TEXT | DOI without URL prefix, e.g. `10.1234/abc` |
| url | TEXT | working link, verified at seed time |
| source_type | TEXT NOT NULL | `peer_reviewed` \| `systematic_review` \| `book` \| `ethnobotanical` \| `institutional` \| `database` \| `historical` \| `community` |
| accessed_date | TEXT | ISO date the URL was verified |
| notes | TEXT | |

### plant_sources — many-to-many
`plant_id TEXT → plants(id), source_id TEXT → sources(id), PRIMARY KEY (plant_id, source_id)`

### claims — one row per medicinal claim about a plant
| col | type | notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| plant_id | TEXT NOT NULL → plants(id) | |
| claim_text | TEXT NOT NULL | the specific claim, e.g. "Leaf tea reduces fever" |

### evidence_assessments — per-claim assessments (the 6 categories)
| col | type | notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| claim_id | INTEGER NOT NULL → claims(id) | |
| category | TEXT NOT NULL CHECK | one of `strong_human, moderate_human, preliminary, traditional_use_documented, insufficient_evidence, safety_concern` |
| summary | TEXT NOT NULL | plain-language assessment |
| study_design | TEXT | e.g. `randomized controlled trial`, `in vitro` |
| population | TEXT | who/what was studied |
| preparation_studied | TEXT | exact preparation/species studied |
| main_findings | TEXT | |
| limitations | TEXT | |
| adverse_effects | TEXT | |
| reviewer_status | TEXT NOT NULL DEFAULT 'draft' | `draft` \| `verified` |
| last_reviewed | TEXT | ISO date |

### evidence_assessment_sources — all sources behind an assessment
`assessment_id INTEGER → evidence_assessments(id), source_id TEXT → sources(id), PRIMARY KEY (assessment_id, source_id)`

### plant_images
| col | type | notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| plant_id | TEXT NOT NULL → plants(id) | |
| url | TEXT NOT NULL | hotlink (Wikimedia upload.wikimedia.org) |
| caption | TEXT | |
| attribution | TEXT NOT NULL | e.g. `Photo: Jane Doe, Wikimedia Commons` |
| license | TEXT NOT NULL | e.g. `CC BY-SA 4.0` |
| license_url | TEXT NOT NULL | |
| source_url | TEXT NOT NULL | Commons file page URL |
| position | INTEGER NOT NULL DEFAULT 0 | display order |

### users — minimal, auth-ready (NO auth flows in Phase 1)
| col | type | notes |
|---|---|---|
| id | TEXT PK | |
| email | TEXT UNIQUE NOT NULL | |
| password_hash | TEXT | NULL until Phase 4 |
| role | TEXT NOT NULL DEFAULT 'member' | `super_admin` \| `reviewer` \| `editor` \| `moderator` \| `member` |
| created_at | TEXT NOT NULL | |

### saved_plants
`user_id TEXT → users(id), plant_id TEXT → plants(id), created_at TEXT, PRIMARY KEY (user_id, plant_id)`

### audit_log
| col | type | notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| actor | TEXT | user id or `system`/`seed` |
| action | TEXT NOT NULL | e.g. `seed.insert`, `plant.update` |
| target | TEXT | affected record id |
| details | TEXT | JSON |
| created_at | TEXT NOT NULL | |

## Derived fields (computed in the API layer, NOT stored)

- `PlantSummary.countries` ← distinct `distribution.country`
- `PlantSummary.claims_assessed` ← count of assessments joined via claims
- `PlantSummary.highest_evidence` ← max by `EVIDENCE_RANK`, null if none
- `PlantSummary.safety_flag` ← exists assessment with `safety_concern`
- `PlantSummary.image` ← first `plant_images` by position
- `PlantDetail.sources` ← union of sources linked via `plant_sources` and assessments

## Evidence-category methodology (stored in docs, enforced by CHECK)

Assessments use exactly the 6 categories defined in `shared/types.ts`
(`EVIDENCE_CATEGORIES`). A claim may carry multiple assessments (e.g. one
`traditional_use_documented` + one `preliminary`), each with its own source.
Unverified assessments stay `reviewer_status='draft'` and are still shown,
labeled as awaiting reviewer verification — never silently hidden, never
presented as verified.
