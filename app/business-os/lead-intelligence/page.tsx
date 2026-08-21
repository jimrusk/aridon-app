'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Building2, CheckCircle2, Loader2, Mail, MapPin, Phone, Radar, Search, Sparkles, Target, UserRound } from 'lucide-react';

type Lead = {
  company: string;
  website: string;
  location: string;
  contactName: string;
  title: string;
  email?: string;
  phone?: string;
  signals: string[];
  score: number;
  whyNow: string;
  suggestedPitch: string;
  source: string;
};

export default function LeadIntelligencePage() {
  const [industry, setIndustry] = useState('');
  const [geography, setGeography] = useState('');
  const [need, setNeed] = useState('');
  const [role, setRole] = useState('Owner / CEO');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'idle' | 'demo' | 'live'>('idle');
  const [message, setMessage] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);

  const averageScore = useMemo(() => {
    if (!leads.length) return 0;
    return Math.round(leads.reduce((sum, lead) => sum + lead.score, 0) / leads.length);
  }, [leads]);

  async function runSearch() {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/lead-intelligence/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry, geography, need, role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Lead search failed.');
      setMode(data.mode === 'live' ? 'live' : 'demo');
      setMessage(data.message || '');
      setLeads(Array.isArray(data.leads) ? data.leads : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lead search failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.16),_transparent_35%),radial-gradient(circle_at_top_left,_rgba(99,102,241,0.14),_transparent_30%)]">
        <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-sm text-sky-200">
                <Radar className="h-4 w-4" /> Aridon Lead Intelligence Engine
              </div>
              <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">Find the companies that need you <span className="text-sky-300">now.</span></h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">Discover, enrich, score, explain, pitch, and route opportunities into a sales workflow. Aridon focuses on the reason a prospect is worth contacting, not just another row in a contact database.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Stat label="Leads" value={String(leads.length)} />
              <Stat label="Avg score" value={averageScore ? String(averageScore) : '—'} />
              <Stat label="Mode" value={mode === 'live' ? 'LIVE' : mode === 'demo' ? 'DEMO' : 'READY'} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8 lg:grid-cols-[390px_1fr]">
        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 lg:sticky lg:top-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-400/10 p-3"><Target className="h-5 w-5 text-sky-300" /></div>
            <div><h2 className="font-semibold">Build a target</h2><p className="text-sm text-slate-400">Tell Aridon who should be on the radar.</p></div>
          </div>

          <div className="mt-6 space-y-4">
            <Field label="Industry or business type" value={industry} onChange={setIndustry} placeholder="e.g. HVAC contractors, manufacturers" />
            <Field label="Geography" value={geography} onChange={setGeography} placeholder="e.g. New Mexico, Southwest, USA" />
            <Field label="Business need / buying signal" value={need} onChange={setNeed} placeholder="e.g. needs more customers, expanding, weak website" textarea />
            <Field label="Decision-maker role" value={role} onChange={setRole} placeholder="Owner / CEO" />
          </div>

          <button onClick={runSearch} disabled={loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-400 px-4 py-3.5 font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            {loading ? 'Scanning market…' : 'Find opportunities'}
          </button>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            <div className="mb-2 flex items-center gap-2 font-medium text-white"><Sparkles className="h-4 w-4 text-amber-300" /> Aridon workflow</div>
            <p>Find → Verify → Detect Need → Score → Explain Why → Create Pitch → Contact → Follow Up → Measure → Learn.</p>
          </div>
        </aside>

        <div>
          {error && <div className="mb-5 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-rose-100">{error}</div>}
          {message && <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">{message}</div>}

          {!leads.length && !loading ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.025] p-10 text-center md:p-16">
              <Radar className="mx-auto h-10 w-10 text-sky-300" />
              <h2 className="mt-5 text-2xl font-semibold">The radar is ready.</h2>
              <p className="mx-auto mt-3 max-w-xl text-slate-400">Set the market, the pain point, and who buys. Aridon will rank opportunities by fit, contact completeness, and detected business signals.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leads.map((lead, index) => <LeadCard key={`${lead.company}-${index}`} lead={lead} />)}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 md:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-indigo-400/10 p-3"><Building2 className="h-5 w-5 text-indigo-300" /></div>
            <div>
              <h3 className="text-xl font-semibold">{lead.company}</h3>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                {lead.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{lead.location}</span>}
                {lead.source && <span>{lead.source}</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="shrink-0 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-center">
          <div className="text-2xl font-semibold text-emerald-200">{lead.score}</div><div className="text-[11px] uppercase tracking-wider text-emerald-300/70">Opportunity score</div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <Panel title="Decision maker" icon={<UserRound className="h-4 w-4" />}>
          <p className="font-medium text-white">{lead.contactName || 'Not enriched yet'}</p>
          <p className="text-sm text-slate-400">{lead.title || 'Target role not identified'}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {lead.email && <span className="flex items-center gap-1.5 text-sky-200"><Mail className="h-4 w-4" />{lead.email}</span>}
            {lead.phone && <span className="flex items-center gap-1.5 text-sky-200"><Phone className="h-4 w-4" />{lead.phone}</span>}
          </div>
        </Panel>
        <Panel title="Why now" icon={<CheckCircle2 className="h-4 w-4" />}>
          <p className="text-sm leading-6 text-slate-300">{lead.whyNow}</p>
        </Panel>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Detected signals</div>
        <div className="mt-2 flex flex-wrap gap-2">{lead.signals.map((signal) => <span key={signal} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">{signal}</span>)}</div>
      </div>

      <div className="mt-3 rounded-2xl border border-sky-300/15 bg-sky-300/[0.06] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-sky-200"><Sparkles className="h-4 w-4" /> Suggested angle</div>
        <p className="mt-2 text-sm leading-6 text-slate-300">{lead.suggestedPitch}</p>
        <button className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-sky-300 hover:text-sky-200">Move to outreach <ArrowRight className="h-4 w-4" /></button>
      </div>
    </article>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">{icon}{title}</div>{children}</div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="min-w-24 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3"><div className="text-lg font-semibold">{value}</div><div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div></div>;
}

function Field({ label, value, onChange, placeholder, textarea = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; textarea?: boolean }) {
  const className = 'mt-1.5 w-full rounded-2xl border border-white/10 bg-black/25 px-3.5 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-sky-400/40 focus:ring-2 focus:ring-sky-400/10';
  return <label className="block text-sm text-slate-300"><span>{label}</span>{textarea ? <textarea rows={3} className={className} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /> : <input className={className} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />}</label>;
}
