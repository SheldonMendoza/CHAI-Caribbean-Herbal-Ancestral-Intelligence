/**
 * CHAI — Phase 1 AI provider SEAM.
 *
 * Phase 1 ships TYPES + CONFIG + STUB ONLY. No model calls, no routes mounted,
 * no secrets, no AI binding usage. The worker never touches env.AI in Phase 1.
 *
 * ============================================================================
 * PHASE 3 TARGET — WorkersAIProvider (NOT implemented here)
 * ----------------------------------------------------------------------------
 * Phase 3 implements a real provider behind this same AIProvider interface:
 *
 *   class WorkersAIProvider implements AIProvider {
 *     constructor(private env: Env, private config: AIProviderConfig) {}
 *     status(): AIStatus { return this.configured ? 'ready' : 'unconfigured'; }
 *     async chat(req: AIChatRequest): Promise<AIChatResponse> {
 *       // 1. Check the daily Neuron budget FIRST (usage() vs
 *       //    config.dailyNeuronBudget). If exhausted, throw/return an honest
 *       //    "daily free-tier budget reached, resets 00:00 UTC" error —
 *       //    never silently degrade, never attempt paid overage.
 *       // 2. Call the model through the binding:
 *       //      const out = await this.env.AI.run(this.config.model, input);
 *       //    where input follows the Workers AI REST shape for the chosen
 *       //    model ({ messages } for chat models).
 *       // 3. Record Neuron usage for the day and return AIChatResponse
 *       //    with citations + model + provider.
 *     }
 *   }
 *
 * Wiring required in wrangler.toml (already declared in Phase 1, unused):
 *   [ai]
 *   binding = "AI"
 * The binding is already enabled on the user's Cloudflare account — no enable
 * step or terms gate is needed in Phase 3.
 *
 * Model policy (verified 2026-10-14): default to a STANDARD free-tier model,
 * currently '@cf/meta/llama-3.1-8b-instruct' (see DEFAULT_AI_CONFIG in
 * shared/types.ts, overridable via the AI_MODEL env var). NEVER default to
 * models that require a paid billing method: kimi-k2.6, kimi-k2.7-code,
 * glm-5.x, deepseek-v4-flash-0731, deepseek-v4-pro-0813 (and siblings in
 * those model lines).
 *
 * Budget plumbing (mandatory): Workers AI free tier = 10,000 Neurons/day,
 * resets 00:00 UTC, HARD limit on free plans (no surprise charges possible).
 * Track daily usage per UTC date; refuse new AI work honestly when the budget
 * is exhausted. No AI routes exist in Phase 1, so nothing can spend budget yet.
 * ============================================================================
 */

import {
  DEFAULT_AI_CONFIG,
  type AIChatRequest,
  type AIChatResponse,
  type AIProvider,
  type AIProviderConfig,
  type AIProviderId,
  type AIStatus,
  type AIUsageSnapshot,
} from '../../../shared/types';

// Re-export the shared AI contracts so worker code imports from one place.
export type {
  AIChatRequest,
  AIChatResponse,
  AIProvider,
  AIProviderConfig,
  AIProviderId,
  AIStatus,
  AIUsageSnapshot,
};
export { DEFAULT_AI_CONFIG };

/** Worker env vars read by resolveAIConfig (all optional; defaults apply). */
export interface AIEnvVars {
  AI_MODEL?: string;
  AI_MAX_TOKENS?: string;
  AI_TEMPERATURE?: string;
}

/**
 * Thrown by NoOpAIProvider.chat(). Phase 3 throws a sibling error when the
 * daily Neuron budget is exhausted (with an honest "resets 00:00 UTC" message).
 */
export class AIUnavailableError extends Error {
  readonly code = 'ai_not_connected';
  constructor(
    message = 'AI is not connected yet — coming in Phase 3.',
  ) {
    super(message);
    this.name = 'AIUnavailableError';
  }
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseTemperature(
  raw: string | undefined,
  fallback: number,
): number {
  if (raw === undefined || raw === '') return fallback;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n >= 0 && n <= 2 ? n : fallback;
}

/** Build the effective AI config from env vars with DEFAULT_AI_CONFIG fallbacks. */
export function resolveAIConfig(env: AIEnvVars): AIProviderConfig {
  return {
    ...DEFAULT_AI_CONFIG,
    model: env.AI_MODEL?.trim() || DEFAULT_AI_CONFIG.model,
    maxTokens: parsePositiveInt(env.AI_MAX_TOKENS, DEFAULT_AI_CONFIG.maxTokens),
    temperature: parseTemperature(env.AI_TEMPERATURE, DEFAULT_AI_CONFIG.temperature),
  };
}

/** Number of ms from `now` until the next 00:00 UTC. */
function msUntilUtcMidnight(now: number): number {
  const d = new Date(now);
  const next = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() + 1,
    0, 0, 0, 0,
  );
  return next - now;
}

/**
 * Phase 1 stub provider. status() reports honestly; chat() refuses honestly;
 * usage() reports zero spend. Phase 3 swaps in WorkersAIProvider behind the
 * same interface — no route or call-site changes needed.
 */
export class NoOpAIProvider implements AIProvider {
  readonly id: AIProviderId = 'workers-ai';

  status(): AIStatus {
    return 'unconfigured';
  }

  async chat(_req: AIChatRequest): Promise<AIChatResponse> {
    throw new AIUnavailableError();
  }

  async usage(): Promise<AIUsageSnapshot> {
    const now = Date.now();
    return {
      date: new Date(now).toISOString().slice(0, 10),
      neuronsUsed: 0,
      budget: DEFAULT_AI_CONFIG.dailyNeuronBudget,
      resetsAt: new Date(now + msUntilUtcMidnight(now)).toISOString(),
    };
  }
}
