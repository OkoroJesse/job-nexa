import { MetadataRoute } from 'next';
import { getOpportunities, getStates, getCategories } from '@/lib/opportunities';
import { BLOG_POSTS } from '@/lib/blog-data';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://jobnexa.ng';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 1. Static platform pages
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

  // 2. Dynamic live opportunities
  const opportunities = await getOpportunities();
  const jobPages: MetadataRoute.Sitemap = opportunities.map((job) => ({
    url: `${BASE_URL}/jobs/${job.slug}`,
    lastModified: job.published_at ? new Date(job.published_at) : now,
    changeFrequency: 'weekly' as const,
    priority: job.is_featured ? 0.85 : 0.75,
  }));

  // 3. Dynamic 36 Nigerian States + FCT
  const states = await getStates();
  const statePages: MetadataRoute.Sitemap = states.map((state) => ({
    url: `${BASE_URL}/jobs?state=${state.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // 4. Dynamic Categories
  const categories = await getCategories();
  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${BASE_URL}/jobs?category=${cat.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.65,
  }));

  // 5. Blog Posts
  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...jobPages, ...statePages, ...categoryPages, ...blogPages];
}
