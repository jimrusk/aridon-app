import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Aridon Sentinel Security | Breach Detection, Containment & Human Override',
  description: 'Aridon Sentinel is a security orchestration and incident-response layer that detects suspicious behavior, contains high-risk activity, preserves evidence, and gives companies a controlled human override before external escalation.',
  alternates: { canonical: '/sentinel-security' },
  openGraph: {
    title: 'Aridon Sentinel Security',
    description: 'Detect the signal. Contain the damage. Preserve the evidence. Keep people in control.',
    url: '/sentinel-security',
    siteName: 'Aridon',
    type: 'website',
  },
};

const wrap: React.CSSProperties = { maxWidth: 1160, margin: '0 auto', padding: '0 20px' };
const card: React.CSSProperties = { background: '#fff', border: '1px solid #d8e2dd', borderRadius: 18, padding: 22, boxShadow: '0 8px 30px rgba(12,30,24,.06)' };
const darkButton: React.CSSProperties = { display: 'inline-block', background: '#10211c', color: '#fff', textDecoration: 'none', fontWeight: 900, padding: '13px 18px', borderRadius: 11 };
const lightButton: React.CSSProperties = { display: 'inline-block', background: '#9EF0CF', color: '#10211c', textDecoration: 'none', fontWeight: 900, padding: '13px 18px', borderRadius: 11 };

