import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://aridon-v02.vercel.app';
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/crossroads`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/analyze-business`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/ai-visibility`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/investor-signal`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/business-os/proof`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/grid-intelligence`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];
}
