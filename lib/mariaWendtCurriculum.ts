export type MariaSource = {
  id: string;
  title: string;
  url: string;
  kind: 'official-site' | 'course-catalog' | 'support' | 'youtube' | 'sales-page';
  note: string;
};

export type MariaModule = {
  id: string;
  title: string;
  promise: string;
  lessons: string[];
  sourceIds: string[];
  aridonExtension: string;
};

export const mariaSources: MariaSource[] = [
  {
    id: 'home',
    title: 'MariaWendt.com Course Shop',
    url: 'https://www.mariawendt.com/',
    kind: 'official-site',
    note: 'Primary catalog for Maria Wendt business and marketing courses, with current positioning around practical online-business education.',
  },
  {
    id: 'shop',
    title: 'Maria Wendt Full Shop',
    url: 'https://www.mariawendt.com/shop/',
    kind: 'official-site',
    note: 'Broad product ladder spanning Instagram, digital products, email, copywriting, launches, ads, automation, YouTube, hiring and mindset.',
  },
  {
    id: 'catalog',
    title: 'Maria Wendt Course Catalog 2026',
    url: 'https://www.mariawendt.com/wp-content/uploads/2026/01/Maria-Wendt-Course-Catalog-5.pdf',
    kind: 'course-catalog',
    note: 'Organizes Maria’s public education across digital products, audience building, automation, copywriting, launch, ads, email, team building and coaching.',
  },
  {
    id: 'digital-products',
    title: 'How To Start Selling Digital Products',
    url: 'https://learn.coachmariawendt.com/digital-products-business/',
    kind: 'sales-page',
    note: 'Public training page centered on product selection, a profitable niche, first sales, simple automation and scaling digital-product volume.',
  },
  {
    id: 'instagram-bundle',
    title: 'Get Paid With Instagram Course Bundle',
    url: 'https://enroll.coachmariawendt.com/',
    kind: 'sales-page',
    note: 'Public explanation of Maria’s Instagram framework: simple funnel, stories, Trial Reels, content, automations and paid promotion.',
  },
  {
    id: 'copywriting',
    title: 'Words Into Money',
    url: 'https://www.mariawendt.com/product/words-into-money-our-copywriting-course/',
    kind: 'official-site',
    note: 'Public course description covering persuasive copy across Instagram, email, Facebook, landing pages, checkout pages and ads.',
  },
  {
    id: 'coaching',
    title: 'Maria Wendt Coaching Group',
    url: 'https://www.mariawendt.com/product/maria-wendt-coaching-group/',
    kind: 'official-site',
    note: 'Community and coaching layer with questions, live calls, support, networking, prior trainings and product offers.',
  },
  {
    id: 'course-path',
    title: 'Which Course Should I Start With?',
    url: 'https://mariawendt-help.freshdesk.com/support/solutions/articles/158000421081-which-course-should-i-start-with-',
    kind: 'support',
    note: 'Public routing logic that recommends a starting course based on a learner’s goal: digital products, Instagram, ads or copywriting.',
  },
  {
    id: 'gameplan',
    title: 'Get Clients Now Program',
    url: 'https://mariawendt.com/get-clients-now/',
    kind: 'sales-page',
    note: 'Public recurring support offer built around a custom gameplan, regular coaching, daily support, community and client acquisition.',
  },
  {
    id: 'youtube',
    title: 'Maria Wendt YouTube Channel',
    url: 'https://www.youtube.com/@mariawendt',
    kind: 'youtube',
    note: 'Public video library on digital products, social media, business growth, audience building and creator monetization.',
  },
];

