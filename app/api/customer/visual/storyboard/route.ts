import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../../lib/customerAuth';

export const runtime = 'nodejs';
export const maxDuration = 120;

const NO_STORE = { 'Cache-Control': 'no-store' };
const RESPONSES_URL = 'https://api.openai.com/v1/responses';
const BRAND_TITLE = 'Aridon Brand Brain';
const VIDEO_SECONDS = new Set(['4', '8', '12']);

type ResponsesPayload = {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  error?: { message?: string };
};

type Scene = {
  scene_number: number;
  scene_title: string;
  narration: string;
  on_screen_text: string;
  visual_direction: string;
  duration_seconds: number;
};

type Storyboard = {
  concept: string;
  final_video_prompt: string;
  scenes: Scene[];
};

const STORYBOARD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['concept', 'final_video_prompt', 'scenes'],
  properties: {
    concept: { type: 'string' },
    final_video_prompt: { type: 'string' },
    scenes: {
      type: 'array',
      minItems: 2,
      maxItems: 8,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['scene_number', 'scene_title', 'narration', 'on_screen_text', 'visual_direction', 'duration_seconds'],
        properties: {
          scene_number: { type: 'integer' },
          scene_title: { type: 'string' },
          narration: { type: 'string' },
          on_screen_text: { type: 'string' },
          visual_direction: { type: 'string' },
          duration_seconds: { type: 'integer' },
        },
      },
    },
  },
};

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function safeJson(value: string | null | undefined) {
  if (!value) return {};
  try { return JSON.parse(value); } catch { return { notes: value }; }
}

function extractOutputText(data: ResponsesPayload) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  return (data.output || []).flatMap((item) => item.content || [])
    .filter((item) => item.type === 'output_text' && typeof item.text === 'string')
    .map((item) => item.text as string).join('\n\n').trim();
}

function cleanScenes(value: unknown, targetSeconds: number): Scene[] {
  if (!Array.isArray(value)) return [];
  const cleaned = value.slice(0, 8).map((item, index) => {
    const row = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    return {
      scene_number: index + 1,
      scene_title: text(row.scene_title, 200) || `Scene ${index + 1}`,
      narration: text(row.narration, 1200),
      on_screen_text: text(row.on_screen_text, 500),
      visual_direction: text(row.visual_direction, 2500),
      duration_seconds: Math.max(1, Math.min(6, Number(row.duration_seconds) || 1)),
    };
  }).filter((scene) => scene.visual_direction);
  if (!cleaned.length) return [];
  let remaining = targetSeconds;
  for (let i = 0; i < cleaned.length; i += 1) {
    const slots = cleaned.length - i;
    const duration = i === cleaned.length - 1 ? remaining : Math.max(1, Math.min(cleaned[i].duration_seconds, remaining - (slots - 1)));
    cleaned[i].duration_seconds = Math.max(1, duration);
    remaining -= cleaned[i].duration_seconds;
  }
  if (remaining !== 0 && cleaned.length) cleaned[cleaned.length - 1].duration_seconds = Math.max(1, cleaned[cleaned.length - 1].duration_seconds + remaining);
  return cleaned;
}

