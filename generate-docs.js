// ═══════════════════════════════════════════════════════════════════
//  Aridon Document Generator  (v2 — Expanded Business Model)
//  Creates:
//    • Aridon-Water-Tokenization-Strategy.docx  (Word report)
//    • Aridon-Water-Tokenization-Pitch.pptx      (PowerPoint deck)
//    • Saves strategy to Knowledge Vault (requires Supabase to be set up)
//  Run: node generate-docs.js
// ═══════════════════════════════════════════════════════════════════

const fs   = require('fs');
const path = require('path');

// Output to user's .codex folder
const home = process.env.USERPROFILE || process.env.HOME || __dirname;
const OUT  = path.join(home, '.codex');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// Brand colors (Aridon)
const C = {
  navy:   '0A0E1A',
  card:   '1D2740',
  blue:   '4A90D9',
  teal:   '26C6DA',
  orange: 'E87722',
  green:  '4CAF50',
  white:  'FFFFFF',
  muted:  '9BA8C6',
  light:  'CDD6F4',
  dark:   '162035',
};

const TODAY = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

// ═══════════════════════════════════════════════════════════════════
//  KNOWLEDGE VAULT — save strategy via API
// ═══════════════════════════════════════════════════════════════════
async function saveToVault() {
  const https = require('https');

  const VAULT_CONTENT = `ARIDON BUSINESS MODEL — FULL STRATEGIC FRAMEWORK
Updated: ${TODAY}

═══════════════════════════════════════
CRITICAL POSITIONING DISTINCTION
═══════════════════════════════════════
Do NOT position Aridon as "tokenizing water."
Position Aridon as "tokenizing verified new water production."

Existing water rights are legally and politically complex in many jurisdictions. Verified production from atmospheric water generation is a fundamentally different concept — the value comes from measuring newly produced water, not transferring ownership of an existing right. This framing is easier for utilities, governments, and enterprise customers to understand and accept.

═══════════════════════════════════════
THE THREE BUSINESSES
═══════════════════════════════════════

BUSINESS 1 — INFRASTRUCTURE (Foundation)
Aridon designs, deploys, owns, and operates:
• Atmospheric Water Generators (AWG-1000)
• Microgrids
• Energy systems
• Water treatment
• Monitoring and maintenance
Revenue model: Equipment, installation, ongoing O&M contracts.

BUSINESS 2 — INTELLIGENCE (Heather's World)
Every AWG becomes an intelligent asset. Heather knows:
• Production volume (real-time)
• Power consumption
• Filter status and lifecycle
• Maintenance schedules
• Weather correlation
• Water quality data
• Carbon footprint per gallon
• Water offsets
The platform generates trusted operational data — the foundation of everything that follows.

BUSINESS 3 — DIGITAL ASSETS (The Token System)
Instead of thinking "we're creating crypto," think:
"We're issuing verified digital certificates backed by measured infrastructure performance."
The token is the digital representation of verified production.
That framing is credible to utilities, governments, and enterprise buyers.

═══════════════════════════════════════
THE EXECUTIVE TEAM (FOUR ROLES)
═══════════════════════════════════════

HEATHER — Chief Business Officer
Manages: CRM, projects, team, business operations.

AQUA — Chief Water Intelligence Officer (NEW)
Manages:
• Water production analytics
• Hydrology and basin impact analysis
• Water credit calculations
• Token verification workflows
• ESG reporting
Heather manages the business. Aqua manages the water.

═══════════════════════════════════════
WATER ASSET DASHBOARD (Per-Unit View)
═══════════════════════════════════════
Every deployed AWG becomes a live digital asset with its own card:

  Unit 0147
  ─────────────────────────────────
  Location          | [GPS / Site Name]
  Gallons Today     | [Real-time]
  Gallons Lifetime  | [Cumulative]
  Water Quality     | [PPM / Grade]
  Humidity          | [%]
  Energy Used       | [kWh]
  Maintenance       | [Status]
  Verification      | [Certified / Pending]
  ─────────────────────────────────
  Token Eligible    | YES
  Tokens Issued     | 127
  Certificates Ret. | 96
  Revenue Generated | $38,400

This ties the physical system directly to its digital representation in one view.

═══════════════════════════════════════
THE REAL MOAT — THE VERIFICATION ENGINE
═══════════════════════════════════════
Most people think the blockchain is the valuable part.
The moat is actually the verification engine.

If Aridon can demonstrate:
• WHERE water was produced
• WHEN it was produced
• HOW MUCH was produced
• WHO verified it
• WHETHER it has already been claimed

...then Aridon owns the trust layer.
That is much harder to replicate than issuing a token.

═══════════════════════════════════════
THE KNOWLEDGE LOOP
═══════════════════════════════════════
Every deployment teaches the system. Aridon learns:
• Which environments produce the most water
• Which filters last longest
• Which maintenance schedules perform best
• Which installations exceed benchmarks

Aridon isn't just generating water.
It's building a proprietary operational dataset that improves future deployments.
This dataset is a competitive moat that compounds with every unit deployed.

═══════════════════════════════════════
THE PRODUCTION-TO-VALUE FEEDBACK LOOP
═══════════════════════════════════════
Deploy → Produce → Measure → Verify → Register → Mint → Trade → Retire → Analyze → Improve → Deploy Again

Notice the feedback loop: every project makes the next project smarter.
This is a stronger long-term platform strategy than a linear mint-and-sell model.

═══════════════════════════════════════
THE END PRODUCT IS CONFIDENCE
═══════════════════════════════════════
A data center, utility, or municipality doesn't really want a blockchain token.
They want CONFIDENCE that they funded verifiable new water production and can demonstrate that to customers, regulators, investors, or sustainability stakeholders.

If Aridon becomes the trusted system that provides that confidence, the tokens become one component of a much larger ecosystem.

═══════════════════════════════════════
THE SIX-STEP TOKENIZATION PROCESS
═══════════════════════════════════════
1. Produce: AWG units extract water from the atmosphere. Every gallon is new, additional supply.
2. Meter & Verify: IoT sensors on each unit log real-time output. A third-party auditor certifies the data.
3. Mint Tokens: For every verified acre-foot, a smart contract issues one token. Token = 1 verified acre-foot of Aridon-produced water.
4. Marketplace: Tokens trade on a decentralized exchange or Aridon marketplace. Buyers: data centers, ESG funds, utilities, corporations.
5. Retire / Burn: Token burned → buyer receives NFT proof. Smart contract auto-executes.
6. Revenue: Aridon earns at mint, at trade (marketplace fees), and at retire (certificate fees). Three revenue touches on the same water.

═══════════════════════════════════════
WATER ASSET EXCHANGE (Module to Build)
═══════════════════════════════════════
A new module within Aridon with four major sections:

1. OPERATIONS: Live AWG fleet, production, maintenance, performance.
2. VERIFICATION: Oracle data, audits, digital asset registry.
3. MARKETPLACE: Buy, sell, and retire verified water production units.
4. IMPACT: ESG reporting, certificates, basin-level analytics, historical performance.

This ties together physical infrastructure, the executive team, and digital assets into one coherent platform.

═══════════════════════════════════════
UNIT ECONOMICS
═══════════════════════════════════════
$400/AF × 2,000,000 acre-feet/year (2032 target) = $800,000,000/year in tokenized water value.
Three revenue events per gallon: mint + trade fees + retire certificates.

MARKET PRICING (2024-2025 voluntary market):
• California surface water spot: $375–637/AF
• Agricultural/municipal at-source: $150–660/AF
• Groundwater penalty: $500/AF
• Conservative midpoint: ~$400/AF

═══════════════════════════════════════
COMPETITIVE LANDSCAPE
═══════════════════════════════════════
• WaterLAB (fmr. WaterDAO): Additional freshwater generation. Wyoming DAO legal framework — this is the blueprint.
• Hypercube: WTR tokens for recycled/reclaimed water.
• Water Ledger: First U.S. patent (2024) for blockchain water asset management.
• BigWater Protocol: $BIGW tokens backed by 10 years of real water infrastructure.

═══════════════════════════════════════
WHY ARIDON IS UNIQUELY POSITIONED
═══════════════════════════════════════
1. AWG = New/Additional Water. No water rights needed. Every gallon is genuinely additive.
2. SaaS platform. IoT data already feeding O&M feeds the token mint — built in, not bolted on.
3. Tribal sovereignty. Navajo Nation as first partner = moral authority and political differentiation.
4. SWSA as verification body. 7-state coalition endorsement = institutional credibility.
5. Data centers are desperate buyers. AI facilities need verified, location-specific offsets.

═══════════════════════════════════════
LEGAL CONSIDERATIONS (CRITICAL)
═══════════════════════════════════════
Because this intersects with environmental claims, financial assets, blockchain, and potentially regulated markets, involve legal counsel from the beginning with expertise in:
• Securities law (token classification)
• Commodities law (water as a commodity)
• Water law (state and federal frameworks)
• Environmental markets (voluntary offset rules)

Building legal and governance considerations into Aridon's architecture early will make the platform more credible and reduce the risk of costly redesigns later.

═══════════════════════════════════════
RECOMMENDED NEXT STEPS
═══════════════════════════════════════
1. Engage Wyoming DAO attorney for legal entity (WaterLAB precedent).
2. Commission third-party verification protocol for AWG production data.
3. Initiate conversations with NM data center developers as first token buyers.
4. Present framework to SWSA as verification/governance partner.
5. Begin design of Water Asset Exchange module.
6. Add AQUA to Aridon executive team.
7. Build Water Asset Dashboard (per-unit live view).`;

  const entries = [
    {
      title:    'Aridon Business Model — Three Businesses, AQUA Executive, and Water Asset Exchange',
      content:  VAULT_CONTENT,
      category: 'strategy'
    },
    {
      title:    'Aridon Positioning: Tokenizing Verified New Water Production (Not Water Rights)',
      content:  `The key distinction: Do NOT position Aridon as "tokenizing water." Position it as "tokenizing verified new water production."\n\nExisting water rights are legally and politically complex. Verified production from atmospheric water generation is different — the value comes from measuring newly produced water, not transferring ownership of an existing right. This framing is easier for utilities, governments, and enterprise customers to understand.\n\nThe end product is CONFIDENCE — not a token. A data center doesn't want a blockchain token. They want confidence that they funded verifiable new water production and can demonstrate that to regulators, investors, and sustainability stakeholders. If Aridon becomes the trusted system that provides that confidence, the tokens are one component of a much larger ecosystem.\n\nThe real moat is the VERIFICATION ENGINE, not the blockchain. If Aridon can prove where water was produced, when, how much, who verified it, and whether it has already been claimed — Aridon owns the trust layer. That is much harder to replicate than creating a token.`,
      category: 'strategy'
    },
    {
      title:    'AQUA — Chief Water Intelligence Officer Role',
      content:  `Aridon needs a fourth executive alongside Heather.\n\nAQUA — Chief Water Intelligence Officer\n\nResponsibilities:\n• Water production analytics\n• Hydrology and basin impact analysis\n• Water credit calculations\n• Token verification workflows\n• ESG reporting and certificate generation\n• Regulatory and compliance intelligence\n\nHeather manages the business. Aqua manages the water. The two roles are complementary — Heather owns CRM, projects, and operations; Aqua owns the data intelligence and verification system that makes the tokens credible.`,
      category: 'team'
    },
    {
      title:    'Water Asset Exchange — Module Design',
      content:  `A new module for Aridon with four sections:\n\n1. OPERATIONS\nLive AWG fleet view. Production rates, maintenance status, and performance metrics for every deployed unit.\n\n2. VERIFICATION\nOracle data feeds, third-party audit records, and the digital asset registry. This is where the trust layer lives.\n\n3. MARKETPLACE\nBuy, sell, and retire verified water production units. Primary token sales + secondary market.\n\n4. IMPACT\nESG reporting, retirement certificates, basin-level analytics, and historical performance trends.\n\nThis ties together the physical infrastructure, the executive team, and the digital asset layer into one coherent platform rather than three disconnected ideas.`,
      category: 'product'
    },
  ];

  for (const entry of entries) {
    const body = JSON.stringify(entry);
    await new Promise((resolve) => {
      const req = https.request('https://aridon-v02.vercel.app/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
      }, (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('  ✓ Vault — saved:', entry.title.slice(0, 55));
          } else {
            console.log('  ! Vault skipped (status ' + res.statusCode + ') — run supabase-schema.sql first');
          }
          resolve();
        });
      });
      req.on('error', () => {
        console.log('  ! Vault skipped (network error)');
        resolve();
      });
      req.write(body);
      req.end();
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
//  WORD DOCUMENT
// ═══════════════════════════════════════════════════════════════════
async function makeDocx() {
  const {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    Table, TableRow, TableCell, WidthType, ShadingType,
    AlignmentType, PageBreak
  } = require('docx');

  const shade = (fill) => ({ type: ShadingType.CLEAR, fill, color: 'auto' });

  function coverTitle(text) {
    return new Paragraph({
      children: [new TextRun({ text, bold: true, size: 64, color: '1565C0' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 1400, after: 240 },
    });
  }
  function subtitle(text) {
    return new Paragraph({
      children: [new TextRun({ text, size: 26, color: '444444' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
    });
  }
  function meta(text) {
    return new Paragraph({
      children: [new TextRun({ text, size: 20, color: '888888' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
    });
  }
  function h1(text) {
    return new Paragraph({
      text,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 480, after: 160 },
    });
  }
  function h2(text) {
    return new Paragraph({
      text,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 320, after: 120 },
    });
  }
  function body(text) {
    return new Paragraph({
      children: [new TextRun({ text, size: 24 })],
      spacing: { after: 160 },
    });
  }
  function bodyBold(text) {
    return new Paragraph({
      children: [new TextRun({ text, bold: true, size: 24 })],
      spacing: { after: 160 },
    });
  }
  function bullet(text, isBold = false) {
    return new Paragraph({
      children: [new TextRun({ text, bold: isBold, size: 24 })],
      bullet: { level: 0 },
      spacing: { after: 100 },
    });
  }
  function callout(number, label) {
    return new Paragraph({
      children: [
        new TextRun({ text: number, bold: true, size: 64, color: '1565C0' }),
        new TextRun({ text: '  ' + label, size: 24, color: '555555' }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
    });
  }
  function keyInsight(text) {
    return new Paragraph({
      children: [new TextRun({ text: '▶  ' + text, bold: true, size: 24, color: '1565C0' })],
      spacing: { before: 120, after: 120 },
    });
  }

  function makeTable(headers, rows) {
    const colCount = headers.length;
    const colW = Math.floor(9072 / colCount);
    return new Table({
      width: { size: 9072, type: WidthType.DXA },
      rows: [
        new TableRow({
          tableHeader: true,
          children: headers.map(h => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, color: 'FFFFFF' })], spacing: { before: 80, after: 80 } })],
            width: { size: colW, type: WidthType.DXA },
            shading: shade('1E3A5F'),
          })),
        }),
        ...rows.map((row, ri) => new TableRow({
          children: row.map(cell => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20 })], spacing: { before: 80, after: 80 } })],
            width: { size: colW, type: WidthType.DXA },
            shading: shade(ri % 2 === 0 ? 'F5F8FF' : 'FFFFFF'),
          })),
        })),
      ],
    });
  }

  const doc = new Document({
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 } } },
      children: [

        // ── Cover ───────────────────────────────────
        coverTitle('Aridon Strategic Business Model'),
        subtitle('Tokenizing Verified New Water Production'),
        meta('Iron Grid Electric & Water  |  Aridon AI Executive Team'),
        meta(`Prepared: ${TODAY}`),
        new Paragraph({ children: [new PageBreak()] }),

        // ── Critical Positioning ─────────────────────
        h1('Critical Positioning Distinction'),
        keyInsight('Do NOT position Aridon as "tokenizing water." Position it as "tokenizing verified new water production."'),
        body('Existing water rights are legally and politically complex in many jurisdictions. Verified production from atmospheric water generation is a fundamentally different concept — the value comes from measuring newly produced water, not transferring ownership of an existing right.'),
        body('This framing is easier for utilities, governments, and enterprise customers to understand and accept. It avoids the legal minefield of water rights law while still capturing the full value of what Aridon produces.'),
        new Paragraph({ children: [new PageBreak()] }),

        // ── Three Businesses ─────────────────────────
        h1('Aridon Is Three Businesses'),
        body('Most infrastructure companies are one business. Aridon is three — and they reinforce each other in ways competitors cannot easily replicate.'),

        h2('Business 1 — Infrastructure (The Foundation)'),
        body('Aridon designs, deploys, owns, and operates Atmospheric Water Generators, microgrids, energy systems, water treatment, and ongoing monitoring. This generates traditional revenue from equipment, installation, and O&M contracts. It is also the physical foundation that makes everything else possible — without the machines in the ground, there are no data, no tokens, no certificates.'),

        h2('Business 2 — Intelligence (Heather\'s World)'),
        body('Every AWG unit becomes an intelligent asset. Heather\'s platform knows production volume, power consumption, filter status, maintenance schedules, weather correlation, water quality, carbon footprint per gallon, and water offsets for every unit in the fleet.'),
        body('The result is something extremely valuable: trusted operational data. This is not a dashboard for its own sake — it is the raw material of token verification. No data, no mint.'),

        h2('Business 3 — Digital Assets (The Token System)'),
        body('Instead of "we\'re creating crypto," think: "We\'re issuing verified digital certificates backed by measured infrastructure performance." The token is simply the digital representation of verified production. That framing is credible to utilities, governments, and enterprise buyers who would never invest in a pure crypto play but will absolutely pay for a verified water offset they can show in an annual report.'),

        new Paragraph({ children: [new PageBreak()] }),

        // ── The Executive Team ─────────────────────────
        h1('The Executive Team'),
        body('Aridon now has four executive roles — two existing, two proposed. Each owns a distinct domain.'),

        new Paragraph({ spacing: { after: 120 } }),
        makeTable(
          ['Executive', 'Title', 'Domain'],
          [
            ['Heather', 'Chief Business Officer', 'CRM, projects, team, business operations — the day-to-day intelligence layer'],
            ['AQUA', 'Chief Water Intelligence Officer', 'Water production analytics, hydrology, basin impact, credit calculations, token verification, ESG reporting'],
            ['Theron', 'Chief Infrastructure Officer', 'AWG deployment, hardware, O&M, site performance'],
            ['Marcus / Exec Team', 'Executive Advisors', 'Strategy, partnerships, capital markets, regulatory'],
          ]
        ),

        new Paragraph({ spacing: { after: 200 } }),
        h2('AQUA — Chief Water Intelligence Officer'),
        body('AQUA is the new executive role Aridon needs. Heather manages the business. Aqua manages the water. Their responsibilities are complementary: Heather owns CRM, projects, and operations; Aqua owns the data intelligence and verification system that makes the tokens credible.'),
        bullet('Water production analytics — real-time and historical per-unit output'),
        bullet('Hydrology and basin impact analysis — where water is coming from, where it goes'),
        bullet('Water credit calculations — acre-feet produced, verified, eligible for minting'),
        bullet('Token verification workflows — data certification pipeline from sensor to blockchain'),
        bullet('ESG reporting — certificates, basin-level impact, carbon footprint per gallon'),

        new Paragraph({ children: [new PageBreak()] }),

        // ── Water Asset Dashboard ──────────────────────
        h1('Water Asset Dashboard'),
        body('Every deployed AWG becomes a live digital asset with its own dashboard card. This ties the physical system directly to its digital representation — making the infrastructure tangible for buyers, auditors, and regulators.'),

        new Paragraph({ spacing: { after: 120 } }),
        makeTable(
          ['Field', 'Data'],
          [
            ['Unit ID', 'AWG-0147'],
            ['Location', 'Site name / GPS coordinates'],
            ['Gallons Today', 'Real-time production volume'],
            ['Gallons Lifetime', 'Cumulative production since deployment'],
            ['Water Quality', 'PPM / grade certification'],
            ['Humidity', 'Local atmospheric reading (%)'],
            ['Energy Used', 'kWh consumed this period'],
            ['Maintenance Status', 'Filter life, service schedule'],
            ['Verification Status', 'Certified / Pending / Under Review'],
            ['Token Eligible', 'YES / NO'],
            ['Tokens Issued', 'Total tokens minted against this unit'],
            ['Certificates Retired', 'Total NFT certificates issued to buyers'],
            ['Revenue Generated', 'Total revenue attributed to this unit'],
          ]
        ),
        new Paragraph({ spacing: { after: 160 } }),
        body('This view is far more compelling than a generic dashboard because it makes the connection between the physical system and its digital value explicit and auditable.'),

        new Paragraph({ children: [new PageBreak()] }),

        // ── The Moat ──────────────────────────────────
        h1('The Real Moat — The Verification Engine'),
        keyInsight('Most people think the blockchain is the valuable part. The moat is actually the verification engine.'),
        body('If Aridon can demonstrate — credibly, repeatably, and with institutional backing — the following five things about every gallon, Aridon owns the trust layer:'),
        bullet('WHERE the water was produced (GPS-verified deployment location)', true),
        bullet('WHEN it was produced (timestamp from IoT sensors)'),
        bullet('HOW MUCH was produced (metered volume, third-party verified)'),
        bullet('WHO verified it (named auditor or oracle network, endorsed by SWSA)'),
        bullet('WHETHER it has already been claimed (on-chain registry, single-use retirement)'),
        body('That trust layer is much harder to replicate than simply issuing a token on a blockchain. Any developer can deploy a smart contract. No competitor can replicate Aridon\'s combination of deployed hardware, operational data history, tribal sovereignty narrative, and SWSA institutional endorsement.'),

        // ── Knowledge Loop ─────────────────────────────
        h1('The Knowledge Loop'),
        body('The Knowledge Vault becomes more valuable with every deployment. Each AWG unit in the field teaches the system:'),
        bullet('Which environments produce the most water — optimal humidity, temperature, and elevation ranges'),
        bullet('Which filters last longest — material performance data across climates'),
        bullet('Which maintenance schedules produce the best results — predictive maintenance models'),
        bullet('Which installations exceed performance benchmarks — site selection intelligence'),
        body('Aridon is not just generating water. It is building a proprietary operational dataset that improves future deployments. This dataset compounds: the more units deployed, the smarter the system gets, and the more accurate its production projections become — which directly increases the credibility of every token it mints.'),

        new Paragraph({ children: [new PageBreak()] }),

        // ── Feedback Loop ──────────────────────────────
        h1('The Production-to-Value Feedback Loop'),
        body('Instead of a linear Produce → Verify → Mint model, Aridon operates a continuous improvement cycle:'),
        new Paragraph({ spacing: { after: 120 } }),
        makeTable(
          ['Stage', 'What Happens'],
          [
            ['Deploy',   'New AWG unit installed and connected to platform'],
            ['Produce',  'Unit extracts water from atmosphere — every gallon is new supply'],
            ['Measure',  'IoT sensors record production, quality, and energy in real time'],
            ['Verify',   'Third-party oracle or auditor certifies the data stream'],
            ['Register', 'Verified production entered into the digital asset registry'],
            ['Mint',     'Smart contract issues tokens (1 token = 1 verified acre-foot)'],
            ['Trade',    'Tokens available on Aridon marketplace or integrated RWA exchanges'],
            ['Retire',   'Buyer burns token → receives NFT proof of offset → Aridon earns fee'],
            ['Analyze',  'Platform analyzes deployment performance against fleet benchmarks'],
            ['Improve',  'Maintenance, site selection, and production models updated'],
            ['Deploy Again', 'Next deployment is smarter, more efficient, more productive'],
          ]
        ),
        new Paragraph({ spacing: { after: 160 } }),
        body('Every project makes the next project smarter. This feedback loop is a stronger long-term platform strategy than a simple mint-and-sell model, because it creates a compounding advantage that widens with each deployment.'),

        new Paragraph({ children: [new PageBreak()] }),

        // ── Confidence ─────────────────────────────────
        h1('The End Product Is Confidence'),
        keyInsight('The token is not the end product. Confidence is the end product.'),
        body('A data center, utility, or municipality does not really want a blockchain token. What they want is confidence:'),
        bullet('Confidence that they funded verifiable new water production'),
        bullet('Confidence that the production was measured and certified independently'),
        bullet('Confidence that the claim has not already been sold to someone else'),
        bullet('Confidence that they can demonstrate this to customers, regulators, investors, and sustainability stakeholders'),
        body('If Aridon becomes the trusted system that provides that confidence, the tokens become one component of a much larger ecosystem — the visible expression of an invisible infrastructure that Aridon uniquely owns.'),

        // ── The Four Models ─────────────────────────
        h1('The Four Tokenization Models — Only One Is the Right Fit'),

        h2('Model 1: Water Rights Tokenization'),
        body('Tokenizing existing legal water rights. Big market, wrong fit. Aridon is a producer, not a rights holder. Verdict: Wrong fit.'),

        h2('Model 2: Water Production Credits — Aridon\'s Play'),
        body('Generate new, additional water and mint tokens against verified production. No water rights needed. Every gallon is genuinely additive. Verdict: This is Aridon\'s path.'),

        h2('Model 3: Scarcity Index Tokens'),
        body('Tokenize the price of water scarcity as a financial instrument. Interesting secondary product. Does not replace physical water contracts. Verdict: Potential add-on.'),

        h2('Model 4: Water Futures (CME)'),
        body('CME already trades water index futures at $300–650/AF. Validates the concept. Aridon builds the spot market and physical delivery layer below it. Verdict: Market validation.'),

        new Paragraph({ children: [new PageBreak()] }),

        // ── How It Works ─────────────────────────────
        h1('How It Works: Produce to Token'),
        new Paragraph({ spacing: { after: 120 } }),
        makeTable(
          ['Step', 'What Happens', 'Who Does It'],
          [
            ['1. Produce', 'AWG-1000 units extract water from the atmosphere. Every gallon is new, additional supply.', 'Aridon AWG fleet'],
            ['2. Meter & Verify', 'IoT sensors log real-time output. Third-party auditor certifies the data stream.', 'Aridon SaaS + third-party oracle'],
            ['3. Mint Tokens', 'For every verified acre-foot, a smart contract issues one token. Token = 1 verified acre-foot.', 'Smart contract (Polygon / Ethereum / Solana)'],
            ['4. Marketplace', 'Tokens trade on Aridon marketplace or integrated RWA exchanges. Buyers: data centers, ESG funds, utilities.', 'Aridon Water Asset Exchange'],
            ['5. Retire / Burn', 'Buyer claims the offset — token permanently burned, NFT certificate issued as proof.', 'Smart contract auto-executes'],
            ['6. Revenue', 'Aridon earns at mint, at trade (fees), and at retire (certificate fees). Three revenue events per gallon.', 'Aridon'],
          ]
        ),
        new Paragraph({ children: [new PageBreak()] }),

        // ── Water Asset Exchange ───────────────────────
        h1('Water Asset Exchange — The Module to Build'),
        body('The Water Asset Exchange is the unified platform layer that brings Infrastructure, Intelligence, and Digital Assets together. It has four major sections:'),

        h2('1. Operations'),
        body('Live AWG fleet dashboard. Production rates, maintenance status, power consumption, and performance metrics for every deployed unit. The physical system made visible.'),

        h2('2. Verification'),
        body('Oracle data feeds, third-party audit records, and the digital asset registry. This is where the trust layer lives — the real product Aridon is selling.'),

        h2('3. Marketplace'),
        body('Primary token sales and secondary market. Buy, sell, and retire verified water production units. Aridon earns on every transaction.'),

        h2('4. Impact'),
        body('ESG reporting, retirement certificates, basin-level analytics, and historical performance. Buyers use this section to generate the documentation they need for regulatory filings, annual reports, and sustainability disclosures.'),

        new Paragraph({ children: [new PageBreak()] }),

        // ── Market Validation ─────────────────────────
        h1('Who Is Already Doing This'),
        new Paragraph({ spacing: { after: 120 } }),
        makeTable(
          ['Project', 'What They Tokenize', 'Why It Matters to Aridon'],
          [
            ['WaterLAB (fmr. WaterDAO)', 'Additional freshwater generation — producers earn WATER tokens for verified output', 'This is the blueprint. Wyoming DAO legal framework already exists. Producers mint, buyers retire, NFT certificates issued.'],
            ['Hypercube', 'Recycled/reclaimed water — WTR tokens', 'Proves that water from non-primary sources can be tokenized and traded.'],
            ['Water Ledger', 'Blockchain water asset management — first U.S. patent issued 2024', 'The legal and patent infrastructure is forming now. Aridon should move quickly.'],
            ['BigWater Protocol', '$BIGW tokens backed by 10 years of real water infrastructure in India', 'Hybrid physical-deployment + token model — closest parallel to what Aridon would build.'],
          ]
        ),
        new Paragraph({ children: [new PageBreak()] }),

        // ── Market Pricing ─────────────────────────────
        h1('What a Water Token Is Worth'),
        new Paragraph({ spacing: { after: 120 } }),
        makeTable(
          ['Market / Source', 'Price per Acre-Foot'],
          [
            ['California surface water spot — South of Delta transfers', '$375 – $637'],
            ['Agricultural / municipal at-source (normal to critical water years)', '$150 – $660'],
            ['Groundwater excess pumping penalty — East Kaweah GSA', '$500'],
            ['Voluntary offset midpoint (conservative baseline)', '~$400'],
          ]
        ),
        new Paragraph({ spacing: { after: 160 } }),
        callout('$800,000,000 / year', 'projected tokenized water value by 2032'),
        body('Based on: 2,000,000 acre-feet of verified AWG production × $400/acre-foot. Does not include O&M revenue, deployment contracts, or marketplace transaction fees.'),

        // ── Revenue Model ──────────────────────────────
        h1('Revenue Model: Three Events Per Gallon'),
        body('Most companies earn once when water is delivered. Aridon earns three times on the same gallon.'),
        bullet('AT MINT — Token sold to market at $400+/AF. Primary revenue event. Scales with every AWG unit deployed.', true),
        bullet('AT TRADE — Marketplace transaction fee (1–3%) on every secondary trade. Recurring, passive revenue as tokens circulate.'),
        bullet('AT RETIRE — Certificate issuance fee when buyer burns token for NFT proof. Third revenue touch at zero additional production cost.'),

        new Paragraph({ children: [new PageBreak()] }),

        // ── Why Aridon ─────────────────────────────────
        h1('Why Aridon Is Uniquely Positioned'),
        bullet('AWG = New/Additional Water. No water rights needed. Every gallon is genuinely additive to the basin.', true),
        bullet('SaaS Platform Built In. The IoT data that feeds O&M feeds the token mint — verification is built in, not bolted on.'),
        bullet('Tribal Sovereignty. Navajo Nation as first deployment partner gives moral authority no Silicon Valley startup can replicate.'),
        bullet('SWSA as Verification Body. 7-state coalition endorsement = institutional credibility. Think of SWSA as the rating agency for Aridon water credits.'),
        bullet('Data Centers Are Desperate Buyers. AI facilities consume millions of gallons per day and face ESG pressure to offset their water footprint.'),
        bullet('The Knowledge Loop. Every deployment makes the next one smarter. The dataset compounds — a moat that widens with scale.'),

        // ── Legal ─────────────────────────────────────
        h1('Legal Considerations'),
        keyInsight('Plan for legal and governance from day one — not after the first token is minted.'),
        body('Because Aridon\'s tokenization program intersects with environmental claims, financial assets, blockchain, and potentially regulated markets, legal counsel should be involved early. Areas requiring expertise:'),
        bullet('Securities law — is a water production token a security? How it is structured determines how it is regulated.', true),
        bullet('Commodities law — water as a tradeable commodity has its own regulatory framework at state and federal levels.'),
        bullet('Water law — each state and tribe has different frameworks. Aridon\'s AWG model is designed to avoid rights conflicts, but this must be documented legally.'),
        bullet('Environmental markets — voluntary offset rules, additionality standards, permanence requirements, and double-counting prohibitions vary by market.'),
        body('Building legal and governance considerations into Aridon\'s architecture early will make the platform more credible and reduce the risk of costly redesigns later. The Wyoming DAO framework used by WaterLAB is the direct precedent.'),

        // ── Next Steps ─────────────────────────────────
        h1('Recommended Next Steps'),
        bullet('Engage a Wyoming DAO attorney to establish the legal entity for token issuance. WaterLAB\'s framework is the direct precedent.', true),
        bullet('Commission a third-party verification protocol for AWG production data — this oracle feeds the mint process and is the foundation of token legitimacy.'),
        bullet('Add AQUA to the Aridon executive team — build the Chief Water Intelligence Officer role into the platform.'),
        bullet('Begin design of the Water Asset Exchange module: Operations, Verification, Marketplace, Impact.'),
        bullet('Build the Water Asset Dashboard — per-unit live view tying each AWG to its digital asset record.'),
        bullet('Initiate conversations with 1–2 New Mexico data center developers about voluntary water offset commitments.'),
        bullet('Present the tokenization framework to SWSA as a potential verification and governance partner.'),

        new Paragraph({ spacing: { after: 400 } }),
        new Paragraph({
          children: [new TextRun({ text: `Prepared by the Aridon AI Executive Team  |  Iron Grid Electric & Water  |  ${TODAY}`, size: 18, color: '888888' })],
          alignment: AlignmentType.CENTER,
        }),
      ],
    }],
  });

  const buf = await Packer.toBuffer(doc);
  const outPath = path.join(OUT, 'Aridon-Water-Tokenization-Strategy.docx');
  fs.writeFileSync(outPath, buf);
  console.log('  ✓ Word doc →', outPath);
}

