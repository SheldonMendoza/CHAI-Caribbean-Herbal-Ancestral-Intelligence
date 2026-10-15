/**
 * CHAI — Caribbean Herbal Ancestral Intelligence
 * Shared TypeScript contracts — SINGLE SOURCE OF TRUTH (Phase 1).
 *
 * Imported by:
 *   - web/  (Vite SPA)      via ../../shared/types
 *   - worker/ (Cloudflare)  via ../shared/types
 *
 * Do not duplicate these types elsewhere. Extend only by coordinator decision.
 */

/* ------------------------------------------------------------------ */
/* Evidence categories — the 6 claim-level assessment categories.      */
/* NEVER assign a single blanket rating to a whole plant; assess      */
/* individual claims. These are informational categories, not        */
/* automatic scientific grades.                                       */
/* ------------------------------------------------------------------ */

export type EvidenceCategory =
  | 'strong_human'
  | 'moderate_human'
  | 'preliminary'
  | 'traditional_use_documented'
  | 'insufficient_evidence'
  | 'safety_concern';

export interface EvidenceCategoryMeta {
  category: EvidenceCategory;
  label: string;
  description: string;
  /** CSS hook, e.g. 'ev-strong'. Styling lives in the web design system. */
  badgeClass: string;
}

/** Display order, strongest evidence first. */
export const EVIDENCE_CATEGORY_ORDER: EvidenceCategory[] = [
  'strong_human',
  'moderate_human',
  'preliminary',
  'traditional_use_documented',
  'insufficient_evidence',
  'safety_concern',
];

export const EVIDENCE_CATEGORIES: Record<EvidenceCategory, EvidenceCategoryMeta> = {
  strong_human: {
    category: 'strong_human',
    label: 'Strong human evidence',
    description:
      'Consistent, relevant high-quality clinical evidence supports the specific claim.',
    badgeClass: 'ev-strong',
  },
  moderate_human: {
    category: 'moderate_human',
    label: 'Moderate human evidence',
    description:
      'Human studies provide meaningful but limited support for the specific claim.',
    badgeClass: 'ev-moderate',
  },
  preliminary: {
    category: 'preliminary',
    label: 'Preliminary evidence',
    description:
      'Findings are early, inconsistent, or based mainly on laboratory or animal studies — not established in humans.',
    badgeClass: 'ev-preliminary',
  },
  traditional_use_documented: {
    category: 'traditional_use_documented',
    label: 'Traditional use documented',
    description:
      'Credible historical or ethnobotanical sources document the use, but efficacy is not clinically established.',
    badgeClass: 'ev-traditional',
  },
  insufficient_evidence: {
    category: 'insufficient_evidence',
    label: 'Insufficient evidence',
    description:
      'Available research does not support a confident conclusion about this claim.',
    badgeClass: 'ev-insufficient',
  },
  safety_concern: {
    category: 'safety_concern',
    label: 'Safety concern',
    description:
      'A meaningful risk, contraindication, or potential interaction has been identified for this use.',
    badgeClass: 'ev-safety',
  },
};

/** Rank used to compute a plant's highest assessed category. Higher = stronger. */
export const EVIDENCE_RANK: Record<EvidenceCategory, number> = {
  strong_human: 5,
  moderate_human: 4,
  preliminary: 3,
  traditional_use_documented: 2,
  insufficient_evidence: 1,
  safety_concern: 0,
};

export function highestEvidence(
  categories: EvidenceCategory[],
): EvidenceCategory | null {
  let best: EvidenceCategory | null = null;
  for (const c of categories) {
    if (best === null || EVIDENCE_RANK[c] > EVIDENCE_RANK[best]) best = c;
  }
  return best;
}

/* ------------------------------------------------------------------ */
/* Plant records                                                      */
/* ------------------------------------------------------------------ */

export type NameType = 'synonym' | 'regional';
export type DistributionStatus =
  | 'native'
  | 'introduced'
  | 'cultivated'
  | 'naturalized'
  | 'unknown';
