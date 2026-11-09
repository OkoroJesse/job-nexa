import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jobnexa.ng';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/jobs',
          '/jobs/',
          '/opportunities',
          '/opportunities/',
          '/categories',
          '/locations',
          '/about',
          '/contact',
          '/blog',
          '/blog/',
          '/pricing',
          '/register',
          '/login',
        ],
        disallow: [
          '/admin',
          '/admin/',
          '/dashboard',
          '/dashboard/',
          '/api/',
          '/_next/',
          '/private/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
