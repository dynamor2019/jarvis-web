import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.jarvisai.com.cn';

export default function robots(): MetadataRoute.Robots {
  const disallowPrivate = [
    '/admin/',
    '/api/',
    '/dashboard/',
    '/settings/',
    '/payment/',
    '/login',
    '/auth/',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowPrivate,
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: disallowPrivate,
      },
      {
        userAgent: 'CCBot',
        allow: '/',
        disallow: disallowPrivate,
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: disallowPrivate,
      },
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: disallowPrivate,
      },
      {
        userAgent: 'Bytespider',
        allow: '/',
        disallow: disallowPrivate,
      },
      {
        userAgent: 'Baiduspider',
        allow: '/',
        disallow: disallowPrivate,
      },
      {
        userAgent: '360Spider',
        allow: '/',
        disallow: disallowPrivate,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
