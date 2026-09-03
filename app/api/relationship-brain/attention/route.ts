import { NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';
import { scoreAttention, type AttentionLead } from '../../../../lib/relationshipBrain';
import { STARTER_LEADS } from '../../../../lib/starterLeads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

function leadKey(lead: { name?: string | null; company?: string | null; email?: string | null }) {
  const email = String(lead.email || '').trim().toLowerCase();
  if (email) return `email:${email}`;
  return `name:${String(lead.name || '').trim().toLowerCase()}|company:${String(lead.company || '').trim().toLowerCase()}`;
}

function starterRelationship(lead: (typeof STARTER_LEADS)[number]): AttentionLead & { created_at: string; updated_at: string } {
  return {
    ...lead,
    phone: null,
    title: null,
    priority: lead.status === 'qualified' ? 'high' : 'medium',
    next_action: null,
    last_contact_at: lead.created_at,
    next_follow_up_at: null,
    relationship_score: lead.status === 'qualified' ? 35 : lead.status === 'active' ? 28 : 12,
    social_handle: null,
    social_url: null,
    updated_at: lead.created_at,
  };
}

export async function GET() {
  try {
    const db = getServerClient();
    const [{ data: dbLeads, error: leadError }, { data: events, error: eventError }] = await Promise.all([
      db.from('leads')
        .select('id,name,company,email,phone,title,status,priority,notes,next_action,last_contact_at,next_follow_up_at,relationship_score,social_handle,social_url,created_at,updated_at')
        .neq('status', 'closed')
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(1000),
      db.from('relationship_events')
        .select('id,lead_id,event_type,direction,source,subject,summary,happened_at')
        .order('happened_at', { ascending: false })
        .limit(1000),
    ]);
    if (leadError) throw leadError;
    if (eventError) throw eventError;

    const liveLeads = (dbLeads || []) as Array<AttentionLead & { created_at?: string | null; updated_at?: string | null }>;
    const liveKeys = new Set(liveLeads.map(leadKey));
    const restoredLeads = STARTER_LEADS
      .filter((lead) => lead.status !== 'closed' && !liveKeys.has(leadKey(lead)))
      .map(starterRelationship);
    const leads = [...liveLeads, ...restoredLeads];

    const latestByLead = new Map<string, any>();
    const eventCountByLead = new Map<string, number>();
    for (const event of events || []) {
      eventCountByLead.set(event.lead_id, (eventCountByLead.get(event.lead_id) || 0) + 1);
      if (!latestByLead.has(event.lead_id)) latestByLead.set(event.lead_id, event);
    }

    const ranked = leads
      .map((lead: any) => {
        const intelligence = scoreAttention(lead);
        const latestEvent = latestByLead.get(lead.id) || null;
        const relationshipScore = Math.min(100, Math.max(
          Number(lead.relationship_score || 0),
          Math.min(100, (eventCountByLead.get(lead.id) || 0) * 4 + (lead.status === 'qualified' ? 35 : lead.status === 'active' ? 28 : 12)),
        ));
        return {
          ...lead,
          attentionScore: intelligence.score,
          reasons: intelligence.reasons,
          recommendedNextAction: intelligence.nextAction,
          quietDays: intelligence.quietDays,
          relationshipScore,
          interactionCount: eventCountByLead.get(lead.id) || 0,
          latestEvent,
        };
      })
      .sort((a, b) => b.attentionScore - a.attentionScore || b.relationshipScore - a.relationshipScore);

    const due = ranked.filter((item) => item.attentionScore >= 35).slice(0, 50);
    const opportunities = ranked.filter((item) => ['qualified', 'active'].includes(String(item.status || '').toLowerCase())).slice(0, 30);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      dataMode: restoredLeads.length ? 'live+restored' : 'live',
      counts: {
        relationships: ranked.length,
        needsAttention: due.length,
        activeOpportunities: opportunities.length,
      },
      attention: due,
      opportunities,
      relationships: ranked.slice(0, 200),
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Relationship Brain attention error; serving restored pipeline', error);
    const ranked = STARTER_LEADS
      .filter((lead) => lead.status !== 'closed')
      .map(starterRelationship)
      .map((lead: any) => {
        const intelligence = scoreAttention(lead);
        return {
          ...lead,
          attentionScore: intelligence.score,
          reasons: intelligence.reasons,
          recommendedNextAction: intelligence.nextAction,
          quietDays: intelligence.quietDays,
          relationshipScore: Number(lead.relationship_score || 0),
          interactionCount: 0,
          latestEvent: null,
        };
      })
      .sort((a, b) => b.attentionScore - a.attentionScore || b.relationshipScore - a.relationshipScore);
    const due = ranked.filter((item) => item.attentionScore >= 35).slice(0, 50);
    const opportunities = ranked.filter((item) => ['qualified', 'active'].includes(String(item.status || '').toLowerCase())).slice(0, 30);
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      dataMode: 'restored',
      counts: { relationships: ranked.length, needsAttention: due.length, activeOpportunities: opportunities.length },
      attention: due,
      opportunities,
      relationships: ranked.slice(0, 200),
      warning: 'Live relationship storage was unavailable, so Aridon served the restored CRM pipeline.',
    }, { headers: NO_STORE });
  }
}
