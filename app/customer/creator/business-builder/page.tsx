'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type Workflow = { title: string; when: string; prompt: string };
type Track = { id: string; title: string; subtitle: string; description: string; modules: string[]; workflows: Workflow[] };

const TRACKS: Track[] = [
  {
    id: 'setup',
    title: 'AI Setup Accelerator',
    subtitle: 'Get useful results without becoming a prompt engineer',
    description: 'A practical setup track that turns a new AI user into a competent operator with reusable context, guardrails, and repeatable working habits.',
    modules: ['Account setup', 'Context', 'Instructions', 'Verification', 'Reusable workflows', 'Privacy', 'Daily operating rhythm'],
    workflows: [
      { title: 'AI Working Profile', when: 'Starting with a new AI tool', prompt: 'Create a reusable working profile for me. My role is [ROLE], business is [BUSINESS], customers are [CUSTOMERS], priorities are [PRIORITIES], constraints are [CONSTRAINTS], preferred output style is [STYLE], and facts that must never be guessed are [FACTS]. Return a short instruction block I can reuse plus a list of missing information that would improve future work.' },
      { title: 'Task-to-AI Router', when: 'Deciding what to delegate to AI', prompt: 'Review these tasks: [TASKS]. Classify each as ideal for AI, AI-assisted with human review, human-led, or do not automate. Explain why, identify required inputs, verification steps, sensitivity risks, and the best reusable workflow for each.' },
      { title: 'Verification Checklist', when: 'Before acting on AI output', prompt: 'Review this AI output: [OUTPUT]. Separate verifiable facts, assumptions, calculations, recommendations, and creative suggestions. Tell me what needs independent verification before I spend money, contact a customer, make a legal/financial decision, or publish a claim.' },
      { title: 'Reusable Master Instruction', when: 'Building a consistent assistant', prompt: 'Turn these preferences and operating rules into a compact reusable system instruction: [RULES]. Remove repetition, preserve non-negotiables, group by purpose, and include a short quality-control checklist the assistant should apply before answering.' },
      { title: 'Daily AI Rhythm', when: 'Creating a simple daily routine', prompt: 'Build a 30-minute daily AI operating routine for [ROLE / BUSINESS]. Include morning prioritization, one revenue task, one operational task, one follow-up task, one learning/verification task, and an end-of-day capture so work compounds instead of disappearing into chats.' },
    ],
  },
  {
    id: 'prompting',
    title: 'Prompt Engineering Lab',
    subtitle: 'Better instructions, stronger outputs, fewer do-overs',
    description: 'Original prompting techniques focused on context, constraints, evidence, iteration, and useful deliverable formats rather than magic phrases.',
    modules: ['Context framing', 'Role clarity', 'Constraints', 'Examples', 'Critique loops', 'Scoring', 'Verification'],
    workflows: [
      { title: 'Five-Part Prompt Builder', when: 'Turning a vague request into a strong one', prompt: 'Rewrite this request into a five-part prompt using Objective, Context, Inputs, Constraints, and Output Format: [REQUEST]. Preserve my intent, identify missing inputs, and do not add facts I did not provide.' },
      { title: 'Prompt Stress Test', when: 'When results keep missing the mark', prompt: 'Stress-test this prompt: [PROMPT]. Identify ambiguity, missing context, conflicting instructions, unverifiable assumptions, weak success criteria, and formatting gaps. Then produce a stronger version and explain the three changes most likely to improve the result.' },
      { title: 'Expert Panel', when: 'A decision benefits from multiple viewpoints', prompt: 'Analyze [DECISION] from four distinct roles: operator, customer, finance/risk reviewer, and skeptical competitor. Give each role independent concerns and recommendations, then synthesize the points of agreement, disagreement, and evidence needed before deciding.' },
      { title: 'Rubric First', when: 'Quality matters more than speed', prompt: 'Before answering this task [TASK], create a 5-7 criterion quality rubric. Then produce the output, score it against the rubric, revise weak sections once, and show only the final result plus a short verification note.' },
      { title: 'Assumption Crusher', when: 'You suspect the AI is filling gaps', prompt: 'Review this request and proposed answer: [TEXT]. List every assumption that is not directly supported, label its risk if wrong, and replace unsupported certainty with a question, range, scenario, or clearly marked hypothesis.' },
    ],
  },
  {
    id: 'freelance',
    title: 'Freelancer & Side-Hustle Builder',
    subtitle: 'Turn a skill into a small productized service',
    description: 'A lean path from skill inventory to paid offer, outreach, delivery, retention, and referral without pretending income is guaranteed.',
    modules: ['Skill inventory', 'Niche', 'Offer', 'Pricing', 'Outreach', 'Delivery', 'Retention'],
    workflows: [
      { title: 'Skill-to-Offer Finder', when: 'Choosing what to sell', prompt: 'Given my skills [SKILLS], experience [EXPERIENCE], available hours [HOURS], and preferred customers [CUSTOMERS], identify 10 services I could realistically deliver with AI assistance. Rank by speed to first sale, ease of proof, delivery complexity, repeatability, and likely buyer urgency.' },
      { title: 'Productized Service', when: 'Packaging a service so it is easy to buy', prompt: 'Turn this service idea [SERVICE] into a productized offer. Define customer, trigger problem, deliverables, exclusions, timeline, required client inputs, price options, revision limit, proof needed, and a simple guarantee that does not promise outcomes outside my control.' },
      { title: 'Prospect List Criteria', when: 'Finding likely buyers', prompt: 'Define a prospecting scorecard for this offer [OFFER]. Include industry, company size, trigger events, visible problems, buying authority, urgency signals, disqualifiers, and the public evidence I should collect before outreach.' },
      { title: 'Warm Outreach Sequence', when: 'Contacting a qualified prospect', prompt: 'Create a respectful three-touch outreach sequence for [OFFER] to [PROSPECT TYPE]. Use one personalized observation, one useful idea, one low-friction CTA, and no fake urgency. Keep each touch concise and distinct.' },
      { title: 'Delivery SOP', when: 'Making the service repeatable', prompt: 'Build a delivery SOP for [SERVICE]. Include intake, source collection, analysis, draft, quality review, client approval, handoff, revision rules, completion criteria, and a post-project upsell or maintenance option.' },
      { title: 'Referral Engine', when: 'Turning completed work into more work', prompt: 'Design a referral and repeat-business system for [SERVICE]. Include the best timing to ask, referral language, a client check-in cadence, a complementary add-on, and a lightweight method to track referrals and renewals.' },
    ],
  },
  {
    id: 'digital-products',
    title: 'Digital Product Factory',
    subtitle: 'Create useful templates, guides, calculators, and micro-products',
    description: 'A build-and-validate track for original digital products based on real buyer problems rather than cloning other creators.',
    modules: ['Problem research', 'Product selection', 'MVP', 'Content', 'Packaging', 'Checkout', 'Launch'],
    workflows: [
      { title: 'Problem Miner', when: 'Before choosing a product', prompt: 'Analyze this audience [AUDIENCE] and evidence [REVIEWS / QUESTIONS / FORUM NOTES / SALES CALLS]. Extract recurring problems, jobs-to-be-done, costly mistakes, repeated questions, and desired shortcuts. Rank product opportunities by urgency, proof of demand, build speed, and differentiation.' },
      { title: 'MVP Product Designer', when: 'Turning a problem into something sellable', prompt: 'Design the smallest useful digital product for this problem: [PROBLEM]. Consider checklist, template, calculator, guide, mini-course, prompt workflow, swipe file, or dashboard. Define the customer outcome, contents, delivery format, build time, price test, and what must be proven before expanding.' },
      { title: 'Originality Guard', when: 'Creating from competitive inspiration', prompt: 'I have seen competitors selling [CATEGORY / FEATURES]. Help me build an original product in the same broad category without copying protected text or distinctive creative expression. Identify common functional needs, original angles, unique structure, examples we can create ourselves, and a differentiated promise.' },
      { title: 'Sales Page Builder', when: 'Preparing the launch page', prompt: 'Create a factual sales-page structure for [PRODUCT] aimed at [AUDIENCE]. Include problem, outcome, contents, screenshots/proof placeholders, who it is for/not for, FAQ, price framing, refund policy placeholder, and CTA. Flag every claim that needs evidence.' },
      { title: '7-Day Launch', when: 'Launching a small product quickly', prompt: 'Create a seven-day launch plan for [PRODUCT] using the channels I already have: [CHANNELS]. Prioritize direct conversations and customer feedback before paid advertising. Include daily tasks, message angle, CTA, metric, and the decision rule for improving, pausing, or expanding.' },
    ],
  },
  {
    id: 'automation-agency',
    title: 'AI Automation Agency',
    subtitle: 'Sell time savings and workflow improvements to businesses',
    description: 'A productized consulting track for finding repetitive work, designing safe automations, proving value, and charging for setup plus maintenance.',
    modules: ['Workflow audit', 'ROI', 'Automation map', 'Pilot', 'Implementation', 'Training', 'Retainer'],
    workflows: [
      { title: 'Automation Audit', when: 'Finding what a business should automate', prompt: 'Audit this business workflow list [WORKFLOWS]. Score each by frequency, labor time, error cost, customer impact, data sensitivity, integration difficulty, and human judgment required. Recommend the top three automation pilots with expected time savings and verification requirements.' },
      { title: 'Pilot Proposal', when: 'Selling a first automation', prompt: 'Create a one-page pilot proposal for automating [PROCESS]. Include current pain, baseline time/cost, proposed workflow, systems touched, what stays human-controlled, implementation steps, security/privacy questions, success metric, pilot fee, ongoing support option, and a clear stop condition.' },
      { title: 'ROI Calculator Brief', when: 'Quantifying the value', prompt: 'Using [EMPLOYEE COST], [HOURS], [FREQUENCY], [ERROR COST], and [AUTOMATION COST], calculate a conservative annualized value range for automating [PROCESS]. Show assumptions, time saved, payback period, and sensitivity if savings are 25%, 50%, or 75% of expected.' },
      { title: 'Human-in-the-Loop Design', when: 'Automation could create risk', prompt: 'Design a human-in-the-loop workflow for [PROCESS]. Specify what AI may draft or classify, what requires approval, thresholds for escalation, audit logs, rollback, data retention, and the situations where automation must stop and hand control to a person.' },
      { title: 'Maintenance Retainer', when: 'Converting a project to recurring revenue', prompt: 'Design a monthly support retainer for this automation [SYSTEM]. Include monitoring, small adjustments, error review, usage reporting, quarterly optimization, excluded work, response times, client responsibilities, and three pricing tiers tied to service level rather than promised financial results.' },
    ],
  },
  {
    id: 'writing',
    title: 'AI Writing Business',
    subtitle: 'Sell business writing with research and human review',
    description: 'A writing-service system for emails, websites, proposals, case studies, and content where clients pay for finished business outcomes, not raw prompts.',
    modules: ['Niche', 'Research', 'Voice', 'Drafting', 'Editing', 'Proof', 'Retainers'],
    workflows: [
      { title: 'Writing Niche Selector', when: 'Choosing the fastest credible service', prompt: 'Compare these writing services for me [SERVICES]. Rank by buyer urgency, ability to show a sample quickly, required subject expertise, liability risk, repeat business, and delivery time. Recommend one entry offer and one recurring upsell.' },
      { title: 'Brand Voice Capture', when: 'Onboarding a client', prompt: 'Analyze these client materials [MATERIALS]. Build a compact voice guide covering tone, vocabulary, sentence style, audience, proof standards, prohibited claims, CTA style, and examples of what sounds on-brand vs off-brand.' },
      { title: 'Research-to-Draft', when: 'Writing factual business content', prompt: 'Using only the supplied source material [SOURCES], create [DELIVERABLE]. Preserve factual meaning, mark missing evidence, avoid unsupported claims, and add a verification checklist for names, dates, numbers, quotes, links, and legal/regulatory statements.' },
      { title: 'Editorial Pass', when: 'Before client delivery', prompt: 'Edit this draft [DRAFT] for clarity, specificity, logical flow, repetition, unsupported claims, tone consistency, CTA strength, and factual uncertainty. Keep the client voice. Return the revised copy plus a short list of items the client must verify.' },
      { title: 'Content Retainer', when: 'Packaging recurring work', prompt: 'Design a monthly content retainer for [CLIENT TYPE] using [CHANNELS]. Include monthly deliverables, content inputs required from the client, approval process, revision limits, reporting, optional add-ons, and three scope-based tiers.' },
    ],
  },
  {
    id: 'ecommerce',
    title: 'Ecommerce & Marketplace Seller Lab',
    subtitle: 'Listings, research, conversion, retention, and operations',
    description: 'Original workflows for marketplace and direct-to-consumer sellers, with special attention to claims, platform rules, reviews, and unit economics.',
    modules: ['Product research', 'Listings', 'Keywords', 'Images', 'Reviews', 'Pricing', 'Retention'],
    workflows: [
      { title: 'Listing Evidence Map', when: 'Before rewriting a product page', prompt: 'Create an evidence map for this product [PRODUCT DATA]. Separate verified specifications, customer benefits supported by those specs, prohibited/uncertain claims, required disclaimers, competitor differences, and questions we need answered before writing the listing.' },
      { title: 'Listing Rewrite', when: 'Improving marketplace copy', prompt: 'Rewrite this product listing [LISTING] for clarity and conversion using only verified facts [FACTS]. Produce title options, key bullets, description/A+ structure, FAQ, image-text concepts, and a list of claims that should not be used without evidence.' },
      { title: 'Review Miner', when: 'Using reviews for product improvement', prompt: 'Analyze these customer reviews [REVIEWS]. Categorize praise, complaints, misunderstandings, returns triggers, desired features, usage scenarios, and exact customer language. Recommend listing changes, product changes, support changes, and questions for future customer research.' },
      { title: 'Unit Economics Check', when: 'Evaluating a SKU', prompt: 'Calculate a unit-economics model for [SKU] using price, product cost, freight, fulfillment, marketplace fees, advertising, returns, discounts, and overhead assumptions [DATA]. Show contribution margin and break-even ad spend. Highlight missing data instead of guessing.' },
      { title: 'Retention Sequence', when: 'Turning a first sale into another', prompt: 'Design a post-purchase retention sequence for [PRODUCT]. Include onboarding/use tips, support check-in, review request timing, replenishment/reorder timing if appropriate, cross-sell logic, and customer-service triggers. Keep all messages compliant with the sales channel rules I provide.' },
    ],
  },
  {
    id: 'saas',
    title: 'SaaS Founder Lab',
    subtitle: 'Prioritization, onboarding, support, retention, and growth',
    description: 'Decision tools for software founders to prioritize evidence, reduce churn, improve onboarding, and build features that solve real user problems.',
    modules: ['ICP', 'Roadmap', 'Onboarding', 'Support', 'Churn', 'Pricing', 'Growth'],
    workflows: [
      { title: 'ICP Builder', when: 'Defining the best early customer', prompt: 'Build an ideal-customer profile for [SAAS] using this evidence [CUSTOMERS / CALLS / USAGE / WINS]. Define firmographics, job role, trigger event, painful workflow, current alternative, buying criteria, disqualifiers, proof required, and the first segment we should focus on.' },
      { title: 'Feature Prioritizer', when: 'The roadmap is overloaded', prompt: 'Score these feature ideas [FEATURES] using customer pain, frequency, strategic fit, evidence strength, revenue/retention potential, implementation cost, risk, and reversibility. Recommend now/next/later/not-now and identify what customer evidence would change the ranking.' },
      { title: 'Onboarding Doctor', when: 'New users are not reaching value', prompt: 'Analyze this onboarding flow [FLOW / METRICS]. Identify the activation event, friction, unnecessary steps, missing guidance, trust gaps, and drop-off points. Propose the smallest experiments to shorten time-to-value with success metrics.' },
      { title: 'Churn Analyst', when: 'Customers are leaving', prompt: 'Analyze these churn reasons, cancellation notes, usage signals, and support tickets [DATA]. Group root causes, distinguish avoidable vs unavoidable churn, identify leading indicators, and propose retention experiments with expected mechanism and measurement.' },
      { title: 'Pricing Experiment', when: 'Testing packaging or price', prompt: 'Design a pricing/packaging experiment for [SAAS]. Use customer value metric, current plans, gross margin, usage behavior, willingness-to-pay evidence, and competitive context. Propose hypotheses, segments, test method, guardrails, and what result would justify a change.' },
    ],
  },
  {
    id: 'app-builder',
    title: 'First App Builder',
    subtitle: 'From idea to tested MVP without code-chaos',
    description: 'A step-by-step AI-assisted app-building track that emphasizes requirements, small increments, tests, security, and deployment discipline.',
    modules: ['Idea', 'MVP', 'Architecture', 'Build', 'Test', 'Secure', 'Deploy'],
    workflows: [
      { title: 'MVP Scoper', when: 'Starting an app idea', prompt: 'Turn this app idea [IDEA] into an MVP. Define primary user, core job, one critical journey, must-have features, non-goals, data needed, auth needs, third-party integrations, success metric, and a build sequence that can produce a testable version quickly.' },
      { title: 'Build Slice Planner', when: 'Planning one increment at a time', prompt: 'Break this MVP [MVP] into vertical build slices that each create a testable user outcome. For each slice list UI, API/data changes, auth, error states, tests, and completion criteria. Prefer slices small enough to review and roll back safely.' },
      { title: 'Code Review Copilot', when: 'After AI-generated code', prompt: 'Review this code change [DIFF / FILES] for correctness, hidden assumptions, security, authorization, data loss, edge cases, accessibility, performance, maintainability, and test coverage. Rank findings by severity and propose the smallest safe fixes.' },
      { title: 'Pre-Launch Gate', when: 'Before going live', prompt: 'Create a launch gate for [APP]. Include authentication, authorization, tenant/data isolation, backups, migrations, secrets, rate limits, validation, error handling, logs, monitoring, accessibility, mobile smoke tests, payment checks if applicable, privacy/terms placeholders, and rollback.' },
      { title: 'Post-Launch Learning Loop', when: 'After first users arrive', prompt: 'Design a first-30-users learning system for [APP]. Include activation metric, interview questions, support tagging, bug severity rules, feature-request capture, churn/abandonment questions, weekly review, and a rule for what not to build yet.' },
    ],
  },
  {
    id: 'code-command',
    title: 'AI Code Command Deck',
    subtitle: 'High-value commands for disciplined coding assistants',
    description: 'A reusable set of coding commands covering understanding, planning, building, debugging, testing, review, and documentation.',
    modules: ['Inspect', 'Plan', 'Implement', 'Debug', 'Test', 'Review', 'Document'],
    workflows: [
      { title: 'Explain Before Editing', when: 'Entering unfamiliar code', prompt: 'Read [FILES / AREA] and explain current behavior, data flow, dependencies, public contracts, and likely side effects of change. Cite exact files/functions. Do not edit anything yet.' },
      { title: 'Smallest Patch', when: 'Fixing a localized issue', prompt: 'Propose the smallest patch that fixes [BUG / REQUIREMENT] while preserving existing behavior. Reuse existing patterns, list affected files, explain risk, and include tests that would fail before and pass after.' },
      { title: 'Dead Code Check', when: 'Before deleting code', prompt: 'Determine whether [FILE / FUNCTION / COMPONENT] is truly unused. Search imports, dynamic references, routes, tests, build configuration, feature flags, and runtime conventions. Only recommend deletion if evidence supports it.' },
      { title: 'Migration Safety', when: 'Changing a database schema', prompt: 'Review this proposed migration [MIGRATION]. Identify lock risk, destructive changes, default/backfill issues, nullability, index cost, rollback limits, application compatibility, and a safe phased rollout if needed.' },
      { title: 'Release Note Generator', when: 'After a change is complete', prompt: 'Create concise release notes for [CHANGE]. Explain user impact, admin/operator impact, migrations/config changes, verification steps, rollback note, and known limitations. Do not claim tests passed unless test evidence is provided.' },
    ],
  },
  {
    id: 'motion',
    title: 'Motion & Interactive Web Lab',
    subtitle: 'Build polished interfaces without sacrificing usability',
    description: 'A front-end experience track for intentional animation, motion systems, interactive storytelling, and performance-safe polish.',
    modules: ['Motion goals', 'Framer Motion', 'Microinteractions', 'Scroll', 'Accessibility', 'Performance', 'Testing'],
    workflows: [
      { title: 'Motion Purpose Map', when: 'Before adding animation', prompt: 'For this interface [UI], identify where motion improves orientation, feedback, hierarchy, continuity, or delight, and where it would only add noise. Define a small motion vocabulary with duration ranges, easing intent, reduced-motion behavior, and reusable patterns.' },
      { title: 'Framer Motion Plan', when: 'Implementing a React animation', prompt: 'Design a Framer Motion implementation for [INTERACTION]. Specify component boundaries, variants, enter/exit states, layout animation, gesture behavior, reduced-motion fallback, performance considerations, and a minimal code structure that matches the existing app patterns.' },
      { title: 'Accessible Animation Audit', when: 'Before shipping animated UI', prompt: 'Audit these animations [DETAILS / CODE] for prefers-reduced-motion, focus stability, content visibility, keyboard use, vestibular triggers, timing, flashing, auto-play, and interaction discoverability. Provide prioritized fixes.' },
      { title: 'Performance Budget', when: 'Motion feels heavy', prompt: 'Review this animated page [CODE / METRICS]. Identify layout thrashing, excessive re-renders, large assets, non-composited properties, scroll handlers, and hydration issues. Recommend a motion performance budget and measurable fixes.' },
    ],
  },
  {
    id: 'mastery',
    title: 'AI Mastery Course',
    subtitle: 'A structured path from beginner to business operator',
    description: 'An original course outline that ties the entire library together into learn-by-doing projects instead of passive reading.',
    modules: ['Foundations', 'Prompting', 'Research', 'Business', 'Content', 'Finance', 'Automation', 'Coding', 'Verification', 'Capstone'],
    workflows: [
      { title: '30-Day Learning Plan', when: 'Learning AI by doing', prompt: 'Create a 30-day learn-by-doing plan for me using AI in [ROLE / BUSINESS]. Each day should take 30-45 minutes and produce one useful artifact, skill, or workflow. Include weekly review days and a final capstone that saves time or creates measurable business value.' },
      { title: 'Skill Check', when: 'Testing understanding', prompt: 'Test my practical understanding of [AI TOPIC] using five scenario questions. Ask one at a time, score my answer against clear criteria, explain the gap, and give a short practice task before the next question.' },
      { title: 'Workflow Capstone', when: 'Turning learning into business value', prompt: 'Help me design a capstone workflow for [BUSINESS PROBLEM]. It must use real inputs, produce a repeatable output, include human review, track time saved or revenue impact, define failure modes, and be simple enough for another employee to follow.' },
      { title: 'AI Policy Starter', when: 'A company begins using AI widely', prompt: 'Draft an internal AI-use policy outline for [COMPANY]. Cover approved use cases, confidential data, customer data, human review, factual verification, intellectual property, security, prohibited uses, escalation, recordkeeping, and employee training. Mark sections needing legal/security review.' },
    ],
  },
];

