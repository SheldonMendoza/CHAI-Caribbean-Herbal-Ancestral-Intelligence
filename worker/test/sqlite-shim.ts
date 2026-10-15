/**
 * CHAI tests — node:sqlite shim exposing the worker's minimal D1 interface.
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  D1Database,
  D1PreparedStatement,
  D1Result,
} from '../src/d1';

const HERE = dirname(fileURLToPath(import.meta.url));

function wrapStatement(stmt: any): D1PreparedStatement {
  let params: unknown[] = [];
  const self: D1PreparedStatement = {
    bind(...values: unknown[]) {
      params = values;
      return self;
    },
    async all<T = Record<string, unknown>>(): Promise<D1Result<T>> {
      return { results: stmt.all(...params) as T[], success: true };
    },
    async first<T = Record<string, unknown>>(): Promise<T | null> {
      const row = stmt.get(...params) as T | undefined;
      return row === undefined ? null : row;
    },
    async run(): Promise<D1Result> {
      stmt.run(...params);
      return { results: [], success: true };
    },
  };
  return self;
}

export interface TestDb {
  db: D1Database;
  raw: DatabaseSync;
}

/** Fresh in-memory DB with migrations/0001_init.sql applied. */
export function openTestDb(): TestDb {
  const raw = new DatabaseSync(':memory:');
  raw.exec(readFileSync(join(HERE, '..', '..', 'migrations', '0001_init.sql'), 'utf8'));
  const db: D1Database = {
    prepare: (query: string) => wrapStatement(raw.prepare(query)),
  };
  return { db, raw };
}

/** Small inline 2-plant fixture (independent of the real seed file). */
export function seedFixture(t: TestDb): void {
  const run = (sql: string) => t.raw.exec(sql);

  run(`INSERT INTO sources (id, title, source_type) VALUES
    ('src-tramil', 'TRAMIL survey', 'ethnobotanical'),
    ('src-rct', 'Randomized trial', 'peer_reviewed');`);

  run(`INSERT INTO plants (id, slug, common_name, scientific_name, family, traditional_use_summary, featured, reviewer_status, last_reviewed, safety_summary, created_at) VALUES
    ('fever-grass', 'fever-grass', 'Fever Grass', 'Cymbopogon citratus', 'Poaceae', 'Leaf tea for fever and colds.', 1, 'verified', '2026-10-14', 'Generally regarded as safe as a food tea.', '2026-10-14T00:00:00.000Z'),
    ('cerasee', 'cerasee', 'Cerasee', 'Momordica charantia', 'Cucurbitaceae', 'Bitter tonic for blood cleansing.', 0, 'verified', '2026-10-01', NULL, '2026-10-01T00:00:00.000Z');`);

  run(`INSERT INTO plant_names (plant_id, name, name_type, region) VALUES
    ('fever-grass', 'Lemongrass', 'regional', 'Trinidad and Tobago'),
    ('fever-grass', 'Andropogon citratus', 'synonym', NULL),
    ('cerasee', 'Bitter Melon', 'regional', 'Jamaica');`);

  run(`INSERT INTO distribution (plant_id, country, status) VALUES
    ('fever-grass', 'Trinidad and Tobago', 'introduced'),
    ('fever-grass', 'Jamaica', 'naturalized'),
    ('cerasee', 'Jamaica', 'introduced');`);

  run(`INSERT INTO traditional_uses (id, plant_id, use_text, countries, preparation) VALUES
    (1, 'fever-grass', 'Leaf tea is traditionally used to reduce fever', '["Trinidad and Tobago"]', 'Steep leaves in hot water'),
    (2, 'fever-grass', 'Used for colds and flu in Trinidad', '["Trinidad and Tobago"]', 'Leaf tea'),
    (3, 'cerasee', 'Bitter tea used as a blood cleanser', '["Jamaica"]', 'Boil vine in water');`);

  run(`INSERT INTO traditional_use_sources (traditional_use_id, source_id) VALUES
    (1, 'src-tramil');`);

  run(`INSERT INTO plant_images (plant_id, url, caption, attribution, license, license_url, source_url, position) VALUES
    ('fever-grass', 'https://upload.wikimedia.org/wikipedia/commons/f/fg.jpg', 'Fever grass', 'Photo: A. Test, Wikimedia Commons', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', 'https://commons.wikimedia.org/wiki/File:Fg.jpg', 0);`);

  // Explicit claim ids 1..3 (fixture-local, like the seed generator does).
  run(`INSERT INTO claims (id, plant_id, claim_text) VALUES
    (1, 'fever-grass', 'Leaf tea reduces fever'),
    (2, 'fever-grass', 'Safe in pregnancy'),
    (3, 'cerasee', 'Bitter tea lowers blood sugar');`);

  run(`INSERT INTO evidence_assessments (id, claim_id, category, summary, reviewer_status) VALUES
    (1, 1, 'traditional_use_documented', 'Documented traditional use.', 'verified'),
    (2, 1, 'preliminary', 'Early lab findings only.', 'draft'),
    (3, 2, 'safety_concern', 'Avoid large amounts in pregnancy.', 'verified'),
    (4, 3, 'preliminary', 'Small human pilot study.', 'draft');`);

  run(`INSERT INTO evidence_assessment_sources (assessment_id, source_id) VALUES
    (1, 'src-tramil'),
    (4, 'src-rct');`);

  run(`INSERT INTO plant_sources (plant_id, source_id) VALUES
    ('fever-grass', 'src-tramil'),
    ('cerasee', 'src-rct');`);
}