export type ReviewerStatus = 'draft' | 'verified';

export interface PlantImage {
  url: string;
  caption: string;
  attribution: string;
  license: string;
  license_url: string;
  source_url: string;
}

export interface PlantName {
  name: string;
  name_type: NameType;
  /** Island/country attribution for regional names; null for synonyms. */
  region: string | null;
  notes: string;
}

export interface Distribution {
  country: string;
  status: DistributionStatus | null;
  note: string;
}

export interface TraditionalUse {
  use: string;
  countries: string[];
  preparation: string;
  source_ids: string[];
}

export interface EvidenceAssessment {
  category: EvidenceCategory;
  summary: string;
  study_design: string;
  population: string;
  preparation_studied: string;
  main_findings: string;
  limitations: string;
  adverse_effects: string;
  source_ids: string[];
  reviewer_status: ReviewerStatus;
  last_reviewed: string; // ISO date
}

export interface Claim {
  claim: string;
  assessments: EvidenceAssessment[];
}

export interface PlantSafety {
  summary: string;
  side_effects: string;
  interactions: string;
  pregnancy: string;
  children: string;
  contraindications: string;
}

export interface Constituent {
  name: string;
  note: string;
}

export interface SourceRef {
  id: string;
  title: string;
  authors: string;
  year: number | null;
  journal: string;
  doi: string;
  url: string;
  source_type: string;
  accessed: string; // ISO date
  notes: string;
}

/** Compact card/list representation. */
export interface PlantSummary {
  id: string;
  slug: string;
  common_name: string;
  scientific_name: string;
  family: string;
  countries: string[];
  traditional_use_summary: string;
  claims_assessed: number;
  /** Strongest assessed category across all claims; null when nothing assessed. */
  highest_evidence: EvidenceCategory | null;
  /** True when at least one assessment has category 'safety_concern'. */
  safety_flag: boolean;
  featured: boolean;
  last_reviewed: string; // ISO date
  image: PlantImage | null;
}

/** Full detail record for /plants/:slug. */
export interface PlantDetail extends Omit<PlantSummary, 'image'> {
  scientific_name_authorship: string;
  botanical_description: string;
  identification: string;
  parts_used: string[];
  constituents: Constituent[];
  cultural_background: string;
  names: PlantName[];
  distribution: Distribution[];
  traditional_uses: TraditionalUse[];
  claims: Claim[];
  safety: PlantSafety;
  images: PlantImage[];
  sources: SourceRef[];
  reviewer_status: ReviewerStatus;
  disambiguation_note: string;
}

/* ------------------------------------------------------------------ */
/* API shapes (worker <-> web contract)                                */
/* ------------------------------------------------------------------ */

export type PlantSort = 'name_asc' | 'name_desc' | 'recently_reviewed';

export interface PlantSearchParams {
  q?: string;
  country?: string;
  family?: string;
  use?: string;
  evidence?: EvidenceCategory;
  safety?: boolean;
  featured?: boolean;
  sort?: PlantSort;
  page?: number;
  per_page?: number;
}

export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface PlantListResponse {
  data: PlantSummary[];
  pagination: Pagination;
}

export interface PlantDetailResponse {
  data: PlantDetail;
}

export interface FilterOption {
  name: string;
  count: number;
}

export interface EvidenceFilterOption {
  category: EvidenceCategory;
  count: number;
}

export interface FiltersResponse {
  countries: FilterOption[];
  families: FilterOption[];
  uses: FilterOption[];
  evidence_levels: EvidenceFilterOption[];
}

