/**
 * CHAI Phase 1 AI provider seam tests — types + config + stub only.
 * No model calls are made; no network, no secrets.
 */
import { describe, expect, it } from 'vitest';
import {
  AIUnavailableError,
  DEFAULT_AI_CONFIG,
  NoOpAIProvider,
  resolveAIConfig,
} from '../src/ai/provider';

describe('resolveAIConfig', () => {
  it('falls back to DEFAULT_AI_CONFIG with no env vars', () => {
    expect(resolveAIConfig({})).toEqual(DEFAULT_AI_CONFIG);
  });

  it('honours AI_MODEL / AI_MAX_TOKENS / AI_TEMPERATURE overrides', () => {
    const cfg = resolveAIConfig({
      AI_MODEL: '@cf/meta/llama-3.1-8b-instruct',
      AI_MAX_TOKENS: '2048',
      AI_TEMPERATURE: '0.7',
    });
    expect(cfg.model).toBe('@cf/meta/llama-3.1-8b-instruct');
    expect(cfg.maxTokens).toBe(2048);
    expect(cfg.temperature).toBe(0.7);
    expect(cfg.provider).toBe('workers-ai');
    expect(cfg.binding).toBe('AI');
    expect(cfg.dailyNeuronBudget).toBe(10000);
  });

  it('ignores invalid numeric overrides', () => {
    const cfg = resolveAIConfig({ AI_MAX_TOKENS: 'nope', AI_TEMPERATURE: '99' });
    expect(cfg.maxTokens).toBe(DEFAULT_AI_CONFIG.maxTokens);
    expect(cfg.temperature).toBe(DEFAULT_AI_CONFIG.temperature);
  });

  it('never defaults to a paid-billing model', () => {
    const banned = ['kimi-k2.6', 'kimi-k2.7-code', 'glm-5', 'deepseek-v4-flash-0731', 'deepseek-v4-pro-0813'];
    for (const m of banned) {
      expect(DEFAULT_AI_CONFIG.model).not.toContain(m);
    }
    expect(DEFAULT_AI_CONFIG.model).toBe('@cf/meta/llama-3.1-8b-instruct');
  });
});

describe('NoOpAIProvider', () => {
  it("status() is 'unconfigured'", () => {
    expect(new NoOpAIProvider().status()).toBe('unconfigured');
  });

  it('chat() throws AIUnavailableError with code ai_not_connected', async () => {
    const p = new NoOpAIProvider();
    await expect(p.chat({ messages: [], mode: 'quick' })).rejects.toMatchObject({
      name: 'AIUnavailableError',
      code: 'ai_not_connected',
    });
    try {
      await p.chat({ messages: [], mode: 'quick' });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(AIUnavailableError);
      expect((err as Error).message).toContain('Phase 3');
    }
  });

  it('usage() returns a zeroed snapshot against the daily budget', async () => {
    const snap = await new NoOpAIProvider().usage();
    expect(snap.neuronsUsed).toBe(0);
    expect(snap.budget).toBe(10000);
    expect(snap.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(snap.resetsAt).getTime()).toBeGreaterThan(Date.now());
  });
});
