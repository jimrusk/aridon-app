// POST /api/safewalk/trips/[id]/audio — multipart {tripSecret, file}.
// Uploads to the 'safewalk-audio' Supabase Storage bucket at {tripId}/{ts}.m4a.
// Returns 503 JSON (never crashes) when storage is unavailable.
import {
  ApiError,
  errJson,
  getDb,
  getTripWithSecret,
  json,
} from '@/lib/safewalk';

export const dynamic = 'force-dynamic';

const BUCKET = 'safewalk-audio';
const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new ApiError(400, 'expected multipart form data');
    }
    const tripSecret = form.get('tripSecret');
    const file = form.get('file');

    const db = getDb();
    const trip = await getTripWithSecret(db, params.id, typeof tripSecret === 'string' ? tripSecret : '');

    if (!(file instanceof File) || file.size === 0) {
      throw new ApiError(400, 'file is required');
    }
    if (file.size > MAX_BYTES) {
      throw new ApiError(413, 'file too large (25MB max)');
    }

    const path = `${trip.id}/${Date.now()}.m4a`;
    try {
      const { error: upError } = await db.storage
        .from(BUCKET)
        .upload(path, file, {
          contentType: file.type || 'audio/mp4',
          upsert: false,
        });
      if (upError) throw upError;
      const { data: signed, error: signError } = await db.storage
        .from(BUCKET)
        .createSignedUrl(path, 7 * 24 * 3600);
      if (signError || !signed?.signedUrl) throw signError ?? new Error('sign failed');
      await db.from('safewalk_events').insert({
        trip_id: trip.id,
        type: 'audio',
        detail: { path },
      });
      return json({ ok: true, url: signed.signedUrl });
    } catch (e) {
      console.error('[safewalk] audio upload failed', e instanceof Error ? e.message : e);
      throw new ApiError(503, 'audio storage unavailable');
    }
  } catch (e) {
    return errJson(e);
  }
}
