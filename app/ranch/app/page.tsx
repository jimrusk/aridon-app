import Link from 'next/link';
import {
  AlertTriangle,
  BarChart3,
  Beef,
  CircleDollarSign,
  Droplets,
  Fence,
  HeartPulse,
  Package,
  ShieldCheck,
  Tractor,
  Users,
  Wrench,
} from 'lucide-react';

const modules = [
  ['Herd Inventory', 'Head count, classes, movements, purchases, sales and death loss', Beef],
  ['Breeding & Calving', 'Breeding groups, pregnancy status, calving windows, weaning and replacements', HeartPulse],
  ['Grazing & Pasture', 'Pasture rotations, forage condition, grazing days and carrying pressure', Fence],
  ['Feed & Hay', 'Hay, supplements, minerals, winter inventory and feed cost per head', Package],
  ['Water & Drought', 'Tanks, wells, hauling, reliability, drought exposure and resilience', Droplets],
  ['Sales & Buyers', 'Sale barns, direct buyers, contracts, weights, premiums and follow-up', BarChart3],
  ['Labor & Crews', 'Payroll, overtime, crew scheduling and recurring ranch work', Users],
  ['Equipment & Fencing', 'Vehicles, trailers, pumps, fencing, maintenance and downtime', Tractor],
  ['Ranch Financials', 'Cost per cow, cost per pound sold, margin, cash needs and trends', CircleDollarSign],
  ['Verified Ranch Data', 'Organize evidence for lenders, insurance, conservation and buyer requests', ShieldCheck],
];

export default function RanchAppPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#f2efe8', color: '#263629', fontFamily: 'Arial,sans-serif', paddingBottom: 90 }}>
      <header style={{ background: '#17351f', color: '#fff', padding: '18px', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 4px 16px #231b1324' }}>
        <div style={{ maxWidth: 1180, margin: 'auto', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 950, color: '#f1d58b', letterSpacing: 1 }}>ARIDON RANCH</div>
            <strong style={{ fontSize: 23 }}>Ranch Command Center</strong>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/ranch" style={navLink}>Ranch Home</Link>
            <Link href="/ranch/verified-data" style={{ ...navLink, color: '#f1d58b' }}>Verified Data</Link>
          </div>
        </div>
      </header>

      <section style={{ maxWidth: 1180, margin: 'auto', padding: '24px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
          <Stat title="Herd on books" value="486 head" sub="Cows, bulls, calves and replacements" />
          <Stat title="Pregnancy rate" value="91%" sub="Current breeding group estimate" />
          <Stat title="Feed cost" value="$2.84/head/day" sub="Watch winter hay pressure" />
          <Stat title="Water status" value="2 alerts" sub="North tank and West well" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(280px,.8fr)', gap: 14, marginTop: 14 }}>
          <section style={panel}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Beef color="#5d3f23" />
              <div>
                <div style={{ fontSize: 12, fontWeight: 950, color: '#6b4a2c' }}>ARIDON RANCH ADVISOR</div>
                <h2 style={{ margin: '3px 0' }}>What needs attention this week?</h2>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
              <Action n="1" title="Check 18 late-calving cows" text="They are outside the target calving window and may need a keep/cull decision." value="Herd efficiency" />
              <Action n="2" title="Move Yearlings off South pasture" text="Current grazing pressure is above the rotation target." value="Forage protection" />
              <Action n="3" title="Secure 60 more tons of hay" text="Current winter inventory is below the selected reserve target." value="$18K exposure" />
              <Action n="4" title="Follow up with 3 buyers" text="Recent weights and market timing make these groups worth quoting now." value="$24K potential" />
              <Action n="5" title="Inspect North tank float valve" text="Water use is above the normal pattern and may indicate a leak or overflow." value="Water risk" />
            </div>
          </section>

          <section style={{ background: '#4a331f', color: '#fff', borderRadius: 20, padding: 22 }}>
            <div style={{ fontSize: 12, fontWeight: 950, color: '#f1d58b' }}>THIS WEEK</div>
            <h2 style={{ fontSize: 30, margin: '7px 0 12px' }}>Ranch priorities</h2>
            <ul style={{ lineHeight: 1.9, paddingLeft: 20, color: '#efe3d4' }}>
              <li>Review late calvers</li>
              <li>Protect South pasture</li>
              <li>Lock winter hay inventory</li>
              <li>Quote market-ready cattle</li>
              <li>Repair water-system issue</li>
            </ul>
            <Link href="/ranch/verified-data" style={{ display: 'inline-block', marginTop: 8, background: '#f1d58b', color: '#2c2519', textDecoration: 'none', fontWeight: 950, padding: '12px 14px', borderRadius: 10 }}>Review Ranch Evidence</Link>
          </section>
        </div>

        <section style={{ ...panel, marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 950, color: '#6b4a2c' }}>RANCH HEALTH SNAPSHOT</div>
              <h2 style={{ margin: '5px 0 4px', fontSize: 30 }}>The ranch in one glance</h2>
            </div>
            <AlertTriangle size={25} color="#9a6b10" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 10, marginTop: 14 }}>
            <Health label="Calf crop" value="87%" note="Below 90% target" />
            <Health label="Death loss" value="1.8%" note="Within target" />
            <Health label="Pasture pressure" value="High" note="South pasture" />
            <Health label="Hay reserve" value="74%" note="Below winter target" />
            <Health label="Cost per cow" value="$1,046" note="Review feed component" />
          </div>
        </section>

        <h2 style={{ fontSize: 30, margin: '28px 0 12px' }}>Your ranch operating system</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12 }}>
          {modules.map(([title, text, Icon]: any) => (
            <section key={title} style={panel}>
              <Icon size={24} color="#5d3f23" />
              <h3 style={{ margin: '10px 0 6px' }}>{title}</h3>
              <p style={{ margin: 0, color: '#667068', lineHeight: 1.5, fontSize: 14 }}>{text}</p>
            </section>
          ))}
        </div>

        <section style={{ marginTop: 20, background: '#e7e0d3', borderRadius: 18, padding: 20, border: '1px solid #d8cebc' }}>
          <strong>Ranch-first design:</strong> every operating lane is centered on herd, forage, water, feed, breeding, weights, buyers, fencing and cost per head. Crop-production language stays out of the way.
        </section>
      </section>
    </main>
  );
}

