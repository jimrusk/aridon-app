'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Fuel,
  Leaf,
  ReceiptText,
  ShieldCheck,
  Sprout,
  Upload,
} from 'lucide-react';

type EvidenceKey = 'fields' | 'inputs' | 'fuel' | 'yield' | 'practices' | 'invoices';

const evidenceLabels: Record<EvidenceKey, string> = {
  fields: 'Field / acreage records',
  inputs: 'Seed, fertilizer & chemical records',
  fuel: 'Fuel / energy records',
  yield: 'Harvest & yield records',
  practices: 'Conservation practice records',
  invoices: 'Invoices / receipts / contracts',
};

const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
const num = (v: string) => Number(v.replace(/,/g, '')) || 0;

export default function VerifiedFarmDataPage() {
  const [farm, setFarm] = useState({
    name: 'Demo Farm',
    crop: 'Corn',
    acres: '1,250',
    yieldPerAcre: '210',
    fuelGallons: '8,500',
    irrigationKwh: '320,000',
    nitrogenPerAcre: '140',
  });
  const [evidence, setEvidence] = useState<Record<EvidenceKey, boolean>>({
    fields: true,
    inputs: true,
    fuel: true,
    yield: true,
    practices: false,
    invoices: false,
  });
  const [costShare, setCostShare] = useState('35,000');
  const [buyerPremium, setBuyerPremium] = useState('12,000');
  const [adminHours, setAdminHours] = useState('120');
  const [hourlyCost, setHourlyCost] = useState('45');
  const [packetReady, setPacketReady] = useState(false);

  const verifiedCount = Object.values(evidence).filter(Boolean).length;
  const completeness = Math.round((verifiedCount / Object.keys(evidence).length) * 100);
  const adminSavings = num(adminHours) * num(hourlyCost);
  const totalOpportunity = num(costShare) + num(buyerPremium) + adminSavings;

  const matches = useMemo(() => {
    const missing = (keys: EvidenceKey[]) => keys.filter((k) => !evidence[k]).map((k) => evidenceLabels[k]);
    return [
      {
        name: 'Scope 3 buyer reporting',
        icon: Leaf,
        need: missing(['fields', 'inputs', 'fuel', 'yield']),
        note: 'Package producer activity data for customer emissions and sustainability reporting.',
      },
      {
        name: '45Z supply-chain data readiness',
        icon: Fuel,
        need: missing(['fields', 'inputs', 'fuel', 'yield', 'practices']),
        note: 'Prepare farm and feedstock records that may be requested by fuel producers or verification partners.',
      },
      {
        name: 'Conservation / cost-share packet',
        icon: BadgeDollarSign,
        need: missing(['fields', 'practices', 'invoices']),
        note: 'Organize practice, acreage and cost evidence for program screening and application support.',
      },
      {
        name: 'Lender / insurer evidence packet',
        icon: ShieldCheck,
        need: missing(['fields', 'yield', 'invoices']),
        note: 'Create a cleaner operating record for due diligence, renewals and risk conversations.',
      },
    ];
  }, [evidence]);

  const toggleEvidence = (key: EvidenceKey) => {
    setPacketReady(false);
    setEvidence((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <main style={{ minHeight: '100vh', background: '#eef4ee', color: '#183b4e', fontFamily: 'Arial,sans-serif', paddingBottom: 80 }}>
      <header style={{ background: 'linear-gradient(135deg,#062a46,#0a533e 72%,#2d6b43)', color: '#fff', padding: '22px 18px 34px' }}>
        <div style={{ maxWidth: 1180, margin: 'auto' }}>
          <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 950, color: '#b9ee91', letterSpacing: 1 }}>ARIDON AG</div>
              <strong style={{ fontSize: 24 }}>Verified Farm Data & Incentives</strong>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/ag" style={{ color: '#fff', textDecoration: 'none', fontWeight: 850 }}>Ag Home</Link>
              <Link href="/ag/app" style={{ color: '#fff', textDecoration: 'none', fontWeight: 850 }}>Command Center</Link>
            </div>
          </nav>
          <div style={{ maxWidth: 900, paddingTop: 42 }}>
            <div style={{ fontSize: 12, fontWeight: 950, color: '#b9ee91' }}>ENTER ONCE • VERIFY • REUSE • GET PAID FASTER</div>
            <h1 style={{ fontSize: 'clamp(42px,7vw,72px)', letterSpacing: -2.5, lineHeight: 1, margin: '10px 0 16px' }}>Turn farm records into program-ready evidence.</h1>
            <p style={{ fontSize: 19, lineHeight: 1.6, color: '#d8ebe4', maxWidth: 820 }}>
              Aridon Ag turns the same operating data already used for crop, labor, input, water and profitability decisions into reusable evidence for buyer programs, conservation opportunities, 45Z supply-chain requests, Scope 3 reporting, lenders and audits.
            </p>
          </div>
        </div>
      </header>

      <section style={{ maxWidth: 1180, margin: '-18px auto 0', padding: '0 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
          <Stat title="Evidence completeness" value={`${completeness}%`} sub={`${verifiedCount} of 6 evidence groups ready`} />
          <Stat title="Program lanes" value="4" sub="One farm record, multiple uses" />
          <Stat title="Illustrative annual value" value={money(totalOpportunity)} sub="Cost-share + premium + admin time" />
          <Stat title="Packet status" value={packetReady ? 'Generated' : 'In progress'} sub={packetReady ? 'Evidence summary is ready' : 'Finish evidence and generate'} />
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '18px auto 0', padding: '0 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(330px,1fr))', gap: 14 }}>
        <div style={panel}>
          <div style={eyebrow}>FARM DATA PROFILE</div>
          <h2 style={{ margin: '5px 0 8px', fontSize: 30 }}>Record it once.</h2>
          <p style={muted}>This first version uses the data locally in the workspace. The same fields are ready to wire into Aridon tenant storage and producer integrations.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginTop: 14 }}>
            <Field label="Farm / operation" value={farm.name} onChange={(v) => setFarm({ ...farm, name: v })} />
            <Field label="Primary crop" value={farm.crop} onChange={(v) => setFarm({ ...farm, crop: v })} />
            <Field label="Acres" value={farm.acres} onChange={(v) => setFarm({ ...farm, acres: v })} />
            <Field label="Yield / acre" value={farm.yieldPerAcre} onChange={(v) => setFarm({ ...farm, yieldPerAcre: v })} />
            <Field label="Annual fuel gallons" value={farm.fuelGallons} onChange={(v) => setFarm({ ...farm, fuelGallons: v })} />
            <Field label="Irrigation kWh" value={farm.irrigationKwh} onChange={(v) => setFarm({ ...farm, irrigationKwh: v })} />
            <Field label="Nitrogen lb / acre" value={farm.nitrogenPerAcre} onChange={(v) => setFarm({ ...farm, nitrogenPerAcre: v })} />
          </div>
        </div>

        <div style={panel}>
          <div style={eyebrow}>VERIFICATION LADDER</div>
          <h2 style={{ margin: '5px 0 8px', fontSize: 30 }}>Prove what is behind the number.</h2>
          <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
            {(['Producer reported', 'Document supported', 'Sensor / system supported', 'Third-party verified', 'Audit ready'] as const).map((label, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 11, borderRadius: 11, background: i <= Math.floor((completeness / 100) * 4) ? '#e6f3df' : '#f4f6f5' }}>
                <div style={{ width: 30, height: 30, borderRadius: 999, display: 'grid', placeItems: 'center', background: i <= Math.floor((completeness / 100) * 4) ? '#2e7d32' : '#d6dfd9', color: '#fff', fontWeight: 950 }}>{i + 1}</div>
                <strong>{label}</strong>
              </div>
            ))}
          </div>
          <p style={{ ...muted, marginTop: 12 }}>Aridon never turns an unverified estimate into a verified claim. Every step keeps the supporting record attached to the result.</p>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '18px auto 0', padding: '0 18px' }}>
        <div style={panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={eyebrow}>EVIDENCE CENTER</div>
              <h2 style={{ margin: '5px 0 4px', fontSize: 30 }}>What can Aridon defend today?</h2>
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#2e7d32' }}>{completeness}% complete</div>
          </div>
          <div style={{ height: 10, borderRadius: 999, background: '#e4eae6', overflow: 'hidden', margin: '14px 0 16px' }}>
            <div style={{ width: `${completeness}%`, height: '100%', background: '#2e7d32', transition: 'width .2s ease' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(245px,1fr))', gap: 10 }}>
            {(Object.keys(evidenceLabels) as EvidenceKey[]).map((key) => (
              <button key={key} onClick={() => toggleEvidence(key)} style={{ textAlign: 'left', border: evidence[key] ? '1px solid #9dcc8e' : '1px dashed #b8c6bd', background: evidence[key] ? '#f0f8ed' : '#fff', borderRadius: 13, padding: 14, cursor: 'pointer', color: '#183b4e' }}>
                <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                  {evidence[key] ? <CheckCircle2 size={20} color="#2e7d32" /> : <Upload size={20} color="#607284" />}
                  <strong>{evidenceLabels[key]}</strong>
                </div>
                <div style={{ fontSize: 12, color: '#607284', marginTop: 7 }}>{evidence[key] ? 'Evidence attached / available' : 'Tap to mark supporting evidence available'}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '18px auto 0', padding: '0 18px' }}>
        <div style={panel}>
          <div style={eyebrow}>PROGRAM MATCH ENGINE</div>
          <h2 style={{ margin: '5px 0 6px', fontSize: 30 }}>Reuse the same record across multiple money lanes.</h2>
          <p style={muted}>These are data-readiness matches, not legal, tax or program-eligibility determinations. Current program rules must be checked before filing or making a claim.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 10, marginTop: 15 }}>
            {matches.map(({ name, icon: Icon, need, note }) => (
              <article key={name} style={{ borderRadius: 15, border: '1px solid #dce8df', padding: 16, background: need.length === 0 ? '#f0f8ed' : '#fff' }}>
                <Icon size={25} color="#2e7d32" />
                <h3 style={{ margin: '9px 0 6px' }}>{name}</h3>
                <p style={{ ...muted, margin: 0 }}>{note}</p>
                <div style={{ marginTop: 11, fontSize: 12, fontWeight: 900, color: need.length === 0 ? '#2e7d32' : '#9a6b10' }}>
                  {need.length === 0 ? 'DATA READY' : `NEEDS ${need.length} MORE EVIDENCE GROUP${need.length > 1 ? 'S' : ''}`}
                </div>
                {need.length > 0 && <div style={{ fontSize: 12, color: '#607284', marginTop: 5 }}>{need.slice(0, 2).join(' • ')}{need.length > 2 ? ' • …' : ''}</div>}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '18px auto 0', padding: '0 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(330px,1fr))', gap: 14 }}>
        <div style={panel}>
          <div style={eyebrow}>VALUE CALCULATOR</div>
          <h2 style={{ margin: '5px 0 8px', fontSize: 30 }}>Tie the program back to farm profit.</h2>
          <div style={{ display: 'grid', gap: 9 }}>
            <Field label="Potential cost-share / incentives" value={costShare} onChange={setCostShare} />
            <Field label="Potential buyer premium / value" value={buyerPremium} onChange={setBuyerPremium} />
            <Field label="Admin hours avoided" value={adminHours} onChange={setAdminHours} />
            <Field label="Loaded admin cost / hour" value={hourlyCost} onChange={setHourlyCost} />
          </div>
          <div style={{ background: '#0d314c', color: '#fff', borderRadius: 14, padding: 18, marginTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#b9ee91' }}>ILLUSTRATIVE ANNUAL VALUE</div>
            <div style={{ fontSize: 38, fontWeight: 950, marginTop: 4 }}>{money(totalOpportunity)}</div>
            <div style={{ color: '#d7e5ee', fontSize: 13, marginTop: 4 }}>{money(num(costShare))} incentives + {money(num(buyerPremium))} buyer value + {money(adminSavings)} admin efficiency</div>
          </div>
        </div>

        <div style={panel}>
          <div style={eyebrow}>EVIDENCE PACKET BUILDER</div>
          <h2 style={{ margin: '5px 0 8px', fontSize: 30 }}>Build the file before someone asks for it.</h2>
          <div style={{ display: 'grid', gap: 9, marginTop: 12 }}>
            <PacketRow icon={Sprout} label={`${farm.name} • ${farm.crop} • ${farm.acres} acres`} />
            <PacketRow icon={ReceiptText} label={`${verifiedCount} evidence groups attached`} />
            <PacketRow icon={ClipboardCheck} label={`${matches.filter((m) => m.need.length === 0).length} program lanes data-ready`} />
            <PacketRow icon={FileCheck2} label={`Evidence completeness ${completeness}%`} />
          </div>
          <button onClick={() => setPacketReady(true)} style={{ marginTop: 16, width: '100%', border: 0, borderRadius: 11, background: '#0a533e', color: '#fff', padding: '13px 15px', fontWeight: 950, cursor: 'pointer' }}>
            Generate Evidence Summary <ArrowRight size={16} style={{ verticalAlign: 'middle' }} />
          </button>
          {packetReady && <div style={{ marginTop: 12, borderRadius: 12, background: '#e6f3df', padding: 13, color: '#285d2c', fontWeight: 850 }}>Evidence summary generated in this workspace. Next production step is persistent storage, document upload and export/sign-off.</div>}
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '18px auto 0', padding: '0 18px' }}>
        <div style={{ background: '#e3efe3', borderRadius: 18, padding: 20, border: '1px solid #cfe0cf' }}>
          <strong>Built into Aridon Ag:</strong> this workspace connects verified data to profitability instead of treating compliance as a separate paperwork island. The next integrations are tenant persistence, document upload, e-sign / approval, current program-rule feeds and one-click packet export.
        </div>
      </section>
    </main>
  );
}