const MONEY_OFFERS = [
  {
    name: 'AI Revenue Sprint',
    best: 'Fastest to sell',
    price: '$495–$995',
    timeline: '2–5 business days',
    promise: 'Find and fix the highest-impact leaks in a small business website, offer, follow-up, and outreach system.',
    deliverables: ['Website/offer audit', 'Customer + competitor snapshot', 'Rewritten core offer', '3-email follow-up sequence', '30-day content plan', '10 qualified prospect targets', 'One implementation call'],
  },
  {
    name: 'AI Business Operating Tune-Up',
    best: 'Best recurring upsell',
    price: '$995 setup + $298–$750/mo',
    timeline: '5–10 business days',
    promise: 'Map repetitive admin, build SOPs, and automate low-risk work while keeping approvals human-controlled.',
    deliverables: ['Workflow audit', 'Top 3 automation opportunities', 'SOP pack', 'One automation pilot', 'Staff handoff', 'Monthly improvement report'],
  },
  {
    name: 'AI Content & Sales Desk',
    best: 'Easy monthly retainer',
    price: '$750–$1,995/mo',
    timeline: 'Monthly',
    promise: 'A done-for-you content and sales-support desk for businesses that cannot justify a full-time marketer.',
    deliverables: ['Monthly campaign', 'Emails', 'Social posts', 'Website updates', 'Sales scripts', 'Proposal support', 'Monthly analytics review'],
  },
];

