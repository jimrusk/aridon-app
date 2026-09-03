export type ImportedContact = {
  name: string;
  email: string;
  company: string;
  phone: string;
  title: string;
  socialHandle?: string;
  socialUrl?: string;
};

export type AttentionLead = {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  status?: string | null;
  priority?: string | null;
  notes?: string | null;
  next_action?: string | null;
  last_contact_at?: string | null;
  next_follow_up_at?: string | null;
  relationship_score?: number | null;
  social_handle?: string | null;
  social_url?: string | null;
};

const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
  'live.com', 'icloud.com', 'me.com', 'aol.com', 'proton.me', 'protonmail.com',
]);

export function cleanText(value: unknown, max = 500): string {
  return typeof value === 'string' ? value.replace(/\0/g, '').trim().slice(0, max) : '';
}

export function extractMailboxes(value: string): Array<{ name: string; email: string }> {
  const input = cleanText(value, 5000);
  if (!input) return [];
  const out: Array<{ name: string; email: string }> = [];
  const seen = new Set<string>();
  const regex = /(?:(?:"([^"]+)"|([^,<]+?))\s*)?<([^<>\s]+@[^<>\s]+)>|\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(input))) {
    const email = cleanText(match[3] || match[4], 254).toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    const name = cleanText(match[1] || match[2], 160).replace(/^['"]|['"]$/g, '').trim();
    out.push({ name, email });
  }
  return out;
}

export function companyFromEmail(email: string): string {
  const domain = cleanText(email, 254).toLowerCase().split('@')[1] || '';
  if (!domain || PERSONAL_DOMAINS.has(domain)) return '';
  const root = domain.split('.')[0].replace(/[-_]+/g, ' ').trim();
  return root.replace(/\b\w/g, (letter) => letter.toUpperCase()).slice(0, 160);
}

function decodeVCardValue(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

function unfoldVCard(text: string): string[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const out: string[] = [];
  for (const raw of lines) {
    if (/^[ \t]/.test(raw) && out.length) out[out.length - 1] += raw.slice(1);
    else out.push(raw);
  }
  return out;
}

export function parseVCard(text: string): ImportedContact[] {
  const cards = cleanText(text, 2_000_000).split(/BEGIN:VCARD/i).slice(1);
  const contacts: ImportedContact[] = [];
  for (const card of cards) {
    const body = card.split(/END:VCARD/i)[0] || '';
    const fields = new Map<string, string[]>();
    for (const line of unfoldVCard(body)) {
      const idx = line.indexOf(':');
      if (idx < 0) continue;
      const key = line.slice(0, idx).split(';')[0].toUpperCase();
      const value = decodeVCardValue(line.slice(idx + 1));
      if (!value) continue;
      fields.set(key, [...(fields.get(key) || []), value]);
    }
    const fn = fields.get('FN')?.[0] || '';
    const n = fields.get('N')?.[0]?.split(';') || [];
    const fallbackName = [n[1], n[0]].filter(Boolean).join(' ').trim();
    const email = (fields.get('EMAIL')?.[0] || '').trim().toLowerCase();
    const name = fn || fallbackName || (email ? email.split('@')[0] : 'Imported contact');
    const org = (fields.get('ORG')?.[0] || '').split(';')[0];
    const urls = fields.get('URL') || [];
    const socialUrl = urls.find((url) => /(?:twitter\.com|x\.com)\//i.test(url)) || '';
    const socialHandle = socialUrl ? (socialUrl.split('/').filter(Boolean).pop() || '').replace(/^@/, '') : '';
    contacts.push({
      name: cleanText(name, 160),
      email: cleanText(email, 254),
      company: cleanText(org || companyFromEmail(email), 160),
      phone: cleanText(fields.get('TEL')?.[0] || '', 80),
      title: cleanText(fields.get('TITLE')?.[0] || '', 160),
      socialHandle: cleanText(socialHandle, 80),
      socialUrl: cleanText(socialUrl, 500),
    });
  }
  return contacts.filter((contact) => contact.name && (contact.email || contact.phone || contact.socialHandle));
}

function parseCsvRows(text: string): string[][] {
  const input = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') { value += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(value.trim()); value = '';
    } else if (char === '\n' && !quoted) {
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; value = '';
    } else value += char;
  }
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function firstValue(record: Record<string, string>, keys: string[]): string {
  for (const key of keys) if (record[key]) return record[key];
  return '';
}

export function parseContactCsv(text: string): ImportedContact[] {
  const rows = parseCsvRows(cleanText(text, 2_000_000));
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => header.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'));
  return rows.slice(1).map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => { record[header] = cleanText(row[index] || '', 1000); });
    const first = firstValue(record, ['first_name', 'firstname', 'first']);
    const last = firstValue(record, ['last_name', 'lastname', 'last']);
    const email = firstValue(record, ['email', 'email_address', 'e_mail']).toLowerCase();
    const name = firstValue(record, ['name', 'full_name', 'contact_name']) || [first, last].filter(Boolean).join(' ') || (email ? email.split('@')[0] : '');
    const socialUrl = firstValue(record, ['x_url', 'twitter_url', 'social_url', 'profile_url']);
    const socialHandle = firstValue(record, ['x_handle', 'twitter_handle', 'social_handle', 'username']) || (socialUrl ? socialUrl.split('/').filter(Boolean).pop() || '' : '');
    return {
      name: cleanText(name, 160),
      email: cleanText(email, 254),
      company: cleanText(firstValue(record, ['company', 'organization', 'organisation', 'org']) || companyFromEmail(email), 160),
      phone: cleanText(firstValue(record, ['phone', 'phone_number', 'mobile', 'telephone']), 80),
      title: cleanText(firstValue(record, ['title', 'job_title', 'position']), 160),
      socialHandle: cleanText(socialHandle.replace(/^@/, ''), 80),
      socialUrl: cleanText(socialUrl, 500),
    };
  }).filter((contact) => contact.name && (contact.email || contact.phone || contact.socialHandle));
}

