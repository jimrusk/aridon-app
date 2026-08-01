// ═══════════════════════════════════════════════════════════════════
//  Aridon AWG-1000 Pitch Deck Generator
//  Output: ~/.codex/Aridon-AWG1000-Pitch.pptx
//  Run:    node generate-pitch.js
// ═══════════════════════════════════════════════════════════════════

const pptxgen = require('pptxgenjs');
const path = require('path');
const os = require('os');
const fs = require('fs');

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9'; // 10" × 5.625"

const OUT = path.join(os.homedir(), '.codex', 'Aridon-AWG1000-Pitch.pptx');

// ── Brand Colors ────────────────────────────────────────────────────
const C = {
  navy:   '0A0E1A',
  card:   '1D2740',
  deep:   '162035',
  blue:   '4A90D9',
  teal:   '26C6DA',
  orange: 'E87722',
  white:  'FFFFFF',
  muted:  '9BA8C6',
  light:  'CDD6F4',
  dark:   '0D1220',
  green:  '4CAF50',
  gold:   'F5C842',
};

const TODAY = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

// ── Helpers ─────────────────────────────────────────────────────────
function addSlide(fn) {
  const s = pres.addSlide();
  s.background = { color: C.navy };
  fn(s);
}

function dot(s, x, y, size, color) {
  s.addShape('ellipse', {
    x, y, w: size, h: size,
    fill: { color },
    line: { width: 0 },
  });
}

function iconCircle(s, x, y, size, color, letter, fontSize) {
  dot(s, x, y, size, color);
  s.addText(letter, {
    x, y, w: size, h: size,
    fontSize: fontSize || 20,
    bold: true,
    color: C.white,
    align: 'center',
    valign: 'middle',
    fontFace: 'Calibri',
    margin: 0,
  });
}

function card(s, x, y, w, h, borderColor, fillColor) {
  s.addShape('roundRect', {
    x, y, w, h,
    fill: { color: fillColor || C.card },
    line: { color: borderColor || C.blue, width: 1.5 },
    rectRadius: 0.1,
  });
}

function label(s, text, x, y, w, h, opts) {
  s.addText(text, Object.assign({
    x, y, w, h,
    fontFace: 'Calibri',
    color: C.white,
    fontSize: 14,
    margin: 0,
  }, opts));
}

// ═══════════════════════════════════════════════════════════════════
//  SLIDE 1 — Title
// ═══════════════════════════════════════════════════════════════════
addSlide(s => {
  s.addShape('ellipse', {
    x: 5.5, y: -1.5, w: 7, h: 7,
    fill: { color: C.card },
    line: { width: 0 },
    transparency: 60,
  });
  s.addShape('ellipse', {
    x: 6.5, y: -0.8, w: 5.5, h: 5.5,
    fill: { color: C.deep },
    line: { color: C.blue, width: 1 },
    transparency: 40,
  });

  iconCircle(s, 0.55, 0.45, 0.72, C.teal, 'A', 22);
  label(s, 'IRON GRID ELECTRIC & WATER', 1.45, 0.52, 6, 0.42, {
    fontSize: 11, bold: true, color: C.teal, charSpacing: 4,
  });

  s.addText('Aridon\nAWG-1000', {
    x: 0.55, y: 1.1, w: 7, h: 2.55,
    fontSize: 68, bold: true,
    color: C.white,
    fontFace: 'Calibri',
  });

  label(s, 'Atmospheric Water Generation\nPowered by Artificial Intelligence', 0.55, 3.72, 7, 0.92, {
    fontSize: 19, color: C.blue,
  });

  label(s, 'Confidential Investor Presentation  |  ' + TODAY, 0.55, 5.2, 6, 0.28, {
    fontSize: 11, color: C.muted,
  });

  const stats = [
    { n: '$800M', l: 'Token value by 2032' },
    { n: '2M AF',  l: 'Annual production target' },
    { n: '3x',    l: 'Revenue events per gallon' },
  ];
  stats.forEach((st, i) => {
    const y = 1.2 + i * 1.38;
    s.addShape('roundRect', {
      x: 8.2, y, w: 1.52, h: 1.18,
      fill: { color: C.deep },
      line: { color: C.blue, width: 1 },
      rectRadius: 0.08,
    });
    label(s, st.n, 8.2, y + 0.05, 1.52, 0.6, { fontSize: 26, bold: true, color: C.blue, align: 'center' });
    label(s, st.l, 8.2, y + 0.65, 1.52, 0.42, { fontSize: 10, color: C.muted, align: 'center' });
  });
});

// ═══════════════════════════════════════════════════════════════════
//  SLIDE 2 — The Global Water Crisis
// ═══════════════════════════════════════════════════════════════════
addSlide(s => {
  label(s, 'THE GLOBAL WATER CRISIS', 0.5, 0.28, 9, 0.45, {
    fontSize: 30, bold: true, color: C.white,
  });
  label(s, 'Water is the defining resource challenge of the 21st century — demand is accelerating faster than supply.', 0.5, 0.82, 9, 0.38, {
    fontSize: 14, color: C.muted,
  });

  const stats = [
    { n: '2.2B',  c: C.orange, label: 'People lack access\nto safe drinking water' },
    { n: '40%',   c: C.blue,   label: 'of the world faces\nwater scarcity today' },
    { n: '2030',  c: C.teal,   label: 'Global demand exceeds\nsupply by 40%' },
    { n: '$1T+',  c: C.gold,   label: 'Annual economic loss\nfrom water scarcity' },
  ];
  stats.forEach((st, i) => {
    const x = 0.38 + i * 2.35;
    s.addShape('roundRect', {
      x, y: 1.5, w: 2.18, h: 2.55,
      fill: { color: C.card },
      line: { color: st.c, width: 2 },
      rectRadius: 0.1,
    });
    dot(s, x + 0.79, 1.62, 0.58, st.c);
    label(s, st.n, x, 1.6, 2.18, 0.62, { fontSize: 30, bold: true, color: C.white, align: 'center', valign: 'middle', margin: 0 });
    label(s, st.label, x + 0.1, 2.3, 1.98, 1.0, { fontSize: 13, color: C.light, align: 'center' });
  });

  s.addShape('roundRect', {
    x: 0.38, y: 4.2, w: 9.24, h: 1.12,
    fill: { color: C.deep },
    line: { color: C.orange, width: 1.5 },
    rectRadius: 0.08,
  });
  label(s, 'AI data centers — the fastest-growing infrastructure sector in the world — consume millions of gallons of water per day and face mounting ESG pressure to offset their footprint. Aridon is the answer.', 0.6, 4.32, 9.0, 0.78, {
    fontSize: 13, color: C.light,
  });
});

