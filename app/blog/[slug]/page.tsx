import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BLOG_POSTS } from '@/lib/blog-data';
import { Calendar, ArrowLeft, ShieldCheck, Share2 } from 'lucide-react';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-500 hover:text-primary transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Articles</span>
      </Link>

      <div className="space-y-4">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary-light text-primary">
          {post.category}
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight leading-snug">
          {post.title}
        </h1>
        <div className="flex items-center gap-4 text-xs text-surface-500 pb-4 border-b border-surface-200">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {post.date}
          </span>
          <span>•</span>
          <span>{post.readTime}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-10 shadow-sm text-sm sm:text-base text-surface-700 leading-relaxed whitespace-pre-line space-y-4">
        {post.content}
      </div>

      <div className="bg-surface-100 p-6 rounded-2xl border border-surface-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-surface-900">Protect Yourself with JobNexa</h4>
          <p className="text-xs text-surface-600 mt-0.5">
            Get direct, verified employer contacts with our 30-Day Pro Pass (₦3,500).
          </p>
        </div>
        <Link
          href="/pricing"
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white transition shadow-sm shrink-0"
        >
          View Pricing (₦3,500)
        </Link>
      </div>
    </article>
  );
}
