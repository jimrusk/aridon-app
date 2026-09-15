'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';

type Level = 'low' | 'verify' | 'high' | 'block';
type Gate = 'proceed' | 'verify_out_of_band' | 'hold' | 'block_automation';

type Assessment = {
  score: number;
  level: Level;
  reasons: string[];
  actionGate: { mode: Gate; reason: string };
  verificationPlan: string[];
  disclaimer: string;
};

type Receipt = {
  id: string;
  inputFingerprint: string;
  generatedAt: string;
  policyVersion: string;
  rawContentStored: boolean;
};

type Demo = {
  label: string;
  channel: string;
  sender: string;
  org: string;
  domain: string;
  url: string;
  amount: string;
  message: string;
  evidence: string;
};

const demos: Demo[] = [
  {
    label: 'Vendor bank-change request',
    channel: 'email',
    sender: 'billing@acme-payments.example',
    org: 'Acme Industrial',
    domain: 'acmeindustrial.example',
    url: '',
    amount: '48500',
    message: 'Urgent: our banking details changed today. Please skip the normal approval and wire the invoice to the new account immediately. Keep this confidential until finance updates the system.',
    evidence: '',
  },
  {
    label: 'Fake bank support text',
    channel: 'text',
    sender: 'Unknown mobile number',
    org: 'Example Bank',
    domain: 'examplebank.com',
    url: 'https://bit.ly/account-verify',
    amount: '',
    message: 'Final warning. Your bank account will be suspended immediately. Use the link and enter your login and verification code now.',
    evidence: '',
  },
  {
    label: 'Verified supplier invoice',
    channel: 'email',
    sender: 'billing@trustedvendor.example',
    org: 'Trusted Vendor',
    domain: 'trustedvendor.example',
    url: 'https://trustedvendor.example/invoices/1234',
    amount: '7200',
    message: 'Invoice 1234 is ready for review under our existing contract. Payment information is unchanged.',
    evidence: 'Official callback completed\nPreviously verified account\nExisting contract confirmed independently',
  },
  {
    label: 'Executive voice-payment request',
    channel: 'voice-video',
    sender: 'Incoming video call',
    org: 'Internal executive',
    domain: '',
    url: '',
    amount: '80000',
    message: 'I need this transfer completed right now. Do not tell anyone else until after the deal closes. Send funds to the new banking destination I just gave you.',
    evidence: '',
  },
];

