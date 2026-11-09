import React from 'react';
import Link from 'next/link';
import { Calendar, ArrowRight, BookOpen } from 'lucide-react';
import { BLOG_POSTS } from '@/lib/blog-data';

export default function BlogIndexPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="border-b border-surface-200 pb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider mb-2">
          <BookOpen className="w-4 h-4 text-brand-500" />
          <span>JobNexa Insights & Advisory</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight">
          Career Guides, NYSC Survival & Anti-Scam Tips
        </h1>
        <p className="text-sm sm:text-base text-surface-600 mt-2 max-w-2xl">
          Actionable advice from seasoned recruiters, HR directors, and Nigerian tech leaders.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {BLOG_POSTS.map((post) => (
          <article
            key={post.slug}
            className="bg-white rounded-2xl border border-surface-200 hover:border-primary hover:shadow-md transition p-6 flex flex-col justify-between"
          >
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-light text-primary mb-3">
                {post.category}
              </span>

              <h2 className="text-base sm:text-lg font-bold text-surface-900 leading-snug hover:text-primary transition">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>

              <p className="text-xs sm:text-sm text-surface-600 mt-2 line-clamp-3 leading-relaxed">
                {post.excerpt}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-surface-100 flex items-center justify-between text-xs text-surface-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {post.date}
              </span>

              <Link
                href={`/blog/${post.slug}`}
                className="font-bold text-primary hover:underline flex items-center gap-1"
              >
                Read Article
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