async function resolveMembership(request: NextRequest, slug: string) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { error: auth.error, status: auth.status } as const;
  const membership = await customerTenantForUser(auth.user.id, slug);
  if (!membership) return { error: 'You do not have access to this workspace.', status: 403 } as const;
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return { error: 'This workspace is not active.', status: 402 } as const;
  return { auth, membership } as const;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = text(body?.slug, 80);
    const projectId = text(body?.projectId, 80);
    const requestedSeconds = text(body?.seconds, 10);
    const seconds = VIDEO_SECONDS.has(requestedSeconds) ? requestedSeconds : '8';
    const direction = text(body?.direction, 5000);
    if (!slug || !projectId) return NextResponse.json({ error: 'Workspace and video project are required.' }, { status: 400, headers: NO_STORE });

    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });
    const db = resolved.auth.db;
    const tenant = resolved.membership.tenant;

    const { data: project, error: projectError } = await db.from('customer_visual_projects')
      .select('id,creator_project_id,title,asset_type,platform,style_notes,must_include_text')
      .eq('id', projectId).eq('tenant_id', tenant.id).maybeSingle();
    if (projectError) throw projectError;
    if (!project) return NextResponse.json({ error: 'Visual project not found.' }, { status: 404, headers: NO_STORE });
    if (project.asset_type !== 'video') return NextResponse.json({ error: 'This project is not configured for video.' }, { status: 409, headers: NO_STORE });

    const [campaignResult, brandResult] = await Promise.all([
      db.from('customer_creator_projects').select('id,title,campaign_type,goal,audience,offer,channels,status,output').eq('id', project.creator_project_id).eq('tenant_id', tenant.id).maybeSingle(),
      db.from('customer_knowledge').select('content').eq('tenant_id', tenant.id).eq('title', BRAND_TITLE).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (campaignResult.error) throw campaignResult.error;
    if (brandResult.error) throw brandResult.error;
    const campaign = campaignResult.data;
    if (!campaign || campaign.status !== 'approved') return NextResponse.json({ error: 'The source campaign must be approved before a storyboard can be built.' }, { status: 409, headers: NO_STORE });

    const brand = safeJson(brandResult.data?.content);
    const context = JSON.stringify({
      company: { name: tenant.business_name, industry: tenant.industry, tagline: tenant.tagline },
      brand_brain: brand,
      approved_campaign: campaign,
      visual_project: {
        title: project.title,
        platform: project.platform,
        style_notes: project.style_notes,
        must_include_text: project.must_include_text,
        additional_direction: direction,
      },
    }, null, 2).slice(0, 36000);

    const instructions = `You are Oracle directing a short commercial video inside Aridon's Visual Studio. Scout checks positioning, Ledger checks the call-to-action, and Ethos checks unsupported claims. Build an executable storyboard for a ${seconds}-second Sora clip.\n\nRULES:\n- Use only supported company and campaign facts from the private context.\n- Never invent certifications, testimonials, performance claims, partner logos, customer names, pricing, awards or guarantees.\n- Keep on-screen text extremely short and legible. Do not put long paragraphs on screen.\n- Every scene must describe camera, subject, environment, motion, lighting and visual continuity clearly enough to guide video generation.\n- The sum of scene durations must equal ${seconds} seconds.\n- Keep the scene count practical for the short runtime.\n- final_video_prompt must be one cohesive production prompt that preserves the approved storyboard, brand direction, pacing and CTA without claiming the video was already rendered.\n- This storyboard remains a DRAFT until the owner explicitly approves it.\n\nPRIVATE CONTEXT:\n${context}`;

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: 'Visual Studio storyboard generation is not configured.' }, { status: 503, headers: NO_STORE });
    const payload = {
      model: process.env.CREATOR_STUDIO_MODEL?.trim() || process.env.CUSTOMER_ASSISTANT_MODEL?.trim() || 'gpt-5.6',
      instructions,
      input: `Create the storyboard now. Target runtime: ${seconds} seconds. Additional direction: ${direction || 'None.'}`,
      max_output_tokens: 5000,
      store: false,
      text: { format: { type: 'json_schema', name: 'aridon_visual_storyboard', strict: true, schema: STORYBOARD_SCHEMA } },
    };
    const response = await fetch(RESPONSES_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const data = await response.json() as ResponsesPayload;
    if (!response.ok) throw new Error(data.error?.message || `Storyboard generation returned ${response.status}.`);
    const outputText = extractOutputText(data);
    if (!outputText) throw new Error('Storyboard generation returned no readable plan.');
    let parsed: Storyboard;
    try { parsed = JSON.parse(outputText) as Storyboard; } catch { throw new Error('Storyboard generation returned an unreadable format.'); }
    const scenes = cleanScenes(parsed.scenes, Number(seconds));
    if (!scenes.length) throw new Error('Storyboard generation returned no usable scenes.');

    await db.from('customer_video_scenes').delete().eq('visual_project_id', projectId).eq('tenant_id', tenant.id);
    const { data: insertedScenes, error: sceneError } = await db.from('customer_video_scenes').insert(scenes.map((scene) => ({
      tenant_id: tenant.id,
      visual_project_id: projectId,
      scene_number: scene.scene_number,
      scene_title: scene.scene_title,
      narration: scene.narration,
      on_screen_text: scene.on_screen_text,
      visual_direction: scene.visual_direction,
      duration_seconds: scene.duration_seconds,
      approved: false,
    }))).select('*').order('scene_number', { ascending: true });
    if (sceneError) throw sceneError;

    const { error: updateError } = await db.from('customer_visual_projects').update({
      storyboard_status: 'draft',
      video_seconds: seconds,
      video_status: null,
      video_progress: 0,
      video_error: null,
      style_notes: project.style_notes || text(parsed.concept, 5000),
      updated_at: new Date().toISOString(),
    }).eq('id', projectId).eq('tenant_id', tenant.id);
    if (updateError) throw updateError;

    await db.from('customer_visual_variants').insert({
      tenant_id: tenant.id,
      visual_project_id: projectId,
      variant_number: 1,
      source_prompt: text(parsed.concept, 12000),
      revised_prompt: text(parsed.final_video_prompt, 30000),
      model_used: 'storyboard',
      status: 'draft',
    });
    await db.from('customer_usage_events').insert({
      tenant_id: tenant.id,
      user_id: resolved.auth.user.id,
      event_name: 'visual_storyboard_generated',
      event_data: { project_id: projectId, seconds, scene_count: scenes.length },
    });

    return NextResponse.json({ concept: text(parsed.concept, 8000), finalVideoPrompt: text(parsed.final_video_prompt, 30000), scenes: insertedScenes || [], seconds }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error('Visual Studio storyboard POST error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Visual Studio could not build the storyboard.' }, { status: 500, headers: NO_STORE });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = text(body?.slug, 80);
    const projectId = text(body?.projectId, 80);
    const approve = Boolean(body?.approve);
    const scenes = Array.isArray(body?.scenes) ? body.scenes : null;
    if (!slug || !projectId) return NextResponse.json({ error: 'Workspace and video project are required.' }, { status: 400, headers: NO_STORE });

    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });
    const db = resolved.auth.db;
    const tenantId = resolved.membership.tenant.id;
    const { data: project, error: projectError } = await db.from('customer_visual_projects').select('id,video_seconds').eq('id', projectId).eq('tenant_id', tenantId).maybeSingle();
    if (projectError) throw projectError;
    if (!project) return NextResponse.json({ error: 'Video project not found.' }, { status: 404, headers: NO_STORE });

    if (scenes) {
      const cleaned = cleanScenes(scenes, Number(project.video_seconds || 8));
      if (!cleaned.length) return NextResponse.json({ error: 'At least one usable scene is required.' }, { status: 400, headers: NO_STORE });
      await db.from('customer_video_scenes').delete().eq('visual_project_id', projectId).eq('tenant_id', tenantId);
      const { error } = await db.from('customer_video_scenes').insert(cleaned.map((scene) => ({
        tenant_id: tenantId,
        visual_project_id: projectId,
        scene_number: scene.scene_number,
        scene_title: scene.scene_title,
        narration: scene.narration,
        on_screen_text: scene.on_screen_text,
        visual_direction: scene.visual_direction,
        duration_seconds: scene.duration_seconds,
        approved: approve,
      })));
      if (error) throw error;
    } else if (approve) {
      const { error } = await db.from('customer_video_scenes').update({ approved: true, updated_at: new Date().toISOString() }).eq('visual_project_id', projectId).eq('tenant_id', tenantId);
      if (error) throw error;
    }

    const storyboardStatus = approve ? 'approved' : 'draft';
    const { error: updateError } = await db.from('customer_visual_projects').update({ storyboard_status: storyboardStatus, updated_at: new Date().toISOString() }).eq('id', projectId).eq('tenant_id', tenantId);
    if (updateError) throw updateError;
    if (approve) {
      await db.from('customer_visual_reviews').insert({ tenant_id: tenantId, visual_project_id: projectId, user_id: resolved.auth.user.id, action: 'storyboard_approve', notes: 'Storyboard approved for video rendering.' });
    }
    return NextResponse.json({ saved: true, storyboardStatus }, { headers: NO_STORE });
  } catch (error) {
    console.error('Visual Studio storyboard PATCH error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Visual Studio could not save the storyboard.' }, { status: 500, headers: NO_STORE });
  }
}
