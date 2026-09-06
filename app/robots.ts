import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: 'https://aridon-v02.vercel.app/sitemap.xml',
    host: 'https://aridon-v02.vercel.app',
  };
}
