export type CodieSource = {
  id: string;
  title: string;
  url: string;
  kind: 'official-site' | 'newsletter' | 'youtube';
  note: string;
};

export type CodieModule = {
  id: string;
  title: string;
  promise: string;
  lessons: string[];
  sourceIds: string[];
  aridonExtension: string;
};

export const codieSources: CodieSource[] = [
  { id: 'ct-home', title: 'Contrarian Thinking', url: 'https://www.contrarianthinking.co/', kind: 'official-site', note: 'Current positioning around buying and scaling cash-flowing small businesses.' },
  { id: 'codie-home', title: 'Codie Sanchez', url: 'https://codiesanchez.com/', kind: 'official-site', note: 'Owner Nation, Contrarian Academy, Growth Boardroom and business-ownership positioning.' },
  { id: 'ct-about', title: 'Contrarian Thinking About / GPS', url: 'https://www.contrarianthinking.co/about', kind: 'official-site', note: 'Gameplan, People, System operating framework.' },
  { id: 'academy', title: 'Contrarian Academy', url: 'https://www.contrarianthinking.co/contrarian-academy', kind: 'official-site', note: 'Acquisition education, marketplace and 10k+ people taught.' },
  { id: 'newsletter', title: 'Contrarian Thinking Newsletter', url: 'https://ct.contrarianthinking.co/', kind: 'newsletter', note: 'Business buying, growth, financing, hiring, owner-independence and deal-repetition themes.' },
  { id: 'minute', title: 'The Main Street Minute', url: 'https://minute.contrarianthinking.co/', kind: 'newsletter', note: 'Case-study based business buying and scaling education.' },
  { id: 'portfolio-email', title: 'How We Turned 1 Email Into a Portfolio of Profitable Businesses', url: 'https://ct.contrarianthinking.co/p/how-we-turned-1-email-into-a-portfolio-of-profitable-businesses', kind: 'newsletter', note: 'Shows the media-to-advisory-to-deals flywheel and the importance of an owned audience.' },
  { id: 'five-businesses', title: 'How He Bought and Scaled 5 Businesses From the Other Side of the World', url: 'https://minute.contrarianthinking.co/p/how-he-bought-and-scaled-5-businesses-from-the-other-side-of-the-world', kind: 'newsletter', note: 'Life-first buy box, deal reps, hiring beyond the owner and operational delegation.' },
  { id: 'locksmith', title: 'How She Bought a Locksmith Business Doing $1.3M in Total Revenue', url: 'https://www.contrarianthinking.co/newsletter-articles/how-she-bought-a-locksmith-business-doing-1-3m-in-total-revenue', kind: 'newsletter', note: 'Buyer learning curve and practical acquisition education.' },
  { id: 'sba-desk', title: 'How a Career SBA Underwriter Built a Lending Desk That Makes Banks Compete', url: 'https://www.contrarianthinking.co/newsletter-articles/how-a-career-sba-underwriter-built-a-lending-desk-that-makes-banks-compete', kind: 'newsletter', note: 'Financing desk and member support around SBA structures.' },
  { id: 'youtube-strategy', title: 'COPY This Strategy To Get Rich', url: 'https://www.youtube.com/watch?v=vCzsrWaZ8Us', kind: 'youtube', note: 'Acquisition entrepreneurship: buying existing cash flow instead of starting from zero.' },
  { id: 'youtube-bp', title: 'How to Buy a Business That’ll Replace Your 9-5 w/Codie Sanchez', url: 'https://www.youtube.com/watch?v=vaKWVHk8HeU', kind: 'youtube', note: 'Boring businesses, buying a business not a job, funding deals and becoming a CEO.' },
];

