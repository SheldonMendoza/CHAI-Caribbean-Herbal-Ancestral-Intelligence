/** Unit tests: pure search/filter/sort logic (mirrors GET /api/plants semantics). */
import { describe, expect, it } from 'vitest';
import {
  buildFilterOptions,
  filterByLetter,
  matchesFilters,
  matchesQuery,
  normalizeParams,
  searchPlants,
  toSummary,
  useKeywords,
} from '../src/lib/query';
import { ALL, aloeVera, cerasee, feverGrass } from './fixtures';

describe('normalizeParams', () => {
  it('applies defaults', () => {
    const p = normalizeParams({});
    expect(p).toMatchObject({
      q: '',
      safety: false,
      featured: false,
      sort: 'name_asc',
      page: 1,
      per_page: 12,
    });
  });

  it('clamps per_page to 1–50', () => {
    expect(normalizeParams({ per_page: 200 }).per_page).toBe(50);
    expect(normalizeParams({ per_page: 0 }).per_page).toBe(12);
    expect(normalizeParams({ per_page: -3 }).per_page).toBe(1);
    expect(normalizeParams({ per_page: NaN }).per_page).toBe(12);
  });

  it('clamps page to >= 1', () => {
    expect(normalizeParams({ page: -2 }).page).toBe(1);
    expect(normalizeParams({ page: 3 }).page).toBe(3);
  });

  it('falls back to name_asc for unknown sort', () => {
    expect(normalizeParams({ sort: 'bogus' as never }).sort).toBe('name_asc');
  });

  it('trims q and caps at 120 chars', () => {
    expect(normalizeParams({ q: '  fever  ' }).q).toBe('fever');
    expect(normalizeParams({ q: 'x'.repeat(200) }).q).toHaveLength(120);
  });

  it('coerces safety/featured strictly (only literal true)', () => {
    expect(normalizeParams({ safety: true }).safety).toBe(true);
    expect(normalizeParams({ safety: 'true' as never }).safety).toBe(false);
  });
});

describe('toSummary', () => {
  it('derives countries, claims_assessed, evidence, safety flag, first image', () => {
    const s = toSummary(cerasee);
    expect(s.countries).toEqual(['Jamaica']);
    expect(s.claims_assessed).toBe(2);
    expect(s.highest_evidence).toBe('preliminary');
    expect(s.safety_flag).toBe(true);
    expect(s.image).toBeNull();
  });

  it('picks the first image when present', () => {
    expect(toSummary(feverGrass).image?.url).toBe('https://example.org/fever.jpg');
  });

  it('reports null highest_evidence when nothing is assessed', () => {
    const bare = { ...feverGrass, claims: [] };
    expect(toSummary(bare).highest_evidence).toBeNull();
    expect(toSummary(bare).claims_assessed).toBe(0);
  });
});

describe('matchesQuery', () => {
  it('matches common name case-insensitively', () => {
    expect(matchesQuery(feverGrass, 'fever grass')).toBe(true);
    expect(matchesQuery(feverGrass, 'FEVER')).toBe(true);
  });

  it('matches scientific name', () => {
    expect(matchesQuery(feverGrass, 'cymbopogon')).toBe(true);
  });

  it('matches regional names and synonyms', () => {
    expect(matchesQuery(feverGrass, 'lemongrass')).toBe(true);
    expect(matchesQuery(feverGrass, 'andropogon citratus')).toBe(true);
  });

  it('matches traditional-use text', () => {
    expect(matchesQuery(cerasee, 'washout')).toBe(true);
  });

  it('matches family', () => {
    expect(matchesQuery(aloeVera, 'asphodel')).toBe(true);
  });

  it('returns false for unrelated terms, true for empty query', () => {
    expect(matchesQuery(feverGrass, 'mango')).toBe(false);
    expect(matchesQuery(feverGrass, '')).toBe(true);
    expect(matchesQuery(feverGrass, '   ')).toBe(true);
  });
});

describe('matchesFilters', () => {
  it('country: exact match on distribution', () => {
    const p = normalizeParams({ country: 'Jamaica' });
    expect(matchesFilters(cerasee, p)).toBe(true);
    expect(matchesFilters(aloeVera, p)).toBe(false);
  });

  it('family: exact match', () => {
    const p = normalizeParams({ family: 'Poaceae' });
    expect(matchesFilters(feverGrass, p)).toBe(true);
    expect(matchesFilters(cerasee, p)).toBe(false);
  });

  it('use: substring match on traditional-use text', () => {
    const p = normalizeParams({ use: 'burn' });
    expect(matchesFilters(aloeVera, p)).toBe(true);
    expect(matchesFilters(feverGrass, p)).toBe(false);
  });

  it('evidence: plant has >= 1 assessment with the category', () => {
    const p = normalizeParams({ evidence: 'moderate_human' });
    expect(matchesFilters(aloeVera, p)).toBe(true);
    expect(matchesFilters(cerasee, p)).toBe(false);
  });

  it('safety: only plants with a safety_concern assessment', () => {
    const p = normalizeParams({ safety: true });
    expect(matchesFilters(cerasee, p)).toBe(true);
    expect(matchesFilters(feverGrass, p)).toBe(false);
  });

  it('featured: only featured plants', () => {
    const p = normalizeParams({ featured: true });
    expect(matchesFilters(feverGrass, p)).toBe(true);
    expect(matchesFilters(aloeVera, p)).toBe(false);
  });
});

