import { NextRequest, NextResponse } from 'next/server';
import { activateBetaTenant } from '../../../../../../lib/customerProvisioning';
import { getServerClient } from '../../../../../../lib/supabase';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function existingWorkspaceForEmail(email: string) {
  const db = getServerClient();
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      if (data.users.length < 1000) return null;
      continue;
    }

    const { data: membership, error: membershipError } = await db
      .from('customer_memberships')
      .select('tenant_id,customer_tenants(slug,business_name)')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership) return null;

    const tenant = Array.isArray(membership.customer_tenants)
      ? membership.customer_tenants[0]
      : membership.customer_tenants;
    if (!tenant) return null;
    return { slug: tenant.slug, businessName: tenant.business_name };
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const body = await request.json();
    const companyTrap = text(body?.companyTrap, 200);
    if (companyTrap) {
      return NextResponse.json({ error: 'We could not create this workspace.' }, { status: 400, headers: NO_STORE });
    }

    const businessName = text(body?.businessName, 180);
    const ownerName = text(body?.ownerName, 120);
    const email = text(body?.email, 254).toLowerCase();
    const industry = text(body?.industry, 160);
    const website = text(body?.website, 500);
    const offer = text(body?.offer, 2500);
    const goal = text(body?.goal, 2500);
    const password = text(body?.password, 500);

    if (!businessName || !ownerName || !industry || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Business name, your name, industry and a valid email are required.' }, { status: 400, headers: NO_STORE });
    }
    if (password.length < 12) {
      return NextResponse.json({ error: 'Please use a password with at least 12 characters.' }, { status: 400, headers: NO_STORE });
    }
    if (website && !/^https?:\/\//i.test(website)) {
      return NextResponse.json({ error: 'Website should begin with http:// or https://.' }, { status: 400, headers: NO_STORE });
    }

    const existing = await existingWorkspaceForEmail(email);
    if (existing) {
      return NextResponse.json(
        {
          error: 'This email already has a Business OS workspace. Sign in instead of creating another beta workspace.',
          existing: true,
          workspaceUrl: `${request.nextUrl.origin}/workspace/${existing.slug}`,
          loginUrl: `${request.nextUrl.origin}/customer/login`,
        },
        { status: 409, headers: NO_STORE },
      );
    }

    const activated = await activateBetaTenant({
      businessName,
      ownerName,
      email,
      industry,
      password,
      feedbackContact: email,
    });

    const db = getServerClient();
    const knowledgeRows = [
      website ? { tenant_id: activated.tenant.id, title: 'Company website', category: 'company profile', content: website } : null,
      offer ? { tenant_id: activated.tenant.id, title: 'What we sell', category: 'company profile', content: offer } : null,
      goal ? { tenant_id: activated.tenant.id, title: 'What we want help with first', category: 'goals', content: goal } : null,
    ].filter(Boolean);

    if (knowledgeRows.length > 0) {
      const { error: knowledgeError } = await db.from('customer_knowledge').insert(knowledgeRows);
      if (knowledgeError) console.error('Self-serve beta knowledge seed error', knowledgeError);
    }

    const { error: projectError } = await db.from('customer_projects').insert({
      tenant_id: activated.tenant.id,
      name: 'Get value from my Business OS',
      description: goal || 'Use Eva, Scout and the workspace on real business work during the beta.',
      status: 'active',
    });
    if (projectError) console.error('Self-serve beta project seed error', projectError);

    const { error: taskError } = await db.from('customer_tasks').insert([
      { tenant_id: activated.tenant.id, title: 'Ask Eva about my most important business priority', owner: ownerName, priority: 'high', status: 'open' },
      { tenant_id: activated.tenant.id, title: 'Teach Scout what we sell and find possible customers', owner: ownerName, priority: 'medium', status: 'open' },
      { tenant_id: activated.tenant.id, title: 'Send beta feedback after trying the system on real work', owner: ownerName, priority: 'medium', status: 'open' },
    ]);
    if (taskError) console.error('Self-serve beta task seed error', taskError);

    const { error: eventError } = await db.from('customer_usage_events').insert({
      tenant_id: activated.tenant.id,
      user_id: activated.user.id,
      event_name: 'beta_self_signup',
      event_data: { websiteProvided: Boolean(website), offerProvided: Boolean(offer), goalProvided: Boolean(goal) },
    });
    if (eventError) console.error('Self-serve beta usage event error', eventError);

    return NextResponse.json(
      {
        created: true,
        email: activated.email,
        businessName: activated.tenant.business_name,
        slug: activated.tenant.slug,
        startUrl: `${request.nextUrl.origin}/customer/start`,
        workspaceUrl: `${request.nextUrl.origin}/workspace/${activated.tenant.slug}`,
        loginUrl: `${request.nextUrl.origin}/customer/login?next=${encodeURIComponent('/customer/start')}`,
      },
      { status: 201, headers: NO_STORE },
    );
  } catch (error) {
    console.error('Self-serve beta signup error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'We could not create the beta workspace.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
