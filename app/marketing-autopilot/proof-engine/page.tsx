'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type ProofInput = {
  project: string;
  problem: string;
  built: string;
  result: string;
  audience: string;
  cta: string;
};

type Output = {
  id: string;
  label: string;
  title: string;
  body: string;
};

const PRESETS: Record<string, ProofInput> = {
  aridon: {
    project: 'Aridon AI Operating Layer',
    problem: 'Most businesses are adding disconnected AI tools without a common operating layer to coordinate objectives, business context, agents, approvals, security, and real-world execution.',
    built: 'Aridon combines Eva orchestration, Sentinel security and governance, Business OS, Farm OS, growth and revenue systems, phone and voice workflows, infrastructure intelligence, project memory, action tools, and approval gates in one operating environment.',
    result: 'A business can move from a stated objective to coordinated AI-assisted execution while preserving context, permissions, human control, and measurable operating outcomes.',
    audience: 'Owner-led businesses, enterprises, farms, infrastructure operators, financial institutions, strategic partners, investors, and organizations deploying AI agents into real operations.',
    cta: 'Give Aridon one expensive operating problem and let us show you the working system we would build around it.',
  },
  sentinel: {
    project: 'Sentinel Agent Defense Layer',
    problem: 'AI agents can chain together individually harmless actions into a dangerous attack path faster than human defenders can react.',
    built: 'Agent Passport, Intent Firewall, Chain Detector, Privilege Governor, continuous risk scoring, machine-speed circuit breaker, prompt-injection protection, and a forensic ledger.',
    result: 'Sentinel can evaluate an agent\'s evolving intent and action chain before execution, then allow, pause, escalate, or block the next step.',
    audience: 'CISOs, banks, credit unions, AI platform teams, regulated businesses, and organizations deploying autonomous agents.',
    cta: 'Ask us to run a Sentinel agent-risk demonstration against one of your workflows.',
  },
  eva: {
    project: 'Eva Phone',
    problem: 'Small businesses lose calls, leads, and customer context when nobody is available to answer consistently.',
    built: 'An AI phone desk connected to Aridon with call objectives, permission controls, business context, live conversation handling, logging, and transfer-ready workflows.',
    result: 'Eva can act as a persistent front desk that knows why the caller is calling, answers routine questions, captures the next action, and hands off when needed.',
    audience: 'Owner-led businesses, service companies, dealerships, farms, clinics, and teams that need reliable phone coverage.',
    cta: 'Give us one phone workflow and we will show how Eva would handle it.',
  },
  farm: {
    project: 'Aridon Farm OS',
    problem: 'Farm improvement decisions are fragmented across water, equipment, financing, buyers, labor, processing, and sustainability programs.',
    built: 'A farm orchestration system that combines transition planning, water and energy intelligence, equipment and robotics, funding, processing, buyer matching, inventory, scheduling, and ROI modeling.',
    result: 'A producer can evaluate the farm as one operating system instead of juggling disconnected tools and advisors.',
    audience: 'Farmers, ranchers, food hubs, lenders, processors, agricultural organizations, universities, and institutional buyers.',
    cta: 'Bring us one farm and we will map the transition, economics, and implementation path.',
  },
  landscaping: {
    project: 'R Beautiful Landscaping Website',
    problem: 'A local landscaping business had a flyer and contact information but no polished digital page customers could easily use.',
    built: 'A focused mobile-friendly landing page with landscaping imagery, services, phone and email actions, and a free-estimate workflow.',
    result: 'The business now has a customer-facing web presence that turns a simple flyer into a usable lead-generation page.',
    audience: 'Local service businesses that need a credible website quickly without a large agency project.',
    cta: 'Send us your flyer, menu, brochure, or business card and we can turn it into a working customer page.',
  },
  awg: {
    project: 'AWG 30K Water Resilience System',
    problem: 'Farms and communities need additional water options where drought, groundwater pressure, and infrastructure constraints make supply uncertain.',
    built: 'A 30,000-gallon-per-day atmospheric water generation concept integrated with storage, treatment, metering, energy optimization, monitoring, and farm-use measurement.',
    result: 'The concept turns atmospheric water generation into a measurable infrastructure pilot rather than a standalone machine.',
    audience: 'Farms, water districts, resilience programs, utilities, universities, investors, and drought-affected communities.',
    cta: 'Partner with us on a monitored water-resilience pilot.',
  },
  campus: {
    project: 'Southwest Technology Campus',
    problem: 'Infrastructure technologies are often developed in isolation without a place to prove how power, water, AI, agriculture, robotics, and manufacturing work together.',
    built: 'A multi-phase demonstration and commercialization campus combining data infrastructure, microgrid systems, water resilience, agriculture, robotics, R&D, manufacturing, tenant space, and workforce development.',
    result: 'The campus is designed to turn technologies into integrated demonstrations, operating data, partnerships, tenants, and commercial projects.',
    audience: 'Infrastructure investors, technology companies, utilities, manufacturers, universities, government programs, and strategic partners.',
    cta: 'Talk with us about becoming a technology, infrastructure, tenant, or capital partner.',
  },
};