const panel: React.CSSProperties = { background: '#fff', border: '1px solid #dce8df', borderRadius: 20, padding: 22 };
const muted: React.CSSProperties = { color: '#607284', lineHeight: 1.55, fontSize: 14 };
const eyebrow: React.CSSProperties = { fontSize: 12, fontWeight: 950, color: '#2e7d32', letterSpacing: .5 };

function Stat({ title, value, sub }: { title: string; value: string; sub: string }) {
  return <div style={{ ...panel, padding: 18 }}><div style={{ fontSize: 12, fontWeight: 900, color: '#607284' }}>{title}</div><div style={{ fontSize: 29, fontWeight: 950, margin: '5px 0' }}>{value}</div><div style={{ fontSize: 12, color: '#607284' }}>{sub}</div></div>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 900, color: '#52677a' }}><span>{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #cfdad3', borderRadius: 9, padding: '10px 11px', fontSize: 14, color: '#183b4e', background: '#fff' }} /></label>;
}

function PacketRow({ icon: Icon, label }: { icon: React.ComponentType<{ size?: number; color?: string }>; label: string }) {
  return <div style={{ display: 'flex', gap: 9, alignItems: 'center', padding: 11, borderRadius: 11, background: '#f5f8f5' }}><Icon size={19} color="#2e7d32"/><span style={{ fontWeight: 850, fontSize: 14 }}>{label}</span></div>;
}
