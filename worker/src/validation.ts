/**
 * CHAI — query-param parsing/validation for GET /api/plants.
 *
 * Conforms to contracts/api.md. Anything invalid -> ParamError (400).
 */

import {
  EVIDENCE_CATEGORIES,
  type EvidenceCategory,
  type PlantSort,
} from '../../shared/types';

const SORTS: PlantSort[] = ['name_asc', 'name_desc', 'recently_reviewed'];
export const MAX_PER_PAGE = 50;
export const DEFAULT_PER_PAGE = 12;
const MAX_Q_LENGTH = 120;

export interface ParsedPlantSearch {
  q?: string;
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

export class ParamError extends Error {
  readonly code = 'invalid_param';
  constructor(message: string) {
    super(message);
    this.name = 'ParamError';
  }
}

function parsePositiveInt(raw: string | null, name: string): number | undefined {
  if (raw === null || raw.trim() === '') return undefined;
  if (!/^\d+$/.test(raw.trim())) {
    throw new ParamError(`'${name}' must be a positive integer.`);
  }
  return Number.parseInt(raw.trim(), 10);
}

export function parsePlantSearchParams(
  sp: URLSearchParams,
): ParsedPlantSearch {
  const qRaw = sp.get('q')?.trim();
  if (qRaw !== undefined && qRaw.length > MAX_Q_LENGTH) {
    throw new ParamError(`'q' must be at most ${MAX_Q_LENGTH} characters.`);
  }

  const evidenceRaw = sp.get('evidence')?.trim();
  let evidence: EvidenceCategory | undefined;
  if (evidenceRaw) {
    if (!(evidenceRaw in EVIDENCE_CATEGORIES)) {
      throw new ParamError(
        `'evidence' must be one of: ${Object.keys(EVIDENCE_CATEGORIES).join(', ')}.`,
      );
    }
    evidence = evidenceRaw as EvidenceCategory;
  }

  const sortRaw = sp.get('sort')?.trim();
  let sort: PlantSort = 'name_asc';
  if (sortRaw) {
    if (!(SORTS as string[]).includes(sortRaw)) {
      throw new ParamError(`'sort' must be one of: ${SORTS.join(', ')}.`);
    }
    sort = sortRaw as PlantSort;
  }

  const page = parsePositiveInt(sp.get('page'), 'page') ?? 1;
  if (page < 1) throw new ParamError(`'page' must be >= 1.`);

  const perPage = parsePositiveInt(sp.get('per_page'), 'per_page') ?? DEFAULT_PER_PAGE;
  if (perPage < 1 || perPage > MAX_PER_PAGE) {
    throw new ParamError(`'per_page' must be between 1 and ${MAX_PER_PAGE}.`);
  }

  const nonEmpty = (v: string | null): string | undefined => {
    const t = v?.trim();
    return t ? t : undefined;
  };

  return {
    q: qRaw || undefined,
    country: nonEmpty(sp.get('country')),
    family: nonEmpty(sp.get('family')),
    use: nonEmpty(sp.get('use')),
    evidence,
    // Per contract: these flags are only honoured on the exact value "true";
    // any other value is ignored (not an error).
    safety: sp.get('safety') === 'true',
    featured: sp.get('featured') === 'true',
    sort,
    page,
    per_page: perPage,
  };
}
