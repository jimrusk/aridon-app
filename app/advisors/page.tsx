'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';

type Mode = 'competitor' | 'challenge' | 'investor' | 'cfo';

type Field = {
  id: string;
  label: string;
  placeholder: string;
  rows?: number;
};

type ModuleConfig = {
  title: string;
  short: string;
  icon: string;
  accent: string;
  webDefault: boolean;
  fields: Field[];
};

type AdvisorResult = {
  mode: Mode;
  label: string;
  model: string;
  researchWeb: boolean;
  report: string;
  sources: Array<{ title: string; url: string }>;
  generatedAt: string;
};

const modules: Record<Mode, ModuleConfig> = {
  competitor: {
    title: 'Competitor Intelligence',
    short: 'Find who can beat us, why, and where Aridon can take ground.',
    icon: '◎',
    accent: '#E74C3C',
    webDefault: true,
    fields: [
      {
        id: 'Target company, market, or URL',
        label: 'Who or what are we analyzing?',
        placeholder: 'Company name, website, technology category, market, or competing solution.',
      },
      {
        id: 'Aridon offer or project being compared',
        label: 'What are we bringing to the fight?',
        placeholder: 'Example: AWG-1000 paid feasibility pilot for drought-stressed municipal or Tribal water systems.',
        rows: 4,
      },
      {
        id: 'Buyer and geography',
        label: 'Who is the buyer and where?',
        placeholder: 'Utilities, Tribal authorities, data centers, oil & gas, municipalities; New Mexico, Southwest, national, etc.',
      },
      {
        id: 'Decision we need to make',
        label: 'What decision should this analysis support?',
        placeholder: 'Positioning, partnership, pricing, outreach, bid/no-bid, pilot selection, investor story, etc.',
        rows: 3,
      },
    ],
  },
  challenge: {
    title: 'CEO Challenge Room',
    short: 'Put the plan on the steel table before the market does.',
    icon: '⚑',
    accent: '#C9A7FF',
    webDefault: false,
    fields: [
      {
        id: 'Decision or proposal',
        label: 'What are we considering?',
        placeholder: 'State the decision, proposal, pilot, partnership, launch, or investment in plain English.',
        rows: 5,
      },
      {
        id: 'Facts and evidence we have',
        label: 'What evidence supports it?',
        placeholder: 'Customer conversations, engineering data, articles, pricing, grant rules, letters, commitments, test results, etc.',
        rows: 5,
      },
      {
        id: 'Assumptions or beliefs',
        label: 'What are we assuming?',
        placeholder: 'What must be true for the plan to work, even if we have not proven it yet?',
        rows: 4,
      },
      {
        id: 'Constraints and stakes',
        label: 'What can we not afford to get wrong?',
        placeholder: 'Cash, timeline, credibility, regulatory limits, engineering claims, partner relationships, founder time, etc.',
        rows: 4,
      },
    ],
  },
  investor: {
    title: 'Investor Interrogation',
    short: 'Hear the hard questions before they are asked across the table.',
    icon: '◆',
    accent: '#FFB454',
    webDefault: true,
    fields: [
      {
        id: 'Company or project',
        label: 'What are we raising around?',
        placeholder: 'Aridon company raise, AWG-1000 pilot, manufacturing facility, project SPV, etc.',
        rows: 4,
      },
      {
        id: 'Capital ask and use of funds',
        label: 'How much and what does it buy?',
        placeholder: '$ amount, structure if known, use of proceeds, and milestones the capital should unlock.',
        rows: 4,
      },
      {
        id: 'Evidence and traction',
        label: 'What proof do we have today?',
        placeholder: 'Revenue, pilots, LOIs, customer conversations, engineering validation, patents, partnerships, grants, manufacturing quotes, etc.',
        rows: 5,
      },
      {
        id: 'Investor or partner target',
        label: 'Who are we trying to convince?',
        placeholder: 'Named investor, infrastructure fund, strategic manufacturer, family office, climate fund, economic-development partner, etc.',
        rows: 3,
      },
    ],
  },
  cfo: {
    title: 'CFO Stress Test',
    short: 'Turn attractive economics into numbers that can survive daylight.',
    icon: '▦',
    accent: '#42D392',
    webDefault: false,
    fields: [
      {
        id: 'Business model or project economics',
        label: 'What are we selling and how do we get paid?',
        placeholder: 'Unit sale, paid feasibility, lease, water offtake, O&M, project fee, licensing, subscription, etc.',
        rows: 4,
      },
      {
        id: 'Known numbers',
        label: 'Give Ledger every number we have.',
        placeholder: 'Price, unit cost, labor, freight, installation, energy, output, utilization, monthly overhead, financing, payment terms, volume, etc.',
        rows: 7,
      },
      {
        id: 'Funding and timing',
        label: 'What cash arrives and when?',
        placeholder: 'Deposits, grants, investor money, customer payments, construction schedule, receivables, supplier terms, etc.',
        rows: 4,
      },
      {
        id: 'Financial decision',
        label: 'What do we need to decide?',
        placeholder: 'Price quote, build/no-build, hire timing, pilot budget, manufacturing scale, financing need, target margin, etc.',
        rows: 3,
      },
    ],
  },
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default function AdvisorsPage() {
  const [mode, setMode] = useState<Mode>('competitor');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [researchWeb, setResearchWeb] = useState(modules.competitor.webDefault);
  const [result, setResult] = useState<AdvisorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [archiving, setArchiving] = useState(false);

  const active = modules[mode];
  const filled = useMemo(
    () => active.fields.filter((field) => (answers[field.id] || '').trim()).length,
    [active.fields, answers],
  );

  function chooseMode(next: Mode) {
    setMode(next);
    setAnswers({});
    setResult(null);
    setNotice('');
    setResearchWeb(modules[next].webDefault);
  }

  async function runAnalysis(event: FormEvent) {
    event.preventDefault();
    if (!filled) {
      setNotice('Add the facts you already have so the executive team has something real to pressure-test.');
      return;
    }

    setLoading(true);
    setNotice('');
    setResult(null);

    const response = await fetch('/api/advisors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, answers, researchWeb }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setNotice(data.error || 'The executive analysis could not be completed.');
      setLoading(false);
      return;
    }

    setResult(data as AdvisorResult);
    setLoading(false);
  }

  async function archiveResult() {
    if (!result) return;
    setArchiving(true);
    setNotice('');

    const subject =
      Object.values(answers).find((value) => value.trim())?.trim().slice(0, 110) || 'Aridon analysis';
    const sourceBlock = result.sources.length
      ? `\n\nSOURCES\n${result.sources.map((source) => `- ${source.title}: ${source.url}`).join('\n')}`
      : '';

    const response = await fetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `${result.label} — ${subject}`,
        category: `Research - ${result.label}`,
        content: `${result.report}${sourceBlock}`,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setNotice(data.error || 'The report could not be archived.');
    } else {
      setNotice('Saved to the Aridon Intelligence Center and Knowledge Vault.');
    }
    setArchiving(false);
  }

  async function copyReport() {
    if (!result) return;
    await navigator.clipboard.writeText(result.report);
    setNotice('Report copied.');
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 13% 0%, rgba(201,167,255,0.13), transparent 30%), radial-gradient(circle at 82% 10%, rgba(66,211,146,0.09), transparent 28%), #070A12',
        color: '#F5F7FB',
        padding: '28px 18px 120px',
      }}
    >
      <div style={{ maxWidth: '1220px', margin: '0 auto' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '18px',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            marginBottom: '24px',
          }}
        >
          <div>
            <div
              style={{
                color: '#C9A7FF',
                fontSize: '12px',
                fontWeight: 950,
                letterSpacing: '1.5px',
                marginBottom: '8px',
              }}
            >
              ARIDON EXECUTIVE CHALLENGE SUITE
            </div>
            <h1 style={{ margin: 0, fontSize: 'clamp(32px, 7vw, 56px)', lineHeight: 1 }}>
              Think harder. Then execute.
            </h1>
            <p style={{ color: '#AAB5CA', maxWidth: '790px', lineHeight: 1.6, marginBottom: 0 }}>
              Four pressure-test rooms for competitive intelligence, founder decisions, investor diligence,
              and financial stress. The job is not to agree with the idea. The job is to make the idea survive.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap' }}>
            <Link href="/intelligence" style={topLinkStyle}>Morning Intel</Link>
            <Link href="/execution" style={topLinkStyle}>Execution Engine</Link>
            <Link href="/" style={topLinkStyle}>Command Center</Link>
          </div>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            marginBottom: '18px',
          }}
        >
          {(Object.keys(modules) as Mode[]).map((key) => {
            const item = modules[key];
            const selected = mode === key;
            return (
              <button
                key={key}
                onClick={() => chooseMode(key)}
                style={{
                  background: selected ? `${item.accent}18` : '#0D1321',
                  border: `1px solid ${selected ? item.accent : '#26324B'}`,
                  borderTop: `3px solid ${item.accent}`,
                  borderRadius: '16px',
                  padding: '18px',
                  color: '#F5F7FB',
                  textAlign: 'left',
                  cursor: 'pointer',
                  minHeight: '142px',
                }}
              >
                <div style={{ color: item.accent, fontSize: '25px', fontWeight: 900 }}>{item.icon}</div>
                <div style={{ fontSize: '17px', fontWeight: 900, margin: '9px 0 5px' }}>{item.title}</div>
                <div style={{ color: '#95A3BE', lineHeight: 1.45, fontSize: '13px' }}>{item.short}</div>
              </button>
            );
          })}
        </section>

        {notice && (
          <div
            style={{
              background: '#2A1D13',
              border: '1px solid #FFB45455',
              color: '#FFD8A7',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '16px',
            }}
          >
            {notice}
          </div>
        )}

        <div className="advisor-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 0.8fr) minmax(0, 1.35fr)', gap: '18px', alignItems: 'start' }}>
          <section
            style={{
              background: '#0C111E',
              border: '1px solid #232F47',
              borderRadius: '18px',
              padding: '19px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: active.accent, fontWeight: 950, fontSize: '12px', letterSpacing: '0.8px' }}>
                  {active.icon} ACTIVE ROOM
                </div>
                <h2 style={{ margin: '6px 0 5px' }}>{active.title}</h2>
              </div>
              <span style={{ color: '#7F8BA5', fontSize: '12px' }}>{filled}/{active.fields.length} fields</span>
            </div>

            <form onSubmit={runAnalysis} style={{ display: 'grid', gap: '14px', marginTop: '16px' }}>
              {active.fields.map((field) => (
                <label key={field.id} style={{ display: 'grid', gap: '6px', color: '#CAD3E3', fontSize: '13px', fontWeight: 750 }}>
                  {field.label}
                  <textarea
                    value={answers[field.id] || ''}
                    onChange={(event) => setAnswers({ ...answers, [field.id]: event.target.value })}
                    placeholder={field.placeholder}
                    rows={field.rows || 3}
                    maxLength={8000}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: '#080D17',
                      color: '#F5F7FB',
                      border: '1px solid #303C57',
                      borderRadius: '10px',
                      padding: '11px 12px',
                      resize: 'vertical',
                      lineHeight: 1.5,
                      fontFamily: 'inherit',
                    }}
                  />
                </label>
              ))}

              <label
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                  background: '#101725',
                  border: '1px solid #28344E',
                  borderRadius: '11px',
                  padding: '11px',
                  color: '#B9C4D7',
                  fontSize: '13px',
                  lineHeight: 1.45,
                }}
              >
                <input
                  type="checkbox"
                  checked={researchWeb}
                  onChange={(event) => setResearchWeb(event.target.checked)}
                  style={{ marginTop: '3px' }}
                />
                <span>
                  <strong style={{ color: '#F5F7FB' }}>Use live web research</strong><br />
                  Best for competitors, investors, public projects, markets, regulations, and current claims.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                style={{
                  border: 0,
                  background: `linear-gradient(135deg, ${active.accent}, #F4F7FC)`,
                  color: '#0A0D13',
                  borderRadius: '11px',
                  padding: '13px 15px',
                  fontWeight: 950,
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: loading ? 0.72 : 1,
                }}
              >
                {loading ? 'Executive team is working…' : `Run ${active.title}`}
              </button>
            </form>
          </section>

          <section
            style={{
              background: '#0C111E',
              border: '1px solid #232F47',
              borderRadius: '18px',
              padding: '19px',
              minHeight: '560px',
            }}
          >
            {!result && !loading && (
              <div
                style={{
                  minHeight: '520px',
                  display: 'grid',
                  placeItems: 'center',
                  textAlign: 'center',
                  color: '#8795B0',
                  padding: '24px',
                }}
              >
                <div>
                  <div style={{ fontSize: '56px', color: active.accent, marginBottom: '12px' }}>{active.icon}</div>
                  <h2 style={{ color: '#F5F7FB', marginBottom: '8px' }}>The chair is empty until you bring a decision.</h2>
                  <p style={{ maxWidth: '560px', lineHeight: 1.65, margin: 0 }}>
                    Give the team the facts you have. It will separate evidence from assumptions, challenge weak points,
                    and finish with three executable actions.
                  </p>
                </div>
              </div>
            )}

            {loading && (
              <div style={{ minHeight: '520px', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                <div>
                  <div className="pulse-dot" style={{ width: '54px', height: '54px', margin: '0 auto 18px', borderRadius: '50%', background: active.accent }} />
                  <h2 style={{ margin: '0 0 8px' }}>Pressure-testing the plan…</h2>
                  <p style={{ color: '#93A0B8', margin: 0 }}>
                    {researchWeb ? 'Researching current public evidence and challenging the assumptions.' : 'Challenging the assumptions against the facts you supplied.'}
                  </p>
                </div>
              </div>
            )}

            {result && !loading && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '12px',
                    flexWrap: 'wrap',
                    borderBottom: '1px solid #243049',
                    paddingBottom: '14px',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <div style={{ color: active.accent, fontWeight: 950, fontSize: '12px', letterSpacing: '0.7px' }}>
                      COMPLETED · {result.researchWeb ? 'LIVE RESEARCH' : 'FOUNDER EVIDENCE'}
                    </div>
                    <h2 style={{ margin: '5px 0 3px' }}>{result.label}</h2>
                    <div style={{ color: '#7E8CA8', fontSize: '12px' }}>
                      {formatDate(result.generatedAt)} · {result.model}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={copyReport} style={smallButtonStyle}>Copy</button>
                    <button onClick={archiveResult} disabled={archiving} style={smallButtonStyle}>
                      {archiving ? 'Saving…' : 'Archive in Aridon'}
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.67,
                    color: '#DCE4F2',
                    fontSize: '14px',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {result.report}
                </div>

                {result.sources.length > 0 && (
                  <div style={{ borderTop: '1px solid #243049', marginTop: '20px', paddingTop: '16px' }}>
                    <h3 style={{ margin: '0 0 10px' }}>Live research sources</h3>
                    <div style={{ display: 'grid', gap: '7px' }}>
                      {result.sources.map((source) => (
                        <a
                          key={source.url}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#8FC5FF', fontSize: '13px', overflowWrap: 'anywhere' }}
                        >
                          {source.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 860px) {
          .advisor-layout {
            grid-template-columns: 1fr !important;
          }
        }
        @keyframes advisorPulse {
          0%, 100% { opacity: 0.35; transform: scale(0.94); }
          50% { opacity: 1; transform: scale(1.06); }
        }
        .pulse-dot { animation: advisorPulse 1.35s ease-in-out infinite; }
      `}</style>
    </main>
  );
}

const topLinkStyle = {
  border: '1px solid #303C57',
  background: '#101725',
  color: '#F5F7FB',
  borderRadius: '11px',
  padding: '10px 13px',
  textDecoration: 'none',
  fontWeight: 850,
  fontSize: '13px',
} as const;

const smallButtonStyle = {
  border: '1px solid #35415D',
  background: '#111827',
  color: '#E7EDF7',
  borderRadius: '9px',
  padding: '8px 10px',
  cursor: 'pointer',
  fontWeight: 800,
  fontSize: '12px',
} as const;
