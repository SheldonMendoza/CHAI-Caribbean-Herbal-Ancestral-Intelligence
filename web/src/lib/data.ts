/**
 * CHAI frontend data layer — Phase 1.
 *
 * Defines the PlantDataSource contract, a SeedDataSource (reads the bundled
 * seed JSON — the real researched dataset is copied verbatim over
 * src/data/seed-plants.json at integration time, keeping this import path
 * stable), and an ApiDataSource (fetch /api/*) prepared for later phases.
 *
 * DEFAULT: SeedDataSource. The commented switch below shows how to move to
 * ApiDataSource when the worker API ships. Do NOT enable it in Phase 1.
 */

import type {
  FiltersResponse,
  Pagination,
  PlantDetail,
  PlantListResponse,
  PlantSearchParams,
  PlantSummary,
  SourceRef,
} from '../../../shared/types';
import {
  buildFilterOptions,
  normalizeParams,
  searchPlants,
  sourcesByIds,
  toSummary,
} from './query';
import seedFile from '../data/seed-plants.json';

export interface PlantDataSource {
  readonly kind: 'seed' | 'api';
  /** Search / filter / paginate. Matches GET /api/plants semantics. */
  search(params: PlantSearchParams): Promise<PlantListResponse>;
  /** Full detail record, or null. Matches GET /api/plants/:slug. */
  getBySlug(slug: string): Promise<PlantDetail | null>;
  /** Filter metadata with counts. Matches GET /api/filters. */
  getFilters(): Promise<FiltersResponse>;
  /** Sources for a detail record (union of linked source ids). */
  getSources(detail: PlantDetail, ids: string[]): Promise<SourceRef[]>;
}

/* ------------------------------------------------------------------ */
/* Seed JSON shape                                                      */
/* ------------------------------------------------------------------ */

interface SeedFile {
  version: number;
  exported: string;
  sources: SourceRef[];
  plants: PlantDetail[];
}

const SEED = seedFile as unknown as SeedFile;
const SOURCE_REGISTRY = new Map<string, SourceRef>(
  (SEED.sources ?? []).map((s) => [s.id, s]),
);

/** Top-level source registry from the seed bundle (for citation resolution). */
export function sourceRegistry(): Map<string, SourceRef> {
  return SOURCE_REGISTRY;
}
const DETAILS: PlantDetail[] = SEED.plants ?? [];
const DETAIL_BY_SLUG = new Map(DETAILS.map((d) => [d.slug, d]));

/* ------------------------------------------------------------------ */
/* SeedDataSource — default for Phase 1                                 */
/* ------------------------------------------------------------------ */

export class SeedDataSource implements PlantDataSource {
  readonly kind = 'seed' as const;

  async search(params: PlantSearchParams): Promise<PlantListResponse> {
    return searchPlants(DETAILS, params);
  }

  async getBySlug(slug: string): Promise<PlantDetail | null> {
    return DETAIL_BY_SLUG.get(slug.toLowerCase()) ?? null;
  }

  async getFilters(): Promise<FiltersResponse> {
    return buildFilterOptions(DETAILS);
  }

  async getSources(detail: PlantDetail, ids: string[]): Promise<SourceRef[]> {
    void detail;
    return sourcesByIds(ids, SOURCE_REGISTRY);
  }
}

/* ------------------------------------------------------------------ */
/* ApiDataSource — prepared for later phases, NOT wired in Phase 1      */
/* ------------------------------------------------------------------ */

/**
 * Fetch-backed implementation of PlantDataSource against the Phase 2+
 * worker API (GET /api/plants, /api/plants/:slug, /api/filters).
 * Kept in the codebase so the production switch is a one-line change in
 * src/lib/data-context.tsx — but importing/using it before the API exists
 * would only produce network errors, so it is NOT referenced anywhere yet.
 */
export class ApiDataSource implements PlantDataSource {
  readonly kind = 'api' as const;
  constructor(private readonly baseUrl = '/api') {}

  private async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(this.baseUrl + path, window.location.origin);
    for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);
    const res = await fetch(url.toString(), { credentials: 'same-origin' });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: { code?: string; message?: string };
      } | null;
      throw new Error(body?.error?.message ?? `API request failed (${res.status})`);
    }
    return (await res.json()) as T;
  }

  private toQuery(params: PlantSearchParams): Record<string, string> {
    const p = normalizeParams(params);
    const q: Record<string, string> = {
      sort: p.sort,
      page: String(p.page),
      per_page: String(p.per_page),
    };
    if (p.q) q.q = p.q;
    if (p.country) q.country = p.country;
    if (p.family) q.family = p.family;
    if (p.use) q.use = p.use;
    if (p.evidence) q.evidence = p.evidence;
    if (p.safety) q.safety = 'true';
    if (p.featured) q.featured = 'true';
    return q;
  }

  async search(params: PlantSearchParams): Promise<PlantListResponse> {
    return this.get<PlantListResponse>('/plants', this.toQuery(params));
  }

  async getBySlug(slug: string): Promise<PlantDetail | null> {
    const res = await this.get<{ data: PlantDetail }>(`/plants/${encodeURIComponent(slug)}`);
    return res.data;
  }

  async getFilters(): Promise<FiltersResponse> {
    return this.get<FiltersResponse>('/filters');
  }

  async getSources(_detail: PlantDetail, _ids: string[]): Promise<SourceRef[]> {
    // The API embeds sources in PlantDetail.sources; this path is a fallback.
    return [];
  }
}

/**
 * THE PRODUCTION SWITCH (Phase 2+):
 *
 *   export const dataSource: PlantDataSource = new ApiDataSource();
 *
 * Phase 1 default (seed bundle, works with zero backend):
 */
export const dataSource: PlantDataSource = new SeedDataSource();

/** Re-exported for components that need the raw summaries directly. */
export function summarizeAll(): PlantSummary[] {
  return DETAILS.map(toSummary);
}

/** Re-exported for the homepage "recently added" section. */
export function summariesByReviewDate(limit = 4): PlantSummary[] {
  return [...DETAILS]
    .sort(
      (a, b) =>
        (b.last_reviewed || '').localeCompare(a.last_reviewed || '') ||
        a.common_name.localeCompare(b.common_name),
    )
    .slice(0, limit)
    .map(toSummary);
}

export type { Pagination };
