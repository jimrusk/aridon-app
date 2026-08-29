'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, BadgeDollarSign, CheckCircle2, ExternalLink, Landmark, MapPinned, Search, ShieldCheck, Sparkles, Tractor } from 'lucide-react';

type Profile = {
  state: string;
  county: string;
  producer: string;
  need: string;
  tribe: string;
  projectCost: string;
};

const sourceGroups = [
  'County conservation & soil/water districts',
  'County extension & local agriculture offices',
  'State departments of agriculture & water agencies',
  'USDA NRCS, FSA, Rural Development & RMA',
  'Tribal agriculture, water & resilience programs',
  'Irrigation districts, water authorities & utilities',
  'Rural electric cooperatives & energy rebates',
  'Economic development groups, foundations & lenders',
];

const projectTypes = [
  'Irrigation upgrade',
  'Water security / AWG',
  'Well rehabilitation',
  'Livestock water',
  'Greenhouse / controlled environment',
  'Solar / farm energy',
  'Equipment',
  'Soil / land improvement',
  'Drought resilience',
  'Storage / processing',
  'Workforce / labor',
];

export default function FundingHunterPage() {
  const [profile, setProfile] = useState<Profile>({
    state: 'New Mexico',
    county: '',
    producer: 'farmer or rancher',
    need: 'irrigation and water security',
    tribe: '',
    projectCost: '140000',
  });

  const queries = useMemo(() => buildQueries(profile), [profile]);
  const projectCost = Number(profile.projectCost.replace(/[^0-9.]/g, '')) || 0;

  return (
    <main style={{ minHeight: '100vh', background: '#f4f7f4', color: '#183b4e', fontFamily: 'Arial,sans-serif' }}>
      <section style={{ background: 'linear-gradient(135deg,#062a46,#0a533e 70%,#2d6b43)', color: '#fff', padding: '28px 6% 58px' }}>
        <div style={{ maxWidth: 1160, margin: 'auto' }}>
          <Link href="/ag" style={{ color: '#b9ee91', textDecoration: 'none', fontWeight: 900, display: 'inline-flex', gap: 7, alignItems: 'center' }}>
            <ArrowLeft size={17} /> Back to Aridon Ag
          </Link>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(280px,.6fr)', gap: 28, alignItems: 'center', marginTop: 38 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 950, color: '#b9ee91', letterSpacing: 1.2 }}>ARIDON AG GRANT & LOAN HUNTER</div>
              <h1 style={{ fontSize: 'clamp(44px,7vw,78px)', lineHeight: .98, letterSpacing: -2.5, margin: '12px 0 18px' }}>
                Find the money hiding in plain sight.
              </h1>
              <p style={{ fontSize: 20, lineHeight: 1.6, color: '#d8ebe4', maxWidth: 820 }}>
                Aridon searches by who the producer is, where the project is located and what the farm actually needs, then organizes grants, loans, cost-share programs, rebates and incentives into a practical funding plan.
              </p>
            </div>
            <div style={{ background: '#ffffff12', border: '1px solid #ffffff2b', borderRadius: 20, padding: 22 }}>
              <Sparkles size={30} color="#b9ee91" />
              <h3 style={{ margin: '10px 0 8px', fontSize: 24 }}>Daily search engine</h3>
              <p style={{ margin: 0, lineHeight: 1.55, color: '#d8ebe4' }}>
                The Aridon morning brief now runs this targeted funding sweep every day and reports new or materially changed agriculture opportunities first.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1160, margin: '-24px auto 0', padding: '0 20px 54px' }}>
        <div style={{ background: '#fff', border: '1px solid #dce8df', borderRadius: 22, boxShadow: '0 12px 40px #173b2a12', padding: 26 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
            <div style={{ width: 48, height: 48, borderRadius: 13, display: 'grid', placeItems: 'center', background: '#e5f0e3' }}><MapPinned color="#2e7d32" /></div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 950, color: '#2e7d32' }}>FUNDING PROFILE</div>
              <h2 style={{ margin: '3px 0 0', fontSize: 31 }}>Tell Aridon what needs to be funded.</h2>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12 }}>
            <Field label="State" value={profile.state} onChange={(state) => setProfile({ ...profile, state })} placeholder="New Mexico" />
            <Field label="County" value={profile.county} onChange={(county) => setProfile({ ...profile, county })} placeholder="San Juan" />
            <Field label="Producer type" value={profile.producer} onChange={(producer) => setProfile({ ...profile, producer })} placeholder="rancher, grower, beginning farmer" />
            <Field label="Specific need" value={profile.need} onChange={(need) => setProfile({ ...profile, need })} placeholder="irrigation, livestock water, equipment" />
            <Field label="Tribe / nation (optional)" value={profile.tribe} onChange={(tribe) => setProfile({ ...profile, tribe })} placeholder="Navajo Nation" />
            <Field label="Project cost" value={profile.projectCost} onChange={(projectCost) => setProfile({ ...profile, projectCost })} placeholder="140000" prefix="$" />
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1160, margin: '0 auto 58px', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(310px,1fr))', gap: 16 }}>
        <div style={{ background: '#0d314c', color: '#fff', borderRadius: 22, padding: 26 }}>
          <Search size={30} color="#b9ee91" />
          <div style={{ fontSize: 12, fontWeight: 950, color: '#b9ee91', marginTop: 12 }}>TARGETED SEARCHES</div>
          <h2 style={{ fontSize: 34, margin: '6px 0 10px' }}>Search the need, not the word “grants.”</h2>
          <p style={{ color: '#d7e5ee', lineHeight: 1.6 }}>These searches are generated from the funding profile. Open any one to investigate current public opportunities.</p>
          <div style={{ display: 'grid', gap: 9, marginTop: 16 }}>
            {queries.map((query) => (
              <a key={query} href={`https://www.google.com/search?q=${encodeURIComponent(query)}`} target="_blank" rel="noreferrer" style={{ color: '#fff', textDecoration: 'none', border: '1px solid #ffffff2d', borderRadius: 11, padding: 12, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', background: '#ffffff0b' }}>
                <span style={{ lineHeight: 1.4 }}>{query}</span><ExternalLink size={16} color="#b9ee91" />
              </a>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #dce8df', borderRadius: 22, padding: 26 }}>
          <Landmark size={30} color="#2e7d32" />
          <div style={{ fontSize: 12, fontWeight: 950, color: '#2e7d32', marginTop: 12 }}>SOURCE COVERAGE</div>
          <h2 style={{ fontSize: 34, margin: '6px 0 10px' }}>Look where small programs live.</h2>
          <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
            {sourceGroups.map((source) => <div key={source} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', lineHeight: 1.45 }}><CheckCircle2 size={18} color="#2e7d32" style={{ flex: '0 0 auto', marginTop: 2 }} />{source}</div>)}
          </div>
        </div>
      </section>

      <section style={{ background: '#e5f0e3', padding: '58px 20px' }}>
        <div style={{ maxWidth: 1160, margin: 'auto' }}>
          <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}><BadgeDollarSign size={31} color="#2e7d32" /><div style={{ fontSize: 12, fontWeight: 950, color: '#2e7d32' }}>CAPITAL-STACK BUILDER</div></div>
          <h2 style={{ fontSize: 'clamp(36px,5vw,54px)', margin: '8px 0 12px' }}>Build the project from more than one funding source.</h2>
          <p style={{ fontSize: 18, lineHeight: 1.65, maxWidth: 920, color: '#52677a' }}>
            Instead of stopping at one grant, Aridon can organize compatible funding types around different eligible project costs, while flagging matching-fund, reimbursement and double-dipping rules for verification.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12, marginTop: 22 }}>
            <StackCard title="Cost share" amount={projectCost ? Math.round(projectCost * .40) : 56000} text="Conservation, irrigation, soil or water practices." />
            <StackCard title="State / local funding" amount={projectCost ? Math.round(projectCost * .20) : 28000} text="Agriculture, drought, water or economic-development programs." />
            <StackCard title="Farm loan" amount={projectCost ? Math.round(projectCost * .30) : 42000} text="FSA, agricultural lenders or other eligible financing." />
            <StackCard title="Rebate / incentive" amount={projectCost ? Math.max(0, projectCost - Math.round(projectCost * .90)) : 14000} text="Energy, utility, equipment or efficiency incentives." />
          </div>
          <p style={{ fontSize: 12, color: '#607284', marginTop: 13 }}>
            Example allocation only. Actual programs, eligible costs, matching requirements and stacking rules must be verified against current official program guidance before an application or financing decision.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: 1160, margin: '58px auto', padding: '0 20px' }}>
        <div style={{ background: '#fff', border: '1px solid #dce8df', borderRadius: 22, padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))', gap: 18 }}>
            <div>
              <ShieldCheck size={30} color="#2e7d32" />
              <div style={{ fontSize: 12, fontWeight: 950, color: '#2e7d32', marginTop: 10 }}>ARIDON FIT RANKING</div>
              <h3 style={{ fontSize: 28, margin: '6px 0 8px' }}>Likely. Possible. Poor fit.</h3>
              <p style={{ color: '#607284', lineHeight: 1.55 }}>Each opportunity should be screened against geography, producer type, project purpose, deadlines, matching funds, reimbursement timing and required records.</p>
            </div>
            <div>
              <Tractor size={30} color="#2e7d32" />
              <div style={{ fontSize: 12, fontWeight: 950, color: '#2e7d32', marginTop: 10 }}>CONNECTED TO FARM ACTIONS</div>
              <h3 style={{ fontSize: 28, margin: '6px 0 8px' }}>Funding follows the recommendation.</h3>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>{projectTypes.map((x) => <span key={x} style={{ background: '#f0f5ef', borderRadius: 999, padding: '7px 10px', fontSize: 12, fontWeight: 800 }}>{x}</span>)}</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, prefix }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; prefix?: string }) {
  return <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 900 }}><span>{label}</span><div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cddbd0', borderRadius: 10, background: '#fff', overflow: 'hidden' }}>{prefix && <span style={{ paddingLeft: 11, color: '#607284' }}>{prefix}</span>}<input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', border: 0, outline: 'none', padding: '12px 11px', fontSize: 15, color: '#183b4e', background: 'transparent' }} /></div></label>;
}