function buildOutputs(input: ProofInput): Output[] {
  const project = input.project.trim() || 'This project';
  const problem = input.problem.trim();
  const built = input.built.trim();
  const result = input.result.trim();
  const audience = input.audience.trim();
  const cta = input.cta.trim();

  const proofStory = `${project}

THE PROBLEM
${problem}

WHAT WE BUILT
${built}

WHAT IT CHANGES
${result}

WHO THIS IS FOR
${audience}

NEXT STEP
${cta}`;

  const linkedin = `We would rather show the work than make another generic AI claim.

Here is what we built: ${project}.

Problem:
${problem}

Our approach:
${built}

The useful part:
${result}

This is built for ${audience}

${cta}

#AI #Automation #Aridon #BuildInPublic`;

  const video = `HOOK
Most people talk about what AI could do. Here is something we actually built.

SCENE 1 — THE PROBLEM
${problem}

SCENE 2 — THE BUILD
${built}

SCENE 3 — THE RESULT
${result}

SCENE 4 — WHO IT HELPS
${audience}

CLOSE
${cta}`;

  const caseStudy = `Case Study: ${project}

Challenge
${problem}

Solution
Aridon designed and assembled: ${built}

Outcome
${result}

Ideal users
${audience}

Engagement
${cta}`;

  const email = `Subject: A working example of ${project}

Instead of sending you a generic capabilities deck, I wanted to show you one concrete example of what we have built.

The problem:
${problem}

What we built:
${built}

What it changes:
${result}

It is especially relevant to:
${audience}

${cta}`;

  const graphic = `${project}

PROBLEM
${problem}

BUILT
${built}

RESULT
${result}

PROOF > PROMISES`;

  const sales = `${project} is a proof point for what Aridon does differently. We start with an expensive operating problem, build the workflow or system around it, connect the necessary AI and tools, and focus on the result. For this project, the problem was: ${problem} The system we built was: ${built} The practical outcome is: ${result}`;

  const investor = `${project} demonstrates Aridon's repeatable operating model: identify a costly real-world problem, orchestrate the right AI/software/infrastructure components, produce a working deployment, then turn the result into a repeatable commercial system. In this case, ${problem} Aridon built ${built} The resulting capability is ${result}`;

  return [
    { id: 'proof', label: 'Proof Story', title: 'The master source', body: proofStory },
    { id: 'linkedin', label: 'LinkedIn Post', title: 'Public proof', body: linkedin },
    { id: 'video', label: '60-Second Video', title: 'Short-form script', body: video },
    { id: 'case', label: 'Case Study', title: 'Website / sales page', body: caseStudy },
    { id: 'email', label: 'Email', title: 'Direct outreach', body: email },
    { id: 'graphic', label: 'Graphic Copy', title: 'One-slide visual', body: graphic },
    { id: 'sales', label: 'Sales Proof', title: 'Use in proposals and demos', body: sales },
    { id: 'investor', label: 'Investor Proof', title: 'Use in decks and updates', body: investor },
  ];
}

