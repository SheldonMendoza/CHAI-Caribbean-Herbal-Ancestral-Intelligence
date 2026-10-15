/**
 * CHAI — D1 query helpers.
 *
 * Computes the derived PlantSummary / PlantDetail fields per contracts/schema.md
 * in the API layer (they are NOT stored in the database):
 *   countries, claims_assessed, highest_evidence (via EVIDENCE_RANK from
 *   shared/types), safety_flag, image.
 */

import {
  EVIDENCE_CATEGORY_ORDER,
  highestEvidence,
  type Constituent,
  type EvidenceAssessment,
  type EvidenceCategory,
  type FiltersResponse,
  type PlantDetail,
  type PlantImage,
  type PlantName,
  type PlantSummary,
  type SourceRef,
  type TraditionalUse,
  type Distribution as DistType,
} from '../../shared/types';
import type { D1Database } from './d1';
import type { ParsedPlantSearch } from './validation';

/* ------------------------------------------------------------------ */
/* Row shapes                                                          */
/* ------------------------------------------------------------------ */

interface PlantRow {
  id: string;
  slug: string;
  common_name: string;
  scientific_name: string;
  scientific_name_authorship: string | null;
  family: string;
  botanical_description: string | null;
  identification: string | null;
  parts_used: string | null;
  constituents: string | null;
  cultural_background: string | null;
  traditional_use_summary: string | null;
  disambiguation_note: string | null;
  safety_summary: string | null;
  side_effects: string | null;
  interactions: string | null;
  pregnancy: string | null;
  children: string | null;
  contraindications: string | null;
  reviewer_status: string;
  featured: number;
  last_reviewed: string | null;
}

interface CountryRow {
  plant_id: string;
  country: string;
}

interface AssessmentRow {
  plant_id: string;
  category: EvidenceCategory;
}

interface ImageRow {
  plant_id: string;
  url: string;
  caption: string | null;
  attribution: string;
  license: string;
  license_url: string;
  source_url: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Escape LIKE wildcards so `q` is a literal substring search. */
function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}

function toPlantImage(r: ImageRow): PlantImage {
  return {
    url: r.url,
    caption: r.caption ?? '',
    attribution: r.attribution,
    license: r.license,
    license_url: r.license_url,
    source_url: r.source_url,
  };
}

function parseJsonArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* /api/plants                                                         */
/* ------------------------------------------------------------------ */

function buildPlantFilters(p: ParsedPlantSearch): {
  where: string;
  params: unknown[];
} {
  const conds: string[] = [];
  const params: unknown[] = [];

  if (p.q) {
    // NOTE: contracts/api.md also names "tags"; the Phase 1 schema stores no
    // tags column, so search covers common name, scientific name, and all
    // recorded names (synonyms + regional). See DEVELOPMENT.md deviations.
    const like = `%${escapeLike(p.q)}%`;
    conds.push(
      `(LOWER(pl.common_name) LIKE LOWER(?) ESCAPE '\\' ` +
        `OR LOWER(pl.scientific_name) LIKE LOWER(?) ESCAPE '\\' ` +
        `OR EXISTS (SELECT 1 FROM plant_names pn WHERE pn.plant_id = pl.id ` +
        `AND LOWER(pn.name) LIKE LOWER(?) ESCAPE '\\'))`,
    );
    params.push(like, like, like);
  }
  if (p.country) {
    conds.push(
      `EXISTS (SELECT 1 FROM distribution d WHERE d.plant_id = pl.id AND d.country = ?)`,
    );
    params.push(p.country);
  }
  if (p.family) {
    conds.push(`pl.family = ?`);
    params.push(p.family);
  }
  if (p.use) {
    const like = `%${escapeLike(p.use)}%`;
    conds.push(
      `EXISTS (SELECT 1 FROM traditional_uses tu WHERE tu.plant_id = pl.id ` +
        `AND LOWER(tu.use_text) LIKE LOWER(?) ESCAPE '\\')`,
    );
    params.push(like);
  }
  if (p.evidence) {
    conds.push(
      `EXISTS (SELECT 1 FROM claims c JOIN evidence_assessments ea ` +
        `ON ea.claim_id = c.id WHERE c.plant_id = pl.id AND ea.category = ?)`,
    );
    params.push(p.evidence);
  }
  if (p.safety) {
    conds.push(
      `EXISTS (SELECT 1 FROM claims c JOIN evidence_assessments ea ` +
        `ON ea.claim_id = c.id WHERE c.plant_id = pl.id AND ea.category = 'safety_concern')`,
    );
  }
  if (p.featured) {
    conds.push(`pl.featured = 1`);
  }
  return { where: conds.length > 0 ? `WHERE ${conds.join(' AND ')}` : '', params };
}

