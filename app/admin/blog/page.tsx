'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BLOG_POSTS, BlogPost } from '@/lib/blog-data';
import { BookOpen, Plus, Calendar, Eye, CheckCircle2, Edit3, Trash2 } from 'lucide-react';

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>(BLOG_POSTS);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Career Advice');
  const [newContent, setNewContent] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    const newPost: BlogPost = {
      slug: newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      title: newTitle,
      excerpt: newContent.substring(0, 150) + '...',
      category: newCategory,
      date: 'Today',
      readTime: '5 min read',
      content: newContent,
    };

    setPosts([newPost, ...posts]);
    setIsCreating(false);
    setNewTitle('');
    setNewContent('');
    alert('Blog post published to public Editorial section!');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
            Editorial CMS & Career Advisory
          </h1>
          <p className="text-xs sm:text-sm text-surface-500 mt-1">
            Publish anti-scam guides, NYSC playbooks, and career advice to drive organic traffic.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-sm flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Write New Article</span>
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-100">
            <h3 className="text-sm font-bold text-surface-900">New Editorial Article</h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-xs text-surface-400 hover:text-surface-600"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Article Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Navigating Corporate Interviews in Lagos..."
                className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Job Search Safety">Job Search Safety</option>
                <option value="NYSC & Youth Growth">NYSC & Youth Growth</option>
                <option value="Remote Work">Remote Work</option>
                <option value="Career Advice">Career Advice</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">Article Body (Markdown)</label>
            <textarea
              rows={8}
              required
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Write the full career article here..."
              className="w-full p-3 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-sans"
            ></textarea>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-primary text-white"
          >
            Publish Article
          </button>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-surface-100 flex items-center justify-between text-xs">
          <span className="font-bold text-surface-900 uppercase tracking-wider">
            Published Articles ({posts.length})
          </span>
          <span className="text-surface-500 font-semibold">SEO Optimized</span>
        </div>

        <div className="divide-y divide-surface-100">
          {posts.map((post) => (
            <div key={post.slug} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-surface-900">{post.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary-light text-primary">
                    {post.category}
                  </span>
                </div>
                <div className="text-surface-500 text-xs flex items-center gap-3">
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  className="px-3 py-1.5 rounded-lg border border-surface-200 hover:bg-surface-50 text-surface-700 font-semibold flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Read on Site</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
