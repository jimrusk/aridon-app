import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Beef,
  CheckCircle2,
  CircleDollarSign,
  Droplets,
  Fence,
  HeartPulse,
  Package,
  ShieldCheck,
  Tractor,
  Users,
} from 'lucide-react';

const PHONE = '505-360-9529';

const cards = [
  { title: 'Herd & Inventory', text: 'Track head count, classes, movements, purchases, sales and death loss.', icon: Beef },
  { title: 'Breeding & Calving', text: 'Monitor breeding groups, pregnancy status, calving windows, weaning and replacement decisions.', icon: HeartPulse },
  { title: 'Grazing & Pasture', text: 'See pasture rotations, carrying pressure, forage condition and grazing plans in one place.', icon: Fence },
  { title: 'Feed & Hay', text: 'Track hay, supplements, minerals, feed cost per head and winter inventory pressure.', icon: Package },
  { title: 'Water & Drought', text: 'Monitor tanks, wells, water hauling, drought exposure and livestock water resilience.', icon: Droplets },
  { title: 'Sales & Buyers', text: 'Track cattle buyers, sale barns, contracts, premiums, weights and follow-up.', icon: BarChart3 },
  { title: 'Labor & Equipment', text: 'Manage payroll, crews, fencing, vehicles, trailers, pumps and maintenance.', icon: Tractor },
  { title: 'Ranch Financials', text: 'See cost per cow, cost per pound sold, gross margin, cash needs and weak spots.', icon: CircleDollarSign },
];