function orderByClause(p: ParsedPlantSearch): string {
  switch (p.sort) {
    case 'name_desc':
      return 'ORDER BY pl.common_name COLLATE NOCASE DESC, pl.scientific_name ASC';
    case 'recently_reviewed':
      // SQLite sorts NULLs last on DESC by default.
      return 'ORDER BY pl.last_reviewed DESC, pl.common_name COLLATE NOCASE ASC';
    case 'name_asc':
    default:
      return 'ORDER BY pl.common_name COLLATE NOCASE ASC, pl.scientific_name ASC';
  }
}

export interface PlantPage {
  data: PlantSummary[];
  total: number;
}

export async function searchPlants(
  db: D1Database,
  p: ParsedPlantSearch,
): Promise<PlantPage> {
  const { where, params } = buildPlantFilters(p);

  const countRow = await db
    .prepare(`SELECT COUNT(*) AS total FROM plants pl ${where}`)
    .bind(...params)
    .first<{ total: number }>();
  const total = countRow?.total ?? 0;

  const offset = (p.page - 1) * p.per_page;
  const rows = (
    await db
      .prepare(
        `SELECT pl.* FROM plants pl ${where} ${orderByClause(p)} LIMIT ? OFFSET ?`,
      )
      .bind(...params, p.per_page, offset)
      .all<PlantRow>()
  ).results;

  const ids = rows.map((r) => r.id);
  const summaries = await buildSummaries(db, rows, ids);
  return { data: summaries, total };
}

async function buildSummaries(
  db: D1Database,
  rows: PlantRow[],
  ids: string[],
): Promise<PlantSummary[]> {
  if (rows.length === 0) return [];

  const placeholders = ids.map(() => '?').join(', ');

  const countryRows = (
    await db
      .prepare(
        `SELECT plant_id, country FROM distribution WHERE plant_id IN (${placeholders})`,
      )
      .bind(...ids)
      .all<CountryRow>()
  ).results;

  const assessmentRows = (
    await db
      .prepare(
        `SELECT c.plant_id AS plant_id, ea.category AS category ` +
          `FROM evidence_assessments ea JOIN claims c ON c.id = ea.claim_id ` +
          `WHERE c.plant_id IN (${placeholders})`,
      )
      .bind(...ids)
      .all<AssessmentRow>()
  ).results;

  const imageRows = (
    await db
      .prepare(
        `SELECT plant_id, url, caption, attribution, license, license_url, source_url ` +
          `FROM plant_images WHERE plant_id IN (${placeholders}) ` +
          `ORDER BY position ASC, id ASC`,
      )
      .bind(...ids)
      .all<ImageRow>()
  ).results;

  const countriesByPlant = new Map<string, Set<string>>();
  for (const r of countryRows) {
    let s = countriesByPlant.get(r.plant_id);
    if (!s) {
      s = new Set();
      countriesByPlant.set(r.plant_id, s);
    }
    s.add(r.country);
  }

  const categoriesByPlant = new Map<string, EvidenceCategory[]>();
  for (const r of assessmentRows) {
    const arr = categoriesByPlant.get(r.plant_id) ?? [];
    arr.push(r.category);
    categoriesByPlant.set(r.plant_id, arr);
  }

  const imageByPlant = new Map<string, PlantImage>();
  for (const r of imageRows) {
    if (!imageByPlant.has(r.plant_id)) imageByPlant.set(r.plant_id, toPlantImage(r));
  }

  return rows.map((r) => {
    const cats = categoriesByPlant.get(r.id) ?? [];
    return {
      id: r.id,
      slug: r.slug,
      common_name: r.common_name,
      scientific_name: r.scientific_name,
      family: r.family,
      countries: [...(countriesByPlant.get(r.id) ?? new Set<string>())].sort(),
      traditional_use_summary: r.traditional_use_summary ?? '',
      claims_assessed: cats.length,
      highest_evidence: highestEvidence(cats),
      safety_flag: cats.includes('safety_concern'),
      featured: r.featured === 1,
      last_reviewed: r.last_reviewed ?? '',
      image: imageByPlant.get(r.id) ?? null,
    };
  });
}