export default function SentinelSecuritySalesPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#f3f7f5', color: '#10211c', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ background: '#07130f', color: '#fff', padding: '22px 0 74px' }}>
        <div style={wrap}>
          <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 62 }}>
            <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 950, letterSpacing: 1 }}>ARIDON</Link>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <Link href="/business-os" style={{ color: '#cfe0d9', textDecoration: 'none', fontWeight: 800 }}>Business OS</Link>
              <Link href="/business-os/sentinel" style={{ color: '#cfe0d9', textDecoration: 'none', fontWeight: 800 }}>Command Center</Link>
              <Link href="/customer/start?product=sentinel" style={lightButton}>Start a Sentinel pilot</Link>
            </div>
          </nav>

          <div style={{ maxWidth: 900 }}>
            <div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: 13, letterSpacing: 1.8, marginBottom: 14 }}>ARIDON SENTINEL SECURITY</div>
            <h1 style={{ fontSize: 'clamp(42px,7vw,78px)', lineHeight: .98, margin: '0 0 22px', letterSpacing: -2.2 }}>When something looks wrong, Sentinel moves first. Your company still holds the override.</h1>
            <p style={{ fontSize: 21, lineHeight: 1.55, color: '#cfe0d9', maxWidth: 820, margin: '0 0 28px' }}>Sentinel is a security orchestration and incident-response layer for companies that cannot afford to discover a breach hours later. It correlates suspicious behavior, contains high-risk activity, preserves evidence, and routes serious incidents into a controlled human response.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/customer/start?product=sentinel" style={lightButton}>Launch a 30-day pilot</Link>
              <Link href="/business-os/sentinel" style={{ ...darkButton, border: '1px solid #38564b' }}>See Sentinel inside Aridon</Link>
            </div>
            <p style={{ marginTop: 18, color: '#8fa79d', fontSize: 13 }}>Sentinel works alongside existing endpoint, identity, firewall, backup and monitoring tools. It is not positioned as a replacement for a company&apos;s entire cybersecurity stack.</p>
          </div>
        </div>
      </section>

      <section style={{ ...wrap, paddingTop: 26 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14, marginTop: -42 }}>
          {[
            ['31%', 'of breaches now begin with software vulnerabilities, according to Verizon’s 2026 DBIR.'],
            ['48%', 'of breaches involve ransomware in Verizon’s 2026 DBIR.'],
            ['48%', 'of breaches involve a third party or supply-chain relationship.'],
            ['Human override', 'Company leadership can pause external reporting while containment and evidence preservation continue.'],
          ].map(([big, text]) => <div key={big + text} style={card}><div style={{ fontSize: 32, fontWeight: 950 }}>{big}</div><p style={{ margin: '8px 0 0', color: '#5d6c67', lineHeight: 1.5, fontSize: 14 }}>{text}</p></div>)}
        </div>
        <p style={{ color: '#71817b', fontSize: 12, marginTop: 10 }}>Threat statistics: <a href="https://www.verizon.com/business/resources/reports/dbir/" target="_blank" rel="noreferrer" style={{ color: '#315e50' }}>Verizon 2026 Data Breach Investigations Report</a>.</p>
      </section>

      <section style={{ ...wrap, paddingTop: 62, paddingBottom: 24 }}>
        <div style={{ maxWidth: 760, marginBottom: 28 }}>
          <div style={{ fontSize: 12, letterSpacing: 1.5, fontWeight: 950, color: '#427262' }}>THE PROBLEM SENTINEL SOLVES</div>
          <h2 style={{ fontSize: 'clamp(30px,4vw,48px)', margin: '10px 0 12px' }}>Security tools generate alerts. Companies need a decision-and-response layer.</h2>
          <p style={{ color: '#5b6b65', fontSize: 18, lineHeight: 1.55 }}>A suspicious login, privilege change, data export and new API token may look harmless one by one. Sentinel combines them into one incident, scores the risk, triggers approved containment steps, and keeps management in control of escalation.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(235px,1fr))', gap: 14 }}>
          {[
            ['Detect', 'Correlate unusual access, privilege escalation, impossible travel, mass reads, export attempts, credential changes and other signals.'],
            ['Contain', 'Freeze risky exports, revoke suspicious sessions, isolate affected access paths and trigger credential rotation workflows.'],
            ['Preserve', 'Retain the incident record, timestamps, indicators and evidence hash so the response team has a defensible trail.'],
            ['Escalate carefully', 'Prepare authority-ready incident packages while keeping simulations, low-confidence findings and overridden incidents from being sent automatically.'],
            ['Override false findings', 'Authorized company leadership can pause company-wide reporting, hold one incident, mark false positives, and safely resume with human approval required.'],
            ['Audit every decision', 'Overrides do not erase history. Sentinel records who changed the state, why it changed, and what happened before and after.'],
          ].map(([title, text]) => <div key={title} style={card}><h3 style={{ marginTop: 0, marginBottom: 8 }}>{title}</h3><p style={{ color: '#5d6d67', lineHeight: 1.55, margin: 0 }}>{text}</p></div>)}
        </div>
      </section>

      <section style={{ background: '#e8f2ed', marginTop: 54, padding: '64px 0' }}>
        <div style={wrap}>
          <div style={{ maxWidth: 760, marginBottom: 28 }}>
            <div style={{ fontSize: 12, letterSpacing: 1.5, fontWeight: 950, color: '#427262' }}>WHO WE ARE STARTING WITH</div>
            <h2 style={{ fontSize: 'clamp(30px,4vw,48px)', margin: '10px 0 12px' }}>Five markets where a security incident becomes an operations problem immediately.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14 }}>
            {[
              ['Manufacturing', 'Downtime, supply-chain exposure, shared vendor access and connected operational systems make containment speed valuable.'],
              ['Healthcare', 'Sensitive records, ransomware pressure, third-party access and operational continuity make evidence and controlled escalation critical.'],
              ['Professional services', 'Law, accounting, finance and advisory firms hold valuable client data but often run lean internal security teams.'],
              ['Public sector', 'Municipalities, utilities and public agencies need defensible incident handling without turning every anomaly into an external filing.'],
              ['MSPs / MSSPs', 'One Sentinel partnership can add a response-and-override layer across many managed customers instead of selling one company at a time.'],
            ].map(([title, text]) => <div key={title} style={card}><h3 style={{ marginTop: 0 }}>{title}</h3><p style={{ marginBottom: 0, color: '#5f6f69', lineHeight: 1.55 }}>{text}</p></div>)}
          </div>
        </div>
      </section>

      <section style={{ ...wrap, paddingTop: 70, paddingBottom: 70 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 18, alignItems: 'stretch' }}>
          <div style={{ ...card, background: '#10211c', color: '#fff', borderColor: '#10211c', padding: 28 }}>
            <div style={{ color: '#9EF0CF', fontWeight: 950, letterSpacing: 1.3, fontSize: 12 }}>FOUNDING COMPANY PILOT</div>
            <h2 style={{ fontSize: 34, margin: '12px 0' }}>30 days to prove the response workflow.</h2>
            <p style={{ color: '#c8d9d2', lineHeight: 1.6 }}>We start with a limited environment, connect the approved signals and workflows, run safe simulations, tune false-positive thresholds, test the company override, and produce an executive readiness review.</p>
            <ul style={{ color: '#dce8e3', lineHeight: 1.8, paddingLeft: 20 }}>
              <li>Security and access review</li>
              <li>Sentinel policy configuration</li>
              <li>Safe breach simulations</li>
              <li>Containment and escalation testing</li>
              <li>False-positive override training</li>
              <li>Executive closeout report</li>
            </ul>
            <Link href="/customer/start?product=sentinel&offer=pilot" style={lightButton}>Apply for a pilot</Link>
          </div>
          <div style={{ ...card, padding: 28 }}>
            <div style={{ color: '#427262', fontWeight: 950, letterSpacing: 1.3, fontSize: 12 }}>CHANNEL PARTNERS</div>
            <h2 style={{ fontSize: 34, margin: '12px 0' }}>MSPs can bring Sentinel to their own customers.</h2>
            <p style={{ color: '#5c6c66', lineHeight: 1.6 }}>The fastest distribution path is through firms already trusted to manage company IT. The partner motion is designed around co-managed deployment, customer-specific policies and human approval controls, not taking the MSP out of the loop.</p>
            <ul style={{ color: '#4e5d58', lineHeight: 1.8, paddingLeft: 20 }}>
              <li>Co-managed customer deployments</li>
              <li>Partner-friendly pilot structure</li>
              <li>Customer-specific escalation policies</li>
              <li>Security override retained by the customer</li>
              <li>Future multi-tenant partner console path</li>
            </ul>
            <Link href="/customer/start?product=sentinel&partner=msp" style={darkButton}>Become a Sentinel partner</Link>
          </div>
        </div>
      </section>

      <section style={{ background: '#07130f', color: '#fff', padding: '70px 0' }}>
        <div style={{ ...wrap, textAlign: 'center' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(34px,5vw,56px)', margin: '0 0 16px' }}>The sales pitch is simple: catch the dangerous pattern early, contain it, keep the evidence, and keep humans in charge.</h2>
            <p style={{ color: '#c7d8d1', lineHeight: 1.55, fontSize: 18, marginBottom: 26 }}>Start with a controlled pilot instead of a giant security replacement project.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/customer/start?product=sentinel&offer=pilot" style={lightButton}>Start a Sentinel pilot</Link>
              <Link href="/business-os/sentinel" style={{ ...darkButton, border: '1px solid #38564b' }}>Open Sentinel Command Center</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
