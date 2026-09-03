'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Relationship = {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  status?: string | null;
  attentionScore: number;
  relationshipScore: number;
  interactionCount: number;
  reasons: string[];
  recommendedNextAction: string;
  quietDays?: number | null;
  social_handle?: string | null;
  social_url?: string | null;
};

type BrainData = {
  counts: { relationships: number; needsAttention: number; activeOpportunities: number };
  attention: Relationship[];
  opportunities: Relationship[];
  relationships: Relationship[];
};

type Settings = {
  auto_create_contacts: boolean;
  daily_brief_enabled: boolean;
  daily_brief_time: string;
  daily_brief_timezone: string;
  brief_recipient: string | null;
  x_sync_enabled: boolean;
};

type XStatus = { configured: boolean; connected: boolean; account?: string | null; missing?: string[]; error?: string };

const panel = { background: '#101827', border: '1px solid #24344d', borderRadius: 20, padding: 20 } as const;
const muted = { color: '#9fb0c7', lineHeight: 1.55 } as const;
const button = { border: 0, borderRadius: 12, padding: '11px 15px', background: '#9EF0CF', color: '#0a1820', fontWeight: 900, cursor: 'pointer' } as const;
const secondaryButton = { ...button, background: '#23344d', color: '#f5f7fb', border: '1px solid #38506f' } as const;

function scoreColor(score: number) {
  if (score >= 70) return '#ffb06b';
  if (score >= 40) return '#f5d06f';
  return '#9EF0CF';
}