/* ------------------------------------------------------------------ */
/* /api/plants/:slug                                                   */
/* ------------------------------------------------------------------ */

interface NameRow {
  name: string;
  name_type: string;
  region: string | null;
  notes: string | null;
}
interface DistRow {
  country: string;
  status: string | null;
  note: string | null;
}
interface UseRow {
  id: number;
  use_text: string;
  countries: string | null;
  preparation: string | null;
}
interface ClaimRow {
  id: number;
  claim_text: string;
}
interface FullAssessmentRow {
  id: number;
  claim_id: number;
  category: EvidenceCategory;
  summary: string;
  study_design: string | null;
  population: string | null;
  preparation_studied: string | null;
  main_findings: string | null;
  limitations: string | null;
  adverse_effects: string | null;
  reviewer_status: string;
  last_reviewed: string | null;
}
interface SourceRow {
  id: string;
  title: string;
  authors: string | null;
  year: number | null;
  journal: string | null;
  doi: string | null;
  url: string | null;
  source_type: string;
  accessed_date: string | null;
  notes: string | null;
}

export async function getPlantDetail(
  db: D1Database,
  slug: string,
): Promise<PlantDetail | null> {
  const row = await db
    .prepare('SELECT * FROM plants WHERE slug = ?')
    .bind(slug)
    .first<PlantRow>();
  if (!row) return null;
  const pid = row.id;

  const names = (
    await db
      .prepare('SELECT name, name_type, region, notes FROM plant_names WHERE plant_id = ? ORDER BY id ASC')
      .bind(pid)
      .all<NameRow>()
  ).results.map(
    (n): PlantName => ({
      name: n.name,
      name_type: n.name_type as PlantName['name_type'],
      region: n.region,
      notes: n.notes ?? '',
    }),
  );

  const distribution = (
    await db
      .prepare('SELECT country, status, note FROM distribution WHERE plant_id = ? ORDER BY id ASC')
      .bind(pid)
      .all<DistRow>()
  ).results.map(
    (d): DistType => ({
      country: d.country,
      status: d.status as DistType['status'],
      note: d.note ?? '',
    }),
  );

  const useRows = (
    await db
      .prepare('SELECT id, use_text, countries, preparation FROM traditional_uses WHERE plant_id = ? ORDER BY id ASC')
      .bind(pid)
      .all<UseRow>()
  ).results;

  const useIds = useRows.map((u) => u.id);
  const useSourceRows = useIds.length
    ? (
        await db
          .prepare(
            `SELECT traditional_use_id, source_id FROM traditional_use_sources ` +
              `WHERE traditional_use_id IN (${useIds.map(() => '?').join(', ')})`,
          )
          .bind(...useIds)
          .all<{ traditional_use_id: number; source_id: string }>()
      ).results
    : [];
  const sourcesByUse = new Map<number, string[]>();
  for (const r of useSourceRows) {
    const arr = sourcesByUse.get(r.traditional_use_id) ?? [];
    arr.push(r.source_id);
    sourcesByUse.set(r.traditional_use_id, arr);
  }

  const traditional_uses = useRows.map(
    (u): TraditionalUse => ({
      use: u.use_text,
      countries: parseJsonArray<string>(u.countries),
      preparation: u.preparation ?? '',
      source_ids: sourcesByUse.get(u.id) ?? [],
    }),
  );

  const claimRows = (
    await db
      .prepare('SELECT id, claim_text FROM claims WHERE plant_id = ? ORDER BY id ASC')
      .bind(pid)
      .all<ClaimRow>()
  ).results;

  const assessmentRows = claimRows.length
    ? (
        await db
          .prepare(
            `SELECT ea.* FROM evidence_assessments ea JOIN claims c ON c.id = ea.claim_id ` +
              `WHERE c.plant_id = ? ORDER BY c.id ASC, ea.id ASC`,
          )
          .bind(pid)
          .all<FullAssessmentRow>()
      ).results
    : [];

  const assessmentIds = assessmentRows.map((a) => a.id);
  const assessSourceRows = assessmentIds.length
    ? (
        await db
          .prepare(
            `SELECT assessment_id, source_id FROM evidence_assessment_sources ` +
              `WHERE assessment_id IN (${assessmentIds.map(() => '?').join(', ')})`,
          )
          .bind(...assessmentIds)
          .all<{ assessment_id: number; source_id: string }>()
      ).results
    : [];
  const sourcesByAssessment = new Map<number, string[]>();
  for (const r of assessSourceRows) {
    const arr = sourcesByAssessment.get(r.assessment_id) ?? [];
    arr.push(r.source_id);
    sourcesByAssessment.set(r.assessment_id, arr);
  }

  const assessmentsByClaim = new Map<number, EvidenceAssessment[]>();
  for (const a of assessmentRows) {
    const arr = assessmentsByClaim.get(a.claim_id) ?? [];
    arr.push({
      category: a.category,
      summary: a.summary,
      study_design: a.study_design ?? '',
      population: a.population ?? '',
      preparation_studied: a.preparation_studied ?? '',
      main_findings: a.main_findings ?? '',
      limitations: a.limitations ?? '',
      adverse_effects: a.adverse_effects ?? '',
      source_ids: sourcesByAssessment.get(a.id) ?? [],
      reviewer_status: a.reviewer_status as EvidenceAssessment['reviewer_status'],
      last_reviewed: a.last_reviewed ?? '',
    });
    assessmentsByClaim.set(a.claim_id, arr);
  }

  const claims = claimRows.map((c) => ({
    claim: c.claim_text,
    assessments: assessmentsByClaim.get(c.id) ?? [],
  }));

  const images = (
    await db
      .prepare(
        'SELECT plant_id, url, caption, attribution, license, license_url, source_url ' +
          'FROM plant_images WHERE plant_id = ? ORDER BY position ASC, id ASC',
      )
      .bind(pid)
      .all<ImageRow>()
  ).results.map(toPlantImage);

  // Sources: union of plant_sources links, traditional-use links, and
  // per-assessment links.
  const sourceRows = (
    await db
      .prepare(
        `SELECT DISTINCT s.* FROM sources s WHERE s.id IN ` +
          `(SELECT source_id FROM plant_sources WHERE plant_id = ?) ` +
          `OR s.id IN (SELECT tus.source_id FROM traditional_use_sources tus ` +
          `JOIN traditional_uses tu ON tu.id = tus.traditional_use_id ` +
          `WHERE tu.plant_id = ?) ` +
          `OR s.id IN (SELECT eas.source_id FROM evidence_assessment_sources eas ` +
          `JOIN evidence_assessments ea ON ea.id = eas.assessment_id ` +
          `JOIN claims c ON c.id = ea.claim_id WHERE c.plant_id = ?)`,
      )
      .bind(pid, pid, pid)
      .all<SourceRow>()
  ).results.map(
    (s): SourceRef => ({
      id: s.id,
      title: s.title,
      authors: s.authors ?? '',
      year: s.year,
      journal: s.journal ?? '',
      doi: s.doi ?? '',
      url: s.url ?? '',
      source_type: s.source_type,
      accessed: s.accessed_date ?? '',
      notes: s.notes ?? '',
    }),
  );

  const countries = [...new Set(distribution.map((d) => d.country))].sort();
  const allCats = assessmentRows.map((a) => a.category);

  const safety = {
    summary: row.safety_summary ?? '',
    side_effects: row.side_effects ?? '',
    interactions: row.interactions ?? '',
    pregnancy: row.pregnancy ?? '',
    children: row.children ?? '',
    contraindications: row.contraindications ?? '',
  };

  return {
    id: row.id,
    slug: row.slug,
    common_name: row.common_name,
    scientific_name: row.scientific_name,
    scientific_name_authorship: row.scientific_name_authorship ?? '',
    family: row.family,
    botanical_description: row.botanical_description ?? '',
    identification: row.identification ?? '',
    parts_used: parseJsonArray<string>(row.parts_used),
    constituents: parseJsonArray<Constituent>(row.constituents),
    cultural_background: row.cultural_background ?? '',
    countries,
    traditional_use_summary: row.traditional_use_summary ?? '',
    claims_assessed: allCats.length,
    highest_evidence: highestEvidence(allCats),
    safety_flag: allCats.includes('safety_concern'),
    featured: row.featured === 1,
    last_reviewed: row.last_reviewed ?? '',
    names,
    distribution,
    traditional_uses,
    claims,
    safety,
    images,
    sources: sourceRows,
    reviewer_status: row.reviewer_status as PlantDetail['reviewer_status'],
    disambiguation_note: row.disambiguation_note ?? '',
  };
}

