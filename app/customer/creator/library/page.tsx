'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type Prompt = {
  title: string;
  prompt: string;
  when: string;
};

type Pack = {
  id: string;
  title: string;
  subtitle: string;
  level: string;
  description: string;
  modules: string[];
  prompts: Prompt[];
};

const PACKS: Pack[] = [
  {
    id: 'business',
    title: 'AI for Business Field Guide',
    subtitle: 'From first prompt to practical operating system',
    level: 'Beginner → Operator',
    description: 'An original Aridon playbook for using AI across strategy, sales, operations, customer service, hiring, research, and management without requiring technical skills.',
    modules: ['AI fundamentals', 'Decision support', 'Sales', 'Operations', 'Customer service', 'Hiring', 'Research', 'Meetings', 'Risk checks', '30-day adoption plan'],
    prompts: [
      { title: 'Business Diagnostic', when: 'When you need a fast view of what to fix first', prompt: 'Act as a practical business operator. Analyze this company: [COMPANY / DESCRIPTION]. Identify the five biggest constraints on revenue, margin, speed, customer experience, or execution. Rank them by impact and ease of correction. For each, give the likely root cause, evidence I should verify, a low-cost fix, a stronger long-term fix, owner, metric, and next action. Separate facts from assumptions.' },
      { title: 'Weekly CEO Brief', when: 'Before a weekly leadership review', prompt: 'Turn the following business updates into a one-page CEO brief: [UPDATES]. Organize it into wins, misses, numbers that matter, cash/revenue risks, customer issues, people issues, decisions required, and the three most important actions for the next seven days. Flag anything that needs verification.' },
      { title: 'Process Builder', when: 'When a task lives mostly in someone’s head', prompt: 'Convert this recurring task into a simple operating procedure: [TASK]. Include purpose, trigger, owner, required inputs, numbered steps, quality checks, exceptions, escalation rules, completion standard, and the one metric that tells us whether the process works.' },
      { title: 'Meeting Compressor', when: 'After a long meeting or transcript', prompt: 'Summarize this meeting for action, not documentation: [NOTES / TRANSCRIPT]. Return decisions made, decisions still needed, commitments with owners and dates, risks, unanswered questions, and the next meeting’s opening agenda. Do not invent owners or deadlines.' },
      { title: 'Customer Complaint Resolver', when: 'When a customer issue needs a measured response', prompt: 'Analyze this customer complaint: [COMPLAINT]. Identify the actual problem, emotional concern, operational cause, reputational risk, what we should verify, the fairest resolution options, and a prevention step. Then draft a concise response that acknowledges the issue without admitting facts we have not confirmed.' },
      { title: 'Hiring Scorecard', when: 'Before interviewing for an important role', prompt: 'Build a hiring scorecard for this role: [ROLE]. Define the mission, 6-8 measurable outcomes for the first year, must-have competencies, red flags, structured interview questions, a practical work sample, scoring rubric, and reference-check questions. Keep evaluation job-related and consistent across candidates.' },
      { title: 'Competitor Gap Map', when: 'When deciding how to differentiate', prompt: 'Compare our offer [OUR OFFER] with these competitors or alternatives [COMPETITORS]. Build a gap map across target customer, promise, proof, price/value, speed, service, switching friction, distribution, and trust. Highlight claims that require validation and identify three defensible ways we could be meaningfully different.' },
      { title: '90-Day Execution Plan', when: 'When an idea needs to become a project', prompt: 'Turn this goal into a 90-day execution plan: [GOAL]. Break it into three 30-day phases with outcomes, milestones, owners, dependencies, budget assumptions, risks, weekly metrics, and stop/continue decision points. Put the highest-leverage work first.' },
      { title: 'Automation Finder', when: 'When admin work is eating the week', prompt: 'Review these recurring tasks: [TASK LIST]. Classify each as eliminate, simplify, standardize, automate, delegate, or keep human-led. Estimate frequency, time saved, error risk, data sensitivity, automation difficulty, and recommended tool/workflow. Prioritize the top five opportunities.' },
      { title: 'Decision Memo', when: 'When two or more choices are competing', prompt: 'Create a decision memo for this choice: [DECISION]. State the objective, constraints, options, assumptions, expected upside, downside, reversible vs irreversible elements, cost, time to value, key risks, evidence still needed, and a recommendation. Include what would change the recommendation.' },
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing & Content Prompt Vault',
    subtitle: 'Campaigns, ads, content, email, SEO and conversion',
    level: 'Marketer → Growth Team',
    description: 'A reusable prompt library designed to turn one business goal into coordinated content rather than disconnected posts.',
    modules: ['Positioning', 'Campaign planning', 'Offers', 'Email', 'Social', 'Ads', 'SEO', 'Landing pages', 'Video', 'Repurposing'],
    prompts: [
      { title: 'Campaign Architect', when: 'Before creating campaign assets', prompt: 'Build a campaign around this offer: [OFFER]. Audience: [AUDIENCE]. Goal: [GOAL]. Create one core message, three proof angles, three objections and responses, channel plan, content sequence, CTA, measurement plan, and a two-week launch calendar. Avoid unsupported claims.' },
      { title: 'Offer Sharpener', when: 'When the offer feels vague', prompt: 'Rewrite this offer so a qualified prospect immediately understands who it is for, the problem it solves, what changes, what is included, why it is credible, what makes it different, and the next step: [OFFER]. Give three positioning directions and explain the tradeoff of each.' },
      { title: 'Landing Page Blueprint', when: 'Before writing a sales page', prompt: 'Create a conversion-focused landing page blueprint for [OFFER] aimed at [AUDIENCE]. Include hero, problem, desired outcome, solution, proof, how it works, objections, FAQ, CTA, and trust elements. Mark every section that requires customer proof, data, testimonials, or legal review.' },
      { title: 'Email Sequence', when: 'For a launch or lead nurture', prompt: 'Create a five-email sequence for [OFFER] to [AUDIENCE]. Email 1: relevance; 2: problem insight; 3: proof/process; 4: objection handling; 5: direct invitation. Provide subject, preview line, body outline, CTA, and the psychological job of each email. Keep claims factual.' },
      { title: '30-Day Social Grid', when: 'When you need consistent posting', prompt: 'Build a 30-day social content grid for [COMPANY / OFFER]. Use five content pillars, varied formats, audience questions, proof, education, behind-the-scenes, objections, and direct offers. For each post give hook, core idea, CTA, and best channel. Avoid repeating the same angle.' },
      { title: 'Ad Angle Generator', when: 'Before creative production', prompt: 'Generate 12 materially different advertising angles for [OFFER] and [AUDIENCE]. For each include audience tension, hook, promise, proof needed, visual concept, CTA, and risk of overclaiming. Group by pain, aspiration, convenience, economics, trust, and urgency.' },
      { title: 'SEO Topic Cluster', when: 'Planning useful organic content', prompt: 'Design an SEO topic cluster for [PRODUCT / SERVICE] serving [AUDIENCE]. Give one pillar topic, 12 supporting topics, search intent, likely funnel stage, internal-link relationships, unique expertise we should add, and conversion path. Do not invent keyword volumes.' },
      { title: 'Case Study Builder', when: 'Turning project results into proof', prompt: 'Turn these verified project facts into a credible case study: [FACTS]. Structure: customer situation, constraints, approach, implementation, measurable results, customer quote placeholder, lessons, and CTA. Clearly mark any missing numbers or claims that need confirmation.' },
      { title: 'Content Repurposer', when: 'Turning one source into many assets', prompt: 'Repurpose this source material: [SOURCE]. Produce a blog outline, LinkedIn post, short social post, email, 60-second video script, FAQ, and sales talking point. Preserve the facts and adapt the framing to each channel instead of merely shortening the same copy.' },
      { title: 'Website Conversion Audit', when: 'When traffic is not turning into leads', prompt: 'Audit this website/page copy: [COPY OR URL NOTES]. Evaluate clarity, relevance, differentiation, trust, proof, friction, CTA, mobile scanability, objections, and conversion path. Rank the ten highest-impact changes and provide replacement copy only where it materially improves clarity.' },
      { title: 'Voice of Customer Miner', when: 'When you have reviews, calls or surveys', prompt: 'Analyze these customer quotes/reviews/call notes: [TEXT]. Extract repeated pains, desired outcomes, objections, trigger events, exact language patterns, trust signals, and buying criteria. Quantify frequency where possible. Then recommend messaging themes based only on the supplied evidence.' },
      { title: 'Launch War Room', when: 'During an active launch', prompt: 'Review these campaign results: [METRICS]. Diagnose what is working and failing by traffic, click-through, conversion, lead quality, sales follow-up, objections, and economics. Give the three experiments most likely to improve results this week, with hypothesis, change, metric, and kill/keep threshold.' },
    ],
  },
  {
    id: 'finance',
    title: 'Financial Decision Lab',
    subtitle: 'Cash flow, pricing, ROI, acquisitions and forecasting',
    level: 'Owner → Finance Partner',
    description: 'Decision-support prompts for understanding numbers and asking better questions. It is not a substitute for licensed accounting, tax, legal, or investment advice.',
    modules: ['Cash flow', 'Budgeting', 'Pricing', 'Unit economics', 'Forecasting', 'ROI', 'Acquisitions', 'Debt', 'Scenario analysis', 'Finance dashboard'],
    prompts: [
      { title: 'Cash Flow Stress Test', when: 'When cash feels tight or uncertain', prompt: 'Stress-test this business cash flow using the data provided: [DATA]. Build base, downside, and severe-downside cases. Show cash-in assumptions, fixed and variable outflows, runway, break-even point, likely pinch dates, and actions that preserve cash. Identify missing data instead of guessing.' },
      { title: 'Pricing Model', when: 'Before changing prices', prompt: 'Analyze pricing for [OFFER]. Inputs: [COSTS, CURRENT PRICE, CUSTOMER INFO, COMPETITOR INFO]. Calculate contribution margin where possible, identify value drivers, propose good/better/best structures, discount guardrails, break-even impacts, and a test plan. Separate calculations from assumptions.' },
      { title: 'Unit Economics', when: 'To see whether growth actually creates value', prompt: 'Build a unit-economics view from this data: [DATA]. Calculate or request what is needed for gross margin, contribution margin, CAC, payback period, LTV assumptions, churn/retention effects, and break-even volume. Explain which metric is currently the weak link.' },
      { title: 'Investment ROI Model', when: 'Evaluating equipment, software or expansion', prompt: 'Evaluate this proposed investment: [INVESTMENT]. Use purchase/implementation cost, recurring costs, expected savings/revenue, timing, useful life, risk, and financing assumptions. Show simple ROI, payback period, and scenario ranges. List non-financial benefits and failure modes separately.' },
      { title: 'Acquisition First Pass', when: 'Screening a business for sale', prompt: 'Perform a first-pass acquisition screen using: [LISTING / FINANCIALS]. Summarize revenue quality, seller earnings, add-backs to verify, customer concentration, working capital needs, capex, owner dependence, growth claims, valuation range assumptions, financing considerations, red flags, diligence questions, and a walk-away list.' },
      { title: 'Seller Financing Structure', when: 'Exploring a lower-cash acquisition structure', prompt: 'Design several seller-financing structures for a business with these facts: [PRICE, CASH FLOW, SELLER NEEDS, BUYER CONSTRAINTS]. Compare down payment, note amount, interest, amortization, balloon, earnout, holdback, transition support, collateral considerations, and debt-service coverage. Flag terms that need legal, tax, lender, or accounting review.' },
      { title: 'Forecast Builder', when: 'Creating a forward operating plan', prompt: 'Build a 12-month driver-based forecast from [HISTORICAL DATA / ASSUMPTIONS]. Use explicit drivers for customers, volume, price, gross margin, payroll, marketing, overhead, capex, and cash. Include base/upside/downside cases and show which assumptions have the greatest effect.' },
      { title: 'Expense Triage', when: 'Cutting costs without damaging the engine', prompt: 'Classify these expenses: [EXPENSES] into protect, optimize, renegotiate, pause, or eliminate. Evaluate each by revenue impact, customer impact, operational risk, reversibility, and annual savings. Recommend a sequence that protects the company’s ability to sell and deliver.' },
      { title: 'Debt Capacity Check', when: 'Before taking on financing', prompt: 'Using the supplied numbers [DATA], evaluate practical debt capacity. Calculate debt-service coverage where possible, cash cushion, sensitivity to lower revenue/higher rates, and operational risks. Provide questions to ask the lender and accountant. Do not assume loan approval.' },
      { title: 'Finance Dashboard', when: 'For a monthly owner review', prompt: 'Design a one-page monthly finance dashboard for this business: [BUSINESS]. Include 8-12 metrics covering revenue, gross margin, operating profit, cash, receivables, runway, pipeline-to-revenue connection, customer concentration, and one industry-specific driver. Define each metric and what action a bad reading should trigger.' },
    ],
  },
  {
    id: 'webdev',
    title: 'Advanced AI Prompts for Web Builders',
    subtitle: 'Plan, build, debug, secure and ship better software',
    level: 'Builder → Engineering Team',
    description: 'Original development prompts focused on producing inspectable work, minimizing regressions, and keeping AI-generated code grounded in the actual codebase.',
    modules: ['Architecture', 'Feature planning', 'Debugging', 'Refactoring', 'Testing', 'Security', 'Accessibility', 'Performance', 'APIs', 'Deployment'],
    prompts: [
      { title: 'Repo Cartographer', when: 'Before changing an unfamiliar codebase', prompt: 'Inspect this repository before proposing changes. Map the app structure, runtime, framework, data layer, authentication, key routes, shared components, environment dependencies, tests, build/deploy path, and likely risk areas. Cite the files that support each conclusion. Do not code yet.' },
      { title: 'Smallest Safe Feature Plan', when: 'Before implementing a feature', prompt: 'Plan the smallest safe implementation of this feature: [FEATURE]. First identify existing patterns in the codebase that should be reused. Then list files to change, data flow, UI states, error states, security concerns, tests, rollback path, and acceptance criteria. Prefer fewer moving parts.' },
      { title: 'Bug Root-Cause Hunt', when: 'When symptoms are known but cause is not', prompt: 'Debug this issue: [ERROR / SYMPTOM]. Create a ranked hypothesis list from most to least likely. For each hypothesis show evidence to inspect, exact file/log/test to check, a minimal reproduction, and what result would confirm or reject it. Do not jump directly to a rewrite.' },
      { title: 'Regression-Safe Refactor', when: 'Cleaning code that already works', prompt: 'Refactor this area: [CODE / FILES] without changing behavior. Identify current contracts, hidden coupling, tests we need before touching it, incremental refactor steps, and measurable improvements. Keep public interfaces stable unless there is a compelling reason not to.' },
      { title: 'Test Designer', when: 'Before or after implementation', prompt: 'Design tests for this feature: [FEATURE]. Cover happy path, validation, authorization, empty state, network/database failure, retries, concurrency where relevant, accessibility behavior, and regression cases. Distinguish unit, integration, and end-to-end tests and prioritize the highest-value set.' },
      { title: 'Security Review', when: 'Before production release', prompt: 'Threat-model this feature/code: [DETAILS]. Review authentication, authorization, tenant isolation, injection, XSS, CSRF, SSRF, secrets, file uploads, rate limiting, data exposure, logging, dependency risk, and abuse cases. Rank findings by severity and provide the smallest safe remediation for each.' },
      { title: 'Performance Investigator', when: 'When a page or API feels slow', prompt: 'Analyze this performance problem using [METRICS / CODE / TRACE]. Separate client, network, server, database, third-party, and rendering causes. Identify the likely bottleneck, measurements needed, low-risk optimizations, and how to prove whether each change helped.' },
      { title: 'API Contract Builder', when: 'Designing a new endpoint', prompt: 'Design an API contract for [CAPABILITY]. Specify method, route, auth, request schema, response schema, status codes, validation, idempotency needs, pagination if applicable, error format, rate limits, observability, and example requests/responses. Keep the interface boring and predictable.' },
      { title: 'Accessibility Pass', when: 'Before shipping UI', prompt: 'Audit this UI: [CODE / DESCRIPTION] for keyboard use, focus order, labels, semantics, contrast concerns, forms, error messaging, motion, screen-reader behavior, touch targets, and responsive use. Return prioritized fixes with code-level guidance and test steps.' },
      { title: 'Deployment Gate', when: 'Before merging or deploying', prompt: 'Create a release gate for this change: [CHANGE]. Include required checks for lint/types, tests, migrations, environment variables, backward compatibility, security, observability, rollback, smoke tests, and user-facing acceptance criteria. Mark anything that could cause irreversible data loss.' },
    ],
  },
  {
    id: 'coding',
    title: 'AI Coding Workspace Blueprint',
    subtitle: 'The 10-folder system for disciplined AI-assisted development',
    level: 'Solo Builder → Team',
    description: 'A clean project-memory structure that gives coding assistants durable context without dumping the whole company into every prompt.',
    modules: ['01-vision', '02-requirements', '03-architecture', '04-ui-ux', '05-data', '06-apis', '07-security', '08-tests', '09-deployment', '10-decisions'],
    prompts: [
      { title: '01 Vision', when: 'Starting a project', prompt: 'Create a concise project vision for [PROJECT]. Include user, problem, desired outcome, non-goals, success measures, constraints, and what must remain true as the product evolves. Save stable truths only.' },
      { title: '02 Requirements', when: 'Turning the vision into buildable scope', prompt: 'Convert this project vision into testable requirements. Separate must-have, should-have, later, and explicitly out-of-scope items. Give acceptance criteria for every must-have.' },
      { title: '03 Architecture', when: 'Choosing technical structure', prompt: 'Document the current or proposed architecture for [PROJECT]. Cover runtime, frontend, backend, data stores, auth, external services, deployment, trust boundaries, major flows, and architecture risks. Prefer diagrams in text/mermaid plus short explanations.' },
      { title: '04 UI/UX', when: 'Keeping interface decisions consistent', prompt: 'Create UI/UX rules for this product: core user journeys, navigation, reusable patterns, empty/loading/error states, mobile behavior, accessibility requirements, and content tone. Record decisions that future screens must follow.' },
      { title: '05 Data', when: 'Defining source-of-truth rules', prompt: 'Document the data model for [PROJECT]. For each entity list purpose, fields, ownership/tenant boundaries, lifecycle, validation, retention, sensitive fields, indexes, and relationships. Flag migrations that could be destructive.' },
      { title: '06 APIs', when: 'Coordinating interfaces', prompt: 'Create an API inventory for [PROJECT]. For each endpoint/service list purpose, caller, authentication, authorization, request/response contract, errors, rate limits, dependencies, and versioning concerns.' },
      { title: '07 Security', when: 'Recording security assumptions', prompt: 'Create a living security file for [PROJECT]. Include assets, actors, trust boundaries, authentication model, authorization model, tenant isolation, secrets, input/file handling, logging, abuse cases, incident notes, and unresolved risks.' },
      { title: '08 Tests', when: 'Defining what must never break', prompt: 'Build the project test map. Tie critical user journeys and data/security contracts to unit, integration, and end-to-end tests. Identify the small smoke-test suite that must pass before every release.' },
      { title: '09 Deployment', when: 'Making releases repeatable', prompt: 'Document the deployment runbook for [PROJECT]: environments, build commands, environment variables, migrations, CI checks, release sequence, smoke tests, observability, rollback, and emergency access procedure.' },
      { title: '10 Decisions', when: 'Preventing old debates from returning', prompt: 'Create an architecture decision record for this decision: [DECISION]. Record context, options considered, decision, rationale, tradeoffs, consequences, date, owner, and conditions that would justify revisiting it.' },
    ],
  },
];

const FOLDER_GUIDE = [
  ['01-vision', 'Stable product purpose, users, outcomes and non-goals.'],
  ['02-requirements', 'Testable scope and acceptance criteria.'],
  ['03-architecture', 'System map, boundaries, dependencies and technical constraints.'],
  ['04-ui-ux', 'Journeys, reusable interface rules and accessibility.'],
  ['05-data', 'Schema, ownership, lifecycle and migration rules.'],
  ['06-apis', 'Contracts between browser, server and external services.'],
  ['07-security', 'Threat model, trust boundaries, auth and unresolved risks.'],
  ['08-tests', 'Critical behaviors and the test coverage that protects them.'],
  ['09-deployment', 'Build, release, smoke test, observability and rollback.'],
  ['10-decisions', 'Short records explaining why important choices were made.'],
];

export default function AiMasterLibraryPage() {
  const [activePack, setActivePack] = useState('business');
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState('');

  const selected = PACKS.find((pack) => pack.id === activePack) || PACKS[0];
  const visiblePrompts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return selected.prompts;
    return selected.prompts.filter((item) => `${item.title} ${item.when} ${item.prompt}`.toLowerCase().includes(q));
  }, [query, selected]);

  async function copyPrompt(item: Prompt) {
    await navigator.clipboard.writeText(item.prompt);
    setCopied(item.title);
    window.setTimeout(() => setCopied(''), 1600);
  }

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrow}>ARIDON · AI MASTER LIBRARY</div>
            <h1 style={{ margin: '8px 0 10px', fontSize: 'clamp(38px,7vw,68px)', lineHeight: .98 }}>Stop collecting prompts. Build capability.</h1>
            <p style={lead}>Five original playbooks turn business, marketing, finance, web development, and AI-assisted coding into repeatable workflows. Copy a prompt, customize the bracketed inputs, and use it with your preferred AI.</p>
          </div>
          <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/customer/creator" style={navLink}>Creator Studio</Link>
            <Link href="/customer/start" style={navLink}>Main Room</Link>
          </nav>
        </header>

        <section style={noticeStyle}>
          <strong>Built from scratch for Aridon.</strong> These are original tools inspired by common AI-workflow categories, not copies of anyone else’s paid books or prompt packs.
        </section>

        <section style={statsGrid}>
          <Stat number={`${PACKS.length}`} label="playbooks" />
          <Stat number={`${PACKS.reduce((sum, pack) => sum + pack.prompts.length, 0)}`} label="starter workflows" />
          <Stat number="10" label="coding context folders" />
          <Stat number="1" label="searchable command center" />
        </section>

        <section style={{ marginTop: 18 }}>
          <div style={eyebrow}>CHOOSE A PLAYBOOK</div>
          <div style={packGrid}>
            {PACKS.map((pack) => (
              <button key={pack.id} onClick={() => { setActivePack(pack.id); setQuery(''); }} style={{ ...packButton, ...(pack.id === activePack ? packButtonActive : {}) }}>
                <span style={{ fontSize: 12, fontWeight: 900, opacity: .72 }}>{pack.level}</span>
                <strong style={{ fontSize: 20, lineHeight: 1.12 }}>{pack.title}</strong>
                <span style={{ fontSize: 13, lineHeight: 1.45, opacity: .76 }}>{pack.subtitle}</span>
              </button>
            ))}
          </div>
        </section>

        <section style={heroPanel}>
          <div>
            <div style={eyebrow}>{selected.level}</div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', margin: '7px 0 7px' }}>{selected.title}</h2>
            <p style={muted}>{selected.description}</p>
          </div>
          <div style={moduleWrap}>{selected.modules.map((module) => <span key={module} style={modulePill}>{module}</span>)}</div>
        </section>

        <section style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '18px 0 12px' }}>
          <input aria-label="Search prompts" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${selected.title}…`} style={searchStyle} />
          <span style={{ color: '#9AA8BC', fontSize: 13 }}>{visiblePrompts.length} workflow{visiblePrompts.length === 1 ? '' : 's'}</span>
        </section>

        <section style={promptGrid}>
          {visiblePrompts.map((item, index) => (
            <article key={item.title} style={promptCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start' }}>
                <div><div style={eyebrow}>WORKFLOW {String(index + 1).padStart(2, '0')}</div><h3 style={{ margin: '5px 0 5px', fontSize: 21 }}>{item.title}</h3></div>
                <button onClick={() => copyPrompt(item)} style={copyButton}>{copied === item.title ? 'Copied ✓' : 'Copy'}</button>
              </div>
              <p style={{ margin: '5px 0 10px', color: '#9EF0CF', fontSize: 13, fontWeight: 800 }}>{item.when}</p>
              <div style={promptText}>{item.prompt}</div>
            </article>
          ))}
        </section>

        {selected.id === 'coding' && (
          <section style={folderPanel}>
            <div style={eyebrow}>THE 10-FOLDER BLUEPRINT</div>
            <h2 style={{ margin: '7px 0 10px' }}>Give the AI a memory palace, not a junk drawer.</h2>
            <p style={muted}>Keep these folders in the repository root or inside a /docs/ai-context directory. The goal is small, durable files that answer the questions a coding assistant repeatedly needs.</p>
            <div style={folderGrid}>{FOLDER_GUIDE.map(([name, text]) => <div key={name} style={folderCard}><strong>📁 {name}</strong><span>{text}</span></div>)}</div>
          </section>
        )}

        <section style={footerPanel}>
          <div><div style={eyebrow}>NEXT LAYER</div><h2 style={{ margin: '6px 0' }}>Turn the library into one-click Aridon actions.</h2><p style={muted}>The next iteration can route selected workflows directly into Eva, Creator Studio, Scout, Ledger, or the development workflow with company context already attached.</p></div>
          <Link href="/customer/creator" style={primaryAction}>Open Creator Studio</Link>
        </section>
      </div>
    </main>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return <div style={statCard}><strong style={{ fontSize: 30 }}>{number}</strong><span style={{ color: '#AEB9CB', fontSize: 13 }}>{label}</span></div>;
}

const pageStyle = { minHeight: '100vh', background: '#07101A', color: '#F7FAFC', fontFamily: 'Arial, sans-serif', padding: '24px 18px 120px' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'start', flexWrap: 'wrap' as const, paddingBottom: 18 };
const eyebrow = { color: '#79E0BC', fontSize: 11, letterSpacing: 1.4, fontWeight: 950 };
const lead = { maxWidth: 840, color: '#BCC7D6', lineHeight: 1.7, fontSize: 17 };
const muted = { color: '#AEB9CB', lineHeight: 1.65, margin: 0 };
const navLink = { border: '1px solid #334155', color: '#F8FAFC', borderRadius: 10, padding: '10px 13px', fontSize: 13, fontWeight: 850, textDecoration: 'none' };
const noticeStyle = { background: '#10271F', border: '1px solid #285D4B', color: '#D7F8EA', borderRadius: 14, padding: '13px 15px', lineHeight: 1.55 };
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: 10, marginTop: 14 };
const statCard = { background: '#0E1825', border: '1px solid #223146', borderRadius: 14, padding: 15, display: 'grid', gap: 3 };
const packGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(205px,1fr))', gap: 10, marginTop: 8 };
const packButton = { background: '#0E1825', color: '#F8FAFC', border: '1px solid #243349', borderRadius: 15, padding: 16, textAlign: 'left' as const, display: 'grid', gap: 6, cursor: 'pointer', minHeight: 132 };
const packButtonActive = { borderColor: '#79E0BC', boxShadow: '0 0 0 1px rgba(121,224,188,.22) inset', background: '#11241F' };
const heroPanel = { marginTop: 16, background: 'linear-gradient(135deg,#122233,#10271F)', border: '1px solid #294057', borderRadius: 20, padding: 22, display: 'grid', gap: 18 };
const moduleWrap = { display: 'flex', flexWrap: 'wrap' as const, gap: 7 };
const modulePill = { border: '1px solid #355066', background: 'rgba(255,255,255,.04)', borderRadius: 999, padding: '7px 10px', fontSize: 12, color: '#CFD8E5' };
const searchStyle = { flex: '1 1 320px', background: '#0E1825', border: '1px solid #2C3C52', color: '#F8FAFC', borderRadius: 11, padding: '12px 13px', fontSize: 14, outline: 'none' };
const promptGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 12 };
const promptCard = { background: '#0D1723', border: '1px solid #223248', borderRadius: 16, padding: 17 };
const copyButton = { background: '#9EF0CF', color: '#07130F', border: 0, borderRadius: 9, padding: '8px 11px', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' as const };
const promptText = { background: '#08111C', border: '1px solid #1E2C3E', borderRadius: 11, padding: 12, color: '#CDD7E5', lineHeight: 1.55, fontSize: 13, whiteSpace: 'pre-wrap' as const };
const folderPanel = { marginTop: 18, background: '#101A28', border: '1px solid #293A51', borderRadius: 18, padding: 20 };
const folderGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 9, marginTop: 14 };
const folderCard = { background: '#09131F', border: '1px solid #25364C', borderRadius: 12, padding: 13, display: 'grid', gap: 6, color: '#D7DFEA', fontSize: 13, lineHeight: 1.45 };
const footerPanel = { marginTop: 18, background: '#DDF8ED', color: '#102019', borderRadius: 18, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, flexWrap: 'wrap' as const };
const primaryAction = { background: '#102019', color: '#FFFFFF', borderRadius: 10, padding: '11px 14px', textDecoration: 'none', fontWeight: 900, whiteSpace: 'nowrap' as const };
