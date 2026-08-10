import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';

export const runtime = 'nodejs';
export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'no-store' };
const PROJECT_STATUSES = new Set(['draft', 'approved', 'rejected', 'archived']);
const ASSET_STATUSES = new Set(['draft', 'approved', 'rejected', 'archived']);
const ASSET_TYPES = new Set(['image', 'video']);

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

async function signedAsset(db: any, asset: any) {
  if (!asset.storage_bucket || !asset.storage_path) return { ...asset, signed_url: null };
  const { data } = await db.storage.from(asset.storage_bucket).createSignedUrl(asset.storage_path, 60 * 30);
  return { ...asset, signed_url: data?.signedUrl || null };
}

export async function GET(request: NextRequest) {
  try {
    const slug = text(request.nextUrl.searchParams.get('slug'), 80);
    if (!slug) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400, headers: NO_STORE });
    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });

    const db = resolved.auth.db;
    const tenantId = resolved.membership.tenant.id;
    const [projectsResult, creatorResult] = await Promise.all([
      db.from('customer_visual_projects')
        .select('id,creator_project_id,title,asset_type,platform,size,style_notes,must_include_text,status,storyboard_status,openai_video_id,video_status,video_progress,video_model,video_seconds,video_size,video_error,created_at,updated_at')
        .eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(40),
      db.from('customer_creator_projects')
        .select('id,title,campaign_type,goal,audience,offer,channels,status,output,created_at')
        .eq('tenant_id', tenantId).eq('status', 'approved').order('updated_at', { ascending: false }).limit(40),
    ]);
    if (projectsResult.error) throw projectsResult.error;
    if (creatorResult.error) throw creatorResult.error;

    const projects = projectsResult.data || [];
    const ids = projects.map((project: any) => project.id);
    let assets: any[] = [];
    let scenes: any[] = [];
    if (ids.length) {
      const [assetResult, sceneResult] = await Promise.all([
        db.from('customer_visual_assets')
          .select('id,visual_project_id,asset_kind,storage_bucket,storage_path,mime_type,width,height,duration_seconds,variant_number,prompt,model_used,status,metadata,created_at,updated_at')
          .eq('tenant_id', tenantId).in('visual_project_id', ids).order('created_at', { ascending: false }),
        db.from('customer_video_scenes')
          .select('id,visual_project_id,scene_number,scene_title,narration,on_screen_text,visual_direction,duration_seconds,approved,created_at,updated_at')
          .eq('tenant_id', tenantId).in('visual_project_id', ids).order('scene_number', { ascending: true }),
      ]);
      if (assetResult.error) throw assetResult.error;
      if (sceneResult.error) throw sceneResult.error;
      assets = await Promise.all((assetResult.data || []).map((asset: any) => signedAsset(db, asset)));
      scenes = sceneResult.data || [];
    }

    const hydrated = projects.map((project: any) => ({
      ...project,
      assets: assets.filter((asset) => asset.visual_project_id === project.id),
      scenes: scenes.filter((scene) => scene.visual_project_id === project.id),
    }));

    return NextResponse.json({ projects: hydrated, approvedCampaigns: creatorResult.data || [] }, { headers: NO_STORE });
  } catch (error) {
    console.error('Visual Studio GET error', error);
    return NextResponse.json({ error: 'Unable to load Visual Studio.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = text(body?.slug, 80);
    const creatorProjectId = text(body?.creatorProjectId, 80);
    const title = text(body?.title, 180);
    const assetType = text(body?.assetType, 20) || 'image';
    const platform = text(body?.platform, 80) || 'general';
    const size = text(body?.size, 40) || '1024x1024';
    const styleNotes = text(body?.styleNotes, 5000);
    const mustIncludeText = text(body?.mustIncludeText, 2000);

    if (!slug || !creatorProjectId || !title || !ASSET_TYPES.has(assetType)) {
      return NextResponse.json({ error: 'Workspace, approved campaign, title, and valid asset type are required.' }, { status: 400, headers: NO_STORE });
    }
    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });

    const db = resolved.auth.db;
    const tenantId = resolved.membership.tenant.id;
    const { data: campaign, error: campaignError } = await db.from('customer_creator_projects')
      .select('id,title,status').eq('id', creatorProjectId).eq('tenant_id', tenantId).maybeSingle();
    if (campaignError) throw campaignError;
    if (!campaign) return NextResponse.json({ error: 'Source campaign was not found.' }, { status: 404, headers: NO_STORE });
    if (campaign.status !== 'approved') return NextResponse.json({ error: 'Visual Studio only starts from an approved Creator Studio campaign.' }, { status: 409, headers: NO_STORE });

    const { data: project, error } = await db.from('customer_visual_projects').insert({
      tenant_id: tenantId,
      creator_project_id: creatorProjectId,
      created_by: resolved.auth.user.id,
      title,
      asset_type: assetType,
      platform,
      size,
      style_notes: styleNotes,
      must_include_text: mustIncludeText,
      status: 'draft',
      storyboard_status: assetType === 'video' ? 'not_started' : 'not_started',
    }).select('*').single();
    if (error) throw error;

    await db.from('customer_usage_events').insert({
      tenant_id: tenantId,
      user_id: resolved.auth.user.id,
      event_name: 'visual_project_created',
      event_data: { asset_type: assetType, platform, source_campaign_id: creatorProjectId },
    });

    return NextResponse.json({ project }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error('Visual Studio POST error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create the Visual Studio project.' }, { status: 500, headers: NO_STORE });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = text(body?.slug, 80);
    const projectId = text(body?.projectId, 80);
    const projectStatus = text(body?.status, 30);
    const assetId = text(body?.assetId, 80);
    const assetStatus = text(body?.assetStatus, 30);
    const notes = text(body?.notes, 3000);

    if (!slug || !projectId) return NextResponse.json({ error: 'Workspace and project are required.' }, { status: 400, headers: NO_STORE });
    if (projectStatus && !PROJECT_STATUSES.has(projectStatus)) return NextResponse.json({ error: 'Invalid project status.' }, { status: 400, headers: NO_STORE });
    if (assetStatus && !ASSET_STATUSES.has(assetStatus)) return NextResponse.json({ error: 'Invalid asset status.' }, { status: 400, headers: NO_STORE });

    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });
    const db = resolved.auth.db;
    const tenantId = resolved.membership.tenant.id;

    const { data: project, error: projectError } = await db.from('customer_visual_projects').select('id,status').eq('id', projectId).eq('tenant_id', tenantId).maybeSingle();
    if (projectError) throw projectError;
    if (!project) return NextResponse.json({ error: 'Visual project not found.' }, { status: 404, headers: NO_STORE });

    if (projectStatus) {
      const { error } = await db.from('customer_visual_projects').update({ status: projectStatus, updated_at: new Date().toISOString() }).eq('id', projectId).eq('tenant_id', tenantId);
      if (error) throw error;
    }

    if (assetId && assetStatus) {
      const { data: asset, error: assetError } = await db.from('customer_visual_assets').select('id').eq('id', assetId).eq('visual_project_id', projectId).eq('tenant_id', tenantId).maybeSingle();
      if (assetError) throw assetError;
      if (!asset) return NextResponse.json({ error: 'Visual asset not found.' }, { status: 404, headers: NO_STORE });
      const { error } = await db.from('customer_visual_assets').update({ status: assetStatus, updated_at: new Date().toISOString() }).eq('id', assetId).eq('tenant_id', tenantId);
      if (error) throw error;
    }

    const effective = assetStatus || projectStatus || 'draft';
    const action = effective === 'approved' ? 'approve' : effective === 'rejected' ? 'reject' : effective === 'archived' ? 'archive' : 'return_to_draft';
    await db.from('customer_visual_reviews').insert({
      tenant_id: tenantId,
      visual_project_id: projectId,
      asset_id: assetId || null,
      user_id: resolved.auth.user.id,
      action,
      notes,
    });

    return NextResponse.json({ saved: true, status: projectStatus || project.status, assetStatus: assetStatus || null }, { headers: NO_STORE });
  } catch (error) {
    console.error('Visual Studio PATCH error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update the Visual Studio project.' }, { status: 500, headers: NO_STORE });
  }
}
