import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import { createEmbedding, semanticMemoryAvailable } from '../../../../lib/embeddings';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function membershipFor(request: NextRequest, slug: string) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { error: auth.error, status: auth.status } as const;
  const membership = await customerTenantForUser(auth.user.id, slug);
  if (!membership) return { error: 'You do not have access to this workspace.', status: 403 } as const;
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return { error: 'This workspace is not active.', status: 402 } as const;
  return { auth, membership } as const;
}

export async function GET(request: NextRequest) {
  try {
    const slug = text(request.nextUrl.searchParams.get('slug'), 80);
    const query = text(request.nextUrl.searchParams.get('q'), 800);
    if (!slug) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400, headers: NO_STORE });
    const resolved = await membershipFor(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });

    if (query && semanticMemoryAvailable()) {
      try {
        const embedding = await createEmbedding(query);
        if (embedding) {
          const { data, error } = await resolved.auth.db.rpc('match_customer_knowledge', {
            query_embedding: embedding,
            match_tenant: resolved.membership.tenant.id,
            match_count: 12,
          });
          if (!error && Array.isArray(data)) {
            await resolved.auth.db.from('customer_usage_events').insert({
              tenant_id: resolved.membership.tenant.id,
              user_id: resolved.auth.user.id,
              event_name: 'company_brain_semantic_search',
              event_data: { query_length: query.length, result_count: data.length },
            });
            return NextResponse.json({ items: data, semantic: true }, { headers: NO_STORE });
          }
        }
      } catch (error) {
        console.warn('Semantic Company Brain search fell back to text search', error);
      }
    }

    let requestBuilder = resolved.auth.db
      .from('customer_knowledge')
      .select('id,title,category,content,created_at')
      .eq('tenant_id', resolved.membership.tenant.id);

    if (query) requestBuilder = requestBuilder.or(`title.ilike.%${query.replace(/[%_,]/g, '')}%,content.ilike.%${query.replace(/[%_,]/g, '')}%`);

    const { data, error } = await requestBuilder.order('created_at', { ascending: false }).limit(query ? 30 : 100);
    if (error) throw error;
    return NextResponse.json({ items: data || [], semantic: false }, { headers: NO_STORE });
  } catch (error) {
    console.error('Customer brain GET error', error);
    return NextResponse.json({ error: 'Unable to load the Company Brain.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = text(body?.slug, 80);
    const title = text(body?.title, 180);
    const category = text(body?.category, 120) || 'company knowledge';
    const content = text(body?.content, 12000);
    if (!slug || !title || !content) return NextResponse.json({ error: 'Workspace, title, and content are required.' }, { status: 400, headers: NO_STORE });

    const resolved = await membershipFor(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });

    let embedding: number[] | null = null;
    try {
      embedding = await createEmbedding(`${title}\n${category}\n${content}`);
    } catch (error) {
      console.warn('Company Brain item saved without embedding', error);
    }

    const { data, error } = await resolved.auth.db
      .from('customer_knowledge')
      .insert({ tenant_id: resolved.membership.tenant.id, title, category, content, embedding })
      .select('id,title,category,content,created_at')
      .single();
    if (error) throw error;

    await resolved.auth.db.from('customer_usage_events').insert({
      tenant_id: resolved.membership.tenant.id,
      user_id: resolved.auth.user.id,
      event_name: 'company_brain_item_added',
      event_data: { title, category, semantic_memory: Boolean(embedding) },
    });
    return NextResponse.json({ item: data, semanticMemory: Boolean(embedding) }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error('Customer brain POST error', error);
    return NextResponse.json({ error: 'Unable to add this Company Brain item.' }, { status: 500, headers: NO_STORE });
  }
}
