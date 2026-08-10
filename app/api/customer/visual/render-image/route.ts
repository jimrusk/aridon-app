import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../../lib/customerAuth';

export const runtime = 'nodejs';
export const maxDuration = 300;

const NO_STORE = { 'Cache-Control': 'no-store' };
const IMAGE_URL = 'https://api.openai.com/v1/images/generations';
const BRAND_TITLE = 'Aridon Brand Brain';
const IMAGE_SIZES = new Set(['1024x1024', '1536x1024', '1024x1536']);

type ImageResponse = {
  data?: Array<{ b64_json?: string; revised_prompt?: string }>;
  error?: { message?: string };
};

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function safeJson(value: string | null | undefined) {
  if (!value) return {};
  try { return JSON.parse(value); } catch { return { notes: value }; }
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
    const requestedSize = text(body?.size, 40);
    const size = IMAGE_SIZES.has(requestedSize) ? requestedSize : '1024x1024';
    const variants = Math.max(1, Math.min(4, Number(body?.variants) || 3));
    const extraDirection = text(body?.direction, 5000);

    if (!slug || !projectId) return NextResponse.json({ error: 'Workspace and visual project are required.' }, { status: 400, headers: NO_STORE });
    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });

    const db = resolved.auth.db;
    const tenant = resolved.membership.tenant;
    const { data: project, error: projectError } = await db.from('customer_visual_projects')
      .select('id,creator_project_id,title,asset_type,platform,size,style_notes,must_include_text,status')
      .eq('id', projectId).eq('tenant_id', tenant.id).maybeSingle();
    if (projectError) throw projectError;
    if (!project) return NextResponse.json({ error: 'Visual project not found.' }, { status: 404, headers: NO_STORE });
    if (project.asset_type !== 'image') return NextResponse.json({ error: 'This visual project is configured for video, not image generation.' }, { status: 409, headers: NO_STORE });

    const [campaignResult, brandResult] = await Promise.all([
      db.from('customer_creator_projects').select('id,title,campaign_type,goal,audience,offer,channels,status,output').eq('id', project.creator_project_id).eq('tenant_id', tenant.id).maybeSingle(),
      db.from('customer_knowledge').select('content').eq('tenant_id', tenant.id).eq('title', BRAND_TITLE).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (campaignResult.error) throw campaignResult.error;
    if (brandResult.error) throw brandResult.error;
    const campaign = campaignResult.data;
    if (!campaign || campaign.status !== 'approved') return NextResponse.json({ error: 'The source Creator Studio campaign must still be approved before visuals can be generated.' }, { status: 409, headers: NO_STORE });

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
        extra_direction: extraDirection,
      },
    }, null, 2).slice(0, 30000);

    const prompt = `Create a polished commercial marketing visual for the company below. This is part of an APPROVED marketing campaign, but the image itself is still a DRAFT for owner review.\n\nPRIVATE CREATIVE CONTEXT:\n${context}\n\nCREATIVE RULES:\n- Match the Brand Brain and campaign positioning.\n- Make the composition native to ${project.platform || 'the intended marketing channel'}.\n- Produce a professional, credible image suitable for a real business, not a generic AI collage.\n- Do not invent product performance, certifications, partner logos, testimonials, awards, statistics, prices, customer names, or guarantees.\n- Do not add logos or trademarks that are not supplied in the context.\n- If must-include text is supplied, render only that requested wording and keep it legible. Otherwise minimize embedded text and leave room for campaign copy to be overlaid later.\n- Avoid tiny illegible typography, fake UI text, gibberish labels, and unsupported claims.\n- Follow these style notes when supplied: ${project.style_notes || 'Use a premium, modern, commercially credible visual direction.'}\n- Additional direction: ${extraDirection || 'None.'}\n- The output must stand on its own visually and be appropriate for owner approval.`;

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: 'Visual Studio image generation is not configured on this deployment.' }, { status: 503, headers: NO_STORE });

    const model = process.env.VISUAL_IMAGE_MODEL?.trim() || 'gpt-image-1.5';
    const response = await fetch(IMAGE_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        n: variants,
        size,
        quality: 'medium',
        output_format: 'png',
        background: 'auto',
        moderation: 'auto',
        user: tenant.id,
      }),
      cache: 'no-store',
    });
    const data = await response.json() as ImageResponse;
    if (!response.ok) throw new Error(data.error?.message || `Image generation returned ${response.status}.`);
    const generated = (data.data || []).filter((item) => item.b64_json);
    if (!generated.length) throw new Error('Image generation returned no usable images.');

    const dimension = size.split('x').map(Number);
    const createdAssets: any[] = [];
    for (let index = 0; index < generated.length; index += 1) {
      const item = generated[index];
      const variant = index + 1;
      const buffer = Buffer.from(item.b64_json as string, 'base64');
      const path = `${tenant.id}/${projectId}/${Date.now()}-v${variant}.png`;
      const { error: uploadError } = await db.storage.from('customer-visuals').upload(path, buffer, { contentType: 'image/png', upsert: false });
      if (uploadError) throw uploadError;

      const { data: asset, error: assetError } = await db.from('customer_visual_assets').insert({
        tenant_id: tenant.id,
        visual_project_id: projectId,
        asset_kind: 'image',
        storage_bucket: 'customer-visuals',
        storage_path: path,
        mime_type: 'image/png',
        width: dimension[0] || null,
        height: dimension[1] || null,
        variant_number: variant,
        prompt,
        model_used: model,
        status: 'draft',
        metadata: { revised_prompt: item.revised_prompt || null, platform: project.platform || null },
      }).select('*').single();
      if (assetError) throw assetError;

      await db.from('customer_visual_variants').insert({
        tenant_id: tenant.id,
        visual_project_id: projectId,
        asset_id: asset.id,
        variant_number: variant,
        source_prompt: prompt,
        revised_prompt: item.revised_prompt || null,
        model_used: model,
        status: 'draft',
      });

      const { data: signed } = await db.storage.from('customer-visuals').createSignedUrl(path, 60 * 30);
      createdAssets.push({ ...asset, signed_url: signed?.signedUrl || null });
    }

    await db.from('customer_visual_projects').update({ size, status: 'draft', updated_at: new Date().toISOString() }).eq('id', projectId).eq('tenant_id', tenant.id);
    await db.from('customer_usage_events').insert({
      tenant_id: tenant.id,
      user_id: resolved.auth.user.id,
      event_name: 'visual_images_generated',
      event_data: { project_id: projectId, variants: createdAssets.length, size, model },
    });

    return NextResponse.json({ assets: createdAssets, model, size }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error('Visual Studio render image error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Visual Studio could not render images.' }, { status: 500, headers: NO_STORE });
  }
}
