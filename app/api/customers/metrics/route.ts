import { NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET() {
  try {
    const db = getServerClient();
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [tenants, feedback, assistant, referrals, betaInvites] = await Promise.all([
      db.from('customer_tenants').select('id,business_name,plan,status,subscription_status,created_at,activated_at').order('created_at', { ascending: false }),
      db.from('customer_feedback').select('id,tenant_id,rating,created_at').gte('created_at', since),
      db.from('customer_assistant_messages').select('id,tenant_id,role,created_at').gte('created_at', since),
      db.from('customer_referrals').select('id,referrer_tenant_id,status,created_at').gte('created_at', since),
      db.from('customer_beta_invites').select('id,used_at,expires_at,created_at').gte('created_at', since),
    ]);

    for (const result of [tenants, feedback, assistant, referrals, betaInvites]) {
      if (result.error) throw result.error;
    }

    const tenantRows = tenants.data || [];
    const feedbackRows = feedback.data || [];
    const assistantRows = assistant.data || [];
    const referralRows = referrals.data || [];
    const betaRows = betaInvites.data || [];
    const activeTenantIds = new Set(
      assistantRows.filter((row) => row.role === 'user').map((row) => row.tenant_id),
    );
    const ratings = feedbackRows.map((row) => Number(row.rating || 0)).filter((rating) => rating > 0);
    const averageRating = ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      windowDays: 30,
      totals: {
        tenants: tenantRows.length,
        paidTenants: tenantRows.filter((row) => ['active', 'trialing', 'past_due'].includes(row.subscription_status || '') && row.plan !== 'beta').length,
        betaTenants: tenantRows.filter((row) => row.subscription_status === 'beta').length,
        activatedTenants: tenantRows.filter((row) => Boolean(row.activated_at)).length,
        activeEvaTenants30d: activeTenantIds.size,
        evaQuestions30d: assistantRows.filter((row) => row.role === 'user').length,
        feedbackResponses30d: feedbackRows.length,
        averageFeedbackRating30d: Number(averageRating.toFixed(2)),
        referrals30d: referralRows.length,
        betaInvites30d: betaRows.length,
        betaInvitesClaimed30d: betaRows.filter((row) => Boolean(row.used_at)).length,
      },
      recentTenants: tenantRows.slice(0, 20),
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Customer metrics error', error);
    return NextResponse.json({ error: 'Unable to load customer product metrics.' }, { status: 500, headers: NO_STORE });
  }
}
