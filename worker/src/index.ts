/**
 * CHAI — Phase 1 read-only API worker.
 *
 * Routes (all GET; Phase 1 has no write or auth endpoints):
 *   GET /api/health        liveness + D1 check
 *   GET /api/plants        search / filter / paginate (contracts/api.md)
 *   GET /api/plants/:slug  full plant detail
 *   GET /api/filters       filter metadata with counts
 *
 * Everything else -> 404. Cross-cutting: security headers on every response,
 * 60 req/min per-IP rate limit on /api/*, safe error envelope, no stack traces.
 */

import type { D1Database } from './d1';
import { getFilters, getPlantDetail, searchPlants } from './db';
import { apiError, json } from './security';
import {
  checkRateLimit,
  getClientIp,
  reset as resetRateLimiter,
} from './rate-limit';
import {
  ParamError,
  parsePlantSearchParams,
} from './validation';
import type { Pagination } from '../../shared/types';

export interface Env {
  DB: D1Database;
  /** Workers AI binding — declared in wrangler.toml, UNUSED in Phase 1. */
  AI?: unknown;
  AI_MODEL?: string;
  AI_MAX_TOKENS?: string;
  AI_TEMPERATURE?: string;
}

/** Test hook: reset the in-memory rate limiter between tests. */
export function resetRateLimit(): void {
  resetRateLimiter();
}

export const API_VERSION = '0.1.0';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function createHandler(env: Env) {
  return async function handler(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      if (request.method !== 'GET' || !path.startsWith('/api/')) {
        return apiError('not_found', 'Not found.', 404);
      }

      const decision = checkRateLimit(getClientIp(request));
      if (!decision.allowed) {
        return apiError(
          'rate_limited',
          'Rate limit exceeded. Please slow down and try again shortly.',
          429,
          { 'Retry-After': String(decision.retryAfterSec) },
        );
      }

      if (path === '/api/health') {
        return handleHealth(env);
      }
      if (path === '/api/plants') {
        return handlePlantList(env, url);
      }
      const slugMatch = /^\/api\/plants\/([^/]+)$/.exec(path);
      if (slugMatch) {
        return handlePlantDetail(env, decodeURIComponent(slugMatch[1]!));
      }
      if (path === '/api/filters') {
        return handleFilters(env);
      }
      return apiError('not_found', 'Not found.', 404);
    } catch (err) {
      // Never leak internals: log nothing sensitive, return a safe envelope.
      return apiError('internal_error', 'An unexpected error occurred.', 500);
    }
  };
}

async function handleHealth(env: Env): Promise<Response> {
  try {
    await env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>();
    return json({
      ok: true,
      service: 'chai-api',
      version: API_VERSION,
      phase: 1,
      db: 'connected',
    });
  } catch {
    return json({
      ok: false,
      service: 'chai-api',
      version: API_VERSION,
      phase: 1,
      db: 'unavailable',
    });
  }
}

async function handlePlantList(env: Env, url: URL): Promise<Response> {
  let params;
  try {
    params = parsePlantSearchParams(url.searchParams);
  } catch (err) {
    if (err instanceof ParamError) {
      return apiError(err.code, err.message, 400);
    }
    throw err;
  }

  const { data, total } = await searchPlants(env.DB, params);
  const total_pages = Math.max(1, Math.ceil(total / params.per_page));
  const pagination: Pagination = {
    page: params.page,
    per_page: params.per_page,
    total,
    total_pages,
  };
  return json({ data, pagination });
}

async function handlePlantDetail(env: Env, slug: string): Promise<Response> {
  if (!SLUG_RE.test(slug)) {
    return apiError('not_found', `No plant found for slug '${slug}'.`, 404);
  }
  const detail = await getPlantDetail(env.DB, slug);
  if (!detail) {
    return apiError('not_found', `No plant found for slug '${slug}'.`, 404);
  }
  return json({ data: detail });
}

async function handleFilters(env: Env): Promise<Response> {
  const filters = await getFilters(env.DB);
  return json(filters);
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return createHandler(env)(request);
  },
};
