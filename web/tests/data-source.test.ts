/** Integration-ish tests: SeedDataSource against the dev fixture JSON. */
import { describe, expect, it } from 'vitest';
import { SeedDataSource } from '../src/lib/data';
import seedFile from '../src/data/seed-plants.json';

const ds = new SeedDataSource();

describe('seed fixture shape', () => {
  it('has version, exported, sources, plants', () => {
    const seed = seedFile as unknown as {
      version: number;
      exported: string;
      sources: unknown[];
      plants: unknown[];
    };
    expect(seed.version).toBe(1);
    expect(typeof seed.exported).toBe('string');
    expect(Array.isArray(seed.sources)).toBe(true);
    expect(Array.isArray(seed.plants)).toBe(true);
    expect(seed.plants.length).toBeGreaterThanOrEqual(2);
  });

  it('every plant has required identity fields', () => {
    const seed = seedFile as unknown as {
      plants: Array<Record<string, unknown>>;
    };
    for (const p of seed.plants) {
      for (const key of [
        'id',
        'slug',
        'common_name',
        'scientific_name',
        'family',
        'last_reviewed',
      ]) {
        expect(p[key], `plant ${p['id']} missing ${key}`).toBeTruthy();
      }
      expect(p['slug']).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

describe('SeedDataSource', () => {
  it('kind is seed', () => {
    expect(ds.kind).toBe('seed');
  });

  it('search returns paginated summaries honoring the contract', async () => {
    const res = await ds.search({ per_page: 1, page: 1 });
    expect(res.data).toHaveLength(1);
    expect(res.pagination.total).toBeGreaterThanOrEqual(2);
    expect(res.pagination.per_page).toBe(1);
    const first = res.data[0];
    expect(first.slug).toBeTruthy();
    expect(first.common_name).toBeTruthy();
    expect(first.scientific_name).toBeTruthy();
  });

  it('search honors q across names', async () => {
    const res = await ds.search({ q: 'cerasee' });
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0].slug).toBe('cerasee');
  });

  it('getBySlug returns the detail record or null', async () => {
    const d = await ds.getBySlug('fever-grass');
    expect(d?.common_name).toBe('Fever Grass');
    expect(Array.isArray(d?.claims)).toBe(true);
    expect(await ds.getBySlug('does-not-exist')).toBeNull();
  });

  it('getFilters returns countries, families, uses, evidence levels', async () => {
    const f = await ds.getFilters();
    expect(f.countries.length).toBeGreaterThan(0);
    expect(f.families.length).toBeGreaterThan(0);
    expect(Array.isArray(f.uses)).toBe(true);
    expect(f.evidence_levels.length).toBeGreaterThan(0);
    for (const e of f.evidence_levels) {
      expect(e.count).toBeGreaterThan(0);
    }
  });

  it('getSources resolves ids from the seed registry', async () => {
    const d = await ds.getBySlug('fever-grass');
    expect(d).not.toBeNull();
    const out = await ds.getSources(d!, ['src-powo-cymbopogon-citratus']);
    expect(out[0]?.id).toBe('src-powo-cymbopogon-citratus');
    // Honest-data contract: a source may carry url "" when the researcher
    // verified the fact but did not preserve a working URL (never invented).
    expect(out[0]?.url).toBe('');
  });

  it('getSources returns working URLs where the registry has them', async () => {
    const out = await ds.getSources(null as never, ['src-tramil-trinidad-2015']);
    expect(out[0]?.url).toMatch(/^https:\/\//);
  });
});
