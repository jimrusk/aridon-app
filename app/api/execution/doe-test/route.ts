import { NextResponse } from 'next/server';
import { DOE_TEST_PROJECTS, scoreDoeTestProjects } from '../../../../lib/doeTestProjects';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

export async function GET() {
  const scorecard = scoreDoeTestProjects();
  return NextResponse.json(
    {
      status: scorecard.passed ? 'passed' : 'failed',
      scorecard,
      projects: DOE_TEST_PROJECTS,
    },
    { headers: NO_STORE_HEADERS },
  );
}
