import type { Metadata } from 'next';
import Link from 'next/link';
import SentinelDownloadClient from './SentinelDownloadClient';

export const metadata: Metadata = {
  title: 'Sentinel: Action-Control Platform for AI Agents | Aridon',
  description:
    'Sentinel by Aridon is the action-control platform for AI agents: pre-execution authorization before an agent acts, human approval for consequential actions, and a tamper-evident audit log. Live demo, pilot, research paper, and code.',
  alternates: { canonical: '/sentinel' },
  openGraph: {
    title: 'Sentinel: The Action-Control Platform for AI Agents',
    description:
      'Pre-execution authorization for AI agents: allow, hold for a human, or deny, with a hash-chained audit record.',
    url: '/sentinel',
    siteName: 'Aridon',
    type: 'website',
  },
};

const wrap: React.CSSProperties = { maxWidth: 1060, margin: '0 auto', padding: '0 20px' };
const card: React.CSSProperties = { background: '#fff', border: '1px solid #d8e2dd', borderRadius: 18, padding: 22, boxShadow: '0 8px 30px rgba(12,30,24,.06)' };
const darkButton: React.CSSProperties = { display: 'inline-block', background: '#10211c', color: '#fff', textDecoration: 'none', fontWeight: 900, padding: '13px 18px', borderRadius: 11 };
const lightButton: React.CSSProperties = { display: 'inline-block', background: '#9EF0CF', color: '#10211c', textDecoration: 'none', fontWeight: 900, padding: '13px 18px', borderRadius: 11 };
const bodyText: React.CSSProperties = { color: '#42524c', fontSize: 17, lineHeight: 1.65 };

