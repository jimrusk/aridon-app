import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from './supabase';

export type ApiErrorCode = 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'RATE_LIMITED' | 'TIMEOUT' | 'INTERNAL_ERROR' | 'SERVICE_UNAVAILABLE';

export class ApiProblem extends Error {
  constructor(
    public status: number,
    public code: ApiErrorCode,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
    this.name = 'ApiProblem';
  }
}

export function correlationId(request: NextRequest) {
  const supplied = request.headers.get('x-correlation-id')?.trim();
  return supplied && /^[a-zA-Z0-9._:-]{8,128}$/.test(supplied) ? supplied : randomUUID();
}

export function apiHeaders(id: string, extra?: HeadersInit) {
  const headers = new Headers(extra);
  headers.set('Cache-Control', 'no-store');
  headers.set('x-correlation-id', id);
  return headers;
}

export function apiErrorResponse(id: string, problem: unknown) {
  const safe = problem instanceof ApiProblem
    ? problem
    : new ApiProblem(500, 'INTERNAL_ERROR', 'The request could not be completed.');

  const headers = apiHeaders(id);
  if (safe.retryAfter && safe.retryAfter > 0) headers.set('Retry-After', String(safe.retryAfter));

  return NextResponse.json({
    ok: false,
    error: {
      code: safe.code,
      message: safe.message,
      correlationId: id,
    },
  }, { status: safe.status, headers });
}

export function apiSuccess<T>(id: string, data: T, status = 200, extraHeaders?: HeadersInit) {
  return NextResponse.json(data, { status, headers: apiHeaders(id, extraHeaders) });
}

function requestIdentity(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();
  const auth = request.headers.get('authorization')?.slice(0, 80) || '';
  return forwarded || realIp || auth || 'anonymous';
}

export async function enforceEnterpriseRateLimit(
  request: NextRequest,
  options: { limit?: number; windowSeconds?: number; scope?: string } = {},
) {
  const limit = options.limit ?? 30;
  const windowSeconds = options.windowSeconds ?? 60;
  const scope = options.scope ?? request.nextUrl.pathname;
  const key = `${scope}:${requestIdentity(request)}`;

  try {
    const db = getServerClient();
    const { data, error } = await db.rpc('consume_enterprise_rate_limit', {
      p_rate_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;

    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.allowed) {
      throw new ApiProblem(429, 'RATE_LIMITED', 'Too many requests. Please retry shortly.', Number(result?.retry_after || windowSeconds));
    }

    return {
      remaining: Number(result?.remaining ?? 0),
      limit,
      windowSeconds,
    };
  } catch (error) {
    if (error instanceof ApiProblem) throw error;
    console.error('enterprise rate limiter unavailable');
    throw new ApiProblem(503, 'SERVICE_UNAVAILABLE', 'Request protection is temporarily unavailable. Please retry shortly.', 5);
  }
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs = 15_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new ApiProblem(504, 'TIMEOUT', 'The request timed out before completion.', 3)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function badRequest(message: string): never {
  throw new ApiProblem(400, 'BAD_REQUEST', message);
}

export async function enterpriseApi<T>(
  request: NextRequest,
  handler: (context: { correlationId: string }) => Promise<T>,
  options: { limit?: number; windowSeconds?: number; timeoutMs?: number; scope?: string } = {},
) {
  const id = correlationId(request);
  try {
    const rate = await enforceEnterpriseRateLimit(request, options);
    const result = await withTimeout(handler({ correlationId: id }), options.timeoutMs ?? 15_000);
    return apiSuccess(id, result, 200, {
      'x-ratelimit-limit': String(rate.limit),
      'x-ratelimit-remaining': String(rate.remaining),
    });
  } catch (error) {
    if (!(error instanceof ApiProblem)) console.error('enterprise api request failed', { correlationId: id });
    return apiErrorResponse(id, error);
  }
}
