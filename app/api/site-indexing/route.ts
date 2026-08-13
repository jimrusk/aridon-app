import { NextRequest, NextResponse } from 'next/server';
import { ingestPublicWebsite } from '../../../lib/websiteIngestion';
import { buildIndexEngine } from '../../../lib/indexEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function POST(request: NextRequest) {
  try {
    const body = request.headers.get('content-type')?.includes('application/json')
      ? await request.json().catch(() => ({}))
      : {};

    const website = typeof body?.website === 'string' ? body.website.trim().slice(0, 500) : '';
    if (!website) {
      return NextResponse.json({ error: 'Enter a public business website to index.' }, { status: 400, headers: NO_STORE });
    }

    const ingestion = await ingestPublicWebsite(website);
    const indexEngine = buildIndexEngine({
      pages: ingestion.pages,
      navigation: ingestion.navigation,
      knowledge: ingestion.knowledge,
    });

    return NextResponse.json({
      website: ingestion.canonicalUrl,
      contacts: ingestion.contacts,
      navigation: ingestion.navigation,
      indexEngine,
      pages: ingestion.pages.map((page) => ({
        url: page.url,
        title: page.title,
        description: page.description,
        headings: page.headings.slice(0, 8),
      })),
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Site indexing error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Aridon could not index that website.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