export default function ProofEnginePage() {
  const [input, setInput] = useState<ProofInput>(PRESETS.aridon);
  const [selected, setSelected] = useState('aridon');
  const [copied, setCopied] = useState('');
  const [savedAt, setSavedAt] = useState('');
  const outputs = useMemo(() => buildOutputs(input), [input]);

  useEffect(() => {
    const saved = window.localStorage.getItem('aridon-proof-engine');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed?.input) setInput(parsed.input);
      if (parsed?.selected) setSelected(parsed.selected);
      if (parsed?.savedAt) setSavedAt(parsed.savedAt);
    } catch {}
  }, []);

  function update<K extends keyof ProofInput>(key: K, value: ProofInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function usePreset(key: string) {
    const preset = PRESETS[key];
    if (!preset) return;
    setSelected(key);
    setInput(preset);
  }

  function save() {
    const now = new Date().toISOString();
    window.localStorage.setItem('aridon-proof-engine', JSON.stringify({ input, selected, savedAt: now }));
    setSavedAt(now);
  }

  async function copyText(id: string, body: string) {
    await navigator.clipboard.writeText(body);
    setCopied(id);
    window.setTimeout(() => setCopied(''), 1800);
  }

  return (
    <main style={page}>
      <div style={shell}>
        <header style={header}>
          <div>
            <div style={eyebrow}>ARIDON · MARKETING AUTOPILOT · PROOF ENGINE</div>
            <h1 style={hero}>Turn one finished piece of work into eight pieces of evidence.</h1>
            <p style={lead}>Proof Engine converts what Aridon actually built into reusable marketing, sales, and investor material. One project becomes a proof story, LinkedIn post, short video, case study, email, graphic, sales proof, and investor proof.</p>
          </div>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            <Link href="/marketing-autopilot" style={ghostButton}>Marketing Autopilot</Link>
            <Link href="/business-os/growth-command" style={ghostButton}>Growth Command</Link>
          </div>
        </header>

        <section style={presetBar}>
          <div>
            <div style={smallLabel}>START WITH WORK WE ALREADY BUILT</div>
            <div style={{ color: '#AEB9CB', fontSize: 13, marginTop: 4 }}>Choose a proof source, then edit anything you want.</div>
          </div>
          <div style={chipWrap}>
            {[
              ['aridon','Aridon Company'],
              ['sentinel','Sentinel'],
              ['eva','Eva Phone'],
              ['farm','Farm OS'],
              ['landscaping','R Beautiful'],
              ['awg','AWG 30K'],
              ['campus','STC'],
            ].map(([key,label]) => (
              <button key={key} onClick={() => usePreset(key)} style={{ ...chip, ...(selected === key ? activeChip : {}) }}>{label}</button>
            ))}
          </div>
        </section>

        <div style={twoCol}>
          <section style={card}>
            <div style={eyebrow}>PROOF SOURCE</div>
            <h2 style={sectionTitle}>Capture the evidence once.</h2>
            <Field label="Project / capability" value={input.project} onChange={(v) => update('project', v)} rows={2} />
            <Field label="Problem" value={input.problem} onChange={(v) => update('problem', v)} rows={4} />
            <Field label="What we built" value={input.built} onChange={(v) => update('built', v)} rows={5} />
            <Field label="Result / practical change" value={input.result} onChange={(v) => update('result', v)} rows={4} />
            <Field label="Who should care" value={input.audience} onChange={(v) => update('audience', v)} rows={3} />
            <Field label="Call to action" value={input.cta} onChange={(v) => update('cta', v)} rows={3} />
            <button onClick={save} style={primaryButton}>Save Proof Source</button>
            <div style={{ color: '#8192A7', fontSize: 11, marginTop: 8 }}>
              {savedAt ? `Saved in this browser · ${new Date(savedAt).toLocaleString()}` : 'Not saved yet'}
            </div>
          </section>

          <section style={card}>
            <div style={eyebrow}>CONTENT MULTIPLIER</div>
            <h2 style={sectionTitle}>One useful idea. Eight usable assets.</h2>
            <div style={statGrid}>
              <Stat value="1" label="proof source" />
              <Stat value="8" label="assets generated" />
              <Stat value="3" label="audiences: buyers, public, investors" />
            </div>
            <div style={{ marginTop: 15, display: 'grid', gap: 8 }}>
              {outputs.map((output) => (
                <div key={output.id} style={miniRow}>
                  <div>
                    <strong>{output.label}</strong>
                    <div style={{ color: '#8192A7', fontSize: 12, marginTop: 2 }}>{output.title}</div>
                  </div>
                  <button onClick={() => copyText(output.id, output.body)} style={tinyButton}>
                    {copied === output.id ? 'Copied ✓' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section style={{ marginTop: 15 }}>
          <div style={eyebrow}>GENERATED PROOF PACK</div>
          <h2 style={sectionTitle}>Ready to publish, send, or drop into a proposal.</h2>
          <div style={outputGrid}>
            {outputs.map((output) => (
              <article key={output.id} style={outputCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start' }}>
                  <div>
                    <div style={smallLabel}>{output.label}</div>
                    <h3 style={{ margin: '5px 0 0', fontSize: 20 }}>{output.title}</h3>
                  </div>
                  <button onClick={() => copyText(output.id, output.body)} style={tinyButton}>{copied === output.id ? 'Copied ✓' : 'Copy'}</button>
                </div>
                <pre style={pre}>{output.body}</pre>
              </article>
            ))}
          </div>
        </section>

        <section style={{ ...card, marginTop: 15 }}>
          <div style={eyebrow}>THE RULE</div>
          <h2 style={sectionTitle}>Show the work. Then let the work multiply.</h2>
          <p style={lead}>Every completed Aridon project should feed this engine. The project becomes evidence, the evidence becomes content, the content creates visibility, and the visibility creates leads. Proof replaces vague claims.</p>
        </section>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, rows }: { label: string; value: string; onChange: (value: string) => void; rows: number }) {
  return (
    <label style={{ display: 'grid', gap: 6, marginTop: 12 }}>
      <span style={smallLabel}>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} style={textarea} />
    </label>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div style={stat}><div style={{ fontSize: 28, fontWeight: 950 }}>{value}</div><div style={{ color: '#8FA1B6', fontSize: 11 }}>{label}</div></div>;
}

const page = { minHeight: '100vh', background: '#07101A', color: '#F8FAFC', fontFamily: 'Arial, sans-serif', padding: '28px 18px 110px' };
const shell = { maxWidth: 1180, margin: '0 auto' };
const header = { display: 'flex', justifyContent: 'space-between', gap: 22, alignItems: 'start', flexWrap: 'wrap' as const, marginBottom: 16 };
const eyebrow = { color: '#79E0BC', fontSize: 11, letterSpacing: 1.2, fontWeight: 950 };
const hero = { fontSize: 'clamp(38px,6vw,64px)', lineHeight: .99, letterSpacing: -2, margin: '8px 0 12px', maxWidth: 920 };
const lead = { maxWidth: 940, color: '#B8C5D5', lineHeight: 1.65, fontSize: 17, margin: 0 };
const ghostButton = { border: '1px solid #334155', color: '#F8FAFC', borderRadius: 10, padding: '10px 13px', textDecoration: 'none', fontWeight: 850 };
const presetBar = { background: 'linear-gradient(135deg,#12263A,#10281F)', border: '1px solid #2A4359', borderRadius: 18, padding: 17, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' as const };
const chipWrap = { display: 'flex', flexWrap: 'wrap' as const, gap: 7 };
const chip = { background: '#0A1520', color: '#CBD5E1', border: '1px solid #34475A', borderRadius: 999, padding: '8px 11px', fontWeight: 850, cursor: 'pointer' };
const activeChip = { background: '#9EF0CF', color: '#07130F', borderColor: '#9EF0CF' };
const twoCol = { display: 'grid', gridTemplateColumns: 'minmax(0,1.05fr) minmax(0,.95fr)', gap: 14, marginTop: 15 };
const card = { background: '#0D1723', border: '1px solid #243449', borderRadius: 17, padding: 18 };
const sectionTitle = { margin: '7px 0 13px', fontSize: 27 };
const smallLabel = { color: '#79E0BC', fontSize: 10, fontWeight: 950, letterSpacing: .8, textTransform: 'uppercase' as const };
const textarea = { width: '100%', boxSizing: 'border-box' as const, background: '#07111B', color: '#fff', border: '1px solid #40546A', borderRadius: 10, padding: '12px 13px', outline: 'none', fontSize: 14, lineHeight: 1.5, resize: 'vertical' as const };
const primaryButton = { marginTop: 14, background: '#9EF0CF', color: '#07130F', border: 0, borderRadius: 10, padding: '12px 15px', fontWeight: 950, cursor: 'pointer' };
const statGrid = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 };
const stat = { background: '#09131F', border: '1px solid #26374B', borderRadius: 12, padding: 12 };
const miniRow = { background: '#09131F', border: '1px solid #26374B', borderRadius: 11, padding: 11, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' };
const tinyButton = { background: '#142436', color: '#DDE7F2', border: '1px solid #39506A', borderRadius: 8, padding: '7px 9px', fontWeight: 850, cursor: 'pointer', flex: '0 0 auto' };
const outputGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(330px,1fr))', gap: 11, marginTop: 10 };
const outputCard = { background: '#0D1723', border: '1px solid #243449', borderRadius: 15, padding: 15 };
const pre = { whiteSpace: 'pre-wrap' as const, overflowWrap: 'anywhere' as const, fontFamily: 'Arial, sans-serif', color: '#C4CFDC', lineHeight: 1.55, fontSize: 13, margin: '13px 0 0' };

