-- CHAI Phase 1 core schema — migrations/0001_init.sql
-- Database: Cloudflare D1 (SQLite). Forward-only migration.
-- Conforms exactly to contracts/schema.md (locked).
-- Derived fields (countries, claims_assessed, highest_evidence, safety_flag,
-- image) are computed in the API layer, NOT stored here.

-- ------------------------------------------------------------------
-- plants
-- ------------------------------------------------------------------
CREATE TABLE plants (
  id                          TEXT PRIMARY KEY,
  slug                        TEXT UNIQUE NOT NULL,
  common_name                 TEXT NOT NULL,
  scientific_name             TEXT NOT NULL,
  scientific_name_authorship  TEXT,
  family                      TEXT NOT NULL,
  botanical_description       TEXT,
  identification              TEXT,
  parts_used                  TEXT,            -- JSON array of strings
  constituents                TEXT,            -- JSON array of {name, note}
  cultural_background         TEXT,
  traditional_use_summary     TEXT,
  disambiguation_note         TEXT,
  safety_summary              TEXT,
  side_effects                TEXT,
  interactions                TEXT,
  pregnancy                   TEXT,
  children                    TEXT,
  contraindications           TEXT,
  reviewer_status             TEXT NOT NULL DEFAULT 'draft',
  featured                    INTEGER NOT NULL DEFAULT 0,
  last_reviewed               TEXT,            -- ISO date YYYY-MM-DD
  created_at                  TEXT NOT NULL    -- UTC ISO timestamp
);

-- slug is covered by its UNIQUE constraint; explicit index on scientific_name
CREATE INDEX idx_plants_scientific_name ON plants(scientific_name);
CREATE INDEX idx_plants_family ON plants(family);

-- ------------------------------------------------------------------
-- plant_names — synonyms + regional names
-- ------------------------------------------------------------------
CREATE TABLE plant_names (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id  TEXT NOT NULL REFERENCES plants(id),
  name      TEXT NOT NULL,
  name_type TEXT NOT NULL,          -- 'synonym' | 'regional'
  region    TEXT,                   -- island/country attribution (regional only)
  notes     TEXT
);
CREATE INDEX idx_plant_names_plant ON plant_names(plant_id);
CREATE INDEX idx_plant_names_name ON plant_names(name);

-- ------------------------------------------------------------------
-- distribution — documented countries/territories
-- ------------------------------------------------------------------
CREATE TABLE distribution (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id  TEXT NOT NULL REFERENCES plants(id),
  country   TEXT NOT NULL,          -- controlled vocabulary (seed-format.md)
  status    TEXT,                   -- native | introduced | cultivated | naturalized | unknown
  note      TEXT
);
CREATE INDEX idx_distribution_plant ON distribution(plant_id);
CREATE INDEX idx_distribution_country ON distribution(country);

-- ------------------------------------------------------------------
-- traditional_uses
-- ------------------------------------------------------------------
CREATE TABLE traditional_uses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id    TEXT NOT NULL REFERENCES plants(id),
  use_text    TEXT NOT NULL,
  countries   TEXT,                 -- JSON array of country names
  preparation TEXT
);
CREATE INDEX idx_traditional_uses_plant ON traditional_uses(plant_id);

-- ------------------------------------------------------------------
-- traditional_use_sources — sources documenting a traditional use
-- ------------------------------------------------------------------
CREATE TABLE traditional_use_sources (
  traditional_use_id INTEGER NOT NULL REFERENCES traditional_uses(id),
  source_id          TEXT NOT NULL REFERENCES sources(id),
  PRIMARY KEY (traditional_use_id, source_id)
);
CREATE INDEX idx_traditional_use_sources_source ON traditional_use_sources(source_id);

-- ------------------------------------------------------------------
-- sources — source registry / citation store
-- ------------------------------------------------------------------
CREATE TABLE sources (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  authors       TEXT,
  year          INTEGER,
  journal       TEXT,
  doi           TEXT,               -- DOI without URL prefix
  url           TEXT,
  source_type   TEXT NOT NULL,      -- peer_reviewed | systematic_review | book |
                                    -- ethnobotanical | institutional | database |
                                    -- historical | community
  accessed_date TEXT,               -- ISO date the URL was verified
  notes         TEXT
);

