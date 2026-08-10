import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../../lib/customerAuth';

export const runtime = 'nodejs';
export const maxDuration = 300;

const NO_STORE = { 'Cache-Control': 'no-store' };
const VIDEO_URL = 'https://api.openai.com/v1/videos';
const VIDEO_SIZES = new Set(['720x1280', '1280x720', '1024x1792', '1792x1024']);
const VIDEO_SECONDS = new Set(['4', '8', '12']);
const VIDEO_MODELS = new Set(['sora-2', 'sora-2-pro']);

type VideoJob = {
  id?: string;
  status?: 'queued' | 'in_progress' | 'completed' | 'failed';
  progress?: number;
  model?: string;
  seconds?: string;
  size?: string;
  prompt?: string | null;
  error?: { code?: string; message?: string } | null;
};

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function resolveMembership(request: NextRequest, slug: string) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { error: auth.error, status: auth.status } as const;
  const membership = await customerTenantForUser(auth.user.id, slug);
  if (!membership) return { error: 'You do not have access to this workspace.', status: 403 } as const;
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return { error: 'This workspace is not active.', status: 402 } as const;
  return { auth, membership } as const;
}

async function videoPrompt(db: any, tenantId: string, projectId: string) {
  const [{ data: scenes, error: sceneError }, { data: variant, error: variantError }] = await Promise.all([
    db.from('customer_video_scenes').select('scene_number,scene_title,narration,on_screen_text,visual_direction,duration_seconds,approved').eq('tenant_id', tenantId).eq('visual_project_id', projectId).order('scene_number', { ascending: true }),
    db.from('customer_visual_variants').select('revised_prompt').eq('tenant_id', tenantId).eq('visual_project_id', projectId).eq('model_used', 'storyboard').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (sceneError) throw sceneError;
  if (variantError) throw variantError;
  if (!scenes?.length || scenes.some((scene: any) => !scene.approved)) throw new Error('Approve the storyboard before rendering video.');
  const sceneText = scenes.map((scene: any) => `Scene ${scene.scene_number} (${scene.duration_seconds}s): ${scene.visual_direction}${scene.on_screen_text ? ` On-screen text: ${scene.on_screen_text}.` : ''}${scene.narration ? ` Narration/audio intent: ${scene.narration}.` : ''}`).join('\n');
  return `${text(variant?.revised_prompt, 20000) || 'Create a cohesive professional commercial video using the approved storyboard.'}\n\nAPPROVED STORYBOARD:\n${sceneText}\n\nPreserve continuity across scenes. Do not invent logos, testimonials, certifications, statistics, pricing, partner names, guarantees, or product claims that are not explicitly present. Keep any on-screen text exactly as approved and legible. Produce a polished business marketing clip.`.slice(0, 32000);
}

async function hydrateAsset(db: any, asset: any) {
  if (!asset?.storage_bucket || !asset?.storage_path) return { ...asset, signed_url: null };
  const { data } = await db.storage.from(asset.storage_bucket).createSignedUrl(asset.storage_path, 60 * 30);
  return { ...asset, signed_url: data?.signedUrl || null };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = text(body?.slug, 80);
    const projectId = text(body?.projectId, 80);
    const requestedModel = text(body?.model, 40);
    const requestedSize = text(body?.size, 40);
    const requestedSeconds = text(body?.seconds, 10);
    const model = VIDEO_MODELS.has(requestedModel) ? requestedModel : (VIDEO_MODELS.has(process.env.VISUAL_VIDEO_MODEL || '') ? process.env.VISUAL_VIDEO_MODEL as string : 'sora-2');
    const size = VIDEO_SIZES.has(requestedSize) ? requestedSize : '720x1280';
    const seconds = VIDEO_SECONDS.has(requestedSeconds) ? requestedSeconds : '8';

    if (!slug || !projectId) return NextResponse.json({ error: 'Workspace and video project are required.' }, { status: 400, headers: NO_STORE });
    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });
    const db = resolved.auth.db;
    const tenantId = resolved.membership.tenant.id;

    const { data: project, error: projectError } = await db.from('customer_visual_projects')
      .select('id,asset_type,storyboard_status,openai_video_id,video_status')
      .eq('id', projectId).eq('tenant_id', tenantId).maybeSingle();
    if (projectError) throw projectError;
    if (!project) return NextResponse.json({ error: 'Video project not found.' }, { status: 404, headers: NO_STORE });
    if (project.asset_type !== 'video') return NextResponse.json({ error: 'This project is not configured for video.' }, { status: 409, headers: NO_STORE });
    if (project.storyboard_status !== 'approved') return NextResponse.json({ error: 'Approve the storyboard before rendering video.' }, { status: 409, headers: NO_STORE });
    if (project.openai_video_id && ['queued', 'in_progress'].includes(project.video_status || '')) return NextResponse.json({ error: 'A video render is already in progress for this project.' }, { status: 409, headers: NO_STORE });

    const prompt = await videoPrompt(db, tenantId, projectId);
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: 'Visual Studio video rendering is not configured on this deployment.' }, { status: 503, headers: NO_STORE });

    const form = new FormData();
    form.set('model', model);
    form.set('prompt', prompt);
    form.set('seconds', seconds);
    form.set('size', size);
    const response = await fetch(VIDEO_URL, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: form, cache: 'no-store' });
    const job = await response.json() as VideoJob;
    if (!response.ok || !job.id) throw new Error(job.error?.message || `Video generation returned ${response.status}.`);

    const { data: asset, error: assetError } = await db.from('customer_visual_assets').insert({
      tenant_id: tenantId,
      visual_project_id: projectId,
      asset_kind: 'video',
      mime_type: 'video/mp4',
      duration_seconds: Number(job.seconds || seconds),
      variant_number: 1,
      prompt,
      model_used: job.model || model,
      status: job.status === 'in_progress' ? 'in_progress' : 'queued',
      metadata: { openai_video_id: job.id, size: job.size || size },
    }).select('*').single();
    if (assetError) throw assetError;

    const { error: updateError } = await db.from('customer_visual_projects').update({
      openai_video_id: job.id,
      video_status: job.status || 'queued',
      video_progress: job.progress || 0,
      video_model: job.model || model,
      video_seconds: job.seconds || seconds,
      video_size: job.size || size,
      video_error: null,
      updated_at: new Date().toISOString(),
    }).eq('id', projectId).eq('tenant_id', tenantId);
    if (updateError) throw updateError;

    await db.from('customer_usage_events').insert({ tenant_id: tenantId, user_id: resolved.auth.user.id, event_name: 'visual_video_render_started', event_data: { project_id: projectId, model, seconds, size, openai_video_id: job.id } });
    return NextResponse.json({ job, asset }, { status: 202, headers: NO_STORE });
  } catch (error) {
    console.error('Visual Studio render video POST error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Visual Studio could not start the video render.' }, { status: 500, headers: NO_STORE });
  }
}