export interface HealthResponse {
  ok: boolean;
  service: 'chai-api';
  version: string;
  phase: number;
  db: 'connected' | 'unavailable';
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

/* ------------------------------------------------------------------ */
/* AI provider seam (Phase 3 target: Cloudflare Workers AI, free tier). */
/* Phase 1 ships TYPES + CONFIG + STUB ONLY. No model calls, no routes */
/* mounted, no secrets.                                               */
/* ------------------------------------------------------------------ */

export type AIProviderId = 'workers-ai';
export type AIResearchMode = 'quick' | 'web' | 'deep' | 'document';
export type AIStatus = 'unconfigured' | 'ready' | 'error';

export interface AIProviderConfig {
  /** Swappable provider id. Phase 3 default: 'workers-ai'. */
  provider: AIProviderId;
  /**
   * Workers AI model id. Configurable via AI_MODEL env var.
   * Default is a standard free-tier model. Do NOT default to models that
   * require a paid billing method: kimi-k2.6, kimi-k2.7-code, glm-5.x,
   * deepseek-v4-flash-0731, deepseek-v4-pro-0813 (and siblings in those lines).
   */
  model: string;
  /**
   * Workers AI binding name on env. Declare in wrangler.toml as:
   *   [ai]
   *   binding = "AI"
   * then call env.AI.run(model, input). The binding is already enabled on
   * the user's Cloudflare account — no enable step needed in Phase 3.
   */
  binding: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
  /** Max chat turns retained per conversation (Phase 3). */
  maxHistoryTurns: number;
  /**
   * Daily Neuron budget for usage-limit plumbing. Workers AI free tier =
   * 10,000 Neurons/day, resets 00:00 UTC, HARD limit on free plans
   * (no surprise charges possible). Phase 3 must refuse new AI work with
   * an honest "daily free-tier budget reached" message when exhausted,
   * never silently degrade or attempt paid overage.
   */
  dailyNeuronBudget: number;
}

export const DEFAULT_AI_CONFIG: AIProviderConfig = {
  provider: 'workers-ai',
  model: '@cf/meta/llama-3.1-8b-instruct',
  binding: 'AI',
  maxTokens: 1024,
  temperature: 0.3,
  timeoutMs: 60000,
  maxHistoryTurns: 20,
  dailyNeuronBudget: 10000,
};

export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Verified plant record excerpt handed to a plant assistant as context. */
export interface AIPlantContext {
  plant_id: string;
  common_name: string;
  scientific_name: string;
  family: string;
  traditional_use_summary: string;
  safety_summary: string;
  top_claims: { claim: string; category: EvidenceCategory; summary: string }[];
}

export interface AICitation {
  label: string;
  title: string;
  url: string;
}

export interface AIChatRequest {
  messages: AIChatMessage[];
  mode: AIResearchMode;
  plant?: AIPlantContext;
  stream?: boolean;
}

export interface AIChatResponse {
  reply: string;
  citations: AICitation[];
  model: string;
  provider: AIProviderId;
}

/** Daily usage snapshot for free-tier budget plumbing (Phase 3). */
export interface AIUsageSnapshot {
  /** ISO date (UTC) this snapshot covers, e.g. '2026-10-14'. */
  date: string;
  neuronsUsed: number;
  budget: number;
  /** ISO timestamp of next 00:00 UTC reset. */
  resetsAt: string;
}

export interface AIProvider {
  readonly id: AIProviderId;
  status(): AIStatus;
  /**
   * Phase 1 stub: throws AIUnavailableError { code: 'ai_not_connected' }
   * with an honest "coming in Phase 3" message. Phase 3 implements this
   * against env.AI.run() with budget checks BEFORE calling the model.
   */
  chat(req: AIChatRequest): Promise<AIChatResponse>;
  /** Phase 1 stub: returns a zeroed snapshot. Phase 3 reads real usage. */
  usage(): Promise<AIUsageSnapshot>;
}

/** Reserved REST shapes for Phase 3 (NOT mounted in Phase 1). */
export interface AIChatApiRequest {
  messages: AIChatMessage[];
  mode: AIResearchMode;
  plant_slug?: string;
  stream?: boolean;
}

export interface AIChatApiResponse {
  data: AIChatResponse;
  conversation_id: string;
}