describe('searchPlants', () => {
  it('returns all plants by default, sorted name_asc', () => {
    const res = searchPlants(ALL, {});
    expect(res.data.map((p) => p.common_name)).toEqual([
      'Aloe Vera',
      'Cerasee',
      'Fever Grass',
    ]);
    expect(res.pagination.total).toBe(3);
    expect(res.pagination.total_pages).toBe(1);
  });

  it('sorts name_desc', () => {
    const res = searchPlants(ALL, { sort: 'name_desc' });
    expect(res.data.map((p) => p.common_name)).toEqual([
      'Fever Grass',
      'Cerasee',
      'Aloe Vera',
    ]);
  });

  it('sorts recently_reviewed (newest first)', () => {
    const res = searchPlants(ALL, { sort: 'recently_reviewed' });
    expect(res.data.map((p) => p.slug)).toEqual([
      'cerasee', // 2026-10-14
      'fever-grass', // 2026-10-13
      'aloe-vera', // 2026-10-12
    ]);
  });

  it('combines q with filters', () => {
    const res = searchPlants(ALL, { q: 'tea', country: 'Jamaica' });
    // both cerasee and fever-grass mention tea and are documented in Jamaica
    expect(res.data.map((p) => p.slug)).toEqual(['cerasee', 'fever-grass']);
  });

  it('narrows q + country + evidence', () => {
    const res = searchPlants(ALL, {
      q: 'tea',
      country: 'Jamaica',
      evidence: 'safety_concern',
    });
    expect(res.data.map((p) => p.slug)).toEqual(['cerasee']);
  });

  it('paginates with per_page and page', () => {
    const p1 = searchPlants(ALL, { per_page: 2, page: 1 });
    const p2 = searchPlants(ALL, { per_page: 2, page: 2 });
    expect(p1.data).toHaveLength(2);
    expect(p2.data).toHaveLength(1);
    expect(p1.pagination.total).toBe(3);
    expect(p1.pagination.total_pages).toBe(2);
    expect(p2.pagination.page).toBe(2);
    expect(p2.data[0].slug).toBe('fever-grass');
  });

  it('clamps page to the last page when out of range', () => {
    const res = searchPlants(ALL, { page: 99 });
    expect(res.pagination.page).toBe(1);
    expect(res.data).toHaveLength(3);
  });
});

describe('filterByLetter', () => {
  it('filters summaries by first letter of common name', () => {
    const summaries = ALL.map(toSummary);
    expect(filterByLetter(summaries, 'F').map((p) => p.slug)).toEqual([
      'fever-grass',
    ]);
    expect(filterByLetter(summaries, 'c').map((p) => p.slug)).toEqual(['cerasee']);
    expect(filterByLetter(summaries, 'Z')).toEqual([]);
  });
});

describe('useKeywords', () => {
  it('extracts lowercase significant terms, deduped, without stopwords', () => {
    const kw = useKeywords(cerasee);
    expect(kw).toContain('bitter');
    expect(kw).toContain('tonic');
    expect(kw).toContain('washout');
    expect(kw).not.toContain('the');
    expect(kw).not.toContain('tea');
    expect(kw).not.toContain('leaf');
    expect(new Set(kw).size).toBe(kw.length);
  });
});

describe('buildFilterOptions', () => {
  it('counts countries, families, uses, and evidence levels', () => {
    const f = buildFilterOptions(ALL);
    const countries = Object.fromEntries(f.countries.map((c) => [c.name, c.count]));
    expect(countries['Jamaica']).toBe(2);
    expect(countries['Trinidad and Tobago']).toBe(1);
    expect(countries['Barbados']).toBe(1);

    const families = Object.fromEntries(f.families.map((c) => [c.name, c.count]));
    expect(families['Poaceae']).toBe(1);

    const ev = Object.fromEntries(f.evidence_levels.map((e) => [e.category, e.count]));
    expect(ev['traditional_use_documented']).toBe(1);
    expect(ev['preliminary']).toBe(1);
    expect(ev['moderate_human']).toBe(1);
    expect(ev['safety_concern']).toBe(1);
    expect(ev['strong_human']).toBeUndefined();
    expect(ev['insufficient_evidence']).toBeUndefined();
  });

  it('orders countries by count desc', () => {
    const f = buildFilterOptions(ALL);
    expect(f.countries[0].name).toBe('Jamaica');
  });
});