// ═══════════════════════════════════════════════════════════════════
//  SLIDE 3 — The Southwest Crisis
// ═══════════════════════════════════════════════════════════════════
addSlide(s => {
  label(s, 'THE SOUTHWEST CRISIS — ARIDON\'S MARKET', 0.5, 0.28, 9, 0.45, {
    fontSize: 28, bold: true, color: C.white,
  });

  const facts = [
    { stat: 'Colorado River',  sub: 'At lowest reservoir levels in recorded history. Seven states in active shortage.' },
    { stat: '7-State SWSA',    sub: 'Southwest Water Security Alliance coalition — the governance body Aridon works with.' },
    { stat: 'AI Data Centers', sub: 'Opening across NM, AZ, TX — each consuming millions of gallons per day for cooling.' },
    { stat: 'Navajo Nation',   sub: '400,000 people. 30%+ of households lack running water. Aridon\'s first deployment partner.' },
  ];
  facts.forEach((f, i) => {
    const y = 1.1 + i * 1.02;
    s.addShape('roundRect', {
      x: 0.4, y, w: 5.5, h: 0.86,
      fill: { color: C.card },
      line: { color: C.deep, width: 1 },
      rectRadius: 0.08,
    });
    label(s, f.stat, 0.62, y + 0.07, 2.1, 0.36, { fontSize: 15, bold: true, color: C.white });
    label(s, f.sub, 0.62, y + 0.46, 5.0, 0.3, { fontSize: 12, color: C.muted });
  });

  s.addShape('roundRect', {
    x: 6.1, y: 1.1, w: 3.5, h: 4.18,
    fill: { color: C.deep },
    line: { color: C.teal, width: 2 },
    rectRadius: 0.1,
  });
  label(s, 'THE\nOPPORTUNITY', 6.1, 1.22, 3.5, 0.9, {
    fontSize: 20, bold: true, color: C.teal, align: 'center',
  });

  const ops = [
    { n: '$400', u: 'per acre-foot\nvoluntary offset midpoint' },
    { n: '78%',  u: 'of AWG market uses\ncooling condensation tech' },
    { n: '2M AF', u: 'Aridon production\ntarget by 2032' },
  ];
  ops.forEach((op, i) => {
    const y = 2.18 + i * 1.06;
    label(s, op.n, 6.1, y, 3.5, 0.52, { fontSize: 28, bold: true, color: C.blue, align: 'center' });
    label(s, op.u, 6.1, y + 0.52, 3.5, 0.46, { fontSize: 11, color: C.muted, align: 'center' });
  });
});

// ═══════════════════════════════════════════════════════════════════
//  SLIDE 4 — The AWG-1000
// ═══════════════════════════════════════════════════════════════════
addSlide(s => {
  s.addShape('roundRect', {
    x: 0.35, y: 0.28, w: 3.8, h: 5.05,
    fill: { color: C.deep },
    line: { color: C.teal, width: 2 },
    rectRadius: 0.12,
  });
  iconCircle(s, 1.3, 0.55, 1.9, C.blue, 'A', 60);
  label(s, 'AWG-1000', 0.35, 2.62, 3.8, 0.6, {
    fontSize: 26, bold: true, color: C.white, align: 'center',
  });
  label(s, 'Atmospheric Water\nGenerator', 0.35, 3.26, 3.8, 0.65,
    { fontSize: 15, color: C.teal, align: 'center' });
  label(s, 'by Aridon / Iron Grid Electric & Water', 0.35, 4.0, 3.8, 0.35,
    { fontSize: 10, color: C.muted, align: 'center' });

  label(s, 'THE AWG-1000', 4.45, 0.28, 5.2, 0.45, {
    fontSize: 30, bold: true, color: C.white,
  });
  label(s, 'Extracts pure drinking water directly from the atmosphere using advanced\ncooling condensation — deployable anywhere humidity exists.', 4.45, 0.82, 5.2, 0.65, {
    fontSize: 13, color: C.muted,
  });

  const specs = [
    { label: 'Technology',   val: 'Cooling condensation (78% AWG market — most proven method)' },
    { label: 'Water Source', val: 'Atmospheric humidity — zero dependency on ground or surface water' },
    { label: 'Intelligence', val: 'Full IoT sensor suite: production, quality, energy, filter life' },
    { label: 'Monitoring',   val: 'Real-time data via Aridon AI platform — predictive maintenance' },
    { label: 'Verification', val: 'Third-party certified output — token-eligible from Day 1' },
    { label: 'Deployment',   val: 'Remote sites, Tribal lands, data centers, municipalities, military' },
  ];
  specs.forEach((sp, i) => {
    const y = 1.6 + i * 0.58;
    s.addShape('roundRect', {
      x: 4.45, y, w: 5.2, h: 0.48,
      fill: { color: i % 2 === 0 ? C.card : C.deep },
      line: { color: C.dark, width: 0 },
      rectRadius: 0.06,
    });
    label(s, sp.label, 4.6, y + 0.08, 1.35, 0.32, { fontSize: 11, bold: true, color: C.blue });
    label(s, sp.val, 6.0, y + 0.08, 3.52, 0.32, { fontSize: 11, color: C.light });
  });
});

