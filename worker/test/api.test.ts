/**
 * CHAI Phase 1 API tests — handler runs against an in-memory SQLite DB
 * (node:sqlite) with the 2-plant fixture from sqlite-shim.ts.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { createHandler, resetRateLimit, type Env } from '../src/index';
import { openTestDb, seedFixture } from './sqlite-shim';
import type {
  FiltersResponse,
  HealthResponse,
  PlantDetailResponse,
  PlantListResponse,
} from '../../shared/types';

const { db } = (() => {
  const t = openTestDb();
  seedFixture(t);
  return t;
})();

const env = { DB: db } as Env;

function get(path: string, headers?: Record<string, string>): Promise<Response> {
  const handler = createHandler(env);
  return handler(new Request(`https://chai.test${path}`, { headers }));
}

beforeEach(() => {
  resetRateLimit();
});

const SECURITY_HEADERS = [
  'content-security-policy',
  'x-content-type-options',
  'referrer-policy',
  'x-frame-options',
  'permissions-policy',
] as const;

describe('GET /api/health', () => {
  it('reports db connected with the phase-1 shape', async () => {
    const res = await get('/api/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as HealthResponse;
    expect(body).toEqual({
      ok: true,
      service: 'chai-api',
      version: '0.1.0',
      phase: 1,
      db: 'connected',
    });
  });

  it('reports db unavailable when the query fails', async () => {
    const bad = createHandler({
      DB: {
        prepare: () => ({
          bind: () => ({
            all: async () => ({ results: [], success: true }),
            first: async () => {
              throw new Error('boom');
            },
            run: async () => ({ results: [], success: true }),
          }),
        }),
      } as unknown as Env['DB'],
    });
    const res = await bad(new Request('https://chai.test/api/health'));
    const body = (await res.json()) as HealthResponse;
    expect(body.ok).toBe(false);
    expect(body.db).toBe('unavailable');
  });
});

describe('GET /api/plants', () => {
  it('lists all plants with default sort (name_asc) and pagination envelope', async () => {
    const res = await get('/api/plants');
    expect(res.status).toBe(200);
    const body = (await res.json()) as PlantListResponse;
    expect(body.data.map((p) => p.slug)).toEqual(['cerasee', 'fever-grass']);
    expect(body.pagination).toEqual({ page: 1, per_page: 12, total: 2, total_pages: 1 });
  });

  it('computes derived summary fields', async () => {
    const res = await get('/api/plants');
    const body = (await res.json()) as PlantListResponse;
    const fg = body.data.find((p) => p.slug === 'fever-grass')!;
    expect(fg.countries).toEqual(['Jamaica', 'Trinidad and Tobago']);
    expect(fg.claims_assessed).toBe(3);
    expect(fg.highest_evidence).toBe('preliminary'); // preliminary(3) > traditional_use_documented(2) > safety_concern(0)
    expect(fg.safety_flag).toBe(true);
    expect(fg.featured).toBe(true);
    expect(fg.image?.url).toBe('https://upload.wikimedia.org/wikipedia/commons/f/fg.jpg');
    const ce = body.data.find((p) => p.slug === 'cerasee')!;
    expect(ce.claims_assessed).toBe(1);
    expect(ce.highest_evidence).toBe('preliminary');
    expect(ce.safety_flag).toBe(false);
    expect(ce.image).toBeNull();
  });

  it('searches q across common name, scientific name, regional names, synonyms', async () => {
    for (const [q, slugs] of [
      ['fever', ['fever-grass']],
      ['Cymbopogon', ['fever-grass']],
      ['lemongrass', ['fever-grass']], // regional name
      ['Andropogon', ['fever-grass']], // synonym
      ['bitter melon', ['cerasee']], // regional name
      ['CERASEE', ['cerasee']], // case-insensitive
    ] as const) {
      const res = await get(`/api/plants?q=${encodeURIComponent(q)}`);
      const body = (await res.json()) as PlantListResponse;
      expect(body.data.map((p) => p.slug)).toEqual(slugs);
    }
  });

  it('treats LIKE wildcards in q as literal characters', async () => {
    const res = await get('/api/plants?q=%25'); // q = "%"
    const body = (await res.json()) as PlantListResponse;
    expect(body.data).toEqual([]);
    expect(body.pagination.total).toBe(0);
  });

  it('filters by country, family, use, evidence, safety, featured', async () => {
    const slugs = async (qs: string) =>
      ((await (await get(`/api/plants?${qs}`)).json()) as PlantListResponse).data.map(
        (p) => p.slug,
      );

    expect(await slugs('country=Jamaica')).toEqual(['cerasee', 'fever-grass']);
    expect(await slugs(`country=${encodeURIComponent('Trinidad and Tobago')}`)).toEqual([
      'fever-grass',
    ]);
    expect(await slugs('country=Haiti')).toEqual([]);
    expect(await slugs('family=Poaceae')).toEqual(['fever-grass']);
    expect(await slugs('use=fever')).toEqual(['fever-grass']);
    expect(await slugs('use=BLOOD')).toEqual(['cerasee']); // case-insensitive substring
    expect(await slugs('evidence=traditional_use_documented')).toEqual(['fever-grass']);
    expect(await slugs('evidence=preliminary')).toEqual(['cerasee', 'fever-grass']);
    expect(await slugs('evidence=safety_concern')).toEqual(['fever-grass']);
    expect(await slugs('safety=true')).toEqual(['fever-grass']);
    expect(await slugs('safety=yes')).toEqual(['cerasee', 'fever-grass']); // non-"true" ignored
    expect(await slugs('featured=true')).toEqual(['fever-grass']);
    expect(await slugs('featured=false')).toEqual(['cerasee', 'fever-grass']); // ignored
    // combined filters
    expect(await slugs('country=Jamaica&evidence=preliminary&featured=true')).toEqual([
      'fever-grass',
    ]);
  });

  it('sorts by name_desc and recently_reviewed', async () => {
    const slugs = async (qs: string) =>
      ((await (await get(`/api/plants?${qs}`)).json()) as PlantListResponse).data.map(
        (p) => p.slug,
      );
    expect(await slugs('sort=name_desc')).toEqual(['fever-grass', 'cerasee']);
    expect(await slugs('sort=recently_reviewed')).toEqual(['fever-grass', 'cerasee']);
  });

  it('paginates and enforces the per_page cap', async () => {
    const p1 = (await (await get('/api/plants?per_page=1&page=1')).json()) as PlantListResponse;
    expect(p1.data).toHaveLength(1);
    expect(p1.pagination).toEqual({ page: 1, per_page: 1, total: 2, total_pages: 2 });
    const p2 = (await (await get('/api/plants?per_page=1&page=2')).json()) as PlantListResponse;
    expect(p2.data[0]!.slug).toBe('fever-grass');
    const p3 = (await (await get('/api/plants?per_page=1&page=3')).json()) as PlantListResponse;
    expect(p3.data).toEqual([]);
  });

  it('rejects invalid params with 400 + error envelope', async () => {
    const cases = [
      'per_page=0',
      'per_page=51',
      'per_page=abc',
      'page=0',
      'page=-2',
      'page=1.5',
      'evidence=bogus',
      'sort=bogus',
      `q=${'x'.repeat(121)}`,
    ];
    for (const qs of cases) {
      const res = await get(`/api/plants?${qs}`);
      expect(res.status, qs).toBe(400);
      const body = (await res.json()) as { error: { code: string; message: string } };
      expect(body.error.code, qs).toBe('invalid_param');
      expect(typeof body.error.message, qs).toBe('string');
    }
  });
});

describe('GET /api/plants/:slug', () => {
  it('returns the full plant detail', async () => {
    const res = await get('/api/plants/fever-grass');
    expect(res.status).toBe(200);
    const body = (await res.json()) as PlantDetailResponse;
    const d = body.data;
    expect(d.common_name).toBe('Fever Grass');
    expect(d.scientific_name).toBe('Cymbopogon citratus');
    expect(d.names).toHaveLength(2);
    expect(d.distribution.map((x) => x.country).sort()).toEqual([
      'Jamaica',
      'Trinidad and Tobago',
    ]);
    expect(d.traditional_uses).toHaveLength(2);
    expect(d.claims).toHaveLength(2);
    expect(d.claims[0]!.assessments).toHaveLength(2);
    expect(d.claims[1]!.assessments[0]!.category).toBe('safety_concern');
    expect(d.claims_assessed).toBe(3);
    expect(d.highest_evidence).toBe('preliminary');
    expect(d.safety_flag).toBe(true);
    expect(d.images).toHaveLength(1);
    // sources: union of plant_sources + traditional-use + assessment links
    // (src-rct is linked to cerasee only, so fever-grass sees src-tramil)
    expect(d.sources.map((s) => s.id).sort()).toEqual(['src-tramil']);
    expect(d.parts_used).toEqual([]);
    // safety columns now read from plants.safety_* (NULL -> "")
    expect(d.safety).toEqual({
      summary: 'Generally regarded as safe as a food tea.',
      side_effects: '',
      interactions: '',
      pregnancy: '',
      children: '',
      contraindications: '',
    });
    // traditional-use source_ids come from the traditional_use_sources link table
    expect(d.traditional_uses[0]!.source_ids).toEqual(['src-tramil']);
    expect(d.traditional_uses[1]!.source_ids).toEqual([]);
    // assessment source_ids come from the evidence_assessment_sources link table
    expect(d.claims[0]!.assessments[0]!.source_ids).toEqual(['src-tramil']);
    expect(d.claims[0]!.assessments[1]!.source_ids).toEqual([]);
  });

  it('404s unknown slugs with the not_found envelope', async () => {
    const res = await get('/api/plants/no-such-plant');
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('not_found');
    expect(body.error.message).toContain('no-such-plant');
  });

  it('404s malformed slugs', async () => {
    const res = await get('/api/plants/UPPERCASE');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/filters', () => {
  it('returns counts for countries, families, uses, evidence levels', async () => {
    const res = await get('/api/filters');
    expect(res.status).toBe(200);
    const body = (await res.json()) as FiltersResponse;

    expect(body.countries).toEqual([
      { name: 'Jamaica', count: 2 },
      { name: 'Trinidad and Tobago', count: 1 },
    ]);
    expect(body.families).toEqual([
      { name: 'Cucurbitaceae', count: 1 },
      { name: 'Poaceae', count: 1 },
    ]);
    expect(body.uses).toEqual([
      { name: 'bitter', count: 1 },
      { name: 'blood', count: 1 },
      { name: 'cleanser', count: 1 },
      { name: 'colds', count: 1 },
      { name: 'fever', count: 1 },
      { name: 'reduce', count: 1 },
      { name: 'trinidad', count: 1 },
    ]);
    expect(body.evidence_levels).toEqual([
      { category: 'preliminary', count: 2 },
      { category: 'traditional_use_documented', count: 1 },
      { category: 'safety_concern', count: 1 },
    ]);
  });
});

describe('unknown routes and methods', () => {
  it('404s unknown /api paths and non-/api paths', async () => {
    for (const path of ['/api/nope', '/api/ai/chat', '/other', '/']) {
      const res = await get(path);
      expect(res.status, path).toBe(404);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code, path).toBe('not_found');
    }
  });

  it('404s non-GET methods', async () => {
    const handler = createHandler(env);
    const res = await handler(
      new Request('https://chai.test/api/plants', { method: 'POST' }),
    );
    expect(res.status).toBe(404);
  });
});

describe('rate limiting', () => {
  it('allows 60 req/min per IP then 429s with Retry-After', async () => {
    const handler = createHandler(env);
    const mk = () =>
      handler(
        new Request('https://chai.test/api/health', {
          headers: { 'x-forwarded-for': '203.0.113.7' },
        }),
      );
    for (let i = 0; i < 60; i++) {
      const res = await mk();
      expect(res.status, `request ${i + 1}`).toBe(200);
    }
    const limited = await mk();
    expect(limited.status).toBe(429);
    expect(limited.headers.get('Retry-After')).toMatch(/^\d+$/);
    const body = (await limited.json()) as { error: { code: string } };
    expect(body.error.code).toBe('rate_limited');
  });

  it('tracks IPs independently', async () => {
    const handler = createHandler(env);
    const mk = (ip: string) =>
      handler(
        new Request('https://chai.test/api/health', {
          headers: { 'x-forwarded-for': ip },
        }),
      );
    for (let i = 0; i < 60; i++) await mk('198.51.100.9');
    expect((await mk('198.51.100.9')).status).toBe(429);
    expect((await mk('198.51.100.10')).status).toBe(200);
  });
});

describe('security headers', () => {
  it('are present on success, 400, 404, and 429 responses; no wildcard CORS', async () => {
    const ok = await get('/api/health');
    const bad = await get('/api/plants?per_page=999');
    const missing = await get('/api/plants/nope');
    for (const res of [ok, bad, missing]) {
      for (const h of SECURITY_HEADERS) {
        expect(res.headers.get(h), h).toBeTruthy();
      }
      expect(res.headers.get('access-control-allow-origin')).toBeNull();
    }
    expect(ok.headers.get('x-content-type-options')).toBe('nosniff');
    expect(ok.headers.get('x-frame-options')).toBe('DENY');
    expect(ok.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(ok.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
  });
});