export const mariaModules: MariaModule[] = [
  {
    id: 'business-model',
    title: 'Choose What You Can Credibly Teach',
    promise: 'Start with a useful topic, a real customer problem and knowledge you can actually deliver.',
    lessons: [
      'A digital-product business begins with a clear topic or skill that can help a defined group of people.',
      'The offer should solve a concrete problem rather than exist only because the format is easy to make.',
      'Keep the first version simple enough to build, sell and improve quickly.',
    ],
    sourceIds: ['digital-products', 'home'],
    aridonExtension: 'Aridon can turn the creator’s expertise, audience questions and product history into an Offer Map that scores product ideas by demand, proof, margin, speed to build and cross-sell potential.',
  },
  {
    id: 'product-ladder',
    title: 'Build a Product Ladder, Not One Course',
    promise: 'Use multiple price points and formats so a buyer has a logical next step.',
    lessons: [
      'Maria’s public catalog spans very low-cost worksheets and templates, entry-level tactical products, full courses and coaching.',
      'A broad catalog lets different customers enter at different levels of readiness and budget.',
      'Upsells and adjacent offers can increase customer value when they genuinely solve the next problem.',
    ],
    sourceIds: ['shop', 'catalog'],
    aridonExtension: 'Aridon can organize the catalog into entry, core, expansion and coaching tiers, then recommend the next best offer based on what the learner has purchased, completed and asked about.',
  },
  {
    id: 'instagram-funnel',
    title: 'Turn Instagram Attention Into Sales',
    promise: 'Connect content, stories, calls to action and simple automation into one repeatable funnel.',
    lessons: [
      'Audience growth and monetization are separate jobs and should be designed together.',
      'Short-form content can attract new people while Stories and direct-response calls to action move interested viewers toward an offer.',
      'Simple automation can reduce repetitive manual follow-up without replacing the creator’s judgment.',
    ],
    sourceIds: ['instagram-bundle', 'shop'],
    aridonExtension: 'Aridon can monitor the content-to-lead-to-sale path, surface which hooks and offers create buyers, and draft the next content, DM, email and offer sequence for approval.',
  },
  {
    id: 'audience-growth',
    title: 'Grow With Repeatable Content Experiments',
    promise: 'Treat audience growth as a testable operating system instead of hoping one post goes viral.',
    lessons: [
      'Different formats can serve different stages of the audience funnel.',
      'Testing many hooks and creative approaches builds pattern recognition about what earns attention.',
      'A creator should keep the production process simple enough to publish consistently.',
    ],
    sourceIds: ['instagram-bundle', 'youtube'],
    aridonExtension: 'Aridon can create an experiment ledger for hooks, topics, formats, retention, clicks, leads and sales, then recommend what should be repeated, revised or retired.',
  },
  {
    id: 'copywriting',
    title: 'Use Words to Move a Buyer',
    promise: 'Match the message to the buyer’s problem, platform and decision stage.',
    lessons: [
      'Persuasive copy requires clarity about the buyer, the desired action and the reason to act now.',
      'Instagram, email, Facebook, landing pages, checkout pages and ads each need different formatting and emphasis.',
      'Strong copy should make the offer easier to understand rather than merely louder.',
    ],
    sourceIds: ['copywriting'],
    aridonExtension: 'Aridon can become the brand-trained copy desk, preserving approved claims and tone while adapting one idea into platform-specific posts, emails, landing pages, checkout copy and ads.',
  },
  {
    id: 'email',
    title: 'Own the Relationship Beyond Social Media',
    promise: 'Move interested followers into an audience the business can nurture directly.',
    lessons: [
      'Email gives the business a direct relationship with people who have opted in rather than relying only on a social algorithm.',
      'Campaigns and automated sequences can educate, launch, follow up and re-engage customers.',
      'The message should reflect what the subscriber has shown interest in, not send everyone the same thing forever.',
    ],
    sourceIds: ['shop', 'catalog'],
    aridonExtension: 'Aridon can unify social activity, purchases, course progress and questions into audience segments, then draft lifecycle email journeys and identify which sequences actually create revenue.',
  },
  {
    id: 'launches',
    title: 'Run Focused Revenue Events',
    promise: 'Use concentrated launches and promotions with a clear offer, deadline and follow-up plan.',
    lessons: [
      'A launch works best when the product, message, audience and promotional window are coordinated.',
      'Short revenue events can concentrate attention and make results easier to analyze.',
      'The post-launch review matters because it turns one promotion into a better playbook for the next one.',
    ],
    sourceIds: ['shop', 'catalog'],
    aridonExtension: 'Aridon can build the launch calendar, draft the asset set, create an approval queue, monitor leading indicators during the launch and write the post-mortem with specific changes for the next cycle.',
  },
  {
    id: 'automation',
    title: 'Automate Repetition, Keep the Human Judgment',
    promise: 'Use automation for routing and follow-up while keeping offers, claims and customer care under control.',
    lessons: [
      'Automations can connect comments, DMs, email and sales pages so interested prospects receive the right next step faster.',
      'Automation should reduce busywork without creating a confusing customer journey.',
      'High-value or sensitive situations should still escalate to a human.',
    ],
    sourceIds: ['instagram-bundle', 'digital-products', 'shop'],
    aridonExtension: 'Aridon can orchestrate approved cross-channel workflows, detect handoff conditions and keep a full record of what was sent, why it was sent and what revenue or support outcome followed.',
  },
  {
    id: 'coaching',
    title: 'Turn Courses Into Ongoing Implementation Support',
    promise: 'Help learners get unstuck after they consume the training.',
    lessons: [
      'A course gives the framework, while a coaching community helps people apply it to individual situations.',
      'Questions and coaching calls reveal recurring obstacles that can improve future curriculum.',
      'Support and community can make a broad product catalog easier to navigate.',
    ],
    sourceIds: ['coaching', 'course-path', 'gameplan'],
    aridonExtension: 'Aridon can answer routine source-grounded questions instantly, route complex cases to Maria or her team, summarize recurring student problems and recommend which lesson, product or live call should come next.',
  },
  {
    id: 'creator-os',
    title: 'Turn the Teaching Business Into an Operating System',
    promise: 'Connect content, products, students, support, launches and analytics so the creator can scale without manually carrying every interaction.',
    lessons: [
      'The public business already spans products, courses, community, social channels, email, live support and promotions.',
      'The next leverage layer is not another isolated tool but a shared operating model across those systems.',
      'A teaching avatar is most useful when it can answer from approved knowledge and hand the learner into real workflows, offers and human support.',
    ],
    sourceIds: ['home', 'catalog', 'coaching', 'youtube'],
    aridonExtension: 'Aridon becomes the Creator OS: public-knowledge ingestion, AI teacher, content factory, audience intelligence, product recommendation, launch command, student support, revenue attribution and human escalation in one system.',
  },
];

export const mariaPublicCorpusSummary = mariaModules
  .map((module) => `${module.title}: ${module.lessons.join(' ')} ARIDON EXTENSION: ${module.aridonExtension}`)
  .join('\n\n');

export function mariaModule(id: string) {
  return mariaModules.find((module) => module.id === id) || mariaModules[0];
}
