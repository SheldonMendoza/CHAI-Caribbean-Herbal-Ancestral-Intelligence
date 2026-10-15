/**
 * CHAI — pure query functions implementing the GET /api/plants semantics
 * from contracts/api.md, plus PlantSummary derivation (per contracts/schema.md)
 * and /api/filters option builders.
 *
 * These are dependency-free so they run identically in the web SPA, in the
 * worker API layer, and in vitest.
 */

import {
  EVIDENCE_CATEGORY_ORDER,
  highestEvidence,
  type Claim,
  type EvidenceCategory,
  type EvidenceFilterOption,
  type FilterOption,
  type FiltersResponse,
  type Pagination,
  type PlantDetail,
  type PlantListResponse,
  type PlantSearchParams,
  type PlantSort,
  type PlantSummary,
  type SourceRef,
} from '../../../shared/types';

/* ------------------------------------------------------------------ */
/* Normalization (mirrors API server-side coercion)                    */
/* ------------------------------------------------------------------ */

const VALID_SORTS: PlantSort[] = ['name_asc', 'name_desc', 'recently_reviewed'];

export interface NormalizedParams {
  q: string;
  country?: string;
  family?: string;
  use?: string;
  evidence?: EvidenceCategory;
  safety: boolean;
  featured: boolean;
  sort: PlantSort;
  page: number;
  per_page: number;
}

export function normalizeParams(raw: PlantSearchParams): NormalizedParams {
  const q = (raw.q ?? '').trim().slice(0, 120);
  const per_page = Math.min(50, Math.max(1, Math.floor(raw.per_page ?? 12) || 12));
  const page = Math.max(1, Math.floor(raw.page ?? 1) || 1);
  const sort: PlantSort = VALID_SORTS.includes(raw.sort as PlantSort)
    ? (raw.sort as PlantSort)
    : 'name_asc';
  return {
    q,
    country: raw.country?.trim() || undefined,
    family: raw.family?.trim() || undefined,
    use: raw.use?.trim() || undefined,
    evidence: raw.evidence,
    safety: raw.safety === true,
    featured: raw.featured === true,
    sort,
    page,
    per_page,
  };
}

/* ------------------------------------------------------------------ */
/* PlantSummary derivation (schema.md "Derived fields")                */
/* ------------------------------------------------------------------ */

/** All assessment categories across every claim on a plant. */
export function plantCategories(plant: PlantDetail): EvidenceCategory[] {
  const out: EvidenceCategory[] = [];
  for (const claim of plant.claims ?? []) {
    for (const a of claim.assessments ?? []) out.push(a.category);
  }
  return out;
}

/** Number of individual assessments across all claims. */
export function countAssessments(claims: Claim[] | undefined): number {
  if (!claims) return 0;
  return claims.reduce((n, c) => n + (c.assessments?.length ?? 0), 0);
}

