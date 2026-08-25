'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  BadgeDollarSign,
  Beef,
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  Fence,
  FileCheck2,
  HeartPulse,
  ReceiptText,
  ShieldCheck,
  Upload,
} from 'lucide-react';

type EvidenceKey = 'herd' | 'health' | 'grazing' | 'water' | 'feed' | 'sales';

const labels: Record<EvidenceKey, string> = {
  herd: 'Herd inventory & movement records',
  health: 'Health, vaccination & treatment records',
  grazing: 'Grazing & pasture records',
  water: 'Water-source & drought records',
  feed: 'Feed, hay & supplement records',
  sales: 'Sales, weights, invoices & buyer records',
};

const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
const num = (v: string) => Number(v.replace(/,/g, '')) || 0;

export default function VerifiedRanchDataPage() {
  const [ranch, setRanch] = useState({ name: 'Demo Ranch', cows: '320', calves: '286', bulls: '14', acres: '18,500', avgSaleWeight: '575' });
  const [evidence, setEvidence] = useState<Record<EvidenceKey, boolean>>({ herd: true, health: true, grazing: true, water: false, feed: true, sales: false });
  const [costShare, setCostShare] = useState('28,000');
  const [insuranceValue, setInsuranceValue] = useState('8,000');
  const [adminHours, setAdminHours] = useState('85');
  const [hourlyCost, setHourlyCost] = useState('45');
  const [packetReady, setPacketReady] = useState(false);

  const verifiedCount = Object.values(evidence).filter(Boolean).length;
  const completeness = Math.round((verifiedCount / 6) * 100);
  const adminSavings = num(adminHours) * num(hourlyCost);
  const totalValue = num(costShare) + num(insuranceValue) + adminSavings;

  const matches = useMemo(() => {
    const missing = (keys: EvidenceKey[]) => keys.filter((key) => !evidence[key]).map((key) => labels[key]);
    return [
      { name: 'Conservation / cost-share screening', icon: BadgeDollarSign, need: missing(['grazing', 'water', 'sales']), note: 'Organize grazing, water and cost evidence for conservation-program review and application support.' },
      { name: 'Drought documentation packet', icon: Droplets, need: missing(['herd', 'water', 'feed']), note: 'Keep herd, water and feed evidence together when drought conditions create operating or assistance needs.' },
      { name: 'Lender / insurer ranch packet', icon: ShieldCheck, need: missing(['herd', 'health', 'sales']), note: 'Prepare a cleaner operating record for renewals, coverage discussions and due diligence.' },
      { name: 'Buyer / supply-chain reporting', icon: Beef, need: missing(['herd', 'health', 'grazing', 'sales']), note: 'Package livestock, health, grazing and sale records when buyers request traceability or sustainability information.' },
    ];
  }, [evidence]);

  function toggle(key: EvidenceKey) {
    setPacketReady(false);
    setEvidence((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f2efe8', color: '#263629', fontFamily: 'Arial,sans-serif', paddingBottom: 80 }}>
      <header style={{ background: 'linear-gradient(135deg,#17351f,#4a331f 72%,#6c4d2e)', color: '#fff', padding: '22px 18px 36px' }}>
        <div style={{ maxWidth: 1180, margin: 'auto' }}>
          <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div><div style={{ fontSize: 12, fontWeight: 950, color: '#f1d58b', letterSpacing: 1 }}>ARIDON RANCH</div><strong style={{ fontSize: 24 }}>Verified Ranch Data</strong></div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><Link href="/ranch" style={navLink}>Ranch Home</Link><Link href="/ranch/app" style={navLink}>Command Center</Link></div>
          </nav>
          <div style={{ maxWidth: 900, paddingTop: 42 }}>
            <div style={{ fontSize: 12, fontWeight: 950, color: '#f1d58b' }}>HERD • GRAZING • WATER • HEALTH • FEED • SALES</div>
            <h1 style={{ fontSize: 'clamp(42px,7vw,72px)', letterSpacing: -2.5, lineHeight: 1, margin: '10px 0 16px' }}>Make ranch records useful more than once.</h1>
            <p style={{ fontSize: 19, lineHeight: 1.6, color: '#eadfd2', maxWidth: 820 }}>Aridon Ranch turns the records already used to run livestock into organized evidence for ranch management, lenders, insurers, conservation opportunities, drought documentation and buyer requests.</p>
          </div>
        </div>
      </header>

      <section style={{ maxWidth: 1180, margin: '-18px auto 0', padding: '0 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
          <Stat title="Evidence completeness" value={`${completeness}%`} sub={`${verifiedCount} of 6 evidence groups ready`} />
          <Stat title="Program / reporting lanes" value="4" sub="One ranch record, multiple uses" />
          <Stat title="Illustrative annual value" value={money(totalValue)} sub="Cost-share + risk/admin value" />
          <Stat title="Packet status" value={packetReady ? 'Generated' : 'In progress'} sub={packetReady ? 'Summary is ready' : 'Finish evidence and generate'} />
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '18px auto 0', padding: '0 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(330px,1fr))', gap: 14 }}>
        <div style={panel}>
          <div style={eyebrow}>RANCH PROFILE</div>
          <h2 style={{ margin: '5px 0 8px', fontSize: 30 }}>Start with the herd.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginTop: 14 }}>
            <Field label="Ranch / operation" value={ranch.name} onChange={(v) => setRanch({ ...ranch, name: v })} />
            <Field label="Cow herd" value={ranch.cows} onChange={(v) => setRanch({ ...ranch, cows: v })} />
            <Field label="Calves" value={ranch.calves} onChange={(v) => setRanch({ ...ranch, calves: v })} />
            <Field label="Bulls" value={ranch.bulls} onChange={(v) => setRanch({ ...ranch, bulls: v })} />
            <Field label="Grazing acres" value={ranch.acres} onChange={(v) => setRanch({ ...ranch, acres: v })} />
            <Field label="Average sale weight" value={ranch.avgSaleWeight} onChange={(v) => setRanch({ ...ranch, avgSaleWeight: v })} />
          </div>
        </div>

        <div style={panel}>
          <div style={eyebrow}>VERIFICATION LADDER</div>
          <h2 style={{ margin: '5px 0 8px', fontSize: 30 }}>Know what is behind the claim.</h2>
          <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
            {['Rancher reported', 'Document supported', 'System / sensor supported', 'Third-party reviewed', 'Audit ready'].map((label, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 11, borderRadius: 11, background: i <= Math.floor((completeness / 100) * 4) ? '#ece5d6' : '#f5f3ee' }}>
                <div style={{ width: 30, height: 30, borderRadius: 999, display: 'grid', placeItems: 'center', background: i <= Math.floor((completeness / 100) * 4) ? '#5d3f23' : '#d9d3c7', color: '#fff', fontWeight: 950 }}>{i + 1}</div>
                <strong>{label}</strong>
              </div>
            ))}
          </div>
          <p style={muted}>Aridon keeps estimates, supporting documents and verified evidence clearly separated so the rancher can see what is solid and what still needs proof.</p>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '18px auto 0', padding: '0 18px' }}>
        <div style={panel}>
          <div style={eyebrow}>EVIDENCE CENTER</div>
          <h2 style={{ margin: '5px 0 4px', fontSize: 30 }}>What can the ranch support today?</h2>
          <div style={{ height: 10, borderRadius: 999, background: '#e3ded4', overflow: 'hidden', margin: '14px 0 16px' }}><div style={{ width: `${completeness}%`, height: '100%', background: '#5d3f23' }} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(245px,1fr))', gap: 10 }}>
            {(Object.keys(labels) as EvidenceKey[]).map((key) => (
              <button key={key} onClick={() => toggle(key)} style={{ textAlign: 'left', border: evidence[key] ? '1px solid #b9aa8f' : '1px dashed #bdb6a9', background: evidence[key] ? '#f7f2e8' : '#fff', borderRadius: 13, padding: 14, cursor: 'pointer', color: '#263629' }}>
                <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>{evidence[key] ? <CheckCircle2 size={20} color="#5d3f23" /> : <Upload size={20} color="#70766f" />}<strong>{labels[key]}</strong></div>
                <div style={{ fontSize: 12, color: '#70766f', marginTop: 7 }}>{evidence[key] ? 'Supporting evidence available' : 'Tap to mark evidence available'}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '18px auto 0', padding: '0 18px' }}>
        <div style={panel}>
          <div style={eyebrow}>RANCH PROGRAM MATCH</div>
          <h2 style={{ margin: '5px 0 6px', fontSize: 30 }}>See which lanes are data-ready.</h2>
          <p style={muted}>These are evidence-readiness screens, not eligibility or payment guarantees. Current program, buyer, insurance and lender requirements must be checked before filing or making a claim.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 10, marginTop: 15 }}>
            {matches.map(({ name, icon: Icon, need, note }) => (
              <article key={name} style={{ borderRadius: 15, border: '1px solid #ddd7ca', padding: 16, background: need.length === 0 ? '#f7f2e8' : '#fff' }}>
                <Icon size={25} color="#5d3f23" />
                <h3 style={{ margin: '9px 0 6px' }}>{name}</h3>
                <p style={{ ...muted, margin: 0 }}>{note}</p>
                <div style={{ marginTop: 11, fontSize: 12, fontWeight: 900, color: need.length === 0 ? '#5d3f23' : '#9a6b10' }}>{need.length === 0 ? 'DATA READY' : `NEEDS ${need.length} MORE EVIDENCE GROUP${need.length > 1 ? 'S' : ''}`}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '18px auto 0', padding: '0 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(330px,1fr))', gap: 14 }}>
        <div style={panel}>
          <div style={eyebrow}>RANCH VALUE CALCULATOR</div>
          <h2 style={{ margin: '5px 0 8px', fontSize: 30 }}>Tie paperwork back to ranch economics.</h2>
          <div style={{ display: 'grid', gap: 9 }}>
            <Field label="Potential conservation / cost-share value" value={costShare} onChange={setCostShare} />
            <Field label="Potential insurance / risk value" value={insuranceValue} onChange={setInsuranceValue} />
            <Field label="Admin hours avoided" value={adminHours} onChange={setAdminHours} />
            <Field label="Loaded admin cost / hour" value={hourlyCost} onChange={setHourlyCost} />
          </div>
          <div style={{ background: '#4a331f', color: '#fff', borderRadius: 14, padding: 18, marginTop: 14 }}><div style={{ fontSize: 12, fontWeight: 900, color: '#f1d58b' }}>ILLUSTRATIVE ANNUAL VALUE</div><div style={{ fontSize: 38, fontWeight: 950, marginTop: 4 }}>{money(totalValue)}</div><div style={{ color: '#eadfd2', fontSize: 13, marginTop: 4 }}>{money(num(costShare))} program value + {money(num(insuranceValue))} risk value + {money(adminSavings)} admin efficiency</div></div>
        </div>

        <div style={panel}>
          <div style={eyebrow}>RANCH EVIDENCE PACKET</div>
          <h2 style={{ margin: '5px 0 8px', fontSize: 30 }}>Build the file before somebody asks.</h2>
          <div style={{ display: 'grid', gap: 9, marginTop: 12 }}>
            <Packet icon={<Beef size={19} color="#5d3f23" />} text={`${ranch.name} • ${ranch.cows} cows • ${ranch.calves} calves`} />
            <Packet icon={<Fence size={19} color="#5d3f23" />} text={`${ranch.acres} grazing acres`} />
            <Packet icon={<ReceiptText size={19} color="#5d3f23" />} text={`${verifiedCount} evidence groups available`} />
            <Packet icon={<ClipboardCheck size={19} color="#5d3f23" />} text={`${matches.filter((m) => m.need.length === 0).length} reporting lanes data-ready`} />
            <Packet icon={<FileCheck2 size={19} color="#5d3f23" />} text={`Evidence completeness ${completeness}%`} />
          </div>
          <button onClick={() => setPacketReady(true)} style={{ marginTop: 16, width: '100%', border: 0, borderRadius: 11, background: '#5d3f23', color: '#fff', padding: '13px 15px', fontWeight: 950, cursor: 'pointer' }}>Generate Ranch Evidence Summary</button>
          {packetReady && <div style={{ marginTop: 12, borderRadius: 12, background: '#ece5d6', padding: 13, color: '#533b23', fontWeight: 850 }}>Ranch evidence summary generated in this workspace. Permanent storage, document upload and signed export are the next production layer.</div>}
        </div>
      </section>
    </main>
  );
}

