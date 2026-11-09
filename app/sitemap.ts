import { MetadataRoute } from 'next';
import { SEED_OPPORTUNITIES, SEED_STATES, SEED_CATEGORIES } from '@/lib/mock-data';
import { BLOG_POSTS } from '@/lib/blog-data';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://jobnexa.ng';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── Static pages ───────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/jobs`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/opportunities`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/categories`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/locations`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];

  // ── Opportunity / job pages ────────────────────────────────────────────────
  const jobPages: MetadataRoute.Sitemap = SEED_OPPORTUNITIES.map((job) => ({
    url: `${BASE_URL}/jobs/${job.slug}`,
    lastModified: job.published_at ? new Date(job.published_at) : now,
    changeFrequency: 'weekly' as const,
    priority: job.is_featured ? 0.85 : 0.75,
  }));

  // ── State / location pages ─────────────────────────────────────────────────
  const statePages: MetadataRoute.Sitemap = SEED_STATES.map((state) => ({
    url: `${BASE_URL}/locations/${state.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // ── Category pages ─────────────────────────────────────────────────────────
  const categoryPages: MetadataRoute.Sitemap = SEED_CATEGORIES.map((cat) => ({
    url: `${BASE_URL}/categories/${cat.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.65,
  }));

  // ── Blog post pages ────────────────────────────────────────────────────────
  // BlogPost uses a `date` string field, not published_at / updated_at
  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...jobPages,
    ...statePages,
    ...categoryPages,
    ...blogPages,
  ];
}