-- ------------------------------------------------------------------
-- plant_sources — many-to-many
-- ------------------------------------------------------------------
CREATE TABLE plant_sources (
  plant_id  TEXT NOT NULL REFERENCES plants(id),
  source_id TEXT NOT NULL REFERENCES sources(id),
  PRIMARY KEY (plant_id, source_id)
);
CREATE INDEX idx_plant_sources_source ON plant_sources(source_id);

-- ------------------------------------------------------------------
-- claims — one row per medicinal claim about a plant
-- ------------------------------------------------------------------
CREATE TABLE claims (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id   TEXT NOT NULL REFERENCES plants(id),
  claim_text TEXT NOT NULL
);
CREATE INDEX idx_claims_plant ON claims(plant_id);

-- ------------------------------------------------------------------
-- evidence_assessments — per-claim assessments (the 6 categories)
-- ------------------------------------------------------------------
CREATE TABLE evidence_assessments (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  claim_id           INTEGER NOT NULL REFERENCES claims(id),
  category           TEXT NOT NULL CHECK (category IN (
                       'strong_human',
                       'moderate_human',
                       'preliminary',
                       'traditional_use_documented',
                       'insufficient_evidence',
                       'safety_concern'
                     )),
  summary            TEXT NOT NULL,
  study_design       TEXT,
  population         TEXT,
  preparation_studied TEXT,
  main_findings      TEXT,
  limitations        TEXT,
  adverse_effects    TEXT,
  reviewer_status    TEXT NOT NULL DEFAULT 'draft',
  last_reviewed      TEXT                -- ISO date
);
CREATE INDEX idx_evidence_claim ON evidence_assessments(claim_id);
CREATE INDEX idx_evidence_category ON evidence_assessments(category);

-- ------------------------------------------------------------------
-- evidence_assessment_sources — all sources behind an assessment
-- ------------------------------------------------------------------
CREATE TABLE evidence_assessment_sources (
  assessment_id INTEGER NOT NULL REFERENCES evidence_assessments(id),
  source_id     TEXT NOT NULL REFERENCES sources(id),
  PRIMARY KEY (assessment_id, source_id)
);
CREATE INDEX idx_evidence_assessment_sources_source ON evidence_assessment_sources(source_id);

-- ------------------------------------------------------------------
-- plant_images
-- ------------------------------------------------------------------
CREATE TABLE plant_images (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id    TEXT NOT NULL REFERENCES plants(id),
  url         TEXT NOT NULL,
  caption     TEXT,
  attribution TEXT NOT NULL,
  license     TEXT NOT NULL,
  license_url TEXT NOT NULL,
  source_url  TEXT NOT NULL,
  position    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_plant_images_plant ON plant_images(plant_id);

-- ------------------------------------------------------------------
-- users — minimal, auth-ready (NO auth flows in Phase 1)
-- ------------------------------------------------------------------
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT,                 -- NULL until Phase 4
  role          TEXT NOT NULL DEFAULT 'member',
  created_at    TEXT NOT NULL
);

-- ------------------------------------------------------------------
-- saved_plants
-- ------------------------------------------------------------------
CREATE TABLE saved_plants (
  user_id    TEXT NOT NULL REFERENCES users(id),
  plant_id   TEXT NOT NULL REFERENCES plants(id),
  created_at TEXT,
  PRIMARY KEY (user_id, plant_id)
);
CREATE INDEX idx_saved_plants_plant ON saved_plants(plant_id);

-- ------------------------------------------------------------------
-- audit_log
-- ------------------------------------------------------------------
CREATE TABLE audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  actor      TEXT,                    -- user id or 'system' / 'seed'
  action     TEXT NOT NULL,           -- e.g. 'seed.insert', 'plant.update'
  target     TEXT,                    -- affected record id
  details    TEXT,                    -- JSON
  created_at TEXT NOT NULL
);
CREATE INDEX idx_audit_log_action ON audit_log(action);
