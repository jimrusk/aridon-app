import type { MetadataRoute } from 'next';
import { getStoreContext } from '../lib/storefront';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://aridon-v02.vercel.app').replace(/\/$/, '');
  const now = new Date();
  const core: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/crossroads`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/analyze-business`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/ai-visibility`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/investor-signal`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/business-os/proof`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/grid-intelligence`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
  ];

  try {
    const store = await getStoreContext();
    const categories: MetadataRoute.Sitemap = store.categories.map((category) => ({
      url: `${base}/shop/${category.slug}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    }));
    const products: MetadataRoute.Sitemap = store.products.map((product) => ({
      url: `${base}/shop/product/${product.slug}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    }));
    return [...core, ...categories, ...products];
  } catch {
    return core;
  }
}
