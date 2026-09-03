'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Filter,
  Mail,
  MapPin,
  Search,
  Send,
  Sparkles,
  Store,
  Target,
  Users,
} from 'lucide-react';

type Stage = 'Discovered' | 'Review' | 'Ready to apply' | 'Applied' | 'Follow-up' | 'Booked';

type Opportunity = {
  id: number;
  name: string;
  type: string;
  location: string;
  date: string;
  deadline: string;
  fee: string;
  fit: number;
  stage: Stage;
  reason: string;
};

const demoOpportunities: Opportunity[] = [
  { id: 1, name: 'Four Corners Weekend Market', type: 'Farmers market', location: 'Northwest New Mexico', date: 'Sep 19', deadline: 'Sep 10', fee: '$35', fit: 94, stage: 'Ready to apply', reason: 'Strong fit for fresh mushrooms, tomatoes, cucumbers and herbs.' },
  { id: 2, name: 'Regional Food & Farm Expo', type: 'Trade / buyer event', location: 'New Mexico', date: 'Oct 8', deadline: 'Sep 14', fee: '$125', fit: 90, stage: 'Review', reason: 'Wholesale buyers, restaurants and food-service contacts in one place.' },
  { id: 3, name: 'Downtown Harvest Festival', type: 'Community event', location: 'San Juan County', date: 'Oct 17', deadline: 'Sep 21', fee: '$65', fit: 87, stage: 'Discovered', reason: 'High consumer traffic and an opportunity to test direct-to-consumer pricing.' },
  { id: 4, name: 'Chef & Producer Match Day', type: 'Wholesale matchmaking', location: 'Northern New Mexico', date: 'Oct 26', deadline: 'Sep 30', fee: '$0', fit: 97, stage: 'Follow-up', reason: 'Excellent outlet for Lion’s Mane and recurring greenhouse produce orders.' },
  { id: 5, name: 'Winter Indoor Market', type: 'Farmers market', location: 'Four Corners region', date: 'Nov 7', deadline: 'Oct 9', fee: '$45', fit: 92, stage: 'Applied', reason: 'Indoor winter sales can absorb mushrooms and greenhouse crops when outdoor supply drops.' },
  { id: 6, name: 'Farm-to-Table Pop-Up Series', type: 'Restaurant collaboration', location: 'Farmington area', date: 'Nov 14', deadline: 'Oct 16', fee: '$0', fit: 89, stage: 'Booked', reason: 'Creates recurring chef relationships rather than relying only on market-day sales.' },
];

const stages: Stage[] = ['Discovered', 'Review', 'Ready to apply', 'Applied', 'Follow-up', 'Booked'];

const routines = [
  ['Daily opportunity scan', 'Search approved sources for farmers markets, festivals, food events, buyer meetings, pop-ups and producer opportunities that match the operation.'],
  ['Deadline watch', 'Flag application deadlines before they become emergencies and surface missing documents or fees.'],
  ['Application builder', 'Reuse farm profile, insurance, permits, product list, photos and business details to pre-fill the next application for owner review.'],
  ['Follow-up queue', 'Draft the right follow-up after an application, buyer meeting or event. Nothing sends until the owner approves it.'],
  ['Revenue learning loop', 'Compare booth fees, labor, travel, sales, wholesale leads and repeat orders so Aridon learns which opportunities are actually worth doing.'],
];

