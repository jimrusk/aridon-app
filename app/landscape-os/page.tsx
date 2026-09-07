import Link from 'next/link';

const modules = [
  ['Estimator', 'Turn property details, scope, labor, materials, equipment and margin targets into a quote-ready estimate.'],
  ['Route Command', 'Organize recurring mowing, maintenance, irrigation and seasonal work by geography, crew and service window.'],
  ['Crew Board', 'See today’s jobs, assignments, blockers, callbacks, hours and completion status without chasing texts.'],
  ['Job Costing', 'Compare estimate vs actual labor, materials, equipment and gross margin on every job.'],
  ['Irrigation Desk', 'Track inspections, leaks, controllers, zones, repair history, seasonal adjustments and water-use opportunities.'],
  ['Equipment Fleet', 'Monitor trucks, trailers, mowers, small equipment, maintenance, downtime and replacement economics.'],
  ['Customer Engine', 'Keep estimates, approvals, service history, follow-up, reviews, renewals and upsell opportunities together.'],
  ['Revenue Recovery', 'Surface stale estimates, missed callbacks, dormant customers, renewals and seasonal work before revenue leaks away.'],
  ['Acquisition Integrator', 'Standardize companies added through a landscaping roll-up without forcing every location into chaos.'],
];

const daily = [
  { label: 'Crews active', value: '4', note: '2 maintenance · 1 install · 1 irrigation' },
  { label: 'Jobs today', value: '17', note: '14 recurring · 3 project jobs' },
  { label: 'Open estimates', value: '$48.6K', note: '6 need follow-up' },
  { label: 'Gross margin watch', value: '31.8%', note: 'Install crew below target' },
];

const jobs = [
  ['Mesa Ridge HOA', 'Maintenance', 'Crew 1', 'In progress', '$1,280'],
  ['Riverstone Dental', 'Irrigation repair', 'Crew 4', 'Needs part', '$640'],
  ['Cedar View Residence', 'Landscape install', 'Crew 3', 'On schedule', '$8,900'],
  ['Northgate Retail', 'Maintenance', 'Crew 2', 'Complete', '$420'],
];

const revenue = [
  ['Stale estimates', '$18,450', '6 prospects', 'Follow up today'],
  ['Spring cleanup', '$12,800', '14 customers', 'Campaign ready'],
  ['Irrigation checks', '$9,600', '24 accounts', 'Schedule route'],
  ['Dormant clients', '$7,300', '11 clients', 'Win-back list'],
];

