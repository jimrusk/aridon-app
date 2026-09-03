import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';
import { cleanText, parseContactCsv, parseVCard } from '../../../../lib/relationshipBrain';

export const runtime = 'nodejs';

const NO_STORE = { 'Cache-Control': 'no-store' };
const MAX_BYTES = 2_000_000;

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Upload a CSV or VCF file.' }, { status: 415, headers: NO_STORE });
    }

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Choose a CSV or VCF file first.' }, { status: 400, headers: NO_STORE });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Contact imports are limited to 2 MB per file.' }, { status: 413, headers: NO_STORE });
    }

    const filename = cleanText(file.name, 240).toLowerCase();
    const raw = await file.text();
    const contacts = filename.endsWith('.vcf') || /vcard/i.test(file.type)
      ? parseVCard(raw)
      : filename.endsWith('.csv') || /csv/i.test(file.type)
        ? parseContactCsv(raw)
        : [];

    if (!contacts.length) {
      return NextResponse.json({ error: 'No contacts were found. Use a .vcf or .csv contact export.' }, { status: 400, headers: NO_STORE });
    }

    const db = getServerClient();
    const { data: existing, error: existingError } = await db
      .from('leads')
      .select('id,email,social_handle')
      .limit(5000);
    if (existingError) throw existingError;

    const byEmail = new Map<string, { id: string }>();
    const bySocial = new Map<string, { id: string }>();
    for (const lead of existing || []) {
      const email = typeof lead.email === 'string' ? lead.email.trim().toLowerCase() : '';
      const social = typeof lead.social_handle === 'string' ? lead.social_handle.trim().toLowerCase() : '';
      if (email) byEmail.set(email, { id: lead.id });
      if (social) bySocial.set(social, { id: lead.id });
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    for (const contact of contacts.slice(0, 2000)) {
      const emailKey = contact.email.toLowerCase();
      const socialKey = (contact.socialHandle || '').toLowerCase();
      const match = (emailKey && byEmail.get(emailKey)) || (socialKey && bySocial.get(socialKey));
      const payload = {
        name: contact.name,
        company: contact.company,
        email: contact.email,
        phone: contact.phone,
        title: contact.title,
        social_handle: contact.socialHandle || null,
        social_url: contact.socialUrl || null,
        source: filename.endsWith('.vcf') ? 'vcf-import' : 'csv-import',
        updated_at: new Date().toISOString(),
      };

      if (match) {
        const { error } = await db.from('leads').update(payload).eq('id', match.id);
        if (error) { skipped++; continue; }
        updated++;
      } else {
        const { data, error } = await db.from('leads').insert({ ...payload, status: 'new', notes: 'Imported into Aridon Relationship Brain.' }).select('id,email,social_handle').single();
        if (error || !data) { skipped++; continue; }
        created++;
        if (emailKey) byEmail.set(emailKey, { id: data.id });
        if (socialKey) bySocial.set(socialKey, { id: data.id });
      }
    }

    return NextResponse.json({ ok: true, filename: file.name, found: contacts.length, created, updated, skipped }, { headers: NO_STORE });
  } catch (error) {
    console.error('Relationship Brain contact import error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to import contacts.' }, { status: 500, headers: NO_STORE });
  }
}