export function toSummary(plant: PlantDetail): PlantSummary {
  const categories = plantCategories(plant);
  return {
    id: plant.id,
    slug: plant.slug,
    common_name: plant.common_name,
    scientific_name: plant.scientific_name,
    family: plant.family,
    countries: (plant.distribution ?? []).map((d) => d.country),
    traditional_use_summary: plant.traditional_use_summary,
    claims_assessed: countAssessments(plant.claims),
    highest_evidence: highestEvidence(categories),
    safety_flag: categories.includes('safety_concern'),
    featured: plant.featured,
    last_reviewed: plant.last_reviewed,
    image: (plant.images ?? [])[0] ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* Search / filter                                                     */
/* ------------------------------------------------------------------ */

/**
 * Case-insensitive substring search across common name, scientific name,
 * regional names, synonyms, family, and traditional-use text.
 *
 * NOTE (deviation from api.md wording): the contract says search covers
 * "tags", but the seed schema (seed-format.md) defines no tags field, so
 * there is nothing to match. The extra fields matched here (family,
 * constituents, parts used) are a superset of the searchable fields the
 * data model actually has.
 */
export function matchesQuery(plant: PlantDetail, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const haystacks: string[] = [
    plant.common_name,
    plant.scientific_name,
    plant.family,
    plant.traditional_use_summary,
    plant.disambiguation_note,
  ];
  for (const n of plant.names ?? []) {
    haystacks.push(n.name);
    if (n.region) haystacks.push(n.region);
  }
  for (const t of plant.traditional_uses ?? []) {
    haystacks.push(t.use, t.preparation, ...t.countries);
  }
  for (const c of plant.constituents ?? []) haystacks.push(c.name, c.note);
  haystacks.push(...(plant.parts_used ?? []));
  return haystacks.some((h) => (h ?? '').toLowerCase().includes(needle));
}

export function matchesFilters(plant: PlantDetail, p: NormalizedParams): boolean {
  if (
    p.country &&
    !(plant.distribution ?? []).some((d) => d.country === p.country)
  )
    return false;
  if (p.family && plant.family !== p.family) return false;
  if (p.use) {
    const needle = p.use.toLowerCase();
    const texts = [
      plant.traditional_use_summary,
      ...(plant.traditional_uses ?? []).flatMap((t) => [
        t.use,
        t.preparation,
        ...t.countries,
      ]),
    ];
    if (!texts.some((t) => (t ?? '').toLowerCase().includes(needle))) return false;
  }
  if (p.evidence && !plantCategories(plant).includes(p.evidence)) return false;
  if (p.safety && !plantCategories(plant).includes('safety_concern')) return false;
  if (p.featured && !plant.featured) return false;
  return true;
}

function sortDetails(plants: PlantDetail[], sort: PlantSort): PlantDetail[] {
  const arr = [...plants];
  switch (sort) {
    case 'name_desc':
      arr.sort((a, b) => b.common_name.localeCompare(a.common_name));
      break;
    case 'recently_reviewed':
      arr.sort((a, b) =>
        (b.last_reviewed || '').localeCompare(a.last_reviewed || '') ||
        a.common_name.localeCompare(b.common_name),
      );
      break;
    case 'name_asc':
    default:
      arr.sort((a, b) => a.common_name.localeCompare(b.common_name));
  }
  return arr;
}

export function searchPlants(
  details: PlantDetail[],
  rawParams: PlantSearchParams,
): PlantListResponse {
  const p = normalizeParams(rawParams);
  const filtered = sortDetails(
    details.filter((d) => matchesQuery(d, p.q) && matchesFilters(d, p)),
    p.sort,
  );
  const total = filtered.length;
  const total_pages = Math.max(1, Math.ceil(total / p.per_page));
  const page = Math.min(p.page, total_pages);
  const start = (page - 1) * p.per_page;
  const pagination: Pagination = { page, per_page: p.per_page, total, total_pages };
  return { data: filtered.slice(start, start + p.per_page).map(toSummary), pagination };
}

/** Client-side alphabetical browse helper (page layer, not an API param). */
export function filterByLetter(summaries: PlantSummary[], letter: string): PlantSummary[] {
  const l = letter.toUpperCase();
  if (l.length !== 1) return summaries;
  return summaries.filter((s) => s.common_name.toUpperCase().startsWith(l));
}

/* ------------------------------------------------------------------ */
/* /api/filters option builders                                        */
/* ------------------------------------------------------------------ */

function countBy(values: string[]): FilterOption[] {
  const map = new Map<string, number>();
  for (const v of values) map.set(v, (map.get(v) ?? 0) + 1);
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Derive traditional-use keyword options from traditional-use text.
 * Per api.md: lowercase significant terms (length > 3, not a stop word),
 * counted per plant (a plant counts once per term).
 */
export const USE_KEYWORD_STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'used', 'use',
  'using', 'into', 'over', 'such', 'are', 'was', 'were', 'been', 'being',
  'has', 'have', 'had', 'does', 'did', 'will', 'would', 'can', 'could',
  'may', 'also', 'than', 'then', 'them', 'they', 'their', 'its', 'leaf',
  'leaves', 'plant', 'plants', 'taken', 'take', 'made', 'make', 'part',
  'parts', 'like', 'very', 'more', 'most', 'when', 'where', 'which',
]);

export function useKeywords(plant: PlantDetail): string[] {
  const texts = [
    plant.traditional_use_summary,
    ...(plant.traditional_uses ?? []).flatMap((t) => [t.use, t.preparation]),
  ].join(' ');
  const words = texts
    .toLowerCase()
    .replace(/[^a-z\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((w) => w.length > 3 && !USE_KEYWORD_STOPWORDS.has(w));
  return [...new Set(words)];
}

export function buildFilterOptions(details: PlantDetail[]): FiltersResponse {
  const countryValues = details.flatMap((d) => d.distribution ?? []).map((x) => x.country);
  const familyValues = details.map((d) => d.family).filter(Boolean);
  const useValues = details.flatMap(useKeywords);
  const evidence_levels: EvidenceFilterOption[] = EVIDENCE_CATEGORY_ORDER.map(
    (category) => ({
      category,
      count: new Set(
        details.filter((d) => plantCategories(d).includes(category)).map((d) => d.id),
      ).size,
    }),
  ).filter((e) => e.count > 0);
  return {
    countries: countBy(countryValues),
    families: countBy(familyValues),
    uses: countBy(useValues),
    evidence_levels,
  };
}

/* ------------------------------------------------------------------ */
/* Source resolution                                                   */
/* ------------------------------------------------------------------ */

/** Map source id -> SourceRef for a plant's union of sources. */
export function resolvePlantSources(
  plant: PlantDetail,
  registry: Map<string, SourceRef>,
): SourceRef[] {
  const ids = new Set<string>();
  for (const t of plant.traditional_uses ?? []) for (const id of t.source_ids ?? []) ids.add(id);
  for (const c of plant.claims ?? [])
    for (const a of c.assessments ?? []) for (const id of a.source_ids ?? []) ids.add(id);
  const out: SourceRef[] = [];
  for (const id of ids) {
    const s = registry.get(id);
    if (s) out.push(s);
  }
  out.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title));
  return out;
}

/** Look up sources for a list of ids, preserving input order. */
export function sourcesByIds(
  ids: string[],
  registry: Map<string, SourceRef>,
): SourceRef[] {
  return ids.map((id) => registry.get(id)).filter((s): s is SourceRef => !!s);
}