export async function GET(request: NextRequest) {
  try {
    const slug = text(request.nextUrl.searchParams.get('slug'), 80);
    const projectId = text(request.nextUrl.searchParams.get('projectId'), 80);
    if (!slug || !projectId) return NextResponse.json({ error: 'Workspace and video project are required.' }, { status: 400, headers: NO_STORE });
    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });
    const db = resolved.auth.db;
    const tenantId = resolved.membership.tenant.id;

    const { data: project, error: projectError } = await db.from('customer_visual_projects').select('id,openai_video_id,video_status,video_progress,video_model,video_seconds,video_size,video_error').eq('id', projectId).eq('tenant_id', tenantId).maybeSingle();
    if (projectError) throw projectError;
    if (!project) return NextResponse.json({ error: 'Video project not found.' }, { status: 404, headers: NO_STORE });
    if (!project.openai_video_id) return NextResponse.json({ project, asset: null }, { headers: NO_STORE });

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: 'Visual Studio video rendering is not configured.' }, { status: 503, headers: NO_STORE });
    const response = await fetch(`${VIDEO_URL}/${encodeURIComponent(project.openai_video_id)}`, { headers: { Authorization: `Bearer ${apiKey}` }, cache: 'no-store' });
    const job = await response.json() as VideoJob;
    if (!response.ok) throw new Error(job.error?.message || `Video status returned ${response.status}.`);

    let { data: asset, error: assetError } = await db.from('customer_visual_assets').select('*').eq('tenant_id', tenantId).eq('visual_project_id', projectId).eq('asset_kind', 'video').order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (assetError) throw assetError;
    const nextStatus = job.status === 'failed' ? 'failed' : job.status === 'completed' ? 'draft' : job.status === 'in_progress' ? 'in_progress' : 'queued';

    if (job.status === 'completed' && asset && !asset.storage_path) {
      const contentResponse = await fetch(`${VIDEO_URL}/${encodeURIComponent(project.openai_video_id)}/content`, { headers: { Authorization: `Bearer ${apiKey}` }, cache: 'no-store' });
      if (!contentResponse.ok) throw new Error(`Completed video could not be downloaded (${contentResponse.status}).`);
      const bytes = Buffer.from(await contentResponse.arrayBuffer());
      const path = `${tenantId}/${projectId}/${Date.now()}-${project.openai_video_id}.mp4`;
      const { error: uploadError } = await db.storage.from('customer-videos').upload(path, bytes, { contentType: 'video/mp4', upsert: false });
      if (uploadError) throw uploadError;
      const { data: updatedAsset, error: updateAssetError } = await db.from('customer_visual_assets').update({ storage_bucket: 'customer-videos', storage_path: path, status: 'draft', duration_seconds: Number(job.seconds || project.video_seconds || 0), model_used: job.model || project.video_model, metadata: { ...(asset.metadata || {}), openai_video_id: project.openai_video_id, size: job.size || project.video_size }, updated_at: new Date().toISOString() }).eq('id', asset.id).eq('tenant_id', tenantId).select('*').single();
      if (updateAssetError) throw updateAssetError;
      asset = updatedAsset;

      try {
        const thumbResponse = await fetch(`${VIDEO_URL}/${encodeURIComponent(project.openai_video_id)}/content?variant=thumbnail`, { headers: { Authorization: `Bearer ${apiKey}` }, cache: 'no-store' });
        if (thumbResponse.ok) {
          const thumbType = thumbResponse.headers.get('content-type') || 'image/jpeg';
          const thumbExt = thumbType.includes('png') ? 'png' : 'jpg';
          const thumbPath = `${tenantId}/${projectId}/${Date.now()}-thumbnail.${thumbExt}`;
          const thumbBytes = Buffer.from(await thumbResponse.arrayBuffer());
          const { error: thumbUploadError } = await db.storage.from('customer-videos').upload(thumbPath, thumbBytes, { contentType: thumbType, upsert: false });
          if (!thumbUploadError) await db.from('customer_visual_assets').insert({ tenant_id: tenantId, visual_project_id: projectId, asset_kind: 'thumbnail', storage_bucket: 'customer-videos', storage_path: thumbPath, mime_type: thumbType, variant_number: 1, model_used: job.model || project.video_model, status: 'draft', metadata: { openai_video_id: project.openai_video_id } });
        }
      } catch (thumbnailError) {
        console.error('Visual Studio thumbnail capture warning', thumbnailError);
      }
    } else if (asset) {
      const { data: updatedAsset } = await db.from('customer_visual_assets').update({ status: nextStatus, updated_at: new Date().toISOString() }).eq('id', asset.id).eq('tenant_id', tenantId).select('*').single();
      if (updatedAsset) asset = updatedAsset;
    }

    const videoError = job.status === 'failed' ? (job.error?.message || 'Video generation failed.') : null;
    await db.from('customer_visual_projects').update({ video_status: job.status || project.video_status, video_progress: job.progress || (job.status === 'completed' ? 100 : 0), video_model: job.model || project.video_model, video_seconds: job.seconds || project.video_seconds, video_size: job.size || project.video_size, video_error: videoError, updated_at: new Date().toISOString() }).eq('id', projectId).eq('tenant_id', tenantId);

    return NextResponse.json({ job, asset: asset ? await hydrateAsset(db, asset) : null }, { headers: NO_STORE });
  } catch (error) {
    console.error('Visual Studio render video GET error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Visual Studio could not refresh the video render.' }, { status: 500, headers: NO_STORE });
  }
}
