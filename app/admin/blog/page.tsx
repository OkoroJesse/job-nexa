'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Calendar, Eye, CheckCircle2, Edit3, Trash2, Loader2 } from 'lucide-react';

interface BlogPostItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  read_time_minutes?: number;
  published_at?: string;
  created_at: string;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Career Advice');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/blog');
      const data = await res.json();
      if (res.ok && data.posts) {
        setPosts(data.posts);
      }
    } catch (e) {
      console.warn('Error fetching blog posts:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          content: newContent.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.post) {
        setPosts((prev) => [data.post, ...prev]);
        setIsCreating(false);
        setNewTitle('');
        setNewContent('');
        alert('Blog post published live to public Editorial section!');
      } else {
        alert(data.error || 'Failed to publish post');
      }
    } catch {
      alert('Error creating blog post');
    } finally {
      setSubmitting(false);
    }
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
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-sm flex items-center gap-2 shrink-0 transition"
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
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white transition disabled:opacity-50"
          >
            {submitting ? 'Publishing...' : 'Publish Article'}
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

        {loading ? (
          <div className="p-12 text-center text-surface-400 flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs">Loading articles from database...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-surface-300 mx-auto" />
            <div className="text-sm font-bold text-surface-900">No articles published yet</div>
            <p className="text-xs text-surface-500 max-w-sm mx-auto">
              Click &quot;Write New Article&quot; to publish your first anti-scam guide or career advisory.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {posts.map((post) => (
              <div key={post.id || post.slug} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-surface-900">{post.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary-light text-primary">
                      {post.category}
                    </span>
                  </div>
                  <div className="text-surface-500 text-xs flex items-center gap-3">
                    <span>{new Date(post.published_at || post.created_at).toLocaleDateString('en-GB')}</span>
                    <span>•</span>
                    <span>{post.read_time_minutes || 5} min read</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-lg border border-surface-200 hover:bg-surface-50 text-surface-700 font-semibold flex items-center gap-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Read on Site</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