export default function TrustLayerPage() {
  const [channel, setChannel] = useState(demos[0].channel);
  const [sender, setSender] = useState(demos[0].sender);
  const [org, setOrg] = useState(demos[0].org);
  const [domain, setDomain] = useState(demos[0].domain);
  const [url, setUrl] = useState(demos[0].url);
  const [amount, setAmount] = useState(demos[0].amount);
  const [message, setMessage] = useState(demos[0].message);
  const [evidence, setEvidence] = useState(demos[0].evidence);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const gateLabel = useMemo(() => assessment?.actionGate.mode.replaceAll('_', ' ') || '', [assessment]);

  function loadDemo(index: number) {
    const demo = demos[index];
    setChannel(demo.channel);
    setSender(demo.sender);
    setOrg(demo.org);
    setDomain(demo.domain);
    setUrl(demo.url);
    setAmount(demo.amount);
    setMessage(demo.message);
    setEvidence(demo.evidence);
    setAssessment(null);
    setReceipt(null);
    setError('');
  }

  async function run(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setAssessment(null);
    setReceipt(null);
    setError('');
    try {
      const response = await fetch('/api/trust-layer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          sender,
          claimedOrganization: org,
          claimedDomain: domain,
          url,
          amount: amount ? Number(amount) : null,
          message,
          verificationEvidence: evidence.split('\n').map((x) => x.trim()).filter(Boolean),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Trust Layer assessment failed.');
      setAssessment(data.assessment);
      setReceipt(data.receipt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trust Layer assessment failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#07100E', color: '#F4FFF9', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 20px 88px' }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 950, letterSpacing: 1 }}>ARIDON</Link>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link href="/sentinel-pilot" style={navLink}>Sentinel</Link>
            <a href="#scan" style={navLink}>Run a Trust Check</a>
          </div>
        </nav>

        <header style={{ paddingTop: 68, maxWidth: 1020 }}>
          <div style={eyebrow}>ARIDON TRUST LAYER · FRAUD SHIELD</div>
          <h1 style={{ fontSize: 'clamp(50px,8vw,96px)', lineHeight: .9, letterSpacing: -4, margin: '16px 0 22px' }}>
            Verify before money, identity, or authority moves.
          </h1>
          <p style={{ color: '#B8CDC4', fontSize: 20, lineHeight: 1.65, maxWidth: 920 }}>
            Trust Layer sits between an incoming claim and a consequential action. It looks for impersonation, payment redirection, credential theft, suspicious links, coercion, and missing verification, then places the right human gate in front of the action.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
            <a href="#scan" style={primaryButton}>Run a Free Trust Check</a>
            <a href="mailto:aridoninfo@aridon.info?subject=Aridon%20Trust%20Layer%20Pilot" style={secondaryButton}>Request a Pilot</a>
          </div>
        </header>

        <section className="fourGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 34 }}>
          {[
            ['IDENTITY', 'Check whether the sender, claimed organization, and communication channel line up.'],
            ['TRANSACTION', 'Apply stronger controls when money, credentials, data, or authority are about to move.'],
            ['EVIDENCE', 'Reward independent verification without treating any one signal as absolute proof.'],
            ['ACTION GATE', 'Proceed, verify out-of-band, hold, or block automation until a human clears the risk.'],
          ].map(([title, copy]) => <article key={title} style={card}><div style={eyebrow}>{title}</div><p style={{ color: '#B8CDC4', lineHeight: 1.6, marginBottom: 0 }}>{copy}</p></article>)}
        </section>

        <section id="scan" style={{ marginTop: 28, background: '#0C1915', border: '1px solid #29493D', borderRadius: 22, padding: 24 }}>
          <div style={eyebrow}>PUBLIC DEFENSIVE DEMO</div>
          <h2 style={{ fontSize: 40, margin: '10px 0 8px' }}>Put a suspicious request through the shield.</h2>
          <p style={{ color: '#A9BFB5', lineHeight: 1.6, maxWidth: 920 }}>Use this as decision support. A risk score is not proof that a person or message is fraudulent. High-impact actions should be independently verified.</p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '18px 0' }}>
            {demos.map((demo, index) => <button key={demo.label} type="button" onClick={() => loadDemo(index)} style={chip}>{demo.label}</button>)}
          </div>

          <form onSubmit={run}>
            <div className="twoGrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={label}>CHANNEL</label>
                <select value={channel} onChange={(e) => setChannel(e.target.value)} style={input}>
                  <option value="email">Email</option>
                  <option value="text">Text</option>
                  <option value="phone">Phone</option>
                  <option value="voice-video">Voice / video</option>
                  <option value="web">Web</option>
                  <option value="document">Document</option>
                  <option value="payment">Payment</option>
                  <option value="social">Social</option>
                </select>
              </div>
              <div><label style={label}>SENDER / CONTACT</label><input value={sender} onChange={(e) => setSender(e.target.value)} style={input} placeholder="name@example.com or phone label" /></div>
            </div>

            <div className="twoGrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
              <div><label style={label}>CLAIMED ORGANIZATION</label><input value={org} onChange={(e) => setOrg(e.target.value)} style={input} /></div>
              <div><label style={label}>OFFICIAL DOMAIN</label><input value={domain} onChange={(e) => setDomain(e.target.value)} style={input} placeholder="example.com" /></div>
            </div>

            <div className="twoGrid" style={{ display: 'grid', gridTemplateColumns: '1.4fr .6fr', gap: 14, marginTop: 14 }}>
              <div><label style={label}>LINK, IF ANY</label><input value={url} onChange={(e) => setUrl(e.target.value)} style={input} placeholder="https://..." /></div>
              <div><label style={label}>AMOUNT, IF ANY</label><input value={amount} onChange={(e) => setAmount(e.target.value)} style={input} inputMode="decimal" placeholder="0" /></div>
            </div>

            <div style={{ marginTop: 14 }}><label style={label}>MESSAGE OR REQUEST</label><textarea value={message} onChange={(e) => setMessage(e.target.value)} style={{ ...input, minHeight: 150 }} /></div>
            <div style={{ marginTop: 14 }}><label style={label}>INDEPENDENT VERIFICATION EVIDENCE · ONE ITEM PER LINE</label><textarea value={evidence} onChange={(e) => setEvidence(e.target.value)} style={{ ...input, minHeight: 100 }} placeholder="Official callback completed\nKnown account confirmed" /></div>

            <button disabled={busy} style={{ ...primaryButton, border: 0, marginTop: 16, cursor: busy ? 'wait' : 'pointer', opacity: busy ? .6 : 1 }}>{busy ? 'Checking…' : 'Run Trust Check'}</button>
            {error && <p style={{ color: '#FFD0A8' }}>{error}</p>}
          </form>

          {assessment && <section style={{ marginTop: 20 }}>
            <div className="twoGrid" style={{ display: 'grid', gridTemplateColumns: '.6fr 1.4fr', gap: 14 }}>
              <article style={{ background: '#F1F5EF', color: '#132019', borderRadius: 18, padding: 22 }}>
                <div style={{ fontSize: 12, fontWeight: 950, letterSpacing: .8 }}>TRUST RISK SCORE</div>
                <div style={{ fontSize: 78, fontWeight: 950, lineHeight: 1, marginTop: 10 }}>{assessment.score}</div>
                <div style={{ fontWeight: 950, textTransform: 'uppercase', marginTop: 8 }}>{assessment.level}</div>
              </article>
              <article style={card}>
                <div style={eyebrow}>ACTION GATE</div>
                <h3 style={{ fontSize: 32, margin: '9px 0', textTransform: 'capitalize' }}>{gateLabel}</h3>
                <p style={{ color: '#C6D7CF', lineHeight: 1.6 }}>{assessment.actionGate.reason}</p>
                {assessment.reasons.slice(0, 5).map((reason) => <p key={reason} style={{ color: '#9FB7AC', lineHeight: 1.55, margin: '8px 0' }}>• {reason}</p>)}
              </article>
            </div>

            <article style={{ ...card, marginTop: 14 }}>
              <div style={eyebrow}>VERIFY THIS WAY</div>
              {assessment.verificationPlan.map((step, index) => <p key={step} style={{ color: '#C6D7CF', lineHeight: 1.6, margin: '9px 0' }}><strong>{index + 1}.</strong> {step}</p>)}
            </article>

            {receipt && <article style={{ ...card, marginTop: 14 }}>
              <div style={eyebrow}>TRUST RECEIPT</div>
              <p style={{ color: '#C6D7CF', lineHeight: 1.6 }}>Receipt <strong>{receipt.id}</strong> · Policy {receipt.policyVersion} · Raw content stored: <strong>{receipt.rawContentStored ? 'yes' : 'no'}</strong></p>
              <p style={{ color: '#839B90', fontSize: 12, overflowWrap: 'anywhere' }}>Fingerprint: {receipt.inputFingerprint}</p>
            </article>}

            <p style={{ color: '#7F978C', fontSize: 12, lineHeight: 1.5, marginTop: 12 }}>{assessment.disclaimer}</p>
          </section>}
        </section>

        <section className="threeGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 26 }}>
          {[
            ['BANKS & CREDIT UNIONS', 'Gate wire changes, account recovery, customer impersonation and high-risk transfers before execution.'],
            ['SMALL BUSINESS', 'Protect invoices, payroll, vendor changes, executive requests and supplier communications without a dedicated fraud team.'],
            ['GOVERNMENT & UTILITIES', 'Verify authority, contractors, emergency requests, payment instructions and critical-infrastructure communications.'],
          ].map(([title, copy]) => <article key={title} style={card}><div style={eyebrow}>{title}</div><h3 style={{ fontSize: 24, margin: '9px 0' }}>{title}</h3><p style={{ color: '#A9BFB5', lineHeight: 1.6 }}>{copy}</p></article>)}
        </section>

        <section style={{ marginTop: 26, background: '#F1F5EF', color: '#132019', borderRadius: 22, padding: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>TRUST LAYER + SENTINEL</div>
          <h2 style={{ fontSize: 40, margin: '10px 0' }}>One protects the human decision. One protects the machine action.</h2>
          <p style={{ color: '#52635B', fontSize: 18, lineHeight: 1.7, maxWidth: 940 }}>Trust Layer evaluates identity, claims, messages, documents and transactions. Sentinel evaluates risky AI behavior and tool execution. Together they create an independent verification and action-gating layer around people, businesses, AI agents and critical infrastructure.</p>
          <a href="mailto:aridoninfo@aridon.info?subject=Trust%20Layer%20and%20Sentinel%20Pilot" style={{ ...primaryButton, display: 'inline-block', marginTop: 16 }}>Start a 30-Day Pilot</a>
        </section>
      </section>
      <style>{`html{scroll-behavior:smooth}@media(max-width:860px){.fourGrid,.threeGrid,.twoGrid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

const navLink = { color: '#D8E9E1', textDecoration: 'none', fontWeight: 850 } as const;
const eyebrow = { color: '#8CF0C2', fontSize: 12, fontWeight: 950, letterSpacing: 1.1 } as const;
const card = { background: '#10231C', border: '1px solid #27493B', borderRadius: 18, padding: 20 } as const;
const label = { display: 'block', color: '#8CF0C2', fontSize: 12, fontWeight: 950, letterSpacing: .8, marginBottom: 8 } as const;
const input = { width: '100%', boxSizing: 'border-box' as const, borderRadius: 12, border: '1px solid #345B4B', background: '#07100E', color: '#F4FFF9', padding: 14, fontFamily: 'Arial, sans-serif', fontSize: 15, lineHeight: 1.55 } as const;
const primaryButton = { display: 'inline-block', borderRadius: 12, padding: '14px 20px', background: '#8CF0C2', color: '#04110B', fontWeight: 950, textDecoration: 'none' } as const;
const secondaryButton = { display: 'inline-block', borderRadius: 12, padding: '14px 20px', border: '1px solid #477965', color: '#F4FFF9', fontWeight: 900, textDecoration: 'none' } as const;
const chip = { border: '1px solid #345B4B', background: '#11271E', color: '#D8E9E1', borderRadius: 999, padding: '10px 13px', fontWeight: 800, cursor: 'pointer' } as const;