export default function AridonRanchPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#f4f2ec', color: '#263629', fontFamily: 'Arial,sans-serif' }}>
      <section style={{ background: 'linear-gradient(135deg,#17351f,#4a331f 72%,#6c4d2e)', color: '#fff', padding: '28px 7% 78px' }}>
        <div style={{ maxWidth: 1180, margin: 'auto' }}>
          <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <strong style={{ letterSpacing: 2, color: '#f1d58b' }}>ARIDON RANCH</strong>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <a href="#ranch-check" style={navLink}>Ranch Profit Check</a>
              <Link href="/ranch/verified-data" style={{ ...navLink, color: '#f1d58b' }}>Verified Ranch Data</Link>
              <Link href="/ranch/app" style={navLink}>Ranch Command Center</Link>
              <a href={`tel:+1${PHONE.replace(/-/g, '')}`} style={{ ...navLink, color: '#f1d58b', fontWeight: 950 }}>Call Jim: {PHONE}</a>
            </div>
          </nav>

          <div style={{ paddingTop: 68, maxWidth: 950 }}>
            <div style={{ fontSize: 12, fontWeight: 950, letterSpacing: 1, color: '#f1d58b' }}>BUILT FOR RANCHERS. NOT A FARM DASHBOARD WITH COWS PAINTED ON IT.</div>
            <h1 style={{ fontSize: 'clamp(50px,8vw,88px)', lineHeight: .95, letterSpacing: -3, margin: '15px 0 22px' }}>
              Know Your Herd.<br />Protect Your Grass.<br />Control Your Costs.<br /><span style={{ color: '#f1d58b' }}>Sell Smarter.</span>
            </h1>
            <p style={{ fontSize: 21, lineHeight: 1.6, color: '#eadfd2', maxWidth: 860 }}>
              Aridon Ranch is a business operating system for cattle and grazing operations. It brings herd performance, breeding, pasture, feed, water, labor, equipment, buyers and ranch finances into one working view, then tells you where money is leaking and what needs attention next.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
              <a href="#ranch-check" style={primaryButton}>Run My Ranch Profit Check <ArrowRight size={16} style={{ verticalAlign: 'middle' }} /></a>
              <Link href="/ranch/app" style={secondaryButton}>See the Ranch Command Center</Link>
              <Link href="/ranch/verified-data" style={secondaryButton}>See Verified Ranch Data</Link>
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '-36px auto 0', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(235px,1fr))', gap: 12 }}>
          {cards.map(({ title, text, icon: Icon }) => (
            <article key={title} style={card}>
              <Icon size={26} color="#5d3f23" />
              <h3 style={{ margin: '10px 0 6px' }}>{title}</h3>
              <p style={{ margin: 0, color: '#667068', lineHeight: 1.5, fontSize: 14 }}>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="ranch-check" style={{ maxWidth: 1180, margin: '62px auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16 }}>
          <div style={{ background: '#17351f', color: '#fff', borderRadius: 22, padding: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 950, color: '#f1d58b' }}>FREE RANCH PROFIT CHECK</div>
            <h2 style={{ fontSize: 38, margin: '8px 0 12px' }}>Find the hidden leaks before they eat another season.</h2>
            <p style={{ color: '#dce5dc', lineHeight: 1.65 }}>
              The ranch check focuses on the numbers that matter to a livestock operation: cost per cow, cost per pound sold, pregnancy and weaning performance, feed cost, death loss, pasture pressure, water cost, labor and buyer value.
            </p>
            <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
              {['Herd productivity review', 'Feed and winter-cost pressure', 'Breeding and weaning performance', 'Water and drought exposure', 'Buyer and sale-value opportunities', 'Labor and equipment cost pressure'].map((item) => (
                <div key={item} style={{ display: 'flex', gap: 9, alignItems: 'center' }}><CheckCircle2 size={18} color="#f1d58b" /><strong>{item}</strong></div>
              ))}
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #ddd7ca', borderRadius: 22, padding: 28 }}>
            <Beef size={38} color="#5d3f23" />
            <div style={{ fontSize: 12, fontWeight: 950, color: '#6b4a2c', marginTop: 12 }}>ARIDON RANCH ADVISOR</div>
            <h2 style={{ fontSize: 38, margin: '8px 0 12px' }}>What should I do this week?</h2>
            <p style={{ lineHeight: 1.65, color: '#667068' }}>
              Aridon turns ranch records into a short priority list: cows to watch, calves to market, feed inventory to protect, pastures to rotate, tanks to inspect, buyers to call, equipment to service and records to finish.
            </p>
            <Link href="/ranch/app" style={{ ...primaryButton, display: 'inline-block', background: '#5d3f23', color: '#fff' }}>Open Ranch Demo</Link>
          </div>
        </div>
      </section>

      <section style={{ background: '#e9e3d7', padding: '66px 20px' }}>
        <div style={{ maxWidth: 1080, margin: 'auto' }}>
          <div style={{ fontSize: 12, fontWeight: 950, color: '#6b4a2c' }}>RANCH-SPECIFIC DATA</div>
          <h2 style={{ fontSize: 'clamp(38px,5vw,58px)', margin: '8px 0 14px' }}>The same ranch records can do more than run the herd.</h2>
          <p style={{ fontSize: 18, lineHeight: 1.65, color: '#626a63', maxWidth: 900 }}>
            Aridon Ranch can organize livestock inventories, grazing records, water records, health records, feed purchases and operating evidence for lender packets, insurance support, conservation program screening, drought documentation and buyer sustainability requests without turning the ranch office into a paper blizzard.
          </p>
          <Link href="/ranch/verified-data" style={{ ...primaryButton, display: 'inline-block', marginTop: 14 }}>Open Verified Ranch Data</Link>
        </div>
      </section>

      <section style={{ maxWidth: 1080, margin: '64px auto', padding: '0 20px' }}>
        <div style={{ background: '#fff', border: '1px solid #ddd7ca', borderRadius: 22, padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 14, alignItems: 'start' }}>
            <ShieldCheck size={34} color="#5d3f23" />
            <div>
              <div style={{ fontSize: 12, fontWeight: 950, color: '#6b4a2c' }}>RANCHER FIRST</div>
              <h2 style={{ fontSize: 36, margin: '6px 0 10px' }}>No crop terminology. No acre-yield dashboard pretending to fit livestock.</h2>
              <p style={{ margin: 0, lineHeight: 1.65, color: '#667068' }}>This site is designed around animals, forage, water, fencing, feed, breeding, calving, weights, buyers and cost per head. Cattle is the primary workflow, with room to extend the same structure to sheep, goats and mixed grazing operations.</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: '#17351f', color: '#fff', padding: '62px 20px' }}>
        <div style={{ maxWidth: 1000, margin: 'auto' }}>
          <div style={{ fontSize: 12, fontWeight: 950, color: '#f1d58b' }}>RANCHER SUPPORT</div>
          <h2 style={{ fontSize: 'clamp(36px,5vw,56px)', margin: '8px 0 12px' }}>Put Aridon Ranch in front of cattlemen, livestock associations and ranch families.</h2>
          <p style={{ fontSize: 18, lineHeight: 1.65, color: '#dce5dc' }}>The site is built to support direct ranch enrollment and association pilots while keeping individual ranch records private unless the operator chooses to share them.</p>
          <a href={`tel:+1${PHONE.replace(/-/g, '')}`} style={{ ...primaryButton, display: 'inline-block', marginTop: 10 }}>Call Jim: {PHONE}</a>
        </div>
      </section>
    </main>
  );
}

const navLink = { color: '#fff', textDecoration: 'none', fontWeight: 850, fontSize: 14 };
const primaryButton = { background: '#f1d58b', color: '#2c2519', padding: '14px 18px', borderRadius: 11, fontWeight: 950, textDecoration: 'none' };
const secondaryButton = { border: '1px solid #d6c9b7', color: '#fff', padding: '14px 18px', borderRadius: 11, fontWeight: 900, textDecoration: 'none' };
const card = { background: '#fff', padding: 20, borderRadius: 17, border: '1px solid #ddd7ca', boxShadow: '0 10px 35px #2a241812' };