// ═══════════════════════════════════════════════════════════════════
//  SLIDE 5 — How It Works
// ═══════════════════════════════════════════════════════════════════
addSlide(s => {
  label(s, 'HOW THE AWG-1000 WORKS', 0.5, 0.28, 9, 0.45, {
    fontSize: 30, bold: true, color: C.white,
  });
  label(s, 'A self-contained, intelligent water production system — from air to verified asset.', 0.5, 0.82, 9, 0.35,
    { fontSize: 14, color: C.muted });

  const steps = [
    { n: '1', t: 'Pull',    d: 'Draws humid air\nthrough intake filters', color: C.blue   },
    { n: '2', t: 'Cool',    d: 'Condenser chills air\nbelow dew point',    color: C.teal   },
    { n: '3', t: 'Collect', d: 'Water droplets\ncollected in reservoir', color: C.blue   },
    { n: '4', t: 'Purify',  d: 'Multi-stage filtration\nto drinking grade', color: C.teal   },
    { n: '5', t: 'Meter',   d: 'IoT sensors log\nevery gallon produced', color: C.orange },
    { n: '6', t: 'Certify', d: 'Aridon AI platform\ncertifies all output', color: C.orange },
  ];

  steps.forEach((st, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.38 + col * 3.12;
    const y = 1.32 + row * 1.95;

    s.addShape('roundRect', {
      x, y, w: 2.88, h: 1.72,
      fill: { color: C.card },
      line: { color: st.color, width: 2 },
      rectRadius: 0.1,
    });
    iconCircle(s, x + 0.15, y + 0.15, 0.65, st.color, st.n, 18);
    label(s, st.t, x + 0.9, y + 0.18, 1.85, 0.4, {
      fontSize: 18, bold: true, color: C.white,
    });
    label(s, st.d, x + 0.15, y + 0.86, 2.58, 0.72, {
      fontSize: 12.5, color: C.muted,
    });

    if (col < 2) {
      label(s, '>', x + 2.88, y + 0.65, 0.24, 0.42, {
        fontSize: 16, bold: true, color: C.blue, align: 'center',
      });
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
//  SLIDE 6 — Three Businesses
// ═══════════════════════════════════════════════════════════════════
addSlide(s => {
  label(s, 'ARIDON IS THREE BUSINESSES', 0.5, 0.28, 9, 0.45, {
    fontSize: 30, bold: true, color: C.white,
  });
  label(s, 'Each reinforces the next — Infrastructure creates Intelligence; Intelligence unlocks Digital Assets.', 0.5, 0.82, 9, 0.35,
    { fontSize: 14, color: C.muted });

  const biz = [
    {
      n: '1', color: C.teal,
      title: 'Infrastructure',
      sub: 'The Foundation',
      pts: [
        'AWG-1000 units — designed, deployed, owned, operated',
        'Microgrids and energy systems',
        'Water treatment and distribution',
        'O&M contracts — reliable recurring revenue',
        'Physical assets that compound in value',
      ],
    },
    {
      n: '2', color: C.blue,
      title: 'Intelligence',
      sub: "Heather's World",
      pts: [
        'Every AWG is a live intelligent data node',
        'Production, quality, energy, filter life, maintenance',
        'Carbon footprint per gallon calculated automatically',
        'Water offset calculations in real time',
        'Trusted operational data = verification foundation',
      ],
    },
    {
      n: '3', color: C.orange,
      title: 'Digital Assets',
      sub: 'The Token System',
      pts: [
        'Verified digital certificates backed by real data',
        'Three revenue events per gallon produced',
        'Mint > Trade > Retire cycle',
        'ESG-grade proof for enterprise buyers',
        'Legal, auditable, on-chain and institutional-grade',
      ],
    },
  ];

  biz.forEach((b, i) => {
    const x = 0.35 + i * 3.12;
    s.addShape('roundRect', {
      x, y: 1.32, w: 2.9, h: 4.0,
      fill: { color: C.card },
      line: { color: b.color, width: 2 },
      rectRadius: 0.12,
    });
    iconCircle(s, x + 1.1, 1.45, 0.7, b.color, b.n, 22);
    label(s, b.title, x, 2.3, 2.9, 0.44, {
      fontSize: 18, bold: true, color: C.white, align: 'center',
    });
    label(s, b.sub, x, 2.76, 2.9, 0.3, {
      fontSize: 11, color: b.color, align: 'center',
    });
    b.pts.forEach((pt, j) => {
      label(s, '• ' + pt, x + 0.12, 3.15 + j * 0.4, 2.65, 0.35, {
        fontSize: 10.5, color: C.muted,
      });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
//  SLIDE 7 — The AI Executive Team
// ═══════════════════════════════════════════════════════════════════
addSlide(s => {
  label(s, 'AI-POWERED EXECUTIVE TEAM', 0.5, 0.28, 9, 0.45, {
    fontSize: 30, bold: true, color: C.white,
  });
  label(s, 'Always on. Always current. Understands every unit in the fleet, every lead in the pipeline.', 0.5, 0.82, 9, 0.35,
    { fontSize: 14, color: C.muted });

  const execs = [
    {
      letter: 'H', color: C.teal,
      name: 'HEATHER',
      title: 'Chief Business Officer',
      owns: ['CRM & Lead Management', 'Project Coordination', 'Team Operations', 'Customer Communications', 'Business Intelligence'],
    },
    {
      letter: 'A', color: C.blue,
      name: 'AQUA',
      title: 'Chief Water Intelligence Officer',
      owns: ['Production Analytics', 'Hydrology & Basin Impact', 'Water Credit Calculations', 'Token Verification Workflows', 'ESG Reporting'],
    },
    {
      letter: 'T', color: C.orange,
      name: 'THERON',
      title: 'Chief Infrastructure Officer',
      owns: ['AWG-1000 Deployment', 'Hardware Performance', 'O&M Scheduling', 'Site Engineering', 'Fleet Optimization'],
    },
    {
      letter: 'M', color: C.gold,
      name: 'MARCUS',
      title: 'Chief Strategy Officer',
      owns: ['Investor Relations', 'Partnership Development', 'Market Expansion', 'SWSA Engagement', 'Capital Markets'],
    },
  ];

  execs.forEach((ex, i) => {
    const x = 0.35 + i * 2.35;
    s.addShape('roundRect', {
      x, y: 1.32, w: 2.18, h: 3.98,
      fill: { color: C.card },
      line: { color: ex.color, width: 2 },
      rectRadius: 0.1,
    });
    iconCircle(s, x + 0.59, 1.46, 1.0, ex.color, ex.letter, 32);
    label(s, ex.name, x, 2.62, 2.18, 0.38, {
      fontSize: 15, bold: true, color: C.white, align: 'center',
    });
    label(s, ex.title, x + 0.1, 3.02, 1.98, 0.46, {
      fontSize: 10, color: ex.color, align: 'center',
    });
    ex.owns.forEach((o, j) => {
      label(s, '• ' + o, x + 0.12, 3.58 + j * 0.32, 1.94, 0.28, {
        fontSize: 9.5, color: C.muted,
      });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
//  SLIDE 8 — Water Tokenization
// ═══════════════════════════════════════════════════════════════════
addSlide(s => {
  label(s, 'WATER TOKENIZATION', 0.5, 0.28, 9, 0.45, {
    fontSize: 30, bold: true, color: C.white,
  });

  s.addShape('roundRect', {
    x: 0.38, y: 0.88, w: 9.24, h: 1.0,
    fill: { color: C.deep },
    line: { color: C.orange, width: 2 },
    rectRadius: 0.1,
  });
  label(s, 'Aridon does NOT tokenize water. Aridon tokenizes VERIFIED NEW WATER PRODUCTION.', 0.58, 0.94, 9.0, 0.78, {
    fontSize: 16, bold: true, color: C.orange, valign: 'middle',
  });

  const left = [
    'No water rights required — AWG water is new, additional supply.',
    'Value comes from measuring newly produced water, not transferring ownership.',
    'Legally cleaner and politically simpler than water rights tokenization.',
    'Genuinely additive to basin supply — every gallon the AWG-1000 produces.',
  ];
  label(s, 'What This Means', 0.38, 2.08, 4.5, 0.4, { fontSize: 16, bold: true, color: C.teal });
  left.forEach((pt, i) => {
    s.addShape('roundRect', {
      x: 0.38, y: 2.58 + i * 0.7, w: 4.5, h: 0.58,
      fill: { color: C.card }, line: { color: C.deep, width: 0 }, rectRadius: 0.06,
    });
    label(s, '> ' + pt, 0.52, 2.65 + i * 0.7, 4.3, 0.46, {
      fontSize: 12, color: C.light,
    });
  });

  label(s, 'What Buyers Hear', 5.12, 2.08, 4.5, 0.4, {
    fontSize: 16, bold: true, color: C.blue,
  });
  const buyers = [
    { buyer: 'Data Centers',  hear: '"We funded 500 AF of verified new water in New Mexico."' },
    { buyer: 'Utilities',     hear: '"We offset our deficit with certified additional supply."' },
    { buyer: 'ESG Investors', hear: '"Our capital produced measurable, auditable new water."' },
    { buyer: 'Regulators',    hear: '"Production was verified. Nothing was double-counted."' },
  ];
  buyers.forEach((b, i) => {
    const y = 2.58 + i * 0.7;
    s.addShape('roundRect', {
      x: 5.12, y, w: 4.5, h: 0.58,
      fill: { color: C.card }, line: { color: C.deep, width: 0 }, rectRadius: 0.06,
    });
    label(s, b.buyer + ':', 5.26, y + 0.06, 1.15, 0.24, { fontSize: 10, bold: true, color: C.blue });
    label(s, b.hear, 5.26, y + 0.3, 4.24, 0.24, { fontSize: 10, color: C.muted });
  });
});

// ═══════════════════════════════════════════════════════════════════
//  SLIDE 9 — The Six-Step Token Cycle
// ═══════════════════════════════════════════════════════════════════
addSlide(s => {
  label(s, 'FROM ATMOSPHERE TO VERIFIED ASSET', 0.5, 0.28, 9, 0.45, {
    fontSize: 28, bold: true, color: C.white,
  });
  label(s, 'Six steps. Three revenue events. Zero water rights required.', 0.5, 0.82, 9, 0.32,
    { fontSize: 14, color: C.muted });

  const steps = [
    { n: '1', t: 'PRODUCE',  d: 'AWG-1000 extracts water from\nthe atmosphere. Every gallon\nis new, additional supply.',     color: C.blue   },
    { n: '2', t: 'METER',    d: 'IoT sensors log output\ncontinuously. Tamper-evident\ndata stream.',                        color: C.teal   },
    { n: '3', t: 'VERIFY',   d: 'Third-party oracle certifies\nproduction data from\nAridon\'s SaaS platform.',             color: C.blue   },
    { n: '4', t: 'MINT',     d: '1 verified acre-foot = 1 token\nissued via smart contract.\nInstant and on-chain.',         color: C.teal   },
    { n: '5', t: 'TRADE',    d: 'Tokens sold on Aridon\nmarketplace or RWA exchanges\nat $400+ per acre-foot.',             color: C.orange },
    { n: '6', t: 'RETIRE',   d: 'Buyer burns token, receives\nNFT proof of offset.\nAridon earns retirement fee.',           color: C.orange },
  ];

  steps.forEach((st, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.35 + col * 3.12;
    const y = 1.25 + row * 2.08;

    s.addShape('roundRect', {
      x, y, w: 2.9, h: 1.82,
      fill: { color: C.card },
      line: { color: st.color, width: 2 },
      rectRadius: 0.1,
    });
    iconCircle(s, x + 0.12, y + 0.12, 0.6, st.color, st.n, 17);
    label(s, st.t, x + 0.82, y + 0.15, 1.98, 0.38, {
      fontSize: 14, bold: true, color: C.white, charSpacing: 1,
    });
    label(s, st.d, x + 0.12, y + 0.68, 2.68, 1.0, {
      fontSize: 11, color: C.muted,
    });

    if (col < 2) {
      label(s, '>', x + 2.9, y + 0.65, 0.22, 0.52, {
        fontSize: 14, bold: true, color: C.blue, align: 'center',
      });
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
//  SLIDE 10 — The Verification Engine
// ═══════════════════════════════════════════════════════════════════
addSlide(s => {
  label(s, 'THE REAL MOAT: THE VERIFICATION ENGINE', 0.5, 0.28, 9, 0.45, {
    fontSize: 26, bold: true, color: C.white,
  });

  s.addShape('roundRect', {
    x: 0.38, y: 0.85, w: 9.24, h: 0.72,
    fill: { color: C.deep },
    line: { color: C.orange, width: 1.5 },
    rectRadius: 0.08,
  });
  label(s, 'Anyone can deploy a smart contract. No competitor can replicate Aridon\'s hardware + data + institutional endorsement.', 0.55, 0.92, 9.0, 0.55, {
    fontSize: 13, color: C.orange, bold: true, valign: 'middle',
  });

  const qs = [
    { q: 'WHERE was it produced?',      a: 'GPS-registered site — every AWG has a fixed, auditable location identity.' },
    { q: 'WHEN was it produced?',       a: 'IoT timestamp — continuous, tamper-evident data stream logged to Aridon platform.' },
    { q: 'HOW MUCH was produced?',      a: 'Metered volume certified by third-party oracle — never self-reported by Aridon.' },
    { q: 'WHO verified it?',            a: 'Named auditor + SWSA 7-state coalition endorsement — the rating agency for Aridon credits.' },
    { q: 'Has it already been claimed?',a: 'On-chain registry — single-use retirement protocol. Double-counting is technically impossible.' },
  ];
  qs.forEach((q, i) => {
    const y = 1.72 + i * 0.72;
    s.addShape('roundRect', {
      x: 0.38, y, w: 9.24, h: 0.6,
      fill: { color: C.card },
      line: { color: C.deep, width: 0 },
      rectRadius: 0.06,
    });
    label(s, q.q, 0.55, y + 0.1, 2.78, 0.4, { fontSize: 12, bold: true, color: C.teal });
    label(s, q.a, 3.38, y + 0.1, 6.12, 0.4, { fontSize: 12, color: C.light });
  });

  s.addShape('roundRect', {
    x: 0.38, y: 5.35, w: 9.24, h: 0.2,
    fill: { color: C.deep },
    line: { color: C.teal, width: 1 },
    rectRadius: 0.05,
  });
  label(s, 'Aridon owns the trust layer. That is what buyers are actually paying for.', 0.55, 5.35, 9.0, 0.22, {
    fontSize: 11, color: C.teal, bold: true,
  });
});

// ═══════════════════════════════════════════════════════════════════
//  SLIDE 11 — Revenue Model
// ═══════════════════════════════════════════════════════════════════
addSlide(s => {
  label(s, 'THREE REVENUE EVENTS PER GALLON', 0.5, 0.28, 9, 0.45, {
    fontSize: 28, bold: true, color: C.white,
  });
  label(s, 'Most water companies earn once. Aridon earns three times on every gallon it produces.', 0.5, 0.82, 9, 0.35,
    { fontSize: 14, color: C.muted });

  const events = [
    {
      n: '1', label: 'AT MINT', title: 'Token Sale',
      desc: 'Sell verified water production tokens at $400+/acre-foot. Primary revenue. Scales directly with every AWG-1000 unit deployed — more units, more production, more tokens.',
      detail: '$400+ / AF', color: C.blue,
    },
    {
      n: '2', label: 'AT TRADE', title: 'Marketplace Fee',
      desc: 'Collect 1-3% on every secondary trade as tokens circulate on the Aridon marketplace or integrated RWA exchanges. Passive, recurring revenue at no production cost.',
      detail: '1-3% per trade', color: C.teal,
    },
    {
      n: '3', label: 'AT RETIRE', title: 'Certificate Fee',
      desc: 'When a buyer retires their token to claim an ESG offset, they receive an NFT certificate. Aridon charges a retirement fee — third revenue event, zero additional production required.',
      detail: 'Per certificate', color: C.orange,
    },
  ];

  events.forEach((ev, i) => {
    const x = 0.35 + i * 3.12;
    s.addShape('roundRect', {
      x, y: 1.28, w: 2.9, h: 4.05,
      fill: { color: C.card },
      line: { color: ev.color, width: 2 },
      rectRadius: 0.12,
    });
    iconCircle(s, x + 1.1, 1.4, 0.7, ev.color, ev.n, 22);
    label(s, ev.label, x, 2.26, 2.9, 0.3, {
      fontSize: 10, bold: true, color: ev.color, align: 'center', charSpacing: 2,
    });
    label(s, ev.title, x, 2.6, 2.9, 0.44, {
      fontSize: 18, bold: true, color: C.white, align: 'center',
    });
    s.addShape('roundRect', {
      x: x + 0.45, y: 3.1, w: 2.0, h: 0.4,
      fill: { color: ev.color }, line: { width: 0 }, rectRadius: 0.06,
    });
    label(s, ev.detail, x + 0.45, 3.1, 2.0, 0.4, {
      fontSize: 13, bold: true, color: C.white, align: 'center', valign: 'middle', margin: 0,
    });
    label(s, ev.desc, x + 0.12, 3.62, 2.65, 1.6, {
      fontSize: 11, color: C.muted,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
//  SLIDE 12 — Market Opportunity
// ═══════════════════════════════════════════════════════════════════
addSlide(s => {
  label(s, 'MARKET OPPORTUNITY', 0.5, 0.28, 9, 0.45, {
    fontSize: 30, bold: true, color: C.white,
  });

  s.addShape('roundRect', {
    x: 0.38, y: 0.88, w: 9.24, h: 1.72,
    fill: { color: C.deep },
    line: { color: C.blue, width: 1.5 },
    rectRadius: 0.1,
  });
  label(s, '$800,000,000', 0.38, 0.92, 9.24, 1.28, {
    fontSize: 72, bold: true, color: C.blue, align: 'center', valign: 'middle',
  });
  label(s, 'Projected annual tokenized water value by 2032', 0.38, 2.2, 9.24, 0.3, {
    fontSize: 14, color: C.muted, align: 'center',
  });

  const formula = [
    { v: '2,000,000', u: 'acre-feet / year', c: C.white },
    { v: 'x $400',    u: 'per acre-foot',    c: C.white },
    { v: '= $800M',   u: 'per year',         c: C.blue  },
  ];
  formula.forEach((f, i) => {
    const x = 0.38 + i * 3.12;
    s.addShape('roundRect', {
      x, y: 2.65, w: 2.9, h: 1.22,
      fill: { color: C.card }, line: { color: C.deep, width: 0 }, rectRadius: 0.08,
    });
    label(s, f.v, x, 2.72, 2.9, 0.66, { fontSize: 24, bold: true, color: f.c, align: 'center' });
    label(s, f.u, x, 3.36, 2.9, 0.36, { fontSize: 12, color: C.muted, align: 'center' });
  });

  const markets = [
    { label: 'CA surface water spot price',    val: '$375 - $637 / AF' },
    { label: 'Agricultural / municipal offset', val: '$150 - $660 / AF' },
    { label: 'Voluntary offset midpoint',       val: '~$400 / AF (conservative baseline)' },
    { label: 'CME water futures (NQH2O)',        val: '$300 - $650 / AF (validates the market)' },
  ];
  markets.forEach((m, i) => {
    const y = 4.05 + i * 0.33;
    label(s, m.label, 0.38, y, 5.5, 0.28, { fontSize: 11, color: C.muted });
    label(s, m.val, 5.9, y, 3.72, 0.28, { fontSize: 11, bold: true, color: C.white, align: 'right' });
  });
  label(s, 'Source: WestWater Research CA Water Market Reports 2024-2025; CME Group NQH2O', 0.38, 5.42, 9.24, 0.2, {
    fontSize: 9, color: C.muted, italic: true,
  });
});

// ═══════════════════════════════════════════════════════════════════
//  SLIDE 13 — Target Buyers
// ═══════════════════════════════════════════════════════════════════
addSlide(s => {
  label(s, 'WHO IS BUYING', 0.5, 0.28, 9, 0.45, {
    fontSize: 30, bold: true, color: C.white,
  });
  label(s, 'Four buyer categories, each with a specific, measurable need Aridon water tokens satisfy.', 0.5, 0.82, 9, 0.35,
    { fontSize: 14, color: C.muted });

  const buyers = [
    {
      color: C.blue, label: 'AI DATA CENTERS',
      urgency: 'MOST URGENT',
      why: 'Consume millions of gallons per day. ESG pressure from boards, regulators, and customers. Need verified, location-specific water offsets they can disclose in annual reports.',
      example: 'A single hyperscale AI facility uses 1-5 million gallons of water per day for cooling.',
    },
    {
      color: C.teal, label: 'MUNICIPAL UTILITIES',
      urgency: 'HIGH DEMAND',
      why: 'Southwest cities face mandatory shortage declarations. Need certified supplemental supply to demonstrate compliance to state water authorities and avoid penalties.',
      example: 'Cities in NM, AZ, CO required to reduce consumption 15-30% under Colorado River Compact.',
    },
    {
      color: C.orange, label: 'ESG FUNDS & CORPORATES',
      urgency: 'GROWING FAST',
      why: 'SEC climate disclosure rules require verified environmental offsets. Water is the emerging asset class after carbon. First-movers get premium ESG positioning.',
      example: 'Fortune 500 companies with net-zero pledges need verifiable water offset instruments.',
    },
    {
      color: C.gold, label: 'GOVERNMENT & TRIBAL',
      urgency: 'STRATEGIC',
      why: 'Federal infrastructure funding for water security. Tribal nations seeking sovereignty over water. DOD facilities in water-stressed regions need reliable supply.',
      example: 'Navajo Nation — 400,000 people, 30%+ without running water — is Aridon\'s first deployment partner.',
    },
  ];

  buyers.forEach((b, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.35 + col * 4.78;
    const y = 1.25 + row * 2.12;

    s.addShape('roundRect', {
      x, y, w: 4.55, h: 1.92,
      fill: { color: C.card },
      line: { color: b.color, width: 1.5 },
      rectRadius: 0.1,
    });
    s.addShape('roundRect', {
      x: x + 0.12, y: y + 0.12, w: 1.5, h: 0.3,
      fill: { color: b.color }, line: { width: 0 }, rectRadius: 0.04,
    });
    label(s, b.label, x + 0.12, y + 0.12, 1.5, 0.3, {
      fontSize: 8.5, bold: true, color: C.white, align: 'center', valign: 'middle', margin: 0,
    });
    s.addShape('roundRect', {
      x: x + 3.35, y: y + 0.12, w: 1.06, h: 0.3,
      fill: { color: C.deep }, line: { color: b.color, width: 1 }, rectRadius: 0.04,
    });
    label(s, b.urgency, x + 3.35, y + 0.12, 1.06, 0.3, {
      fontSize: 8, bold: true, color: b.color, align: 'center', valign: 'middle', margin: 0,
    });
    label(s, b.why, x + 0.12, y + 0.54, 4.3, 0.78, { fontSize: 11, color: C.light });
    label(s, b.example, x + 0.12, y + 1.6, 4.3, 0.26, { fontSize: 10, color: C.muted, italic: true });
  });
});

// ═══════════════════════════════════════════════════════════════════
//  SLIDE 14 — Strategic Partnerships
// ═══════════════════════════════════════════════════════════════════
addSlide(s => {
  label(s, 'STRATEGIC PARTNERSHIPS', 0.5, 0.28, 9, 0.45, {
    fontSize: 30, bold: true, color: C.white,
  });
  label(s, 'Two institutional relationships no competitor can replicate — one moral, one political.', 0.5, 0.82, 9, 0.35,
    { fontSize: 14, color: C.muted });

  s.addShape('roundRect', {
    x: 0.35, y: 1.25, w: 4.5, h: 4.1,
    fill: { color: C.card },
    line: { color: C.teal, width: 2 },
    rectRadius: 0.12,
  });
  iconCircle(s, 1.35, 1.38, 1.1, C.teal, 'N', 36);
  label(s, 'NAVAJO NATION', 0.35, 2.65, 4.5, 0.44, {
    fontSize: 18, bold: true, color: C.white, align: 'center',
  });
  label(s, 'First Deployment Partner', 0.35, 3.12, 4.5, 0.3,
    { fontSize: 12, color: C.teal, align: 'center' });

  const navpts = [
    '400,000 people — 30%+ lack running water',
    'Tribal sovereignty = accelerated deployment authority',
    'Moral narrative no startup or VC can replicate',
    'Spans NM, AZ, UT, CO — heart of SWSA territory',
    'AWG fleet on Navajo land = proof of mission and market',
  ];
  navpts.forEach((pt, i) => {
    label(s, '• ' + pt, 0.52, 3.55 + i * 0.35, 4.15, 0.3, { fontSize: 11, color: C.light });
  });

  s.addShape('roundRect', {
    x: 5.15, y: 1.25, w: 4.5, h: 4.1,
    fill: { color: C.card },
    line: { color: C.blue, width: 2 },
    rectRadius: 0.12,
  });
  iconCircle(s, 6.15, 1.38, 1.1, C.blue, 'S', 36);
  label(s, 'SWSA', 5.15, 2.65, 4.5, 0.44, {
    fontSize: 18, bold: true, color: C.white, align: 'center',
  });
  label(s, 'Southwest Water Security Alliance\nVerification & Governance Partner', 5.15, 3.12, 4.5, 0.46,
    { fontSize: 12, color: C.blue, align: 'center' });

  const swsapts = [
    '7-state coalition: NM, AZ, CO, TX, UT, NV, CA',
    'Acts as "rating agency" for Aridon water credits',
    'Endorsement turns tokens from speculative to bankable',
    'Political cover across every Southwest jurisdiction',
    'Makes Aridon tokens acceptable to regulated buyers',
  ];
  swsapts.forEach((pt, i) => {
    label(s, '• ' + pt, 5.32, 3.68 + i * 0.35, 4.15, 0.3, { fontSize: 11, color: C.light });
  });
});

// ═══════════════════════════════════════════════════════════════════
//  SLIDE 15 — Why Aridon Wins
// ═══════════════════════════════════════════════════════════════════
addSlide(s => {
  label(s, 'WHY ARIDON WINS', 0.5, 0.28, 9, 0.45, {
    fontSize: 30, bold: true, color: C.white,
  });
  label(s, 'Six advantages that compound — each one harder to replicate than the last.', 0.5, 0.82, 9, 0.35,
    { fontSize: 14, color: C.muted });

  const pts = [
    { n: '01', t: 'New Water, Not Repackaged Rights', d: 'Every AWG-1000 gallon is genuinely additive to basin supply. No water rights battles. Legally clean in every state and tribal jurisdiction.',               color: C.blue   },
    { n: '02', t: 'Verification Built In, Not Bolted On', d: 'The same IoT data that runs O&M feeds the token mint. Competitors must retrofit verification onto dumb infrastructure. Aridon\'s is native.',          color: C.teal   },
    { n: '03', t: 'Tribal Sovereignty Narrative', d: 'Navajo Nation as first deployment partner gives moral authority no VC-backed startup can replicate. "Water sovereignty, tokenized" markets itself.',             color: C.orange },
    { n: '04', t: 'SWSA Institutional Credibility', d: 'A 7-state water coalition as verification partner is the rating agency stamp that turns Aridon tokens from speculative to bankable for regulated buyers.',    color: C.blue   },
    { n: '05', t: 'The Knowledge Loop', d: 'Every deployed unit teaches the platform. Forecasts improve, maintenance drops, site selection sharpens. The competitive moat widens with every AWG deployed.',          color: C.teal   },
    { n: '06', t: 'Manufactured in the Market', d: 'New Mexico plant: built in the same region where water is scarce, the Navajo Nation operates, and SWSA governs. Supply chain and brand narrative in one location.', color: C.orange },
  ];

  pts.forEach((pt, i) => {
    const y = 1.28 + i * 0.69;
    s.addShape('roundRect', {
      x: 0.38, y, w: 9.24, h: 0.58,
      fill: { color: C.card },
      line: { color: C.deep, width: 0 },
      rectRadius: 0.06,
    });
    s.addShape('roundRect', {
      x: 0.38, y, w: 0.78, h: 0.58,
      fill: { color: pt.color }, line: { width: 0 }, rectRadius: 0.06,
    });
    label(s, pt.n, 0.38, y, 0.78, 0.58, {
      fontSize: 13, bold: true, color: C.white, align: 'center', valign: 'middle', margin: 0,
    });
    label(s, pt.t, 1.25, y + 0.08, 2.88, 0.36, { fontSize: 12, bold: true, color: C.white });
    label(s, pt.d, 4.18, y + 0.08, 5.32, 0.4, { fontSize: 11, color: C.muted });
  });
});

// ═══════════════════════════════════════════════════════════════════
//  SLIDE 16 — Manufacturing: New Mexico
// ═══════════════════════════════════════════════════════════════════
addSlide(s => {
  label(s, 'MANUFACTURING: NEW MEXICO', 0.5, 0.28, 9, 0.45, {
    fontSize: 30, bold: true, color: C.white,
  });
  label(s, 'Phase 1 manufacturing in the heart of the Southwest water crisis — the exact market Aridon serves.', 0.5, 0.82, 9, 0.35,
    { fontSize: 14, color: C.muted });

  s.addShape('roundRect', {
    x: 0.35, y: 1.25, w: 4.7, h: 4.1,
    fill: { color: C.card },
    line: { color: C.teal, width: 1.5 },
    rectRadius: 0.1,
  });
  label(s, 'Why New Mexico', 0.5, 1.38, 4.4, 0.4, { fontSize: 16, bold: true, color: C.teal });

  const nmpts = [
    { h: 'JTIP',          d: '50-90% wage reimbursement for new jobs (6 months) — most generous in the region.' },
    { h: 'Mfg Tax Credit', d: '5-10% ITC on equipment + High-Wage Jobs Credit: 8.5% of wages for 4 years.' },
    { h: 'Stackable',     d: 'JTIP + ITC + High-Wage Jobs all combinable on the same project.' },
    { h: 'GRT Deduction', d: 'Gross receipts tax deduction on all manufacturing equipment.' },
    { h: 'Clean Energy',  d: 'NM Energy Conservation & Management runs a dedicated clean mfg program.' },
    { h: 'Proximity',     d: 'Albuquerque I-25: 90 min to Navajo Nation. Sandia Labs engineering pipeline.' },
  ];
  nmpts.forEach((pt, i) => {
    const y = 1.9 + i * 0.57;
    label(s, pt.h + ':', 0.52, y, 1.12, 0.28, { fontSize: 10.5, bold: true, color: C.blue });
    label(s, pt.d, 1.68, y, 3.25, 0.36, { fontSize: 10.5, color: C.muted });
  });

  s.addShape('roundRect', {
    x: 5.25, y: 1.25, w: 4.38, h: 4.1,
    fill: { color: C.deep },
    line: { color: C.blue, width: 1.5 },
    rectRadius: 0.1,
  });
  label(s, 'Manufacturing Roadmap', 5.4, 1.38, 4.08, 0.4, { fontSize: 15, bold: true, color: C.blue });

  const phases = [
    { p: 'Phase 1', loc: 'New Mexico', t: 'Albuquerque / I-25 Corridor', d: 'AWG-1000 assembly, QA, deployment prep. 90 min to Navajo Nation first fleet.' },
    { p: 'Phase 2', loc: 'Arizona',    t: 'Phoenix Metro Scale-Up',       d: 'Expand as demand grows. Future48 workforce. Electronics supply chain.' },
    { p: 'Phase 3', loc: 'Multi-Site', t: 'Regional Hubs',                d: 'Local production near each major deployment cluster. Faster service cycles.' },
  ];
  phases.forEach((ph, i) => {
    const y = 1.95 + i * 1.18;
    s.addShape('roundRect', {
      x: 5.38, y, w: 4.08, h: 1.05,
      fill: { color: C.card }, line: { color: C.dark, width: 0 }, rectRadius: 0.06,
    });
    s.addShape('roundRect', {
      x: 5.38, y, w: 0.88, h: 1.05,
      fill: { color: i === 0 ? C.teal : i === 1 ? C.blue : C.muted }, line: { width: 0 }, rectRadius: 0.06,
    });
    label(s, ph.p, 5.38, y, 0.88, 1.05, {
      fontSize: 10, bold: true, color: C.white, align: 'center', valign: 'middle', margin: 0,
    });
    label(s, ph.loc, 6.32, y + 0.06, 3.0, 0.3, { fontSize: 12, bold: true, color: C.white });
    label(s, ph.t, 6.32, y + 0.36, 3.0, 0.22, { fontSize: 10, color: C.teal });
    label(s, ph.d, 6.32, y + 0.6, 3.0, 0.36, { fontSize: 10, color: C.muted });
  });
});

// ═══════════════════════════════════════════════════════════════════
//  SLIDE 17 — Water Asset Exchange
// ═══════════════════════════════════════════════════════════════════
addSlide(s => {
  label(s, 'WATER ASSET EXCHANGE', 0.5, 0.28, 9, 0.45, {
    fontSize: 30, bold: true, color: C.white,
  });
  label(s, 'The platform module that ties Infrastructure, Intelligence, and Digital Assets into one unified ecosystem.', 0.5, 0.82, 9, 0.35,
    { fontSize: 14, color: C.muted });

  const sections = [
    {
      n: '1', color: C.blue,
      name: 'Operations',
      sub: 'Live AWG Fleet Command',
      pts: ['Real-time production by unit', 'Maintenance + filter life status', 'Energy consumption per gallon', 'Fleet performance benchmarks'],
    },
    {
      n: '2', color: C.teal,
      name: 'Verification',
      sub: 'The Trust Layer',
      pts: ['Oracle data feeds and audits', 'Digital asset registry', 'Certification status per unit', 'Third-party endorsement records'],
    },
    {
      n: '3', color: C.orange,
      name: 'Marketplace',
      sub: 'Buy, Sell, and Retire',
      pts: ['Primary token listings', 'Secondary market trading', 'Retirement workflows', 'Buyer dashboard and history'],
    },
    {
      n: '4', color: C.gold,
      name: 'Impact',
      sub: 'ESG and Reporting',
      pts: ['NFT offset certificates', 'Basin-level analytics', 'Carbon footprint per gallon', 'Compliance filing exports'],
    },
  ];

  sections.forEach((sec, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.35 + col * 4.78;
    const y = 1.25 + row * 2.05;

    s.addShape('roundRect', {
      x, y, w: 4.55, h: 1.85,
      fill: { color: C.card },
      line: { color: sec.color, width: 2 },
      rectRadius: 0.1,
    });
    iconCircle(s, x + 0.12, y + 0.15, 0.65, sec.color, sec.n, 18);
    label(s, sec.name, x + 0.88, y + 0.12, 2.2, 0.4, { fontSize: 18, bold: true, color: C.white });
    label(s, sec.sub, x + 0.88, y + 0.52, 3.5, 0.26, { fontSize: 11, color: sec.color });
    sec.pts.forEach((pt, j) => {
      const ptcol = j % 2;
      const ptrow = Math.floor(j / 2);
      label(s, '• ' + pt, x + 0.12 + ptcol * 2.28, y + 0.95 + ptrow * 0.38, 2.2, 0.32, {
        fontSize: 10.5, color: C.muted,
      });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
//  SLIDE 18 — Next Steps + Contact
// ═══════════════════════════════════════════════════════════════════
addSlide(s => {
  s.addShape('ellipse', {
    x: -1, y: -1.5, w: 7, h: 7,
    fill: { color: C.blue },
    line: { width: 0 },
    transparency: 88,
  });

  iconCircle(s, 0.5, 0.42, 0.72, C.teal, 'A', 22);
  label(s, 'IRON GRID ELECTRIC & WATER', 1.38, 0.5, 6, 0.4, {
    fontSize: 11, bold: true, color: C.teal, charSpacing: 4,
  });

  label(s, 'Next Steps', 0.5, 1.05, 9, 0.52, {
    fontSize: 34, bold: true, color: C.white,
  });

  const steps = [
    { n: '01', t: 'Legal Entity',          d: 'Wyoming DAO attorney — establish token issuance entity. WaterLAB framework is the direct precedent.' },
    { n: '02', t: 'Verification Protocol', d: 'Commission third-party AWG production standard. This oracle is the foundation of every token minted.' },
    { n: '03', t: 'Add AQUA',             d: 'Activate the Chief Water Intelligence Officer role within the Aridon executive platform.' },
    { n: '04', t: 'Water Asset Exchange',  d: 'Begin product design for Operations, Verification, Marketplace, and Impact modules.' },
    { n: '05', t: 'New Mexico Site',       d: 'Site selection along Albuquerque I-25 corridor for AWG-1000 manufacturing facility.' },
    { n: '06', t: 'First Token Buyers',    d: 'Approach 1-2 NM data center developers — voluntary offset commitment = proof of demand.' },
  ];

  steps.forEach((st, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.35 + col * 4.78;
    const y = 1.72 + row * 1.1;
    s.addShape('roundRect', {
      x, y, w: 4.55, h: 0.94,
      fill: { color: C.card },
      line: { color: C.deep, width: 0 },
      rectRadius: 0.08,
    });
    s.addShape('roundRect', {
      x, y, w: 0.72, h: 0.94,
      fill: { color: C.orange }, line: { width: 0 }, rectRadius: 0.08,
    });
    label(s, st.n, x, y, 0.72, 0.94, {
      fontSize: 16, bold: true, color: C.white, align: 'center', valign: 'middle', margin: 0,
    });
    label(s, st.t, x + 0.82, y + 0.08, 3.62, 0.34, { fontSize: 13, bold: true, color: C.white });
    label(s, st.d, x + 0.82, y + 0.48, 3.62, 0.38, { fontSize: 10.5, color: C.muted });
  });

  label(s, 'aridon-v02.vercel.app  |  Iron Grid Electric & Water  |  jimrusk66@yahoo.com', 0.35, 5.35, 9.3, 0.24, {
    fontSize: 10, color: C.muted, align: 'center',
  });
});

// ═══════════════════════════════════════════════════════════════════
//  WRITE FILE
// ═══════════════════════════════════════════════════════════════════
if (!fs.existsSync(path.dirname(OUT))) fs.mkdirSync(path.dirname(OUT), { recursive: true });
pres.writeFile({ fileName: OUT }).then(() => {
  console.log('\n  ================================================');
  console.log('  Aridon AWG-1000 Pitch Deck — COMPLETE');
  console.log('  Saved to: ' + OUT);
  console.log('  18 slides | Aridon brand theme');
  console.log('  ================================================\n');
}).catch(e => {
  console.error('Error:', e.message);
});