const navLink = { color: '#fff', textDecoration: 'none', fontWeight: 850 };
const panel = { background: '#fff', borderRadius: 18, padding: 20, border: '1px solid #ddd7ca' };

function Stat({ title, value, sub }: { title: string; value: string; sub: string }) {
  return <section style={panel}><div style={{ fontSize: 12, fontWeight: 900, color: '#667068' }}>{title}</div><div style={{ fontSize: 30, fontWeight: 950, margin: '5px 0' }}>{value}</div><div style={{ fontSize: 13, color: '#667068' }}>{sub}</div></section>;
}

function Action({ n, title, text, value }: { n: string; title: string; text: string; value: string }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr auto', gap: 10, alignItems: 'center', padding: 12, borderRadius: 12, background: '#f8f5ef' }}><div style={{ width: 30, height: 30, borderRadius: 999, display: 'grid', placeItems: 'center', background: '#e6dbc8', fontWeight: 950, color: '#5d3f23' }}>{n}</div><div><strong>{title}</strong><div style={{ fontSize: 13, color: '#667068', marginTop: 3 }}>{text}</div></div><div style={{ fontSize: 12, fontWeight: 900, color: '#5d3f23', textAlign: 'right' }}>{value}</div></div>;
}

function Health({ label, value, note }: { label: string; value: string; note: string }) {
  return <div style={{ background: '#f8f5ef', borderRadius: 13, padding: 14 }}><div style={{ fontSize: 12, fontWeight: 900, color: '#667068' }}>{label}</div><div style={{ fontSize: 25, fontWeight: 950, margin: '4px 0' }}>{value}</div><div style={{ fontSize: 12, color: '#667068' }}>{note}</div></div>;
}
