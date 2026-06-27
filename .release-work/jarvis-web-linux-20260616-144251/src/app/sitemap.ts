import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.jarvisai.com.cn';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const publicRoutes = [
    '/',
    '/features',
    '/docs',
    '/store',
    '/support',
    '/feedback',
  ];

  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority: route === '/' ? 1 : 0.7,
  }));
}
