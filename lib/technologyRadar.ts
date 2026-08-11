export const radarCategories = [
  'AI models & reasoning',
  'Agent platforms & automation',
  'Video, image & voice generation',
  'Developer tools & infrastructure',
  'Search, research & knowledge systems',
  'Security, identity & governance',
  'CRM, sales & marketing technology',
  'Finance, analytics & operations tools',
  'Robotics, edge AI & physical systems',
  'Standards, APIs & interoperability'
] as const;

export const radarDecisions = [
  { id: 'use', label: 'USE IT', meaning: 'Adopt directly because it creates immediate advantage.' },
  { id: 'integrate', label: 'INTEGRATE IT', meaning: 'Connect it to Aridon as a specialist capability or provider.' },
  { id: 'beat', label: 'BEAT IT', meaning: 'Build an Aridon-native capability that should outperform the relevant workflow.' },
  { id: 'watch', label: 'WATCH IT', meaning: 'Promising, but not mature or important enough to act on yet.' },
  { id: 'ignore', label: 'IGNORE IT', meaning: 'Low strategic value, poor fit, or unnecessary duplication.' }
] as const;

export const radarQuestions = [
  'Does this materially improve what Aridon can do for a business?',
  'Does it create a capability customers will pay for or depend on?',
  'Can Aridon integrate it faster and better than rebuilding it?',
  'Does it threaten an existing Aridon advantage?',
  'Is the provider stable, safe, affordable, and commercially usable?',
  'What measurable outcome would justify adopting it?',
  'Can it be benchmarked against Aridon before we trust it?'
];
