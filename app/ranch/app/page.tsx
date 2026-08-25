import Link from 'next/link';
import {
  AlertTriangle,
  BarChart3,
  Beef,
  CircleDollarSign,
  Droplets,
  Fence,
  HeartPulse,
  Home,
  Menu,
  Package,
  ShieldCheck,
  Tractor,
  Users,
} from 'lucide-react';
import styles from './page.module.css';

const primaryTools = [
  ['Herd', 'Head count, movements, sales and death loss', Beef],
  ['Breeding', 'Pregnancy, calving, weaning and replacements', HeartPulse],
  ['Grazing', 'Pasture rotation, forage and carrying pressure', Fence],
  ['Feed', 'Hay, supplements and cost per head', Package],
  ['Water', 'Tanks, wells, hauling and drought', Droplets],
  ['Sales', 'Buyers, weights, premiums and follow-up', BarChart3],
] as const;

const moreTools = [
  ['Labor', 'Payroll, overtime and recurring ranch work', Users],
  ['Equipment', 'Vehicles, trailers, pumps, fencing and maintenance', Tractor],
  ['Financials', 'Cost per cow, cost per pound and ranch margin', CircleDollarSign],
  ['Verified Data', 'Lenders, insurance, conservation and buyer evidence', ShieldCheck],
] as const;

export default function RanchAppPage() {
  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <div>
            <div className={styles.brand}>ARIDON RANCH</div>
            <strong className={styles.title}>Command Center</strong>
          </div>
          <div className={styles.desktopNav}>
            <Link href="/ranch">Ranch Home</Link>
            <Link href="/ranch/verified-data">Verified Data</Link>
          </div>
        </div>
      </header>

      <div className={styles.shell}>
        <section id="today" className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <div className={styles.eyebrow}>TODAY</div>
              <h1>What needs attention?</h1>
            </div>
            <div className={styles.statusPill}><AlertTriangle size={16} /> 3 priorities</div>
          </div>

          <div className={styles.statsGrid}>
            <Stat title="Herd" value="486" sub="head on books" />
            <Stat title="Pregnancy" value="91%" sub="current group" />
            <Stat title="Feed" value="$2.84" sub="per head/day" />
            <Stat title="Water" value="2" sub="alerts" alert />
          </div>

          <div className={styles.priorityList}>
            <Priority rank="1" title="Check 18 late-calving cows" detail="Outside the target calving window." tag="Herd" />
            <Priority rank="2" title="Move yearlings off South pasture" detail="Grazing pressure is above target." tag="Pasture" />
            <Priority rank="3" title="Secure 60 more tons of hay" detail="Winter reserve is below target." tag="$18K exposure" />
            <div className={styles.desktopOnly}><Priority rank="4" title="Follow up with 3 buyers" detail="Current weights make these groups worth quoting." tag="$24K potential" /></div>
            <div className={styles.desktopOnly}><Priority rank="5" title="Inspect North tank float valve" detail="Water use is above its normal pattern." tag="Water" /></div>
          </div>
        </section>

        <section id="health" className={styles.section}>
          <div className={styles.sectionHeadingCompact}>
            <div>
              <div className={styles.eyebrow}>RANCH HEALTH</div>
              <h2>One-glance numbers</h2>
            </div>
          </div>
          <div className={styles.healthScroller}>
            <Health label="Calf crop" value="87%" note="Below 90% target" />
            <Health label="Death loss" value="1.8%" note="Within target" />
            <Health label="Pasture" value="High" note="South pasture" warning />
            <Health label="Hay reserve" value="74%" note="Below target" warning />
            <Health label="Cost / cow" value="$1,046" note="Review feed" />
          </div>
        </section>

        <section id="tools" className={styles.section}>
          <div className={styles.sectionHeadingCompact}>
            <div>
              <div className={styles.eyebrow}>QUICK TOOLS</div>
              <h2>Run the ranch</h2>
            </div>
          </div>

          <div className={styles.toolGrid}>
            {primaryTools.map(([title, text, Icon]) => (
              <button key={title} className={styles.toolCard} type="button">
                <span className={styles.toolIcon}><Icon size={22} /></span>
                <span className={styles.toolText}><strong>{title}</strong><small>{text}</small></span>
              </button>
            ))}
          </div>

          <details className={styles.moreTools}>
            <summary><Menu size={18} /> More ranch tools</summary>
            <div className={styles.moreGrid}>
              {moreTools.map(([title, text, Icon]) => title === 'Verified Data' ? (
                <Link key={title} href="/ranch/verified-data" className={styles.moreCard}>
                  <Icon size={21} /><span><strong>{title}</strong><small>{text}</small></span>
                </Link>
              ) : (
                <div key={title} className={styles.moreCard}>
                  <Icon size={21} /><span><strong>{title}</strong><small>{text}</small></span>
                </div>
              ))}
            </div>
          </details>
        </section>
      </div>

      <nav className={styles.mobileNav} aria-label="Ranch command center navigation">
        <a href="#today"><Home size={20} /><span>Today</span></a>
        <a href="#health"><AlertTriangle size={20} /><span>Health</span></a>
        <a href="#tools"><Beef size={20} /><span>Tools</span></a>
        <Link href="/ranch/verified-data"><ShieldCheck size={20} /><span>Data</span></Link>
      </nav>
    </main>
  );
}

function Stat({ title, value, sub, alert = false }: { title: string; value: string; sub: string; alert?: boolean }) {
  return (
    <article className={`${styles.stat} ${alert ? styles.statAlert : ''}`}>
      <div className={styles.statTitle}>{title}</div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statSub}>{sub}</div>
    </article>
  );
}

function Priority({ rank, title, detail, tag }: { rank: string; title: string; detail: string; tag: string }) {
  return (
    <article className={styles.priority}>
      <div className={styles.rank}>{rank}</div>
      <div className={styles.priorityCopy}>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <div className={styles.tag}>{tag}</div>
    </article>
  );
}

function Health({ label, value, note, warning = false }: { label: string; value: string; note: string; warning?: boolean }) {
  return (
    <article className={`${styles.healthCard} ${warning ? styles.healthWarning : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}
