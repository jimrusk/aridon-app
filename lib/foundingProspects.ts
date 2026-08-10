export type FoundingProspect = {
  slug: string;
  active: boolean;
  expiresAt: string;
  companyName: string;
  industry: string;
  location: string;
  website: string;
  contactEmail: string;
  decisionMaker: string;
  decisionRole: string;
  publicSummary: string;
  fitReason: string;
  watchItems: string[];
  studioIdeas: string[];
  sampleBrief: string[];
  starterQuestions: string[];
};

const expiresAt = '2026-09-15T23:59:59-06:00';

export const foundingProspects: FoundingProspect[] = [
  {
    slug: 'axe-engineering-f26a', active: true, expiresAt,
    companyName: 'Axé Engineering, Inc.', industry: 'Native-owned civil engineering and government contracting', location: 'Albuquerque, New Mexico',
    website: 'https://axe-eng.com/', contactEmail: 'axe.eng.info@gmail.com', decisionMaker: 'Todd Kirkpatrick, PE', decisionRole: 'President',
    publicSummary: 'Public information describes Axé Engineering as a Native-owned New Mexico engineering firm serving federal, tribal and local agencies across infrastructure, water/wastewater, drainage, construction administration, environmental support and grant applications.',
    fitReason: 'Axé combines federal capture, tribal work, infrastructure engineering, grant support and a stated growth goal. Aridon can connect opportunity intelligence, pursuit planning, teaming, marketing production and owner follow-up in one workspace.',
    watchItems: [
      'Continuously rank federal and tribal engineering opportunities against Axé capabilities and 8(a) positioning.',
      'Build one pursuit brief showing buyer, eligibility, teaming needs, deadlines, likely competition and next action before proposal effort begins.',
      'Maintain a partner and subcontractor pipeline around water, wastewater, civil, environmental and infrastructure pursuits.',
      'Give leadership a morning brief of opportunity changes, unanswered outreach, upcoming deadlines and decisions requiring approval.'
    ],
    studioIdeas: [
      'Turn one capability statement into agency-specific outreach, LinkedIn content, teaming emails and a visual project-capability campaign.',
      'Create an approved-content library around water/wastewater, federal infrastructure and tribal community work without inventing project claims.',
      'Build visual explainers and short videos for complex infrastructure services from owner-approved technical source material.'
    ],
    sampleBrief: ['Capture: identify the three highest-fit federal or tribal pursuits that deserve attention this week.','Teaming: flag pursuits needing a complementary prime, specialty subcontractor or local partner.','Marketing: convert one approved water/wastewater capability into a targeted agency and partner campaign.','Follow-up: surface unanswered teaming and business-development outreach older than three business days.'],
    starterQuestions: ['Find the best federal and tribal opportunities for our civil, water and infrastructure capabilities.','Build a teaming strategy for a federal water or infrastructure pursuit.','Turn our approved capabilities into a 30-day business-development campaign without overstating our experience.']
  },
  {
    slug: 'teknicare-f26t', active: true, expiresAt,
    companyName: 'Teknicare, Inc.', industry: 'Mission-critical government engineering, test, IT and advisory services', location: 'Albuquerque, New Mexico',
    website: 'https://www.teknicare.com/', contactEmail: 'info@teknicare.com', decisionMaker: 'Chuck O’Donnell', decisionRole: 'President & CEO',
    publicSummary: 'Public information describes Teknicare as an Albuquerque small business supporting mission-critical government and defense programs through systems engineering, test and evaluation, IT/cybersecurity, directed-energy expertise, program support and teaming relationships.',
    fitReason: 'Teknicare already operates in a relationship-heavy federal and prime-contractor market where capture intelligence, teaming follow-up, conference outreach and capability communications can create outsized value. The preview uses public information only and is not designed for classified data.',
    watchItems: [
      'Track relevant federal and prime-contractor opportunities and rank them by mission fit, timing, likely buyer and teaming path.',
      'Maintain a teaming pipeline with primes and complementary small businesses, including follow-up clocks and meeting next actions.',
      'Turn public conference, customer and program signals into business-development briefs for leadership.',
      'Keep external communication approval-gated and separate public business-development content from sensitive or classified work.'
    ],
    studioIdeas: [
      'Create public-facing capability campaigns for systems engineering, test, cybersecurity and mission-support services.',
      'Repurpose approved technical material into conference follow-up, teaming outreach, website copy and recruiting content.',
      'Generate visual explainers for public capabilities without exposing proprietary or classified information.'
    ],
    sampleBrief: ['Growth: rank current public opportunities where Teknicare has a strong technical or teaming fit.','Teaming: identify primes and small-business partners worth a targeted conversation this month.','Marketing: prepare an approved public campaign around one mission-support capability.','Follow-up: show leadership the business-development conversations that have gone quiet and the recommended next step.'],
    starterQuestions: ['Build a capture watchlist for public opportunities relevant to our engineering and test capabilities.','Which teaming relationships should leadership prioritize and why?','Create a public-facing campaign from our approved capabilities while keeping sensitive work out of the system.']
  },
  {
    slug: 'excelligent-f26e', active: true, expiresAt,
    companyName: 'Excelligent LLC', industry: 'Government project management, controls and engineering professional services', location: 'Albuquerque / Los Alamos, New Mexico',
    website: 'https://www.excelligentllc.com/', contactEmail: 'info@excelligentllc.com', decisionMaker: 'Matthew Naranjo', decisionRole: 'Managing Partner',
    publicSummary: 'Public information describes Excelligent as a Veteran-Owned and Minority-Owned small business providing project management, project controls, risk and opportunity management, engineering support, training and consulting for federal agencies, national laboratories, production agencies and prime contractors in the nuclear-security enterprise.',
    fitReason: 'Excelligent sells expertise into complex government programs. Aridon can help leadership monitor pursuits, organize capture, develop evidence-grounded marketing, coordinate partner outreach and maintain a disciplined follow-up pipeline without replacing professional judgment.',
    watchItems: [
      'Monitor public nuclear-security, laboratory, project-controls and engineering-support opportunities for fit and timing.',
      'Build go/no-go pursuit briefs before leadership invests proposal and recruiting effort.',
      'Track prime-contractor, laboratory and teaming conversations with next-action ownership.',
      'Surface capability gaps, staffing dependencies and deadlines that could block a pursuit.'
    ],
    studioIdeas: [
      'Turn approved project-controls and risk-management expertise into targeted B2B and GovCon campaigns.',
      'Create recruiting, teaming and thought-leadership content from company-approved source material.',
      'Produce visual explainers for earned value, risk/opportunity management and project-control concepts for public business development.'
    ],
    sampleBrief: ['Capture: identify public opportunities matching project controls, engineering support or risk-management capabilities.','Go/No-Go: separate qualified pursuits from attractive distractions before staff time is committed.','Marketing: create a campaign aimed at primes and program leaders using only approved claims.','Operations: show open pursuits, staffing dependencies and partner follow-ups in one executive view.'],
    starterQuestions: ['Find the strongest public pursuit paths for our project-controls and engineering services.','Build a go/no-go brief for a government opportunity before we spend proposal resources.','Create a targeted prime-contractor outreach campaign based only on claims we can support.']
  },
  {
    slug: 'integration-inc-f26i', active: true, expiresAt,
    companyName: 'Integration Inc.', industry: 'Custom fabrication, electrical/mechanical manufacturing and systems integration', location: 'Albuquerque, New Mexico',
    website: 'https://www.integrationincnm.com/', contactEmail: 'Brittany@integrationinc-nm.com', decisionMaker: 'Brittany', decisionRole: 'Company contact',
    publicSummary: 'Public information describes Integration Inc. as a New Mexico women-owned small business providing custom welding, fabrication, electrical and mechanical manufacturing, systems integration and flight-simulation work, with customers including major aerospace and defense companies.',
    fitReason: 'A specialized manufacturer wins through a mix of repeat customers, prime-contractor relationships, technical quoting and visibility into new programs. Aridon can connect opportunity discovery, account research, quote follow-up and visual capability marketing around the same approved company knowledge.',
    watchItems: [
      'Identify aerospace, defense, laboratory and industrial programs that may need custom fabrication or systems-integration partners.',
      'Build target-account briefs around primes and integrators before outreach begins.',
      'Maintain a follow-up queue for quotes, capability introductions and partner conversations.',
      'Give leadership a weekly view of the best-fit accounts, open quotes, stale follow-ups and next revenue actions.'
    ],
    studioIdeas: [
      'Turn approved project photos and capability descriptions into aerospace/defense sales campaigns and capability visuals.',
      'Create customer-specific capability pages for fabrication, electrical integration, flight simulation or custom equipment.',
      'Build short visual/video explainers from owner-approved manufacturing material for trade shows and prime-contractor outreach.'
    ],
    sampleBrief: ['Accounts: identify five aerospace/defense organizations with a credible fit for Integration capabilities.','Pipeline: flag quotes and capability introductions that need a next action.','Marketing: build a focused campaign around one manufacturing capability using approved source material.','Growth: identify adjacent programs or prime relationships worth leadership attention.'],
    starterQuestions: ['Find target accounts that buy the kind of fabrication and systems-integration work we perform.','Build an account plan for approaching a major aerospace or defense prime.','Turn our approved capabilities and project material into a focused B2B campaign.']
  },
  {
    slug: 'waypoint-solutions-f26w', active: true, expiresAt,
    companyName: 'Waypoint Solutions LLC', industry: 'Federal construction, industrial supplies, equipment and facility support', location: 'Albuquerque, New Mexico / Nashville, Tennessee',
    website: 'https://waypointsols.com/', contactEmail: 'info@waypointsols.com', decisionMaker: 'Federico Berard', decisionRole: 'Managing Member',
    publicSummary: 'Public information describes Waypoint Solutions as a U.S. small business with active SAM registration offering federal construction, industrial and facility supplies, equipment solutions, subcontractor sourcing and contract/project management.',
    fitReason: 'Waypoint is early enough that a disciplined capture and supplier intelligence system can shape how it grows. Aridon can monitor solicitations, qualify opportunities, research vendors and teaming partners, create capability campaigns and maintain the founders’ follow-up clock.',
    watchItems: [
      'Continuously scan for federal solicitations matching Waypoint NAICS, geography, equipment and construction capabilities.',
      'Build a go/no-go brief with buyer, requirement, deadline, compliance clues, sourcing path and likely partner needs.',
      'Maintain supplier and subcontractor research alongside each pursuit instead of in separate spreadsheets.',
      'Give founders a daily view of qualified opportunities, pending quotes, unanswered outreach and next decisions.'
    ],
    studioIdeas: [
      'Create solicitation-specific capability outreach and teaming campaigns from approved company credentials.',
      'Build visual capability packages for construction, equipment and industrial-supply lines.',
      'Repurpose one capability statement into buyer outreach, partner emails, social content and a short company video.'
    ],
    sampleBrief: ['Opportunities: rank the federal solicitations that best match Waypoint this week.','Sourcing: identify supplier or subcontractor gaps before deciding to bid.','Marketing: create a targeted campaign for one federal buyer or teaming audience.','Follow-up: show every unanswered quote, partner inquiry and agency contact requiring action.'],
    starterQuestions: ['Find federal opportunities that match our current capabilities and tell us which ones not to chase.','Build a supplier and subcontractor plan for a promising solicitation.','Create a capability campaign aimed at federal buyers and prime contractors.']
  }
];