const card: React.CSSProperties = { background: '#fff', border: '1px solid #D8D2C7', borderRadius: 18, padding: 20, boxShadow: '0 12px 30px rgba(45,55,40,.06)' };
const eyebrow: React.CSSProperties = { color: '#527A48', fontWeight: 950, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase' };
const body: React.CSSProperties = { color: '#615E56', lineHeight: 1.7, fontSize: 16 };
const button: React.CSSProperties = { background: '#A8E06F', color: '#15210E', textDecoration: 'none', fontWeight: 950, borderRadius: 999, padding: '13px 18px', display: 'inline-block' };
const outline: React.CSSProperties = { color: '#EFF5EA', textDecoration: 'none', border: '1px solid #486243', borderRadius: 999, padding: '10px 14px', fontWeight: 850, fontSize: 14 };

export default function LandscapeOSPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#F3F0E8', color: '#171A15', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ background: 'linear-gradient(135deg,#122112 0%,#1B311A 62%,#304A2A 100%)', color: '#F8FBF4' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '22px 20px 72px' }}>
          <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
            <Link href="/landscape-os" style={{ color: '#F8FBF4', textDecoration: 'none', fontWeight: 950, letterSpacing: 1 }}>ARIDON · LANDSCAPE OS</Link>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a href="#platform" style={outline}>Platform</a>
              <a href="#dashboard" style={outline}>Dashboard</a>
              <Link href="/business-os" style={outline}>Business OS</Link>
              <Link href="/business-os/beta" style={button}>Start a pilot</Link>
            </div>
          </nav>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 34, alignItems: 'center', paddingTop: 64 }}>
            <div>
              <div style={{ ...eyebrow, color: '#A8E06F' }}>BUILT FOR LANDSCAPERS, NOT SOFTWARE DEPARTMENTS</div>
              <h1 style={{ fontSize: 'clamp(48px,8vw,82px)', lineHeight: .94, letterSpacing: -3, margin: '16px 0 22px' }}>Run the whole landscaping company from one operating system.</h1>
              <p style={{ fontSize: 20, lineHeight: 1.65, color: '#C7D4C1', maxWidth: 760 }}>Estimates. Recurring routes. Crews. Job costing. Irrigation. Equipment. Customer follow-up. Seasonal upsells. Acquisition integration. Aridon Landscape OS turns scattered field work into one owner-ready operating picture.</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 26 }}>
                <Link href="/business-os/beta" style={button}>Build My Landscape OS</Link>
                <a href="#dashboard" style={{ ...outline, padding: '13px 18px' }}>See the operating board</a>
              </div>
              <p style={{ color: '#91A18B', fontSize: 13, marginTop: 12 }}>Pilot workspace first. Owner approval remains required for consequential external actions.</p>
            </div>

            <div style={{ background: '#0E180E', border: '1px solid #3D5739', borderRadius: 24, padding: 20, boxShadow: '0 30px 70px rgba(0,0,0,.28)' }}>
              <div style={{ ...eyebrow, color: '#A8E06F' }}>TODAY · OWNER BRIEF</div>
              <h2 style={{ fontSize: 30, margin: '9px 0 15px' }}>What needs attention before the trucks roll?</h2>
              {[
                'Crew 3 install margin is slipping below target.',
                'Six open estimates have had no follow-up in 5+ days.',
                'Two irrigation jobs can be combined into one route tomorrow.',
                'Three mowers are approaching scheduled service hours.',
                'Four maintenance customers fit a spring cleanup upsell.'
              ].map((item, i) => <div key={item} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 10, padding: '11px 0', borderTop: i ? '1px solid #263A24' : 0 }}><span style={{ width: 28, height: 28, borderRadius: 999, background: i < 2 ? '#A8E06F' : '#D8E7C8', color: '#17210F', display: 'grid', placeItems: 'center', fontWeight: 950, fontSize: 12 }}>{i+1}</span><span style={{ color: '#E5EDE0', lineHeight: 1.5 }}>{item}</span></div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="dashboard" style={{ maxWidth: 1180, margin: '0 auto', padding: '68px 20px 28px' }}>
        <div style={{ maxWidth: 820 }}><div style={eyebrow}>OWNER COMMAND CENTER</div><h2 style={{ fontSize: 'clamp(36px,5vw,58px)', margin: '10px 0 14px', letterSpacing: -1.8 }}>One screen for the business behind the work.</h2><p style={body}>The goal is not more software tabs. It is a clear answer to three questions: what is happening, where is money leaking, and what should the owner do next?</p></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginTop: 24 }}>
          {daily.map((item) => <article key={item.label} style={card}><div style={{ color: '#77736B', fontSize: 13, fontWeight: 800 }}>{item.label}</div><div style={{ fontSize: 34, fontWeight: 950, margin: '5px 0 4px' }}>{item.value}</div><div style={{ color: '#6A7564', fontSize: 13 }}>{item.note}</div></article>)}
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '18px 20px 68px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(420px,1fr))', gap: 14 }}>
          <article style={card}>
            <div style={eyebrow}>LIVE JOB BOARD</div>
            <h3 style={{ fontSize: 28, margin: '8px 0 16px' }}>Today’s field work</h3>
            <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}><thead><tr>{['Account','Work','Crew','Status','Value'].map(h => <th key={h} style={{ textAlign: 'left', padding: '9px 8px', borderBottom: '1px solid #D8D2C7', color: '#77736B', fontSize: 12 }}>{h}</th>)}</tr></thead><tbody>{jobs.map(r => <tr key={r[0]}>{r.map((v,i) => <td key={i} style={{ padding: '11px 8px', borderBottom: '1px solid #EEEAE2', fontSize: 14, fontWeight: i===0?800:500 }}>{v}</td>)}</tr>)}</tbody></table></div>
          </article>

          <article style={card}>
            <div style={eyebrow}>REVENUE RECOVERY</div>
            <h3 style={{ fontSize: 28, margin: '8px 0 16px' }}>Money already hiding in the business</h3>
            {revenue.map((r,i) => <div key={r[0]} style={{ display: 'grid', gridTemplateColumns: '1.2fr .75fr .85fr 1fr', gap: 8, padding: '12px 0', borderTop: i ? '1px solid #EEEAE2' : 0, fontSize: 14 }}><strong>{r[0]}</strong><span>{r[1]}</span><span style={{ color: '#6C7167' }}>{r[2]}</span><span style={{ color: '#527A48', fontWeight: 850 }}>{r[3]}</span></div>)}
          </article>
        </div>
      </section>

      <section id="platform" style={{ background: '#E5EBDD', padding: '72px 20px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ maxWidth: 840 }}><div style={eyebrow}>THE LANDSCAPE OPERATING PACK</div><h2 style={{ fontSize: 'clamp(36px,5vw,58px)', margin: '10px 0 14px', letterSpacing: -1.8 }}>Built around how landscaping companies actually make and lose money.</h2><p style={body}>Landscape OS is an industry layer on top of Aridon Business OS. The core executive system handles company context, decisions and controlled execution. The landscape pack adds field operations, recurring revenue and production economics.</p></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12, marginTop: 26 }}>
            {modules.map(([title,text],i) => <article key={title} style={{ ...card, borderTop: `4px solid ${i%3===0?'#5C8B52':i%3===1?'#A2B86B':'#708E6D'}` }}><div style={{ fontSize: 13, fontWeight: 950, color: '#527A48' }}>0{i+1}</div><h3 style={{ fontSize: 22, margin: '7px 0 9px' }}>{title}</h3><p style={{ ...body, fontSize: 14, marginBottom: 0 }}>{text}</p></article>)}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '72px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14 }}>
          <article style={{ ...card, background: '#172617', color: '#F4F7F1', borderColor: '#30472E' }}><div style={{ ...eyebrow, color: '#A8E06F' }}>FOR THE OWNER</div><h3 style={{ fontSize: 32, margin: '9px 0' }}>Know which work is worth doing.</h3><p style={{ ...body, color: '#C7D1C3' }}>Track margin by service line, customer, crew and job type. See whether maintenance, installs, irrigation, enhancements or snow/seasonal work is actually carrying the company.</p></article>
          <article style={card}><div style={eyebrow}>FOR THE FIELD</div><h3 style={{ fontSize: 32, margin: '9px 0' }}>Give crews the next clear move.</h3><p style={body}>Crew assignments, job scope, property notes, materials, photos, equipment and callback issues can live with the work instead of scattered across texts and memory.</p></article>
          <article style={card}><div style={eyebrow}>FOR A ROLL-UP</div><h3 style={{ fontSize: 32, margin: '9px 0' }}>Standardize without flattening good local operators.</h3><p style={body}>Use one KPI model, one owner brief and one acquisition integration playbook while preserving local branding, crews and customer relationships where that makes sense.</p></article>
        </div>
      </section>

      <section style={{ background: '#1B2E1A', color: '#F6F8F4', padding: '72px 20px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ ...eyebrow, color: '#A8E06F' }}>PILOT IT ON A REAL LANDSCAPING BUSINESS</div>
          <h2 style={{ fontSize: 'clamp(40px,6vw,66px)', letterSpacing: -2, margin: '12px 0 18px' }}>Start with the workflow that can make money fastest.</h2>
          <p style={{ fontSize: 19, color: '#C7D4C1', lineHeight: 1.65, maxWidth: 780, margin: '0 auto 24px' }}>The first pilot should focus on recovered revenue, recurring-route efficiency and job-margin visibility. Once those produce measurable value, layer in deeper scheduling, integrations and acquisition tooling.</p>
          <Link href="/business-os/beta" style={button}>Start Landscape OS Pilot</Link>
        </div>
      </section>

      <footer style={{ background: '#0D160D', color: '#879485', padding: '26px 20px' }}><div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', fontSize: 13 }}><span>Aridon Landscape OS · Industry operating pack</span><span><Link href="/business-os" style={{ color: '#B8C7B2' }}>Business OS</Link> · <Link href="/" style={{ color: '#B8C7B2' }}>Aridon</Link></span></div></footer>
    </main>
  );
}
