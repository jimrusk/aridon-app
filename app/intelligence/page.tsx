'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';

type Category = 'Morning Brief' | 'Funding Watch' | 'Opportunity' | 'Research';

type GmailBrief = {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  body: string;
  category: Category;
  source: 'Gmail';
};

type KnowledgeItem = {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at?: string;
};

type FeedItem = {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: Category;
  date: string;
  source: string;
};

const categoryOrder: Category[] = [
  'Morning Brief',
  'Funding Watch',
  'Opportunity',
  'Research',
];

const categoryAccent: Record<Category, string> = {
  'Morning Brief': '#65B7FF',
  'Funding Watch': '#42D392',
  Opportunity: '#FFB454',
  Research: '#C9A7FF',
};

function normalizeCategory(value: string): Category {
  const normalized = value.toLowerCase();
  if (normalized.includes('fund')) return 'Funding Watch';
  if (normalized.includes('opportun') || normalized.includes('groundwater')) {
    return 'Opportunity';
  }
  if (normalized.includes('morning') || normalized.includes('brief')) {
    return 'Morning Brief';
  }
  return 'Research';
}

function formatDate(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value || 'Date unavailable';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(parsed));
}

function cleanPreview(value: string, max = 320) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > max ? `${normalized.slice(0, max).trim()}…` : normalized;
}