const LAUNCH_DAYS = [
  ['Day 1', 'Choose one offer and one customer type. Build a one-page sample using a real local business.'],
  ['Day 2', 'Create a before/after audit example and a fixed-scope checkout or proposal.'],
  ['Day 3', 'Use Scout / Find Customers to build a list of 25 highly qualified prospects with visible problems.'],
  ['Day 4', 'Send 10 personalized outreach messages with one useful observation and one low-friction CTA.'],
  ['Day 5', 'Follow up, offer two short diagnostic calls, and close only the fixed-scope first project.'],
  ['Day 6', 'Deliver fast using Creator Studio + the Master Library, with human review before client delivery.'],
  ['Day 7', 'Ask for testimonial/referral, document the workflow, and offer the recurring support tier.'],
];

export default function BusinessBuilderPage() {
  const [active, setActive] = useState('automation-agency');
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState('');
  const selected = TRACKS.find((track) => track.id === active) || TRACKS[0];
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return selected.workflows;
    return selected.workflows.filter((item) => `${item.title} ${item.when} ${item.prompt}`.toLowerCase().includes(q));
  }, [query, selected]);
  const workflowCount = TRACKS.reduce((sum, track) => sum + track.workflows.length, 0);

  async function copy(item: Workflow) {
    await navigator.clipboard.writeText(item.prompt);
    setCopied(item.title);
    window.setTimeout(() => setCopied(''), 1500);
  }

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1220, margin: '0 auto' }}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrow}>ARIDON · AI BUSINESS BUILDER</div>
            <h1 style={{ fontSize: 'clamp(38px,7vw,68px)', lineHeight: .98, margin: '8px 0 10px' }}>Turn AI know-how into something customers will pay for.</h1>
            <p style={lead}>Twelve original learning and business tracks combine setup, prompting, freelancing, digital products, automation, writing, ecommerce, SaaS, app building, coding, motion, and AI mastery. The money layer packages those capabilities into fixed-scope offers Aridon can actually deliver.</p>
          </div>
          <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/customer/creator/library" style={navLink}>AI Master Library</Link>
            <Link href="/customer/creator" style={navLink}>Creator Studio</Link>
            <Link href="/customer/sales" style={navLink}>Find Customers</Link>
          </nav>
        </header>

        <section style={noticeStyle}><strong>No income guarantees.</strong> The fastest route is usually a small, fixed-scope service sold to a real business with a visible problem. Use AI to reduce delivery time, not to promise unrealistic results.</section>

        <section style={statsGrid}>
          <Stat number={`${TRACKS.length}`} label="business + skill tracks" />
          <Stat number={`${workflowCount}`} label="new original workflows" />
          <Stat number="3" label="ready-to-sell offers" />
          <Stat number="7 days" label="first-sales sprint" />
        </section>

        <section style={moneyPanel}>
          <div><div style={eyebrow}>FASTEST MONEY PATH</div><h2 style={{ margin: '7px 0 8px', fontSize: 'clamp(28px,4vw,42px)' }}>Launch an Aridon AI Revenue Sprint service.</h2><p style={muted}>Do not lead with “AI prompts.” Lead with a business result: clearer offer, better follow-up, more qualified outreach, or less admin. The AI library is the engine under the hood.</p></div>
          <div style={offerGrid}>{MONEY_OFFERS.map((offer) => <article key={offer.name} style={offerCard}><div style={offerTag}>{offer.best}</div><h3 style={{ fontSize: 23, margin: '8px 0 5px' }}>{offer.name}</h3><div style={{ color: '#9EF0CF', fontWeight: 950 }}>{offer.price} · {offer.timeline}</div><p style={muted}>{offer.promise}</p><div style={{ display: 'grid', gap: 6 }}>{offer.deliverables.map((item) => <span key={item} style={deliverable}>✓ {item}</span>)}</div></article>)}</div>
        </section>

        <section style={launchPanel}>
          <div><div style={eyebrow}>7-DAY FIRST-SALES SPRINT</div><h2 style={{ margin: '7px 0 8px' }}>Sell the small result first. Earn the retainer second.</h2></div>
          <div style={launchGrid}>{LAUNCH_DAYS.map(([day, task]) => <div key={day} style={launchCard}><strong style={{ color: '#9EF0CF' }}>{day}</strong><span>{task}</span></div>)}</div>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 14 }}><Link href="/customer/sales" style={primaryAction}>Find First Prospects</Link><Link href="/customer/creator" style={secondaryAction}>Build the Sample</Link></div>
        </section>

        <section style={{ marginTop: 22 }}>
          <div style={eyebrow}>ALL BUSINESS BUILDER TRACKS</div>
          <div style={trackGrid}>{TRACKS.map((track) => <button key={track.id} onClick={() => { setActive(track.id); setQuery(''); }} style={{ ...trackButton, ...(track.id === active ? activeTrack : {}) }}><strong style={{ fontSize: 18 }}>{track.title}</strong><span style={{ opacity: .72, lineHeight: 1.4 }}>{track.subtitle}</span></button>)}</div>
        </section>

        <section style={heroPanel}>
          <div><div style={eyebrow}>{selected.modules.length} MODULES</div><h2 style={{ margin: '6px 0', fontSize: 'clamp(28px,4vw,40px)' }}>{selected.title}</h2><p style={muted}>{selected.description}</p></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{selected.modules.map((module) => <span key={module} style={modulePill}>{module}</span>)}</div>
        </section>

        <section style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', margin: '17px 0 12px' }}><input aria-label="Search workflows" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${selected.title}…`} style={searchStyle} /><span style={{ color: '#91A0B5', fontSize: 13 }}>{visible.length} workflow{visible.length === 1 ? '' : 's'}</span></section>

        <section style={workflowGrid}>{visible.map((item, index) => <article key={item.title} style={workflowCard}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start' }}><div><div style={eyebrow}>WORKFLOW {String(index + 1).padStart(2, '0')}</div><h3 style={{ margin: '5px 0', fontSize: 21 }}>{item.title}</h3></div><button onClick={() => copy(item)} style={copyButton}>{copied === item.title ? 'Copied ✓' : 'Copy'}</button></div><p style={{ color: '#9EF0CF', fontSize: 13, fontWeight: 850 }}>{item.when}</p><div style={promptText}>{item.prompt}</div></article>)}</section>

        <section style={footerPanel}><div><div style={eyebrow}>HOW THIS FITS ARIDON</div><h2 style={{ margin: '6px 0' }}>Library → Creator Studio → Scout → delivery → recurring account.</h2><p style={{ ...muted, color: '#294238' }}>Use the library for the operating playbook, Creator Studio for deliverables, Find Customers for prospecting, and the existing Aridon workspace to keep client work organized.</p></div><Link href="/customer/creator" style={darkAction}>Start a Client Project</Link></section>
      </div>
    </main>
  );
}