// ═══════════════════════════════════════════════════════════════════
//  POWERPOINT
// ═══════════════════════════════════════════════════════════════════
function makePptx() {
  const pptx = new (require('pptxgenjs'))();
  pptx.layout = 'LAYOUT_16x9';

  function slide(fn) {
    const s = pptx.addSlide();
    s.background = { color: C.navy };
    fn(s);
    return s;
  }

  function slideTitle(s, text, y = 0.28) {
    s.addText(text, { x: 0.5, y, w: 9, h: 0.65, fontSize: 26, bold: true, color: C.white, fontFace: 'Calibri' });
  }

  function divider(s, y = 0.97) {
    s.addShape(pptx.ShapeType.line, { x: 0.5, y, w: 9, h: 0, line: { color: C.blue, width: 1 } });
  }

  function slideNote(s, text) {
    s.addText(text, { x: 0.5, y: 5.22, w: 9, h: 0.3, fontSize: 10, color: C.muted, italic: true, fontFace: 'Calibri' });
  }

  // ── Slide 1: Title ──────────────────────────────
  slide(s => {
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.45, h: 5.625, fill: { color: C.blue }, line: { width: 0 } });
    s.addText('ARIDON', { x: 0.65, y: 0.35, w: 9, h: 0.38, fontSize: 13, bold: true, color: C.muted, charSpacing: 8, fontFace: 'Calibri' });
    s.addText('Strategic\nBusiness Model', { x: 0.65, y: 0.82, w: 9, h: 2.0, fontSize: 46, bold: true, color: C.white, fontFace: 'Calibri' });
    s.addText('Tokenizing Verified New Water Production', { x: 0.65, y: 3.0, w: 8.5, h: 0.65, fontSize: 18, color: C.blue, fontFace: 'Calibri' });
    s.addShape(pptx.ShapeType.line, { x: 0.65, y: 3.82, w: 3.5, h: 0, line: { color: C.blue, width: 2 } });
    s.addText('Iron Grid Electric & Water  |  ' + TODAY, { x: 0.65, y: 4.1, w: 8, h: 0.38, fontSize: 13, color: C.muted, fontFace: 'Calibri' });
  });

  // ── Slide 2: Critical Positioning ──────────────
  slide(s => {
    slideTitle(s, 'Critical Positioning Distinction');
    divider(s);
    s.addShape(pptx.ShapeType.roundRect, { x: 0.45, y: 1.15, w: 9.1, h: 1.1, fill: { color: C.card }, line: { color: C.orange, width: 2 }, rectRadius: 0.1 });
    s.addText('Do NOT say "tokenizing water." Say "tokenizing verified new water production."', {
      x: 0.65, y: 1.22, w: 8.7, h: 0.9, fontSize: 17, bold: true, color: C.orange, align: 'center', valign: 'middle', fontFace: 'Calibri',
    });
    const pts = [
      'Existing water rights are legally complex in every jurisdiction — this positioning avoids that entire minefield.',
      'AWG production is genuinely new, additional water. The value comes from measuring production, not transferring ownership of a right.',
      'Utilities, governments, and enterprise buyers immediately understand "verified production." They are skeptical of "water crypto."',
      'The end product is CONFIDENCE — not a token. A data center wants proof they funded verifiable new water production, full stop.',
    ];
    pts.forEach((pt, i) => {
      s.addText('▶  ' + pt, {
        x: 0.5, y: 2.45 + i * 0.75, w: 9, h: 0.65, fontSize: 13, color: C.light, fontFace: 'Calibri',
      });
    });
  });

  // ── Slide 3: Three Businesses ───────────────────
  slide(s => {
    slideTitle(s, 'Aridon Is Three Businesses');
    divider(s);
    const businesses = [
      { n: '1', label: 'INFRASTRUCTURE', title: 'The Foundation', color: C.teal,
        bullets: ['AWG-1000 units, microgrids, energy systems', 'Water treatment & monitoring', 'O&M contracts', 'Traditional equipment + installation revenue'] },
      { n: '2', label: 'INTELLIGENCE', title: 'Heather\'s World', color: C.blue,
        bullets: ['Every AWG is an intelligent asset', 'Production, quality, energy, maintenance', 'Carbon footprint per gallon', 'Trusted operational data = verification'] },
      { n: '3', label: 'DIGITAL ASSETS', title: 'The Token System', color: C.orange,
        bullets: ['Verified digital certificates', 'Backed by measured performance', 'Three revenue events per gallon', 'Mint → Trade → Retire'] },
    ];
    businesses.forEach((b, i) => {
      const x = 0.35 + i * 3.18;
      s.addShape(pptx.ShapeType.roundRect, { x, y: 1.1, w: 2.98, h: 4.2, fill: { color: C.card }, line: { color: b.color, width: 2 }, rectRadius: 0.1 });
      s.addShape(pptx.ShapeType.ellipse, { x: x + 1.1, y: 1.22, w: 0.78, h: 0.78, fill: { color: b.color }, line: { width: 0 } });
      s.addText(b.n, { x: x + 1.1, y: 1.22, w: 0.78, h: 0.78, fontSize: 20, bold: true, color: C.white, align: 'center', valign: 'middle', fontFace: 'Calibri' });
      s.addText(b.label, { x, y: 2.15, w: 2.98, h: 0.35, fontSize: 10, bold: true, color: b.color, align: 'center', charSpacing: 2, fontFace: 'Calibri' });
      s.addText(b.title, { x, y: 2.52, w: 2.98, h: 0.45, fontSize: 16, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
      b.bullets.forEach((bl, bi) => {
        s.addText('• ' + bl, { x: x + 0.12, y: 3.08 + bi * 0.46, w: 2.72, h: 0.4, fontSize: 11.5, color: C.muted, fontFace: 'Calibri' });
      });
    });
  });

  // ── Slide 4: AQUA Executive ─────────────────────
  slide(s => {
    slideTitle(s, 'Introducing AQUA — Chief Water Intelligence Officer');
    divider(s);
    s.addShape(pptx.ShapeType.roundRect, { x: 0.45, y: 1.1, w: 4.35, h: 4.2, fill: { color: C.card }, line: { color: C.teal, width: 2 }, rectRadius: 0.1 });
    s.addShape(pptx.ShapeType.ellipse, { x: 1.58, y: 1.22, w: 1.1, h: 1.1, fill: { color: C.teal }, line: { width: 0 } });
    s.addText('A', { x: 1.58, y: 1.22, w: 1.1, h: 1.1, fontSize: 36, bold: true, color: C.navy, align: 'center', valign: 'middle', fontFace: 'Calibri' });
    s.addText('AQUA', { x: 0.45, y: 2.48, w: 4.35, h: 0.45, fontSize: 22, bold: true, color: C.teal, align: 'center', fontFace: 'Calibri' });
    s.addText('Chief Water Intelligence Officer', { x: 0.45, y: 2.95, w: 4.35, h: 0.38, fontSize: 13, color: C.light, align: 'center', fontFace: 'Calibri' });
    const duties = ['Water production analytics', 'Hydrology & basin impact', 'Water credit calculations', 'Token verification workflows', 'ESG reporting & certificates'];
    duties.forEach((d, i) => {
      s.addText('• ' + d, { x: 0.65, y: 3.45 + i * 0.35, w: 4.0, h: 0.32, fontSize: 12, color: C.muted, fontFace: 'Calibri' });
    });
    s.addShape(pptx.ShapeType.roundRect, { x: 5.1, y: 1.1, w: 4.45, h: 4.2, fill: { color: C.card }, line: { color: C.blue, width: 1 }, rectRadius: 0.1 });
    s.addText('How the Team Divides', { x: 5.1, y: 1.22, w: 4.45, h: 0.42, fontSize: 14, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
    const split = [
      { name: 'Heather', role: 'CRM, projects,\noperations, business', color: C.blue },
      { name: 'Aqua', role: 'Water data, credits,\nverification, ESG', color: C.teal },
    ];
    split.forEach((sp, i) => {
      const y = 1.78 + i * 1.6;
      s.addShape(pptx.ShapeType.roundRect, { x: 5.3, y, w: 4.0, h: 1.35, fill: { color: C.dark }, line: { color: sp.color, width: 1.5 }, rectRadius: 0.08 });
      s.addText(sp.name, { x: 5.3, y: y + 0.08, w: 4.0, h: 0.45, fontSize: 18, bold: true, color: sp.color, align: 'center', fontFace: 'Calibri' });
      s.addText(sp.role, { x: 5.3, y: y + 0.55, w: 4.0, h: 0.7, fontSize: 12, color: C.muted, align: 'center', fontFace: 'Calibri' });
    });
    s.addText('Heather manages the business.\nAqua manages the water.', { x: 5.1, y: 4.55, w: 4.45, h: 0.65, fontSize: 13, bold: true, color: C.light, align: 'center', fontFace: 'Calibri' });
  });

  // ── Slide 5: Water Asset Dashboard ─────────────
  slide(s => {
    slideTitle(s, 'Water Asset Dashboard — Every AWG Is a Live Digital Asset');
    divider(s);
    s.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 1.08, w: 5.3, h: 4.25, fill: { color: C.card }, line: { color: C.blue, width: 1.5 }, rectRadius: 0.1 });
    s.addText('AWG Unit 0147', { x: 0.55, y: 1.18, w: 5.0, h: 0.42, fontSize: 16, bold: true, color: C.white, fontFace: 'Calibri' });
    s.addShape(pptx.ShapeType.line, { x: 0.55, y: 1.65, w: 4.9, h: 0, line: { color: C.dark, width: 1 } });
    const fields = [
      ['Gallons Today',     '4,280 gal'],
      ['Gallons Lifetime',  '1,847,500 gal'],
      ['Water Quality',     '< 5 PPM  ✓'],
      ['Humidity',          '62%'],
      ['Energy Used',       '18.4 kWh'],
      ['Maintenance',       'On Schedule'],
      ['Verification',      'Certified'],
    ];
    fields.forEach(([k, v], i) => {
      s.addText(k, { x: 0.55, y: 1.76 + i * 0.42, w: 2.8, h: 0.35, fontSize: 12, color: C.muted, fontFace: 'Calibri' });
      s.addText(v, { x: 3.35, y: 1.76 + i * 0.42, w: 2.15, h: 0.35, fontSize: 12, color: C.white, bold: true, fontFace: 'Calibri' });
    });
    s.addShape(pptx.ShapeType.roundRect, { x: 5.9, y: 1.08, w: 3.65, h: 4.25, fill: { color: C.dark }, line: { color: C.teal, width: 1.5 }, rectRadius: 0.1 });
    s.addText('Digital Asset Record', { x: 5.9, y: 1.18, w: 3.65, h: 0.4, fontSize: 13, bold: true, color: C.teal, align: 'center', fontFace: 'Calibri' });
    const digital = [
      { label: 'Token Eligible', value: 'YES', color: C.green },
      { label: 'Tokens Issued', value: '127', color: C.white },
      { label: 'Certs Retired', value: '96', color: C.white },
      { label: 'Revenue Generated', value: '$38,400', color: C.blue },
    ];
    digital.forEach((d, i) => {
      s.addText(d.label, { x: 6.0, y: 1.75 + i * 0.88, w: 3.4, h: 0.35, fontSize: 11, color: C.muted, align: 'center', fontFace: 'Calibri' });
      s.addText(d.value, { x: 6.0, y: 2.1 + i * 0.88, w: 3.4, h: 0.5, fontSize: 22, bold: true, color: d.color, align: 'center', fontFace: 'Calibri' });
    });
  });

  // ── Slide 6: The Real Moat ──────────────────────
  slide(s => {
    slideTitle(s, 'The Real Moat — The Verification Engine');
    divider(s);
    s.addShape(pptx.ShapeType.roundRect, { x: 0.45, y: 1.12, w: 9.1, h: 0.78, fill: { color: C.dark }, line: { color: C.orange, width: 1.5 }, rectRadius: 0.08 });
    s.addText('Most people think the blockchain is the valuable part. The moat is the verification engine.', {
      x: 0.65, y: 1.2, w: 8.7, h: 0.6, fontSize: 14, bold: true, color: C.orange, align: 'center', valign: 'middle', fontFace: 'Calibri',
    });
    const pts = [
      { q: 'WHERE?', d: 'GPS-verified deployment location — every unit has a registered site identity.' },
      { q: 'WHEN?',  d: 'Timestamp from IoT sensors — tamper-evident, continuous data stream.' },
      { q: 'HOW MUCH?', d: 'Metered volume, certified by third-party oracle — not self-reported.' },
      { q: 'WHO VERIFIED?', d: 'Named auditor or oracle network, endorsed by SWSA — institutional stamp.' },
      { q: 'ALREADY CLAIMED?', d: 'On-chain registry — single-use retirement prevents double-counting.' },
    ];
    pts.forEach((pt, i) => {
      const y = 2.08 + i * 0.66;
      s.addShape(pptx.ShapeType.roundRect, { x: 0.45, y, w: 9.1, h: 0.56, fill: { color: C.card }, line: { color: C.dark, width: 1 }, rectRadius: 0.06 });
      s.addText(pt.q, { x: 0.6, y: y + 0.08, w: 1.8, h: 0.38, fontSize: 12, bold: true, color: C.teal, fontFace: 'Calibri' });
      s.addText(pt.d, { x: 2.5, y: y + 0.08, w: 6.85, h: 0.38, fontSize: 12, color: C.light, fontFace: 'Calibri' });
    });
    s.addText('Any developer can deploy a smart contract. No competitor can replicate Aridon\'s hardware + data history + SWSA endorsement + tribal sovereignty.', {
      x: 0.45, y: 5.38, w: 9.1, h: 0.25, fontSize: 11, color: C.muted, italic: true, fontFace: 'Calibri',
    });
  });

  // ── Slide 7: Feedback Loop ──────────────────────
  slide(s => {
    slideTitle(s, 'The Production-to-Value Feedback Loop');
    divider(s);
    s.addText('Every project makes the next one smarter. The dataset compounds — this is the long-term competitive moat.', {
      x: 0.5, y: 1.05, w: 9, h: 0.42, fontSize: 13, color: C.muted, fontFace: 'Calibri',
    });
    const steps = ['Deploy', 'Produce', 'Measure', 'Verify', 'Register', 'Mint', 'Trade', 'Retire', 'Analyze', 'Improve'];
    const cols = 5;
    steps.forEach((st, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 0.38 + col * 1.86;
      const y = 1.62 + row * 1.75;
      const isLast = i === steps.length - 1;
      s.addShape(pptx.ShapeType.roundRect, {
        x, y, w: 1.68, h: 1.42,
        fill: { color: isLast ? C.blue : C.card },
        line: { color: isLast ? C.white : C.blue, width: isLast ? 2 : 1 },
        rectRadius: 0.08,
      });
      s.addText(String(i + 1), { x, y: y + 0.1, w: 1.68, h: 0.38, fontSize: 20, bold: true, color: isLast ? C.white : C.blue, align: 'center', fontFace: 'Calibri' });
      s.addText(st, { x, y: y + 0.52, w: 1.68, h: 0.58, fontSize: 13, bold: true, color: C.white, align: 'center', valign: 'middle', fontFace: 'Calibri' });
      if (col < cols - 1 && i < steps.length - 1) {
        s.addText('→', { x: x + 1.68, y: y + 0.52, w: 0.18, h: 0.38, fontSize: 14, color: C.blue, align: 'center', fontFace: 'Calibri' });
      }
    });
    s.addShape(pptx.ShapeType.roundRect, { x: 0.38, y: 5.05, w: 9.22, h: 0.42, fill: { color: C.dark }, line: { color: C.blue, width: 1 }, rectRadius: 0.06 });
    s.addText('⟳  Deploy Again — smarter, faster, more productive', { x: 0.38, y: 5.1, w: 9.22, h: 0.32, fontSize: 13, bold: true, color: C.teal, align: 'center', fontFace: 'Calibri' });
  });

  // ── Slide 8: Water Asset Exchange ───────────────
  slide(s => {
    slideTitle(s, 'Water Asset Exchange — The Module to Build');
    divider(s);
    s.addText('One unified platform that ties Infrastructure, Intelligence, and Digital Assets together.', {
      x: 0.5, y: 1.05, w: 9, h: 0.38, fontSize: 13, color: C.muted, fontFace: 'Calibri',
    });
    const sections = [
      { n: '1', name: 'Operations',    color: C.blue,   desc: 'Live AWG fleet. Production rates, maintenance, power, performance — every unit, real time.' },
      { n: '2', name: 'Verification',  color: C.teal,   desc: 'Oracle feeds, third-party audits, digital asset registry. The trust layer — the real product.' },
      { n: '3', name: 'Marketplace',   color: C.orange, desc: 'Primary token sales + secondary market. Buy, sell, retire. Aridon earns on every transaction.' },
      { n: '4', name: 'Impact',        color: C.green,  desc: 'ESG reporting, NFT certificates, basin analytics, historical performance for compliance filings.' },
    ];
    sections.forEach((sec, i) => {
      const y = 1.55 + i * 0.97;
      s.addShape(pptx.ShapeType.roundRect, { x: 0.45, y, w: 9.1, h: 0.82, fill: { color: C.card }, line: { color: sec.color, width: 1.5 }, rectRadius: 0.08 });
      s.addShape(pptx.ShapeType.ellipse, { x: 0.58, y: y + 0.14, w: 0.54, h: 0.54, fill: { color: sec.color }, line: { width: 0 } });
      s.addText(sec.n, { x: 0.58, y: y + 0.14, w: 0.54, h: 0.54, fontSize: 16, bold: true, color: C.white, align: 'center', valign: 'middle', fontFace: 'Calibri' });
      s.addText(sec.name, { x: 1.25, y: y + 0.08, w: 2.0, h: 0.38, fontSize: 15, bold: true, color: sec.color, fontFace: 'Calibri' });
      s.addText(sec.desc, { x: 1.25, y: y + 0.44, w: 8.0, h: 0.32, fontSize: 12, color: C.muted, fontFace: 'Calibri' });
    });
  });

  // ── Slide 9: Revenue + Economics ────────────────
  slide(s => {
    slideTitle(s, 'Three Revenue Events Per Gallon  |  $800M / Year by 2032');
    divider(s);
    const events = [
      { n: '1', label: 'AT MINT',   title: 'Token Sale',       desc: '$400+/AF. Scales with every AWG unit deployed.', color: C.blue },
      { n: '2', label: 'AT TRADE',  title: 'Marketplace Fee',  desc: '1–3% on every secondary trade. Passive, recurring.', color: C.teal },
      { n: '3', label: 'AT RETIRE', title: 'Certificate Fee',  desc: 'NFT issuance fee. Zero additional production cost.', color: C.orange },
    ];
    events.forEach((ev, i) => {
      const x = 0.35 + i * 3.18;
      s.addShape(pptx.ShapeType.roundRect, { x, y: 1.1, w: 2.98, h: 2.55, fill: { color: C.card }, line: { color: ev.color, width: 2 }, rectRadius: 0.1 });
      s.addShape(pptx.ShapeType.ellipse, { x: x + 1.09, y: 1.22, w: 0.8, h: 0.8, fill: { color: ev.color }, line: { width: 0 } });
      s.addText(ev.n, { x: x + 1.09, y: 1.22, w: 0.8, h: 0.8, fontSize: 22, bold: true, color: C.white, align: 'center', valign: 'middle', fontFace: 'Calibri' });
      s.addText(ev.label, { x, y: 2.18, w: 2.98, h: 0.32, fontSize: 10, bold: true, color: ev.color, align: 'center', charSpacing: 2, fontFace: 'Calibri' });
      s.addText(ev.title, { x, y: 2.52, w: 2.98, h: 0.4, fontSize: 15, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
      s.addText(ev.desc, { x: x + 0.15, y: 2.98, w: 2.65, h: 0.55, fontSize: 12, color: C.muted, align: 'center', fontFace: 'Calibri' });
    });
    s.addShape(pptx.ShapeType.roundRect, { x: 0.45, y: 3.85, w: 9.1, h: 1.55, fill: { color: C.card }, line: { color: C.blue, width: 1 }, rectRadius: 0.1 });
    s.addText('$800,000,000', { x: 0.45, y: 3.9, w: 9.1, h: 0.85, fontSize: 58, bold: true, color: C.blue, align: 'center', fontFace: 'Calibri' });
    s.addText('2,000,000 AF / year  ×  $400 / AF  =  $800M / year  (tokenized water value by 2032)', {
      x: 0.65, y: 4.78, w: 8.7, h: 0.38, fontSize: 12, color: C.muted, align: 'center', fontFace: 'Calibri',
    });
    slideNote(s, 'Excludes O&M revenue, deployment contracts, and marketplace fees.');
  });

  // ── Slide 10: Legal Considerations ─────────────
  slide(s => {
    slideTitle(s, 'Legal Considerations — Build Governance In From Day One');
    divider(s);
    s.addShape(pptx.ShapeType.roundRect, { x: 0.45, y: 1.12, w: 9.1, h: 0.72, fill: { color: C.dark }, line: { color: C.orange, width: 1.5 }, rectRadius: 0.08 });
    s.addText('This intersects with securities, commodities, water law, and environmental markets. Involve counsel early.', {
      x: 0.65, y: 1.2, w: 8.7, h: 0.55, fontSize: 13, bold: true, color: C.orange, align: 'center', valign: 'middle', fontFace: 'Calibri',
    });
    const areas = [
      { area: 'Securities Law', detail: 'Is a water production token a security? Structure determines regulation. Get this answered before the first mint.' },
      { area: 'Commodities Law', detail: 'Water as a tradeable commodity has its own state and federal regulatory framework.' },
      { area: 'Water Law', detail: 'Each state and tribe has different frameworks. Aridon\'s AWG model avoids rights conflicts — document it legally.' },
      { area: 'Environmental Markets', detail: 'Voluntary offset rules, additionality standards, permanence, and double-counting prohibitions vary by market.' },
    ];
    areas.forEach((a, i) => {
      const y = 2.0 + i * 0.84;
      s.addShape(pptx.ShapeType.roundRect, { x: 0.45, y, w: 9.1, h: 0.7, fill: { color: C.card }, line: { color: C.dark, width: 1 }, rectRadius: 0.06 });
      s.addText(a.area, { x: 0.62, y: y + 0.1, w: 2.5, h: 0.5, fontSize: 13, bold: true, color: C.white, fontFace: 'Calibri' });
      s.addText(a.detail, { x: 3.2, y: y + 0.1, w: 6.2, h: 0.5, fontSize: 12, color: C.muted, fontFace: 'Calibri' });
    });
    s.addText('The Wyoming DAO framework used by WaterLAB is the direct precedent. Building governance in early makes the platform more credible and prevents costly redesigns.', {
      x: 0.45, y: 5.4, w: 9.1, h: 0.22, fontSize: 11, color: C.muted, italic: true, fontFace: 'Calibri',
    });
  });

  // ── Slide 11: Next Steps ────────────────────────
  slide(s => {
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.45, h: 5.625, fill: { color: C.orange }, line: { width: 0 } });
    s.addText('Next Steps', { x: 0.65, y: 0.25, w: 9, h: 0.65, fontSize: 30, bold: true, color: C.white, fontFace: 'Calibri' });
    const steps = [
      { n: '01', t: 'Legal Entity',           d: 'Engage a Wyoming DAO attorney for token issuance structure. WaterLAB is the direct precedent.' },
      { n: '02', t: 'Verification Protocol',  d: 'Commission third-party standard for AWG production data. This oracle feeds every mint.' },
      { n: '03', t: 'Add AQUA',               d: 'Build the Chief Water Intelligence Officer role into the Aridon executive team.' },
      { n: '04', t: 'Water Asset Exchange',   d: 'Begin design: Operations, Verification, Marketplace, and Impact sections.' },
      { n: '05', t: 'Water Asset Dashboard',  d: 'Build per-unit live view — tie each AWG to its digital asset record.' },
      { n: '06', t: 'First Token Buyers',     d: 'Initiate conversations with NM data center developers. First buyers = proof of demand.' },
    ];
    steps.forEach((st, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.55 + col * 4.68;
      const y = 1.05 + row * 1.45;
      s.addShape(pptx.ShapeType.roundRect, { x, y, w: 4.45, h: 1.25, fill: { color: C.card }, line: { color: C.orange, width: 0.75 }, rectRadius: 0.08 });
      s.addText(st.n, { x: x + 0.1, y: y + 0.18, w: 0.65, h: 0.65, fontSize: 20, bold: true, color: C.orange, align: 'center', valign: 'middle', fontFace: 'Calibri' });
      s.addText(st.t, { x: x + 0.85, y: y + 0.1, w: 3.45, h: 0.42, fontSize: 13, bold: true, color: C.white, fontFace: 'Calibri' });
      s.addText(st.d, { x: x + 0.85, y: y + 0.55, w: 3.45, h: 0.6, fontSize: 11, color: C.muted, fontFace: 'Calibri' });
    });
    s.addText('aridon-v02.vercel.app  |  Iron Grid Electric & Water', {
      x: 0.65, y: 5.4, w: 9, h: 0.22, fontSize: 10, color: C.muted, fontFace: 'Calibri',
    });
  });

  const outPath = path.join(OUT, 'Aridon-Water-Tokenization-Pitch.pptx');
  pptx.writeFile({ fileName: outPath });
  console.log('  ✓ PowerPoint →', outPath);
}

// ═══════════════════════════════════════════════════════════════════
//  RUN
// ═══════════════════════════════════════════════════════════════════
(async () => {
  console.log('\n  ╔═══════════════════════════════════════╗');
  console.log('  ║   Aridon Document Generator  v2       ║');
  console.log('  ╚═══════════════════════════════════════╝\n');

  console.log('  [1/3] Saving to Knowledge Vault...');
  await saveToVault();

  console.log('  [2/3] Creating Word document...');
  try { await makeDocx(); } catch (e) { console.error('  ✗ Word doc failed:', e.message); }

  console.log('  [3/3] Creating PowerPoint deck...');
  try { makePptx(); } catch (e) { console.error('  ✗ PowerPoint failed:', e.message); }

  console.log('\n  ─────────────────────────────────────────');
  console.log('  Done! Files saved to: ' + OUT);
  console.log('  ─────────────────────────────────────────\n');
})();