export default function SentinelHubPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#f3f7f5', color: '#10211c', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ background: '#07130f', color: '#fff', padding: '22px 0 64px' }}>
        <div style={wrap}>
          <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 56 }}>
            <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 950, letterSpacing: 1 }}>ARIDON</Link>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <Link href="/sentinel-demo" style={{ color: '#cfe0d9', textDecoration: 'none', fontWeight: 800 }}>Live demo</Link>
              <Link href="/sentinel-pilot" style={lightButton}>Start a Sentinel pilot</Link>
            </div>
          </nav>

          <div style={{ maxWidth: 880 }}>
            <div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: 13, letterSpacing: 1.8, marginBottom: 14 }}>SENTINEL BY ARIDON</div>
            <h1 style={{ fontSize: 'clamp(38px,6vw,64px)', lineHeight: 1.02, margin: '0 0 22px', letterSpacing: -1.6 }}>Sentinel: the action-control platform for AI agents</h1>
            <p style={{ fontSize: 20, lineHeight: 1.6, color: '#cfe0d9', maxWidth: 800, margin: '0 0 28px' }}>
              Sentinel is the action-control platform for AI agents, built by Aridon. Before an AI
              agent&apos;s action executes, Sentinel evaluates it against policy and returns one of
              three verdicts: allow, hold for human approval, or deny. Every decision is written to
              a SHA-256 hash-chained audit log that anyone can re-verify. Sentinel is a
              development-stage technical preview, now in early access and opening design-partner
              pilot conversations.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/sentinel-demo" style={lightButton}>Run the live demo</Link>
              <Link href="/sentinel-pilot" style={{ ...darkButton, border: '1px solid #38564b' }}>Apply for the free pilot</Link>
            </div>
          </div>
        </div>
      </section>

      <section style={{ ...wrap, paddingTop: 56 }}>
        <div style={{ maxWidth: 780, marginBottom: 26 }}>
          <div style={{ fontSize: 12, letterSpacing: 1.5, fontWeight: 950, color: '#427262' }}>PRE-EXECUTION AUTHORIZATION, DEFINED</div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,40px)', margin: '10px 0 12px' }}>The permission check happens before the action runs</h2>
          <p style={bodyText}>
            Pre-execution authorization means the permission check happens before an action runs, not
            in a log review after it. Detection tools tell you what an agent already did. Sentinel
            sits between the agent&apos;s decision and the tool call, so an action that fails policy,
            or that needs a person&apos;s judgment, never executes in the first place.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(235px,1fr))', gap: 14 }}>
          {[
            ['Allow', 'Actions inside policy execute immediately, with the decision recorded in the audit log.'],
            ['Hold for human approval', 'Consequential actions wait for a person. The approval is bound to that exact action, one shot, not a blanket pass.'],
            ['Deny', 'Actions that fail policy, or whose content scores as hostile, never execute at all.'],
            ['Audit everything', 'Every verdict lands in a SHA-256 hash-chained log that anyone can re-verify after the fact.'],
          ].map(([title, text]) => (
            <div key={title} style={card}>
              <h3 style={{ marginTop: 0, marginBottom: 8 }}>{title}</h3>
              <p style={{ color: '#5d6d67', lineHeight: 1.55, margin: 0 }}>{text}</p>
            </div>
          ))}
        </div>
        <p style={{ ...bodyText, marginTop: 22 }}>
          Sentinel gates payments and transfers, sending email and messages, shell and command
          execution, database writes and deletes, credential access, network requests, and file
          deletion, plus any action whose content scores as hostile, such as prompt injection or data
          exfiltration attempts. The public test build is an MCP server that sits in front of any MCP
          client, and a CrewAI template is published alongside it.
        </p>
      </section>

      <section style={{ ...wrap, paddingTop: 48 }}>
        <div style={{ ...card, padding: 28 }}>
          <div style={{ fontSize: 12, letterSpacing: 1.5, fontWeight: 950, color: '#427262' }}>WHAT THE INTERNAL TEST SHOWED</div>
          <h2 style={{ fontSize: 30, margin: '10px 0 12px' }}>18 of 18 scenarios, 0 false positives (internal harness)</h2>
          <p style={{ ...bodyText, margin: 0 }}>
            In Aridon&apos;s internal harness (September 2026), Sentinel held all 13 hostile actions
            before execution and passed all 5 benign controls: 18 of 18 scenarios, 0 false positives.
            These are synthetic, internal results. There has been no independent penetration test and
            no third-party evaluation, and Sentinel is not a certified security product or a guarantee
            of safety.
          </p>
        </div>
      </section>

      <section style={{ ...wrap, paddingTop: 48, paddingBottom: 64 }}>
        <div style={{ maxWidth: 780, marginBottom: 22 }}>
          <div style={{ fontSize: 12, letterSpacing: 1.5, fontWeight: 950, color: '#427262' }}>READ THE RESEARCH, GET THE CODE</div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,40px)', margin: '10px 0 12px' }}>Everything is public</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(235px,1fr))', gap: 14 }}>
          <div style={card}>
            <h3 style={{ marginTop: 0 }}>Live demo</h3>
            <p style={{ color: '#5d6d67', lineHeight: 1.55 }}>Run all 18 attack and control scenarios, play the human approver, and inspect the audit trail.</p>
            <Link href="/sentinel-demo" style={{ color: '#315e50', fontWeight: 800 }}>Open the demo</Link>
          </div>
          <div style={card}>
            <h3 style={{ marginTop: 0 }}>Pilot</h3>
            <p style={{ color: '#5d6d67', lineHeight: 1.55 }}>A free two-week design-partner pilot on one of your agents.</p>
            <Link href="/sentinel-pilot" style={{ color: '#315e50', fontWeight: 800 }}>See the pilot</Link>
          </div>
          <div style={card}>
            <h3 style={{ marginTop: 0 }}>Research paper</h3>
            <p style={{ color: '#5d6d67', lineHeight: 1.55 }}>&ldquo;Sentinel: Pre-Execution Authorization for AI Agents and Legacy Operational Technology,&rdquo; Zenodo, DOI 10.5281/zenodo.23920785.</p>
            <a href="https://doi.org/10.5281/zenodo.23920785" style={{ color: '#315e50', fontWeight: 800 }}>Read the paper</a>
          </div>
          <div style={card}>
            <h3 style={{ marginTop: 0 }}>Code</h3>
            <p style={{ color: '#5d6d67', lineHeight: 1.55 }}>The MCP server and the CrewAI template are open source on GitHub.</p>
            <a href="https://github.com/jimrusk/sentinel-mcp" style={{ color: '#315e50', fontWeight: 800 }}>sentinel-mcp</a>
            <br />
            <a href="https://github.com/jimrusk/sentinel-crewai-template" style={{ color: '#315e50', fontWeight: 800 }}>sentinel-crewai-template</a>
          </div>
        </div>
      </section>

      <section style={{ background: '#e8f2ed', padding: '56px 0 64px' }}>
        <div style={wrap}>
          <div style={{ maxWidth: 780, marginBottom: 8 }}>
            <div style={{ fontSize: 12, letterSpacing: 1.5, fontWeight: 950, color: '#427262' }}>ALSO FROM SENTINEL</div>
            <h2 style={{ fontSize: 'clamp(26px,4vw,36px)', margin: '10px 0 8px' }}>Sentinel for your devices</h2>
            <p style={bodyText}>
              Separate from the agent platform above, the Sentinel device downloads (Android and
              Windows) live here.
            </p>
          </div>
          <SentinelDownloadClient />
        </div>
      </section>
    </main>
  );
}