function StackCard({ title, amount, text }: { title: string; amount: number; text: string }) {
  return <div style={{ background: '#fff', border: '1px solid #d5e2d5', borderRadius: 15, padding: 18 }}><div style={{ fontWeight: 900 }}>{title}</div><div style={{ fontSize: 30, fontWeight: 950, color: '#0a533e', margin: '5px 0' }}>${amount.toLocaleString()}</div><div style={{ color: '#607284', fontSize: 13, lineHeight: 1.45 }}>{text}</div></div>;
}

function buildQueries(profile: Profile) {
  const state = profile.state.trim() || '[state]';
  const county = profile.county.trim() || '[county]';
  const producer = profile.producer.trim() || 'farmer rancher';
  const need = profile.need.trim() || 'agriculture project';
  const queries = [
    `${county} ${state} conservation district ${need} funding`,
    `${state} department of agriculture ${need} grant ${producer}`,
    `${county} ${state} drought assistance ${producer}`,
    `${state} agricultural ${need} cost share`,
    `USDA NRCS ${state} EQIP ${need}`,
    `USDA FSA ${state} loan ${need} ${producer}`,
    `USDA Rural Development ${state} ${need} agriculture`,
    `${state} rural electric cooperative agricultural rebate ${need}`,
    `${county} ${state} irrigation district ${need} funding`,
    `${state} agricultural lender low interest loan ${need}`,
  ];
  if (profile.tribe.trim()) queries.push(`${profile.tribe.trim()} agriculture water infrastructure funding ${need}`);
  return queries;
}
