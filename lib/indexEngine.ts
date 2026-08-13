export type IndexEnginePage = {
  url: string;
  title: string;
  description: string;
  headings: string[];
  text: string;
};

export type IndexEngineInput = {
  pages: IndexEnginePage[];
  navigation: string[];
  knowledge: string;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function buildIndexEngine(input: IndexEngineInput) {
  const pageIndex = input.pages.map((page) => {
    const missing: string[] = [];
    if (page.title.trim().length < 12) missing.push('title');
    if (page.description.trim().length < 50) missing.push('description');
    if (!page.headings.length) missing.push('headings');

    const score = clamp(
      35 +
      (page.title.trim().length >= 12 ? 20 : 0) +
      (page.description.trim().length >= 50 ? 20 : 0) +
      (page.headings.length ? 15 : 0) +
      (page.text.trim().length >= 500 ? 10 : 0),
    );

    return {
      url: page.url,
      title: page.title || page.url,
      score,
      status: missing.length ? 'needs-work' : 'ready',
      missing,
    };
  });

  const total = Math.max(1, pageIndex.length);
  const readyPages = pageIndex.filter((page) => page.status === 'ready').length;
  const describedPages = input.pages.filter((page) => page.description.trim().length >= 50).length;
  const headingPages = input.pages.filter((page) => page.headings.length > 0).length;

  const searchReadiness = clamp(
    30 +
      (readyPages / total) * 35 +
      (describedPages / total) * 20 +
      (input.navigation.length ? 15 : 0),
  );

  const aiReadiness = clamp(
    35 +
      (headingPages / total) * 25 +
      (describedPages / total) * 20 +
      (input.knowledge.length >= 2500 ? 20 : 0),
  );

  const issues: string[] = [];
  const recommendedFixes: string[] = [];

  if (readyPages < pageIndex.length) {
    issues.push(`${pageIndex.length - readyPages} scanned page${pageIndex.length - readyPages === 1 ? '' : 's'} need indexing cleanup.`);
    recommendedFixes.push('Repair missing titles, descriptions, and heading structure before requesting recrawls.');
  }

  if (!input.navigation.length) {
    issues.push('Very little crawlable internal navigation was detected.');
    recommendedFixes.push('Strengthen internal links between service, proof, location, and contact pages.');
  }

  if (describedPages < input.pages.length) {
    recommendedFixes.push('Write a unique search description for every important page.');
  }

  recommendedFixes.push('Generate and validate sitemap.xml, robots.txt, canonical URLs, and appropriate structured data.');
  recommendedFixes.push('Connect the site owner’s search-platform accounts before any external submission or monitoring step.');

  return {
    engine: 'Aridon Index Engine',
    status: 'active',
    indexedAt: new Date().toISOString(),
    pagesIndexed: pageIndex.length,
    readyPages,
    searchReadiness,
    aiReadiness,
    pageIndex,
    issues: issues.slice(0, 6),
    recommendedFixes: recommendedFixes.slice(0, 7),
    submissionChannels: [
      {
        name: 'Aridon Internal Index',
        status: 'active',
        detail: 'Scanned pages are cataloged for Aridon analysis and executive workflows.',
      },
      {
        name: 'XML Sitemap',
        status: 'prepare',
        detail: 'Prepare and validate the business sitemap before external submission.',
      },
      {
        name: 'Search Platform Connection',
        status: 'connect',
        detail: 'Owner authorization is required before Aridon can submit or monitor external indexing.',
      },
    ],
    note: 'External search-engine inclusion is not guaranteed. Aridon can prepare eligible pages, use owner-authorized channels, and monitor results.',
  };
}
