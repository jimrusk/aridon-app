import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST /api/admin/invite — send an invite email to a new user
export async function POST(req: NextRequest) {
  try {
    const { email, role = 'member', name = '' } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error } = await db.auth.admin.inviteUserByEmail(email, {
      data: { role, name, active: true },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://aridon-v02.vercel.app'}/login`,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, id: data.user?.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