function Stat({ number, label }: { number: string; label: string }) { return <div style={statCard}><strong style={{ fontSize: 29 }}>{number}</strong><span style={{ color: '#AEB9CB', fontSize: 13 }}>{label}</span></div>; }

const pageStyle = { minHeight: '100vh', background: '#07101A', color: '#F8FAFC', fontFamily: 'Arial, sans-serif', padding: '24px 18px 120px' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'start', flexWrap: 'wrap' as const, paddingBottom: 18 };
const eyebrow = { color: '#79E0BC', fontSize: 11, letterSpacing: 1.3, fontWeight: 950 };
const lead = { maxWidth: 880, color: '#BCC7D6', lineHeight: 1.7, fontSize: 17 };
const muted = { color: '#AEB9CB', lineHeight: 1.62, margin: '8px 0' };
const navLink = { border: '1px solid #334155', color: '#F8FAFC', borderRadius: 10, padding: '10px 13px', fontSize: 13, fontWeight: 850, textDecoration: 'none' };
const noticeStyle = { background: '#231F10', border: '1px solid #665B26', color: '#F4E9B4', borderRadius: 14, padding: '13px 15px', lineHeight: 1.55 };
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: 10, marginTop: 14 };
const statCard = { background: '#0E1825', border: '1px solid #223146', borderRadius: 14, padding: 15, display: 'grid', gap: 3 };
const moneyPanel = { marginTop: 18, background: 'linear-gradient(135deg,#10271F,#122233)', border: '1px solid #315444', borderRadius: 20, padding: 22 };
const offerGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))', gap: 11, marginTop: 15 };
const offerCard = { background: '#0A1620', border: '1px solid #2A4550', borderRadius: 16, padding: 17 };
const offerTag = { display: 'inline-block', background: '#9EF0CF', color: '#07130F', borderRadius: 999, padding: '5px 8px', fontSize: 11, fontWeight: 950 };
const deliverable = { color: '#D5DFEA', fontSize: 13, lineHeight: 1.45 };
const launchPanel = { marginTop: 15, background: '#101A28', border: '1px solid #293A51', borderRadius: 18, padding: 20 };
const launchGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 8, marginTop: 12 };
const launchCard = { background: '#09131F', border: '1px solid #25364C', borderRadius: 12, padding: 12, display: 'grid', gap: 6, color: '#D7DFEA', fontSize: 13, lineHeight: 1.5 };
const primaryAction = { background: '#9EF0CF', color: '#07130F', borderRadius: 10, padding: '11px 14px', textDecoration: 'none', fontWeight: 950 };
const secondaryAction = { border: '1px solid #52657D', color: '#F8FAFC', borderRadius: 10, padding: '10px 13px', textDecoration: 'none', fontWeight: 900 };
const trackGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(215px,1fr))', gap: 9, marginTop: 8 };
const trackButton = { background: '#0E1825', color: '#F8FAFC', border: '1px solid #243349', borderRadius: 14, padding: 14, textAlign: 'left' as const, display: 'grid', gap: 5, cursor: 'pointer', minHeight: 94 };
const activeTrack = { borderColor: '#79E0BC', background: '#11241F', boxShadow: '0 0 0 1px rgba(121,224,188,.2) inset' };
const heroPanel = { marginTop: 15, background: '#101A28', border: '1px solid #293A51', borderRadius: 18, padding: 20, display: 'grid', gap: 14 };
const modulePill = { border: '1px solid #355066', background: 'rgba(255,255,255,.04)', borderRadius: 999, padding: '7px 10px', fontSize: 12, color: '#CFD8E5' };
const searchStyle = { flex: '1 1 320px', background: '#0E1825', border: '1px solid #2C3C52', color: '#F8FAFC', borderRadius: 11, padding: '12px 13px', fontSize: 14, outline: 'none' };
const workflowGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 12 };
const workflowCard = { background: '#0D1723', border: '1px solid #223248', borderRadius: 16, padding: 17 };
const copyButton = { background: '#9EF0CF', color: '#07130F', border: 0, borderRadius: 9, padding: '8px 11px', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' as const };
const promptText = { background: '#08111C', border: '1px solid #1E2C3E', borderRadius: 11, padding: 12, color: '#CDD7E5', lineHeight: 1.55, fontSize: 13, whiteSpace: 'pre-wrap' as const };
const footerPanel = { marginTop: 18, background: '#DDF8ED', color: '#102019', borderRadius: 18, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, flexWrap: 'wrap' as const };
const darkAction = { background: '#102019', color: '#FFFFFF', borderRadius: 10, padding: '11px 14px', textDecoration: 'none', fontWeight: 900, whiteSpace: 'nowrap' as const };
