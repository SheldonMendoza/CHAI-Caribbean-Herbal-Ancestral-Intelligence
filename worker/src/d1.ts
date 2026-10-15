/**
 * CHAI — minimal structural D1 types.
 *
 * The worker only depends on this tiny interface, so tests can substitute an
 * in-memory SQLite shim without any Cloudflare runtime or wrangler.
 */
export interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  first<T = Record<string, unknown>>(column?: string): Promise<T | null>;
  run(): Promise<D1Result>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}