const navLink = { color: '#fff', textDecoration: 'none', fontWeight: 850 };
const panel: React.CSSProperties = { background: '#fff', border: '1px solid #ddd7ca', borderRadius: 20, padding: 22 };
const muted: React.CSSProperties = { color: '#70766f', lineHeight: 1.55, fontSize: 14 };
const eyebrow: React.CSSProperties = { fontSize: 12, fontWeight: 950, color: '#6b4a2c', letterSpacing: .5 };

function Stat({ title, value, sub }: { title: string; value: string; sub: string }) {
  return <div style={{ ...panel, padding: 18 }}><div style={{ fontSize: 12, fontWeight: 900, color: '#70766f' }}>{title}</div><div style={{ fontSize: 29, fontWeight: 950, margin: '5px 0' }}>{value}</div><div style={{ fontSize: 12, color: '#70766f' }}>{sub}</div></div>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 900, color: '#626a63' }}><span>{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d6d0c5', borderRadius: 9, padding: '10px 11px', fontSize: 14, color: '#263629', background: '#fff' }} /></label>;
}

function Packet({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div style={{ display: 'flex', gap: 9, alignItems: 'center', padding: 11, borderRadius: 11, background: '#f8f5ef' }}>{icon}<span style={{ fontWeight: 850, fontSize: 14 }}>{text}</span></div>;
}