export default function MarketOpportunitiesPage() {
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<'All' | Stage>('All');

  const filtered = useMemo(() => demoOpportunities.filter((o) => {
    const text = `${o.name} ${o.type} ${o.location} ${o.reason}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (stage === 'All' || o.stage === stage);
  }), [query, stage]);

  const avgFit = Math.round(demoOpportunities.reduce((sum, o) => sum + o.fit, 0) / demoOpportunities.length);
  const needsAction = demoOpportunities.filter((o) => ['Review', 'Ready to apply', 'Follow-up'].includes(o.stage)).length;

  return (
    <main style={{ minHeight: '100vh', background: '#f5f4ed', color: '#18251d', fontFamily: 'Arial,sans-serif', paddingBottom: 80 }}>
      <header style={{ background: 'linear-gradient(135deg,#153c2a,#204f37 70%,#527546)', color: '#fff', padding: '18px 18px 42px' }}>
        <div style={{ maxWidth: 1180, margin: 'auto' }}>
          <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/ag" style={{ color: '#fff', textDecoration: 'none', display: 'inline-flex', gap: 8, alignItems: 'center', fontWeight: 900 }}><ArrowLeft size={17} /> Aridon Ag</Link>
            <span style={{ background: '#d7efb6', color: '#173b2b', padding: '8px 11px', borderRadius: 999, fontSize: 11, fontWeight: 950 }}>MARKET PIPELINE PROTOTYPE</span>
          </nav>
          <div style={{ maxWidth: 900, paddingTop: 36 }}>
            <div style={{ color: '#d7efb6', fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>ARIDON OPPORTUNITY SCOUT</div>
            <h1 style={{ fontSize: 'clamp(44px,7vw,74px)', lineHeight: .98, letterSpacing: -2.5, margin: '12px 0 18px' }}>Find the sale.<br /><span style={{ color: '#d7efb6' }}>Keep the follow-up moving.</span></h1>
            <p style={{ fontSize: 19, lineHeight: 1.62, color: '#deebe2', maxWidth: 820 }}>Aridon can discover qualified markets and buyer opportunities, track every application and deadline, prepare the paperwork, and keep follow-ups from disappearing into the cracks.</p>
          </div>
        </div>
      </header>

      <section style={{ maxWidth: 1180, margin: '-20px auto 0', padding: '0 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12 }}>
        <Metric title="Open opportunities" value={demoOpportunities.length.toString()} sub="Demo pipeline" icon={Target} />
        <Metric title="Average fit" value={`${avgFit}%`} sub="Product + geography + timing" icon={Sparkles} />
        <Metric title="Needs action" value={needsAction.toString()} sub="Review, apply or follow up" icon={Clock3} />
        <Metric title="Booked" value={demoOpportunities.filter(o => o.stage === 'Booked').length.toString()} sub="Confirmed opportunities" icon={CheckCircle2} />
      </section>

      <section style={{ maxWidth: 1180, margin: '22px auto 0', padding: '0 18px' }}>
        <div style={{ background: '#fff', border: '1px solid #d9e2d5', borderRadius: 20, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
            <div><div style={{ color: '#356943', fontSize: 12, fontWeight: 950 }}>OPPORTUNITY PIPELINE</div><h2 style={{ fontSize: 32, margin: '6px 0 0' }}>Every event from discovery to repeat revenue</h2></div>
            <div style={{ color: '#6a756e', fontSize: 12 }}>Demo opportunities shown until live discovery sources are connected.</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px,1fr) 210px', gap: 10, marginTop: 17 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', border: '1px solid #ccd7ca', background: '#fafbf8', borderRadius: 12, padding: '10px 12px' }}><Search size={18} color="#356943" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search opportunities" style={{ width: '100%', border: 0, outline: 0, background: 'transparent', fontSize: 14 }} /></label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', border: '1px solid #ccd7ca', background: '#fafbf8', borderRadius: 12, padding: '10px 12px' }}><Filter size={18} color="#356943" /><select value={stage} onChange={(e) => setStage(e.target.value as 'All' | Stage)} style={{ width: '100%', border: 0, outline: 0, background: 'transparent' }}><option>All</option>{stages.map(s => <option key={s}>{s}</option>)}</select></label>
          </div>

          <div style={{ display: 'grid', gap: 11, marginTop: 17 }}>
            {filtered.map((o) => <article key={o.id} style={{ border: '1px solid #e1e8de', borderRadius: 16, padding: 16, display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(220px,.75fr)', gap: 16, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><span style={{ fontSize: 11, fontWeight: 950, color: '#356943', background: '#eef4ea', borderRadius: 999, padding: '6px 8px' }}>{o.type}</span><span style={{ fontSize: 11, fontWeight: 950, color: '#705d14', background: '#faf2d7', borderRadius: 999, padding: '6px 8px' }}>{o.stage}</span></div>
                <h3 style={{ fontSize: 23, margin: '9px 0 7px' }}>{o.name}</h3>
                <p style={{ margin: 0, color: '#5f6d64', lineHeight: 1.5, fontSize: 14 }}>{o.reason}</p>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 11, color: '#66736b', fontSize: 12 }}><span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><MapPin size={14} />{o.location}</span><span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><CalendarDays size={14} />{o.date}</span><span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><CircleDollarSign size={14} />{o.fee}</span></div>
              </div>
              <div style={{ background: '#f7f9f5', borderRadius: 13, padding: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span style={{ fontSize: 12, color: '#6b776f' }}>Aridon fit</span><strong>{o.fit}%</strong></div>
                <div style={{ height: 8, background: '#dfe7db', borderRadius: 999, margin: '8px 0 12px', overflow: 'hidden' }}><div style={{ width: `${o.fit}%`, height: '100%', background: '#356943' }} /></div>
                <div style={{ fontSize: 12, color: '#6b776f' }}>Application deadline</div><div style={{ fontWeight: 950, marginTop: 3 }}>{o.deadline}</div>
              </div>
            </article>)}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '18px auto 0', padding: '0 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 12 }}>
        <div style={{ background: '#163d2a', color: '#fff', borderRadius: 20, padding: 22 }}>
          <div style={{ color: '#d7efb6', fontSize: 12, fontWeight: 950 }}>AUTOMATION ROUTINES</div>
          <h2 style={{ fontSize: 31, margin: '7px 0 14px' }}>The boring parts should run themselves.</h2>
          <div style={{ display: 'grid', gap: 10 }}>{routines.map(([title, text], i) => <div key={title} style={{ background: '#214e38', borderRadius: 13, padding: 12, display: 'grid', gridTemplateColumns: '30px 1fr', gap: 9 }}><div style={{ width: 28, height: 28, borderRadius: 999, background: '#d7efb6', color: '#173b2b', display: 'grid', placeItems: 'center', fontWeight: 950 }}>{i + 1}</div><div><strong>{title}</strong><div style={{ color: '#dce9e0', fontSize: 13, lineHeight: 1.45, marginTop: 4 }}>{text}</div></div></div>)}</div>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <Panel icon={Store} eyebrow="WHAT ARIDON SEARCHES FOR" title="More than farmers markets"><Item text="Farmers markets, festivals and community events" /><Item text="Restaurant and chef producer-match opportunities" /><Item text="Wholesale buyers, grocers and food-service leads" /><Item text="CSA, farm-box and subscription opportunities" /><Item text="Ag expos, demos, sponsorships and producer showcases" /></Panel>
          <Panel icon={Mail} eyebrow="APPLICATION + FOLLOW-UP" title="One reusable vendor packet"><Item text="Business profile, products, pricing and photos" /><Item text="Permits, insurance and food-safety records" /><Item text="Application answers and fee tracking" /><Item text="Owner-approved email drafts and reminders" /><Item text="Event result: sales, leads, repeat orders and notes" /></Panel>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '18px auto 0', padding: '0 18px' }}>
        <div style={{ background: '#e7eee0', borderRadius: 20, padding: 22, display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(240px,.6fr)', gap: 18, alignItems: 'center' }}>
          <div><div style={{ color: '#356943', fontSize: 12, fontWeight: 950 }}>ARIDON DIFFERENCE</div><h2 style={{ fontSize: 33, margin: '7px 0 8px' }}>Don’t just find events. Learn which ones make money.</h2><p style={{ margin: 0, color: '#56645b', lineHeight: 1.6 }}>After each opportunity, Aridon records sales, hours, travel, fees, customer leads and repeat orders. Over time the system can stop recommending pretty events that produce lousy economics and favor the ones that create durable customers.</p></div>
          <div style={{ background: '#fff', borderRadius: 15, padding: 17 }}><div style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 950 }}><Send color="#356943" /> Human approval stays in control</div><p style={{ margin: '8px 0 0', color: '#66736b', fontSize: 13, lineHeight: 1.5 }}>Discovery and drafting can be automatic. Applications, fees, commitments and outbound messages require the owner’s approval.</p></div>
        </div>
      </section>
    </main>
  );
}

function Metric({ title, value, sub, icon: Icon }: any) { return <div style={{ background: '#fff', border: '1px solid #d9e2d5', borderRadius: 17, padding: 17, boxShadow: '0 8px 22px rgba(30,60,35,.05)' }}><Icon color="#356943" /><div style={{ fontSize: 12, color: '#647069', fontWeight: 900, marginTop: 8 }}>{title}</div><div style={{ fontSize: 28, fontWeight: 950, marginTop: 3 }}>{value}</div><div style={{ fontSize: 12, color: '#728078', marginTop: 3 }}>{sub}</div></div>; }
function Panel({ icon: Icon, eyebrow, title, children }: any) { return <article style={{ background: '#fff', border: '1px solid #d9e2d5', borderRadius: 20, padding: 21 }}><Icon color="#356943" /><div style={{ color: '#356943', fontSize: 12, fontWeight: 950, marginTop: 10 }}>{eyebrow}</div><h2 style={{ fontSize: 28, margin: '6px 0 12px' }}>{title}</h2><div style={{ display: 'grid', gap: 9 }}>{children}</div></article>; }
function Item({ text }: { text: string }) { return <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: '#5d6a62', lineHeight: 1.45, fontSize: 14 }}><CheckCircle2 size={17} color="#356943" style={{ flex: '0 0 auto', marginTop: 2 }} />{text}</div>; }