export function daysBetween(iso: string | null | undefined, now = Date.now()): number | null {
  const time = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(time) ? Math.max(0, Math.floor((now - time) / 86_400_000)) : null;
}

export function scoreAttention(lead: AttentionLead, now = Date.now()) {
  let score = 0;
  const reasons: string[] = [];
  const followUp = lead.next_follow_up_at ? Date.parse(lead.next_follow_up_at) : NaN;
  if (Number.isFinite(followUp)) {
    const deltaDays = Math.ceil((followUp - now) / 86_400_000);
    if (deltaDays <= 0) { score += 48; reasons.push('follow-up is due'); }
    else if (deltaDays <= 3) { score += 24; reasons.push('follow-up is coming up'); }
  }
  const quietDays = daysBetween(lead.last_contact_at, now);
  if (quietDays === null) { score += 12; reasons.push('no contact history yet'); }
  else if (quietDays >= 45) { score += 26; reasons.push(`${quietDays} days since contact`); }
  else if (quietDays >= 21) { score += 18; reasons.push(`${quietDays} days since contact`); }
  else if (quietDays >= 10) { score += 8; reasons.push(`${quietDays} days since contact`); }

  const status = (lead.status || '').toLowerCase();
  if (status === 'qualified') { score += 16; reasons.push('qualified opportunity'); }
  else if (status === 'active') { score += 12; reasons.push('active relationship'); }
  else if (status === 'new') score += 5;

  const priority = (lead.priority || '').toLowerCase();
  if (priority === 'high' || priority === 'urgent') { score += 12; reasons.push(`${priority} priority`); }

  const text = `${lead.notes || ''} ${lead.next_action || ''}`.toLowerCase();
  if (/waiting|follow[- ]?up|proposal|sent|reply|call back|callback|decision|review/.test(text)) {
    score += 10; reasons.push('notes contain a pending action');
  }

  const stored = Number(lead.relationship_score || 0);
  if (Number.isFinite(stored) && stored > 0) score += Math.round(Math.min(100, stored) * 0.15);

  const nextAction = cleanText(lead.next_action, 240) ||
    (Number.isFinite(followUp) && followUp <= now ? 'Follow up now' :
      quietDays !== null && quietDays >= 21 ? 'Reconnect and ask for the next decision' :
      status === 'qualified' ? 'Move the opportunity to a concrete next step' :
      'Review the relationship and set the next action');

  return { score: Math.min(100, score), reasons, nextAction, quietDays };
}