export const codieModules: CodieModule[] = [
  {
    id: 'ownership',
    title: 'Ownership Before Optimization',
    promise: 'Understand the core Main Street ownership thesis before looking at listings.',
    lessons: [
      'Prefer ownership of durable cash-flowing assets over dependence on one income source.',
      'Small, ordinary businesses can be attractive because demand is understandable and operations can be improved.',
      'The goal is not simply to buy revenue. The goal is to buy a business that can produce freedom rather than another full-time job.',
    ],
    sourceIds: ['ct-home', 'codie-home', 'youtube-strategy', 'youtube-bp'],
    aridonExtension: 'Turn the ownership thesis into a measurable acquisition thesis with target industries, geography, minimum SDE, owner involvement, capital limits and risk tolerances.',
  },
  {
    id: 'buy-box',
    title: 'Build the Buy Box Around Your Life',
    promise: 'Define what should be bought before browsing what happens to be for sale.',
    lessons: [
      'Start with the life and operating model the buyer wants, then work backward into the business profile.',
      'Use clear constraints for geography, industry, size, cash flow, customer concentration, capital and owner dependence.',
      'A disciplined buy box reduces shiny-object deals and improves deal-repetition quality.',
    ],
    sourceIds: ['five-businesses', 'ct-about'],
    aridonExtension: 'Aridon converts the buy box into a saved acquisition thesis, scores listings against it and keeps the pipeline ranked by fit.',
  },
  {
    id: 'deal-reps',
    title: 'Deal Reps Before Deal Romance',
    promise: 'Learn to evaluate many opportunities before emotionally committing to one.',
    lessons: [
      'Strong buyers build pattern recognition by looking at many deals.',
      'The purpose of early screening is to reject bad deals quickly and reserve deep diligence for the few that deserve it.',
      'LOIs, seller conversations and financing conversations become better with repetition.',
    ],
    sourceIds: ['newsletter', 'five-businesses'],
    aridonExtension: 'Aridon gives every prospect the same intake, score, evidence ledger, financing screen and diligence workflow so the buyer gets repetitions without losing consistency.',
  },
  {
    id: 'underwriting',
    title: 'Underwrite the Cash Flow, Not the Story',
    promise: 'Separate seller claims from sustainable owner economics.',
    lessons: [
      'Normalize earnings before accepting a headline SDE or EBITDA number.',
      'Challenge add-backs and reconcile revenue with stronger evidence such as bank statements, tax returns, contracts and payroll.',
      'Test customer concentration, working capital, owner dependence, employee retention, recurring revenue, margins and transferability.',
      'A deal can look cheap and still be unsafe once debt service and reinvestment needs are included.',
    ],
    sourceIds: ['locksmith', 'academy'],
    aridonExtension: 'This is the Aridon Buyer Room: evidence-weighted SDE normalization, add-back challenges, underwriting scores, kill triggers and conditions before close.',
  },
  {
    id: 'financing',
    title: 'Structure the Deal, Do Not Just Price It',
    promise: 'Understand how financing and risk-sharing change what a buyer can safely pay.',
    lessons: [
      'Acquisition price is only one variable. Down payment, lender debt, seller notes, earnouts and working capital matter just as much.',
      'SBA lending can be useful for eligible transactions, but lender underwriting and cash-flow coverage still control the outcome.',
      'Seller financing can align incentives when the economics and documentation are sound.',
    ],
    sourceIds: ['sba-desk', 'youtube-bp'],
    aridonExtension: 'Aridon models alternative structures, annual debt service, coverage, cash at close, seller-note exposure and buyer cash-flow scenarios before an LOI is sent.',
  },
  {
    id: 'diligence',
    title: 'Prove What Must Be True',
    promise: 'Move from attractive narrative to evidence-backed acquisition decision.',
    lessons: [
      'Diligence should test the assumptions that make the deal work, not become a paperwork scavenger hunt.',
      'Financial, legal, tax, customer, employee, operational and technology risks should each have explicit evidence and owners.',
      'The buyer should know what conditions must be satisfied before closing and what findings would kill the deal.',
    ],
    sourceIds: ['academy', 'locksmith'],
    aridonExtension: 'Aridon maintains the diligence checklist, evidence confidence ledger, advisor gates, unresolved questions and change history in one deal workspace.',
  },
  {
    id: 'operator',
    title: 'Become the CEO, Not the New Technician',
    promise: 'Design the acquired company to work without recreating a job for the buyer.',
    lessons: [
      'The buyer has to identify owner bottlenecks and transfer critical relationships, decisions and tribal knowledge.',
      'Hire for the skills the owner should not keep doing and document repeatable operating roles.',
      'Measure success by a business that becomes more transferable and less dependent on one person.',
    ],
    sourceIds: ['youtube-bp', 'five-businesses', 'newsletter'],
    aridonExtension: 'Aridon converts underwriting weaknesses into a 100-day takeover plan with stabilization, delegation, documentation and value-creation tasks.',
  },
  {
    id: 'growth',
    title: 'Grow the Boring Business Intelligently',
    promise: 'Find practical growth without breaking what made the acquisition valuable.',
    lessons: [
      'Stabilize the core before piling on complexity.',
      'Look for pricing, referral, upsell, cross-sell, partnerships, sales follow-up, digital visibility and operational improvements.',
      'Build a company that is more profitable and more sellable, even if there is no plan to sell it.',
    ],
    sourceIds: ['ct-about', 'newsletter', 'codie-home'],
    aridonExtension: 'Aridon runs the acquired business through Growth Command, Marketing Autopilot, AI Visibility, website analysis and revenue attribution after close.',
  },
  {
    id: 'flywheel',
    title: 'Media → Education → Community → Deals',
    promise: 'Understand the broader Contrarian Thinking business machine.',
    lessons: [
      'A useful free audience can feed education, events, advisory, marketplaces and investment opportunities.',
      'An owned newsletter compounds because the relationship is not controlled by a social platform.',
      'Case studies turn member outcomes into both teaching material and proof for the next buyer.',
    ],
    sourceIds: ['portfolio-email', 'minute', 'newsletter', 'codie-home'],
    aridonExtension: 'Aridon can connect content, student learning, deal analysis, financing, diligence, member progress and post-close growth into one measurable operating system.',
  },
];

export const codiePublicCorpusSummary = codieModules
  .map((module) => `${module.title}: ${module.lessons.join(' ')} ARIDON EXTENSION: ${module.aridonExtension}`)
  .join('\n\n');

export function codieModule(id: string) {
  return codieModules.find((module) => module.id === id) || codieModules[0];
}