export default function IntelligencePage() {
  const [gmailBriefs, setGmailBriefs] = useState<GmailBrief[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<'All' | Category>('All');
  const [expandedId, setExpandedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'Research' as Category,
    content: '',
  });

  async function loadFeed() {
    setLoading(true);
    setNotice('');

    const [gmailResult, knowledgeResult] = await Promise.allSettled([
      fetch('/api/gmail/intelligence', { cache: 'no-store' }),
      fetch('/api/knowledge', { cache: 'no-store' }),
    ]);

    if (gmailResult.status === 'fulfilled') {
      const data = await gmailResult.value.json().catch(() => ({}));
      setGmailConnected(Boolean(data.connected));
      setGmailBriefs(Array.isArray(data.briefs) ? data.briefs : []);
      if (!gmailResult.value.ok && data.message) setNotice(data.message);
      if (!gmailResult.value.ok && data.error) setNotice(data.error);
    } else {
      setNotice('The Gmail briefing feed could not be reached.');
    }

    if (knowledgeResult.status === 'fulfilled') {
      const data = await knowledgeResult.value.json().catch(() => []);
      setKnowledge(Array.isArray(data) ? data : []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadFeed();
  }, []);

  const feed = useMemo<FeedItem[]>(() => {
    const emailItems = gmailBriefs.map((item) => ({
      id: `gmail-${item.id}`,
      title: item.subject,
      content: item.body || item.snippet,
      summary: cleanPreview(item.snippet || item.body),
      category: item.category,
      date: item.date,
      source: 'Morning delivery',
    }));

    const archivedItems = knowledge
      .filter((item) => {
        const category = item.category?.toLowerCase() || '';
        return (
          category.includes('brief') ||
          category.includes('fund') ||
          category.includes('opportun') ||
          category.includes('research') ||
          category.includes('groundwater') ||
          category.includes('awg')
        );
      })
      .map((item) => ({
        id: `vault-${item.id}`,
        title: item.title,
        content: item.content,
        summary: cleanPreview(item.content),
        category: normalizeCategory(item.category),
        date: item.created_at || '',
        source: 'Research Vault',
      }));

    const seen = new Set<string>();
    return [...emailItems, ...archivedItems]
      .filter((item) => {
        const key = `${item.title.toLowerCase()}|${item.date.slice(0, 10)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => Date.parse(b.date || '') - Date.parse(a.date || ''));
  }, [gmailBriefs, knowledge]);

  const visibleFeed =
    activeCategory === 'All'
      ? feed
      : feed.filter((item) => item.category === activeCategory);

  const counts = useMemo(() => {
    return categoryOrder.reduce<Record<Category, number>>(
      (result, category) => {
        result[category] = feed.filter((item) => item.category === category).length;
        return result;
      },
      {
        'Morning Brief': 0,
        'Funding Watch': 0,
        Opportunity: 0,
        Research: 0,
      },
    );
  }, [feed]);

  async function archiveResearch(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;

    setSaving(true);
    setNotice('');
    const response = await fetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        category: form.category,
        content: form.content,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setNotice(data.error || 'The research item could not be archived.');
      setSaving(false);
      return;
    }

    setForm({ title: '', category: 'Research', content: '' });
    setNotice('Research archived in the Aridon Intelligence Center.');
    setSaving(false);
    await loadFeed();
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, rgba(74,144,217,0.16), transparent 34%), #070A12',
        color: '#F6F8FC',
        padding: '28px 18px 110px',
      }}
    >
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '18px',
            flexWrap: 'wrap',
            marginBottom: '24px',
          }}
        >
          <div>
            <div
              style={{
                color: '#FFB454',
                fontSize: '12px',
                fontWeight: 900,
                letterSpacing: '1.6px',
                marginBottom: '8px',
              }}
            >
              ARIDON INTELLIGENCE CENTER
            </div>
            <h1 style={{ margin: 0, fontSize: 'clamp(30px, 7vw, 54px)', lineHeight: 1 }}>
              Morning Briefs &amp; Opportunity Radar
            </h1>
            <p style={{ color: '#A8B3CC', maxWidth: '760px', lineHeight: 1.6 }}>
              One home for the 5:00 a.m. Mountain briefing, AWG funding watch,
              groundwater opportunities, investor signals, and every useful piece of Aridon research.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={loadFeed}
              disabled={loading}
              style={{
                border: '1px solid #31405F',
                background: '#11182A',
                color: '#F6F8FC',
                padding: '11px 15px',
                borderRadius: '12px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {loading ? 'Refreshing…' : '↻ Refresh'}
            </button>
            <Link
              href="/"
              style={{
                border: '1px solid #31405F',
                background: '#11182A',
                color: '#F6F8FC',
                padding: '11px 15px',
                borderRadius: '12px',
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              Command Center
            </Link>
          </div>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          {categoryOrder.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              style={{
                textAlign: 'left',
                background: '#0F1523',
                border: `1px solid ${categoryAccent[category]}55`,
                borderTop: `3px solid ${categoryAccent[category]}`,
                borderRadius: '16px',
                padding: '18px',
                color: '#F6F8FC',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '34px', fontWeight: 950 }}>{counts[category]}</div>
              <div style={{ color: '#A8B3CC', fontWeight: 750 }}>{category}</div>
            </button>
          ))}
        </section>

        {!gmailConnected && (
          <section
            style={{
              background: '#172015',
              border: '1px solid #42D39255',
              borderRadius: '16px',
              padding: '17px',
              marginBottom: '20px',
            }}
          >
            <strong>Connect Gmail once to turn on automatic morning-brief import.</strong>
            <div style={{ color: '#B8C8B8', marginTop: '6px', lineHeight: 1.5 }}>
              The connection will read only the matching Aridon briefing messages and retain the existing
              approval gate for outgoing email.
            </div>
            <a
              href="/api/gmail/connect"
              style={{
                display: 'inline-block',
                marginTop: '12px',
                background: '#42D392',
                color: '#07120D',
                padding: '10px 14px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: 900,
              }}
            >
              Connect or reconnect Gmail
            </a>
          </section>
        )}

        {notice && (
          <div
            style={{
              background: '#2A1B12',
              border: '1px solid #FFB45455',
              color: '#FFD8A6',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '18px',
            }}
          >
            {notice}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.7fr) minmax(280px, 0.8fr)',
            gap: '18px',
            alignItems: 'start',
          }}
          className="intelligence-layout"
        >
          <section
            style={{
              background: '#0C111E',
              border: '1px solid #202B43',
              borderRadius: '18px',
              padding: '18px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
                alignItems: 'center',
                flexWrap: 'wrap',
                marginBottom: '14px',
              }}
            >
              <h2 style={{ margin: 0 }}>Intelligence Feed</h2>
              <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                {(['All', ...categoryOrder] as const).map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    style={{
                      border: '1px solid #2C3854',
                      background: activeCategory === category ? '#22304D' : '#11182A',
                      color: '#E9EEF8',
                      borderRadius: '999px',
                      padding: '7px 10px',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {loading && <p style={{ color: '#A8B3CC' }}>Gathering the morning signal…</p>}

            {!loading && visibleFeed.length === 0 && (
              <div
                style={{
                  border: '1px dashed #34415E',
                  borderRadius: '14px',
                  padding: '24px',
                  color: '#A8B3CC',
                  lineHeight: 1.6,
                }}
              >
                No entries are visible in this category yet. Connect Gmail or archive the first research
                item using the panel beside the feed.
              </div>
            )}

            <div style={{ display: 'grid', gap: '12px' }}>
              {visibleFeed.map((item) => {
                const expanded = expandedId === item.id;
                return (
                  <article
                    key={item.id}
                    style={{
                      background: '#11182A',
                      border: '1px solid #263350',
                      borderLeft: `4px solid ${categoryAccent[item.category]}`,
                      borderRadius: '14px',
                      padding: '16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '14px',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: categoryAccent[item.category],
                            fontSize: '11px',
                            fontWeight: 950,
                            letterSpacing: '0.7px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {item.category} · {item.source}
                        </div>
                        <h3 style={{ margin: '7px 0 4px', fontSize: '19px' }}>{item.title}</h3>
                        <div style={{ color: '#7F8DAA', fontSize: '12px' }}>
                          {formatDate(item.date)}
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedId(expanded ? '' : item.id)}
                        style={{
                          border: '1px solid #35415D',
                          background: '#0A0F1B',
                          color: '#DCE4F3',
                          borderRadius: '9px',
                          padding: '8px 10px',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        {expanded ? 'Close' : 'Read'}
                      </button>
                    </div>
                    <p
                      style={{
                        color: '#B6C0D5',
                        lineHeight: 1.65,
                        whiteSpace: expanded ? 'pre-wrap' : 'normal',
                        marginBottom: 0,
                      }}
                    >
                      {expanded ? item.content : item.summary}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          <aside
            style={{
              background: '#0C111E',
              border: '1px solid #202B43',
              borderRadius: '18px',
              padding: '18px',
              position: 'sticky',
              top: '18px',
            }}
          >
            <h2 style={{ marginTop: 0 }}>Archive New Research</h2>
            <p style={{ color: '#A8B3CC', lineHeight: 1.55, fontSize: '14px' }}>
              Drop in any contact lead, grant finding, article, pilot idea, or research note so it stays with
              Aridon instead of disappearing into the chat stream.
            </p>
            <form onSubmit={archiveResearch} style={{ display: 'grid', gap: '13px' }}>
              <label style={{ display: 'grid', gap: '6px', color: '#C6D0E2', fontSize: '13px' }}>
                Title
                <input
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  maxLength={200}
                  required
                  style={{
                    background: '#080D17',
                    color: '#F6F8FC',
                    border: '1px solid #303D5A',
                    borderRadius: '10px',
                    padding: '11px',
                  }}
                />
              </label>
              <label style={{ display: 'grid', gap: '6px', color: '#C6D0E2', fontSize: '13px' }}>
                Category
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value as Category })
                  }
                  style={{
                    background: '#080D17',
                    color: '#F6F8FC',
                    border: '1px solid #303D5A',
                    borderRadius: '10px',
                    padding: '11px',
                  }}
                >
                  {categoryOrder.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'grid', gap: '6px', color: '#C6D0E2', fontSize: '13px' }}>
                Details, source, and next action
                <textarea
                  value={form.content}
                  onChange={(event) => setForm({ ...form, content: event.target.value })}
                  rows={12}
                  maxLength={50000}
                  required
                  style={{
                    background: '#080D17',
                    color: '#F6F8FC',
                    border: '1px solid #303D5A',
                    borderRadius: '10px',
                    padding: '11px',
                    resize: 'vertical',
                    lineHeight: 1.5,
                  }}
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                style={{
                  border: 0,
                  background: 'linear-gradient(135deg, #FF9A38, #FFD27A)',
                  color: '#17120B',
                  borderRadius: '11px',
                  padding: '12px 14px',
                  fontWeight: 950,
                  cursor: saving ? 'wait' : 'pointer',
                }}
              >
                {saving ? 'Archiving…' : 'Archive in Aridon'}
              </button>
            </form>
          </aside>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 820px) {
          .intelligence-layout {
            grid-template-columns: 1fr !important;
          }
          aside {
            position: static !important;
          }
        }
      `}</style>
    </main>
  );
}