export default function RelationshipBrainPage() {
  const [data, setData] = useState<BrainData | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [xStatus, setXStatus] = useState<XStatus | null>(null);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [brainRes, settingsRes, xRes] = await Promise.all([
        fetch('/api/relationship-brain/attention', { cache: 'no-store' }),
        fetch('/api/relationship-brain/settings', { cache: 'no-store' }),
        fetch('/api/x/status', { cache: 'no-store' }),
      ]);
      const brain = await brainRes.json();
      const settingsJson = await settingsRes.json();
      const x = await xRes.json();
      if (!brainRes.ok) throw new Error(brain.error || 'Unable to load relationship intelligence.');
      setData(brain);
      setSettings(settingsJson.settings || null);
      setXStatus(x);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load Relationship Brain.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredRelationships = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!data) return [];
    if (!needle) return data.relationships;
    return data.relationships.filter((item) => [item.name, item.company, item.email, item.title, item.social_handle, item.status].join(' ').toLowerCase().includes(needle));
  }, [data, filter]);

  async function sync(path: string, label: string) {
    setBusy(label); setMessage(''); setError('');
    try {
      const response = await fetch(path, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `${label} failed.`);
      setMessage(label === 'gmail'
        ? `Google sync complete: ${result.relationshipsTouched || 0} relationships touched, ${result.contactsCreated || 0} contacts created.`
        : `X sync complete: ${result.relationshipsTouched || 0} relationships touched, ${result.contactsCreated || 0} contacts created.`);
      await load();
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : `${label} sync failed.`);
    } finally { setBusy(''); }
  }

  async function importContacts(file: File | null) {
    if (!file) return;
    setBusy('import'); setMessage(''); setError('');
    try {
      const form = new FormData(); form.set('file', file);
      const response = await fetch('/api/relationship-brain/import', { method: 'POST', body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Contact import failed.');
      setMessage(`Imported ${result.found} contacts: ${result.created} new, ${result.updated} updated.`);
      await load();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Contact import failed.');
    } finally { setBusy(''); }
  }

  async function saveSettings(patch: Partial<Settings>) {
    if (!settings) return;
    const optimistic = { ...settings, ...patch };
    setSettings(optimistic);
    setError('');
    try {
      const response = await fetch('/api/relationship-brain/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save settings.');
      setSettings(result.settings);
    } catch (settingsError) {
      setSettings(settings);
      setError(settingsError instanceof Error ? settingsError.message : 'Unable to save settings.');
    }
  }

  async function sendBrief() {
    setBusy('brief'); setMessage(''); setError('');
    try {
      const response = await fetch('/api/relationship-brain/daily-brief', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to send the brief.');
      setMessage(`Eva sent the relationship brief to ${result.recipient}.`);
    } catch (briefError) {
      setError(briefError instanceof Error ? briefError.message : 'Unable to send the brief.');
    } finally { setBusy(''); }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#07101d', color: '#f5f7fb', padding: '34px 18px 80px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: '.15em' }}>ARIDON · RELATIONSHIP BRAIN</div>
            <h1 style={{ fontSize: 'clamp(36px,7vw,68px)', margin: '8px 0 12px', lineHeight: .98 }}>Who needs your attention?</h1>
            <p style={{ ...muted, maxWidth: 820, margin: 0 }}>Email, contacts, follow-ups, social relationships and opportunities become one memory layer. Eva ranks the next moves instead of waiting for you to remember them.</p>
          </div>
          <Link href="/executive-ops/control-center" style={{ ...secondaryButton, textDecoration: 'none' }}>Executive Ops</Link>
        </div>

        {error && <div style={{ marginTop: 18, padding: 14, borderRadius: 14, background: '#4b1f2a', border: '1px solid #8b3b50' }}>{error}</div>}
        {message && <div style={{ marginTop: 18, padding: 14, borderRadius: 14, background: '#12382d', border: '1px solid #2d6f59' }}>{message}</div>}

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginTop: 24 }}>
          {[
            ['Relationships', data?.counts.relationships ?? '…'],
            ['Needs attention', data?.counts.needsAttention ?? '…'],
            ['Active opportunities', data?.counts.activeOpportunities ?? '…'],
            ['X connector', xStatus?.connected ? xStatus.account || 'Connected' : xStatus?.configured ? 'Ready to connect' : 'Needs API key'],
          ].map(([label, value]) => <div key={String(label)} style={panel}><div style={{ color: '#8ea4bf', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 900 }}>{label}</div><div style={{ fontSize: 27, fontWeight: 950, marginTop: 7 }}>{value}</div></div>)}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14, marginTop: 14 }}>
          <div style={panel}>
            <h2 style={{ marginTop: 0 }}>Bring the history together</h2>
            <p style={muted}>Scan the last 180 days of Google Workspace activity, match people to the CRM and create missing contacts when permitted.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <button style={button} disabled={Boolean(busy)} onClick={() => sync('/api/relationship-brain/sync-gmail', 'gmail')}>{busy === 'gmail' ? 'Syncing…' : 'Sync Google Workspace'}</button>
              <label style={{ ...secondaryButton, display: 'inline-block' }}>{busy === 'import' ? 'Importing…' : 'Import CSV / VCF'}<input type="file" accept=".csv,.vcf,text/csv,text/vcard" style={{ display: 'none' }} onChange={(event) => { importContacts(event.target.files?.[0] || null); event.currentTarget.value = ''; }} /></label>
            </div>
          </div>

          <div style={panel}>
            <h2 style={{ marginTop: 0 }}>X relationship connector</h2>
            <p style={muted}>{xStatus?.connected ? `Connected as ${xStatus.account}. Aridon can turn mentions into relationship history.` : xStatus?.configured ? 'OAuth is configured and ready for connection.' : `The connector code is installed. Add ${xStatus?.missing?.join(', ') || 'X_CLIENT_ID'} in Vercel to activate it.`}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {!xStatus?.connected && <a href="/api/x/connect?return=/relationship-brain" style={{ ...button, textDecoration: 'none' }}>Connect X</a>}
              {xStatus?.connected && <button style={button} disabled={Boolean(busy)} onClick={() => sync('/api/x/sync', 'x')}>{busy === 'x' ? 'Syncing…' : 'Sync X mentions'}</button>}
            </div>
          </div>

          <div style={panel}>
            <h2 style={{ marginTop: 0 }}>Eva morning brief</h2>
            <p style={muted}>Relationship follow-ups, active opportunities and the next 48 hours of Google Calendar in one owner email.</p>
            {settings && <>
              <label style={{ display: 'flex', gap: 9, alignItems: 'center', marginBottom: 10 }}><input type="checkbox" checked={settings.daily_brief_enabled} onChange={(event) => saveSettings({ daily_brief_enabled: event.target.checked })} />Send daily brief</label>
              <input value={settings.brief_recipient || ''} placeholder="Brief recipient email" onChange={(event) => setSettings({ ...settings, brief_recipient: event.target.value })} onBlur={() => saveSettings({ brief_recipient: settings.brief_recipient })} style={{ width: '100%', boxSizing: 'border-box', padding: 11, borderRadius: 10, border: '1px solid #38506f', background: '#091220', color: '#fff', marginBottom: 10 }} />
              <button style={secondaryButton} disabled={Boolean(busy)} onClick={sendBrief}>{busy === 'brief' ? 'Sending…' : 'Send brief now'}</button>
            </>}
          </div>

          <div style={panel}>
            <h2 style={{ marginTop: 0 }}>Memory rules</h2>
            <p style={muted}>Keep automatic contact creation under your control.</p>
            {settings && <>
              <label style={{ display: 'flex', gap: 9, alignItems: 'center', marginBottom: 10 }}><input type="checkbox" checked={settings.auto_create_contacts} onChange={(event) => saveSettings({ auto_create_contacts: event.target.checked })} />Create missing contacts from Gmail</label>
              <label style={{ display: 'flex', gap: 9, alignItems: 'center' }}><input type="checkbox" checked={settings.x_sync_enabled} onChange={(event) => saveSettings({ x_sync_enabled: event.target.checked })} />Include X in Relationship Brain</label>
            </>}
          </div>
        </section>

        <section style={{ ...panel, marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div><div style={{ color: '#ffb06b', fontSize: 12, fontWeight: 950, letterSpacing: '.12em' }}>EVA ATTENTION QUEUE</div><h2 style={{ fontSize: 31, margin: '6px 0' }}>The relationships most likely to need a move</h2></div>
            <button style={secondaryButton} onClick={load}>Refresh</button>
          </div>
          <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
            {(data?.attention || []).slice(0, 12).map((item) => <article key={item.id} style={{ background: '#091220', border: '1px solid #24344d', borderRadius: 16, padding: 15, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}><strong style={{ fontSize: 18 }}>{item.name}</strong>{item.company && <span style={{ color: '#9fb0c7' }}>· {item.company}</span>}<span style={{ borderRadius: 999, padding: '3px 7px', background: '#17253a', fontSize: 11, fontWeight: 900 }}>{item.status || 'new'}</span></div>
                <div style={{ marginTop: 7 }}>{item.recommendedNextAction}</div>
                <div style={{ ...muted, marginTop: 5, fontSize: 13 }}>{item.reasons?.join(' · ') || 'Review the relationship'}</div>
              </div>
              <div style={{ minWidth: 76, textAlign: 'center' }}><div style={{ color: scoreColor(item.attentionScore), fontSize: 25, fontWeight: 950 }}>{item.attentionScore}</div><div style={{ color: '#7f94ad', fontSize: 10, fontWeight: 900 }}>ATTENTION</div></div>
            </article>)}
            {data && data.attention.length === 0 && <p style={muted}>Nothing is over the attention threshold right now. That is a pleasantly quiet dashboard.</p>}
          </div>
        </section>

        <section style={{ ...panel, marginTop: 14 }}>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <div><h2 style={{ margin: 0 }}>Relationship directory</h2><p style={{ ...muted, marginBottom: 0 }}>One place for CRM contacts, imported contacts and automatically discovered relationships.</p></div>
            <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search people, companies, email…" style={{ width: 300, maxWidth: '100%', padding: 11, borderRadius: 11, border: '1px solid #38506f', background: '#091220', color: '#fff' }} />
          </div>
          <div style={{ overflowX: 'auto', marginTop: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead><tr>{['Relationship', 'Contact', 'Status', 'Interactions', 'Relationship', 'Next move'].map((head) => <th key={head} style={{ textAlign: 'left', padding: '10px 8px', color: '#8298b2', fontSize: 11, letterSpacing: '.08em' }}>{head}</th>)}</tr></thead>
              <tbody>{filteredRelationships.map((item) => <tr key={item.id} style={{ borderTop: '1px solid #1e2d42' }}>
                <td style={{ padding: '12px 8px' }}><strong>{item.name}</strong><div style={{ color: '#8ea4bf', fontSize: 12 }}>{item.title || item.company || ''}</div></td>
                <td style={{ padding: '12px 8px', color: '#b7c5d6' }}>{item.email || (item.social_handle ? `@${item.social_handle}` : item.phone || '—')}</td>
                <td style={{ padding: '12px 8px' }}>{item.status || 'new'}</td>
                <td style={{ padding: '12px 8px' }}>{item.interactionCount}</td>
                <td style={{ padding: '12px 8px', fontWeight: 900, color: scoreColor(item.relationshipScore) }}>{item.relationshipScore}</td>
                <td style={{ padding: '12px 8px', color: '#c7d3e0' }}>{item.recommendedNextAction}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
