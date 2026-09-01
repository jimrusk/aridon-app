import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';

export const runtime = 'nodejs';
export const maxDuration = 300;

const NO_STORE = { 'Cache-Control': 'no-store' };
const GOOGLE_API = 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = process.env.GEMINI_VIDEO_MODEL?.trim() || 'gemini-omni-1.1-flash';
const ASPECTS = new Set(['16:9', '9:16']);
const RESOLUTIONS = new Set(['360p', '720p', '1080p', '4k']);
const MODES = new Set(['text_to_video', 'image_to_video', 'edit', 'extend']);

function clean(value: unknown, max = 8000) {
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

function apiKey() {
  return process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_AI_API_KEY?.trim() || '';
}

function extractVideoUri(data: any) {
  if (typeof data?.output_video?.uri === 'string') return data.output_video.uri;
  for (const step of data?.steps || []) {
    if (step?.type !== 'model_output') continue;
    for (const item of step?.content || []) {
      if (item?.type === 'video' && typeof item?.uri === 'string') return item.uri;
    }
  }
  return '';
}

function fileIdFromUri(uri: string) {
  const match = uri.match(/files\/([a-zA-Z0-9-]+)/);
  return match?.[1] || '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = clean(body?.slug, 80);
    const prompt = clean(body?.prompt, 12000);
    const mode = clean(body?.mode, 40) || 'text_to_video';
    const aspectRatio = ASPECTS.has(body?.aspectRatio) ? body.aspectRatio : '16:9';
    const resolution = RESOLUTIONS.has(body?.resolution) ? body.resolution : '360p';
    const previousInteractionId = clean(body?.previousInteractionId, 180);
    const mediaData = clean(body?.mediaData, 12_000_000);
    const mediaMime = clean(body?.mediaMime, 120);

    if (!slug || !prompt) return NextResponse.json({ error: 'Workspace and video instructions are required.' }, { status: 400, headers: NO_STORE });
    if (!MODES.has(mode)) return NextResponse.json({ error: 'Unsupported video mode.' }, { status: 400, headers: NO_STORE });

    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });

    const key = apiKey();
    if (!key) return NextResponse.json({
      error: 'Gemini Omni is installed in Aridon, but the server is missing GEMINI_API_KEY.',
      configured: false,
      model: MODEL,
    }, { status: 503, headers: NO_STORE });

    const input: any = mediaData && mediaMime
      ? [
          { type: mediaMime.startsWith('video/') ? 'video' : 'image', data: mediaData, mime_type: mediaMime },
          { type: 'text', text: prompt },
        ]
      : prompt;

    const payload: Record<string, unknown> = {
      model: MODEL,
      input,
      response_format: { type: 'video', delivery: 'uri', aspect_ratio: aspectRatio, resolution },
      store: true,
      background: false,
      stream: false,
    };

    if (previousInteractionId && (mode === 'edit' || mode === 'extend')) {
      payload.previous_interaction_id = previousInteractionId;
    } else if (mode !== 'text_to_video') {
      payload.generation_config = { video_config: { task: mode } };
    }

    const response = await fetch(`${GOOGLE_API}/interactions?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message || `Gemini Omni returned ${response.status}.`;
      return NextResponse.json({ error: message }, { status: response.status, headers: NO_STORE });
    }

    const uri = extractVideoUri(data);
    const fileId = fileIdFromUri(uri);
    const interactionId = clean(data?.id, 180);
    if (!fileId) return NextResponse.json({ error: 'Gemini Omni generated a response but Aridon could not locate the video file.' }, { status: 502, headers: NO_STORE });

    await resolved.auth.db.from('customer_usage_events').insert({
      tenant_id: resolved.membership.tenant.id,
      user_id: resolved.auth.user.id,
      event_name: 'video_studio_generation_requested',
      event_data: { model: MODEL, mode, aspect_ratio: aspectRatio, resolution },
    });

    return NextResponse.json({
      ok: true,
      model: MODEL,
      interactionId,
      fileId,
      status: 'PROCESSING',
    }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error('Video Studio generation error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Aridon Video Studio could not generate the video.' }, { status: 500, headers: NO_STORE });
  }
}

export async function GET(request: NextRequest) {
  try {
    const slug = clean(request.nextUrl.searchParams.get('slug'), 80);
    const fileId = clean(request.nextUrl.searchParams.get('fileId'), 80);
    const download = request.nextUrl.searchParams.get('download') === '1';
    if (!slug || !fileId || !/^[a-zA-Z0-9-]+$/.test(fileId)) return NextResponse.json({ error: 'Workspace and valid video file are required.' }, { status: 400, headers: NO_STORE });

    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });
    const key = apiKey();
    if (!key) return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 503, headers: NO_STORE });

    if (download) {
      const response = await fetch(`${GOOGLE_API}/files/${fileId}:download?alt=media&key=${encodeURIComponent(key)}`, { cache: 'no-store' });
      if (!response.ok || !response.body) return NextResponse.json({ error: `Video download returned ${response.status}.` }, { status: response.status, headers: NO_STORE });
      return new NextResponse(response.body, {
        status: 200,
        headers: {
          'Content-Type': response.headers.get('content-type') || 'video/mp4',
          'Content-Disposition': `inline; filename="aridon-video-${fileId}.mp4"`,
          'Cache-Control': 'private, no-store',
        },
      });
    }

    const response = await fetch(`${GOOGLE_API}/files/${fileId}?key=${encodeURIComponent(key)}`, { cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: data?.error?.message || `Video status returned ${response.status}.` }, { status: response.status, headers: NO_STORE });
    return NextResponse.json({
      state: typeof data?.state === 'string' ? data.state : 'PROCESSING',
      mimeType: data?.mimeType || 'video/mp4',
      sizeBytes: data?.sizeBytes || null,
      expirationTime: data?.expirationTime || null,
      error: data?.error?.message || null,
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Video Studio status error', error);
    return NextResponse.json({ error: 'Unable to read the generated video status.' }, { status: 500, headers: NO_STORE });
  }
}
