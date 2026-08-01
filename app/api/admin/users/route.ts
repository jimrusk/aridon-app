import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET /api/admin/users — list all users with profiles
export async function GET() {
  try {
    const db = adminClient();
    const { data, error } = await db.auth.admin.listUsers();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const users = data.users.map(u => ({
      id:         u.id,
      email:      u.email,
      role:       u.user_metadata?.role || 'member',
      name:       u.user_metadata?.name || u.email?.split('@')[0] || 'User',
      active:     u.user_metadata?.active !== false,
      last_sign_in: u.last_sign_in_at,
      created_at: u.created_at,
      confirmed:  !!u.confirmed_at,
    }));

    return NextResponse.json(users);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH /api/admin/users — update role or active status
export async function PATCH(req: NextRequest) {
  try {
    const { id, role, active, name } = await req.json();
    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    const db = adminClient();
    const update: any = { user_metadata: {} };
    if (role   !== undefined) update.user_metadata.role   = role;
    if (active !== undefined) update.user_metadata.active = active;
    if (name   !== undefined) update.user_metadata.name   = name;

    const { error } = await db.auth.admin.updateUserById(id, update);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/admin/users?id=xxx — permanently remove a user
export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    const db = adminClient();
    const { error } = await db.auth.admin.deleteUser(id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
