/**
 * CHAI — seed integration test.
 *
 * Applies the REAL committed migrations (0001_init.sql + 0002_seed.sql,
 * generated from data/seed-plants.json) to an in-memory SQLite database and
 * exercises the real worker handler against the real 15-plant seed catalog.
 * This is the closest thing to production D1 available without Cloudflare.
 */
import { describe, expect, it, beforeAll } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHandler } from '../src/index';
import { openTestDb } from './sqlite-shim';

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS = join(HERE, '..', '..', 'migrations');

describe('seed integration (real migrations + real seed data)', () => {
  let get: (path: string) => Promise<Response>;

  beforeAll(() => {
    const t = openTestDb();
    // Apply the generated seed migration on top of 0001.
    t.raw.exec(readFileSync(join(MIGRATIONS, '0002_seed.sql'), 'utf8'));
    const handler = createHandler({ DB: t.db });
    get = (path: string) =>
      handler(
        new Request(`https://chai.test${path}`, {
          headers: { 'cf-connecting-ip': '9.9.9.9' },
        }),
      );
    // Keep the raw handle reachable for sanity queries below.
    (globalThis as any).__chaiSeedRaw = t.raw as DatabaseSync;
  });

  it('seeded exactly 15 plants and 45 sources', async () => {
    const raw = (globalThis as any).__chaiSeedRaw as DatabaseSync;
    expect((raw.prepare('SELECT COUNT(*) AS n FROM plants').get() as any).n).toBe(15);
    expect((raw.prepare('SELECT COUNT(*) AS n FROM sources').get() as any).n).toBe(45);
    expect(
      (raw.prepare('SELECT COUNT(*) AS n FROM evidence_assessments').get() as any).n,
    ).toBe(32);
  });

  it('GET /api/plants lists the catalog with pagination', async () => {
    const res = await get('/api/plants');
    expect(res.status).toBe(200);
    const j = (await res.json()) as any;
    expect(j.pagination.total).toBe(15);
    expect(j.data).toHaveLength(12);
    expect(j.pagination.total_pages).toBe(2);
  });

  it('searches common, scientific, and regional names', async () => {
    let j = (await (await get('/api/plants?q=cerasee')).json()) as any;
    expect(j.data[0].slug).toBe('cerasee');
    j = (await (await get('/api/plants?q=Cymbopogon')).json()) as any;
    expect(j.data.some((p: any) => p.slug === 'fever-grass')).toBe(true);
    j = (await (await get('/api/plants?q=lemongrass')).json()) as any;
    expect(j.data.some((p: any) => p.slug === 'fever-grass')).toBe(true);
  });

  it('filters: country, family, evidence, safety', async () => {
    let j = (await (await get('/api/plants?country=Jamaica')).json()) as any;
    expect(j.pagination.total).toBeGreaterThan(0);
    expect(j.data.every((p: any) => p.countries.includes('Jamaica'))).toBe(true);

    j = (await (await get('/api/plants?family=Poaceae')).json()) as any;
    expect(j.data.every((p: any) => p.family === 'Poaceae')).toBe(true);

    j = (await (await get('/api/plants?evidence=safety_concern')).json()) as any;
    expect(j.pagination.total).toBeGreaterThan(0);
    expect(j.data.every((p: any) => p.safety_flag)).toBe(true);

    j = (await (await get('/api/plants?safety=true')).json()) as any;
    expect(j.data.every((p: any) => p.safety_flag)).toBe(true);
  });

  it('plant detail renders full record with sources and safety', async () => {
    const res = await get('/api/plants/guinea-hen-weed');
    expect(res.status).toBe(200);
    const d = ((await res.json()) as any).data;
    expect(d.scientific_name).toBeTruthy();
    expect(d.claims.length).toBeGreaterThan(0);
    expect(d.claims_assessed).toBeGreaterThan(0);
    expect(d.sources.length).toBeGreaterThan(0);
    expect(d.traditional_uses.every((u: any) => Array.isArray(u.source_ids))).toBe(true);
    expect(
      d.claims.every((c: any) => c.assessments.every((a: any) => Array.isArray(a.source_ids))),
    ).toBe(true);
  });

  it('filters metadata reflects the real catalog', async () => {
    const j = (await (await get('/api/filters')).json()) as any;
    expect(j.countries.length).toBeGreaterThan(0);
    expect(j.families.length).toBeGreaterThan(0);
    expect(j.evidence_levels.length).toBeGreaterThan(0);
  });

  it('unknown slug 404s with the safe envelope', async () => {
    const res = await get('/api/plants/nope');
    expect(res.status).toBe(404);
    const j = (await res.json()) as any;
    expect(j.error.code).toBe('not_found');
  });
});
