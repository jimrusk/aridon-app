import { NextResponse } from 'next/server';
import { runSentinelBenchmark, SENTINEL_BENCHMARK_CASES, SENTINEL_BENCHMARK_VERSION } from '@/lib/sentinelBenchmark';

export const dynamic = 'force-dynamic';

const NO_STORE = {
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET() {
  return NextResponse.json(runSentinelBenchmark(), { headers: NO_STORE });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  if (body?.mode === 'manifest') {
    return NextResponse.json(
      {
        benchmark: 'Aridon Sentinel Transparent Defensive Benchmark',
        version: SENTINEL_BENCHMARK_VERSION,
        cases: SENTINEL_BENCHMARK_CASES.map((test) => ({
          id: test.id,
          title: test.title,
          category: test.category,
          lane: test.lane,
          input: test.input,
          expectation: test.expectation,
          rationale: test.rationale,
        })),
      },
      { headers: NO_STORE },
    );
  }

  return NextResponse.json(runSentinelBenchmark(), { headers: NO_STORE });
}
