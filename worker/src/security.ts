/**
 * CHAI — security headers.
 *
 * Every API response (success, 4xx, 5xx) passes through here.
 * Phase 1 CORS policy: same-origin only — no Access-Control-Allow-Origin header.
 */

export function applySecurityHeaders(res: Response): Response {
  const headers = new Headers(res.headers);
  headers.set(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  );
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Frame-Options', 'DENY');
  headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
  );
  // Same-origin only: explicitly ensure no wildcard CORS header is present.
  headers.delete('Access-Control-Allow-Origin');
  headers.delete('Access-Control-Allow-Methods');
  headers.delete('Access-Control-Allow-Headers');
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

export function json(
  data: unknown,
  status = 200,
  extraHeaders?: Record<string, string>,
): Response {
  const res = new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders,
    },
  });
  return applySecurityHeaders(res);
}

export function apiError(
  code: string,
  message: string,
  status: number,
  extraHeaders?: Record<string, string>,
): Response {
  // Safe envelope: no stack traces, no SQL, no internal paths.
  return json({ error: { code, message } }, status, extraHeaders);
}