/* ------------------------------------------------------------------ */
/* /api/filters                                                        */
/* ------------------------------------------------------------------ */

/** Minimal stopword list for the Phase 1 keyword extraction on use text. */
const USE_STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'are', 'was', 'were',
  'has', 'have', 'had', 'been', 'being', 'its', 'their', 'they', 'them',
  'used', 'uses', 'use', 'using', 'traditionally', 'traditional',
  'leaf', 'leaves', 'tea', 'teas', 'drink', 'drunk', 'taken', 'take', 'taking',
  'plant', 'plants', 'made', 'make', 'well', 'also', 'often', 'sometimes',
  'commonly', 'common', 'such', 'which', 'when', 'while', 'about', 'into',
  'over', 'under', 'between', 'among', 'without', 'within', 'many', 'much',
  'more', 'most', 'very', 'will', 'would', 'could', 'should', 'treat',
  'treatment', 'remedy', 'folk', 'said', 'believed', 'help', 'helps',
]);

function extractUseKeywords(
  perPlantTexts: Map<string, string[]>,
): { name: string; count: number }[] {
  const plantCount = new Map<string, number>();
  for (const texts of perPlantTexts.values()) {
    const terms = new Set<string>();
    for (const text of texts) {
      for (const raw of text.toLowerCase().split(/[^a-z]+/)) {
        if (raw.length >= 4 && !USE_STOPWORDS.has(raw)) terms.add(raw);
      }
    }
    for (const t of terms) plantCount.set(t, (plantCount.get(t) ?? 0) + 1);
  }
  return [...plantCount.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function getFilters(db: D1Database): Promise<FiltersResponse> {
  const countryRows = (
    await db
      .prepare(
        `SELECT country AS name, COUNT(DISTINCT plant_id) AS count FROM distribution ` +
          `GROUP BY country ORDER BY count DESC, name ASC`,
      )
      .all<{ name: string; count: number }>()
  ).results;

  const familyRows = (
    await db
      .prepare(
        `SELECT family AS name, COUNT(*) AS count FROM plants ` +
          `GROUP BY family ORDER BY count DESC, name ASC`,
      )
      .all<{ name: string; count: number }>()
  ).results;

  const useRows = (
    await db
      .prepare('SELECT plant_id, use_text FROM traditional_uses')
      .all<{ plant_id: string; use_text: string }>()
  ).results;
  const perPlantTexts = new Map<string, string[]>();
  for (const r of useRows) {
    const arr = perPlantTexts.get(r.plant_id) ?? [];
    arr.push(r.use_text);
    perPlantTexts.set(r.plant_id, arr);
  }
  const uses = extractUseKeywords(perPlantTexts);

  const evidenceRows = (
    await db
      .prepare(
        `SELECT ea.category AS category, COUNT(DISTINCT c.plant_id) AS count ` +
          `FROM evidence_assessments ea JOIN claims c ON c.id = ea.claim_id ` +
          `GROUP BY ea.category`,
      )
      .all<{ category: EvidenceCategory; count: number }>()
  ).results;
  const evidence_levels = evidenceRows
    .map((r) => ({ category: r.category, count: r.count }))
    .sort(
      (a, b) =>
        EVIDENCE_CATEGORY_ORDER.indexOf(a.category) -
        EVIDENCE_CATEGORY_ORDER.indexOf(b.category),
    );

  return {
    countries: countryRows.map((r) => ({ name: r.name, count: r.count })),
    families: familyRows.map((r) => ({ name: r.name, count: r.count })),
    uses,
    evidence_levels,
  };
}
