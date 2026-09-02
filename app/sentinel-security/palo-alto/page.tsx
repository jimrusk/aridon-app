import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Aridon Sentinel + Palo Alto Networks | Response Fabric Integration Concept',
  description: 'Executive integration concept for adding Aridon Sentinel containment, business continuity, evidence and human escalation controls across Palo Alto Networks security products.',
  alternates: { canonical: '/sentinel-security/palo-alto' },
};

const wrap: React.CSSProperties = { maxWidth: 1120, margin: '0 auto', padding: '0 20px' };
const card: React.CSSProperties = { background: '#fff', border: '1px solid #d8e2dd', borderRadius: 18, padding: 22, boxShadow: '0 8px 30px rgba(12,30,24,.06)' };

export default function PaloAltoExecutiveProposalPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#f3f7f5', color: '#10211c', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ background: '#07130f', color: '#fff', padding: '24px 0 68px' }}>
        <div style={wrap}>
          <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginBottom: 54 }}>
            <Link href="/sentinel-security" style={{ color: '#fff', textDecoration: 'none', fontWeight: 950 }}>ARIDON SENTINEL</Link>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/business-os/sentinel/palo-alto" style={{ background: '#9EF0CF', color: '#10211c', textDecoration: 'none', padding: '11px 14px', borderRadius: 10, fontWeight: 900 }}>Open integration lab</Link>
              <Link href="/customer/start?product=sentinel&partner=palo-alto" style={{ border: '1px solid #38564b', color: '#fff', textDecoration: 'none', padding: '11px 14px', borderRadius: 10, fontWeight: 900 }}>Discuss a pilot</Link>
            </div>
          </nav>

          <div style={{ maxWidth: 900 }}>
            <div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1.8 }}>EXECUTIVE INTEGRATION CONCEPT</div>
            <h1 style={{ fontSize: 'clamp(42px,7vw,76px)', lineHeight: .98, margin: '12px 0 20px', letterSpacing: -2 }}>Palo Alto finds the attack. Sentinel limits the damage.</h1>
            <p style={{ color: '#cfe0d9', fontSize: 20, lineHeight: 1.55, maxWidth: 850 }}>Aridon Sentinel Response Fabric is designed to sit above detection, identity and security-automation products and answer the business-critical question after an alert: what is the smallest safe action that contains the threat, preserves evidence and keeps the company operating?</p>
            <p style={{ color: '#8fa79d', fontSize: 13, lineHeight: 1.5 }}>This page describes an Aridon integration concept. It does not claim an existing commercial partnership, certification or endorsement by Palo Alto Networks or CyberArk.</p>
          </div>
        </div>
      </section>

      <section style={{ ...wrap, paddingTop: 34, paddingBottom: 34 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginTop: -58 }}>
          {[
            ['Prisma AIRS', 'AI-agent and runtime signals feed agent quarantine, delegated-access control and evidence decisions.'],
            ['Cortex XSIAM', 'Detection and telemetry feed incident correlation, blast-radius scoring and containment prioritization.'],
            ['Cortex XSOAR', 'Playbooks remain execution engines while Sentinel applies company-level continuity, approval and escalation policy.'],
            ['CyberArk', 'Identity and privileged-session events feed targeted suspension and credential-rotation decisions.'],
          ].map(([title, text]) => <div key={title} style={card}><h3 style={{ marginTop: 0 }}>{title}</h3><p style={{ color: '#5c6d66', lineHeight: 1.55, marginBottom: 0 }}>{text}</p></div>)}
        </div>
      </section>

      <section style={{ ...wrap, paddingTop: 44, paddingBottom: 48 }}>
        <div style={{ maxWidth: 790, marginBottom: 26 }}>
          <div style={{ color: '#427262', fontSize: 12, fontWeight: 950, letterSpacing: 1.5 }}>THE RESPONSE FABRIC</div>
          <h2 style={{ fontSize: 'clamp(31px,4vw,48px)', margin: '10px 0 12px' }}>One company-level decision layer across AI, identity and security operations.</h2>
        </div>
        <div style={{ ...card, background: '#10211c', color: '#fff', borderColor: '#10211c', padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
            {['1. Detect', '2. Correlate', '3. Measure blast radius', '4. Contain smallest safe scope', '5. Preserve evidence', '6. Protect continuity', '7. Human decision', '8. Controlled escalation'].map((step) => <div key={step} style={{ background: '#142c24', border: '1px solid #2a4a3f', borderRadius: 12, padding: 15, fontWeight: 900 }}>{step}</div>)}
          </div>
        </div>
      </section>

      <section style={{ background: '#e8f2ed', padding: '64px 0' }}>
        <div style={wrap}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 18 }}>
            <div style={card}>
              <div style={{ color: '#427262', fontSize: 12, fontWeight: 950, letterSpacing: 1.4 }}>WHAT SENTINEL ADDS</div>
              <h2 style={{ fontSize: 34, margin: '10px 0 12px' }}>Adaptive Containment Fabric</h2>
              <ul style={{ color: '#52635d', lineHeight: 1.75, paddingLeft: 20 }}>
                <li>Cross-product blast-radius assessment</li>
                <li>Smallest-safe isolation recommendation</li>
                <li>Business-continuity guardrails</li>
                <li>AI-agent quarantine decision layer</li>
                <li>Evidence envelope and chain-of-custody hashing</li>
                <li>Audited executive override and incident hold</li>
                <li>Prepare Only, Human Approval and pre-authorized Critical Response modes</li>
              </ul>
            </div>
            <div style={card}>
              <div style={{ color: '#427262', fontSize: 12, fontWeight: 950, letterSpacing: 1.4 }}>WHY IT CAN EXPAND THE PLATFORM</div>
              <h2 style={{ fontSize: 34, margin: '10px 0 12px' }}>From cybersecurity to digital resilience.</h2>
              <p style={{ color: '#52635d', lineHeight: 1.65 }}>The response layer creates an additional enterprise value proposition after detection: reducing operational damage while preserving normal business activity wherever possible.</p>
              <p style={{ color: '#52635d', lineHeight: 1.65 }}>That can support enterprise-response, AI-emergency-control, identity-containment, critical-infrastructure and evidence/compliance packaging without replacing the underlying Palo Alto products.</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ ...wrap, paddingTop: 70, paddingBottom: 70 }}>
        <div style={{ maxWidth: 820, marginBottom: 26 }}>
          <div style={{ color: '#427262', fontSize: 12, fontWeight: 950, letterSpacing: 1.5 }}>PILOT PROPOSAL</div>
          <h2 style={{ fontSize: 'clamp(31px,4vw,48px)', margin: '10px 0 12px' }}>Prove it without replacing anyone&apos;s security stack.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 14 }}>
          {[
            ['Week 1', 'Map Prisma AIRS, Cortex and CyberArk test events into Sentinel’s normalized incident model. Define authorized actions and rollback limits.'],
            ['Week 2', 'Run safe simulations for rogue AI agent, stolen privileged identity, data-exfiltration attempt and ransomware precursor.'],
            ['Week 3', 'Tune blast-radius scoring, smallest-safe containment logic, continuity rules and executive approval workflow.'],
            ['Week 4', 'Deliver measured response-time results, false-positive review, evidence package quality and production-readiness plan.'],
          ].map(([title, text]) => <div key={title} style={card}><div style={{ fontSize: 20, fontWeight: 950 }}>{title}</div><p style={{ color: '#586962', lineHeight: 1.6, marginBottom: 0 }}>{text}</p></div>)}
        </div>

        <div style={{ ...card, marginTop: 20, background: '#10211c', color: '#fff', borderColor: '#10211c', padding: 28 }}>
          <h2 style={{ fontSize: 34, marginTop: 0 }}>The ask</h2>
          <p style={{ color: '#cbdcd5', fontSize: 18, lineHeight: 1.6 }}>Run one controlled joint technical evaluation using non-production data and safe simulations. Aridon supplies the Response Fabric, audit controls and containment policy layer. The participating security team supplies approved test signals, product-field mappings and action permissions.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
            <Link href="/business-os/sentinel/palo-alto" style={{ background: '#9EF0CF', color: '#10211c', textDecoration: 'none', padding: '12px 16px', borderRadius: 10, fontWeight: 900 }}>Open the working lab</Link>
            <Link href="/customer/start?product=sentinel&offer=palo-alto-pilot" style={{ border: '1px solid #3a5b4f', color: '#fff', textDecoration: 'none', padding: '12px 16px', borderRadius: 10, fontWeight: 900 }}>Start pilot discussion</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
