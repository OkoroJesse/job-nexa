'use client';

import React, { useState, useEffect } from 'react';
import { FolderTree, MapPin, Plus, CheckCircle2, Loader2, X } from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_featured: boolean;
  sort_order: number;
}

interface StateItem {
  id: string;
  name: string;
  slug: string;
  geopolitical_zone: string;
  is_active: boolean;
}

export default function AdminTaxonomiesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [states, setStates] = useState<StateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'categories' | 'states'>('categories');

  // Modal for new category
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatFeatured, setNewCatFeatured] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTaxonomies();
  }, []);

  const fetchTaxonomies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/taxonomies');
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories || []);
        setStates(data.states || []);
      }
    } catch (e) {
      console.error('Error fetching taxonomies:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/taxonomies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName.trim(),
          description: newCatDesc.trim(),
          is_featured: newCatFeatured,
        }),
      });

      const data = await res.json();
      if (res.ok && data.category) {
        setCategories((prev) => [...prev, data.category]);
        setIsAddModalOpen(false);
        setNewCatName('');
        setNewCatDesc('');
        setNewCatFeatured(false);
      } else {
        alert(data.error || 'Failed to create category');
      }
    } catch {
      alert('Error creating category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
          Taxonomies & Regional Directory
        </h1>
        <p className="text-xs sm:text-sm text-surface-500 mt-1">
          Manage opportunity industry sectors and all 36 Nigerian States + FCT.
        </p>
      </div>

      <div className="flex items-center gap-2 border-b border-surface-200 pb-3">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'categories'
              ? 'bg-primary text-white shadow-sm'
              : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
          }`}
        >
          Opportunity Categories ({categories.length})
        </button>

        <button
          onClick={() => setActiveTab('states')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'states'
              ? 'bg-primary text-white shadow-sm'
              : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
          }`}
        >
          Nigerian States & FCT ({states.length})
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-12 text-center text-surface-400 flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-xs">Loading taxonomies from database...</p>
        </div>
      ) : activeTab === 'categories' ? (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-surface-100 flex items-center justify-between text-xs">
            <span className="font-bold text-surface-900 uppercase tracking-wider">
              Opportunity Sectors
            </span>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="p-8 text-center text-xs text-surface-500">
              No categories found. Click &quot;Add Category&quot; to create one.
            </div>
          ) : (
            <div className="divide-y divide-surface-100">
              {categories.map((cat) => (
                <div key={cat.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-surface-900 text-sm">{cat.name}</div>
                    <div className="text-surface-500 text-[11px] font-mono mt-0.5">slug: {cat.slug}</div>
                    {cat.description && <p className="text-surface-600 text-xs mt-1">{cat.description}</p>}
                  </div>
                  <div className="text-right">
                    {cat.is_featured && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        ★ Featured on Home
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-surface-100 flex items-center justify-between text-xs">
            <span className="font-bold text-surface-900 uppercase tracking-wider">
              All 36 States + Federal Capital Territory (FCT)
            </span>
            <span className="text-surface-500 font-semibold">100% Nationwide Reach</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 divide-y sm:divide-y-0 sm:gap-2 p-4">
            {states.map((st) => (
              <div key={st.id} className="p-3 rounded-xl border border-surface-100 bg-surface-50/50 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-surface-900">{st.name}</div>
                  <div className="text-[11px] text-surface-500">{st.geopolitical_zone} Zone</div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active location"></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-surface-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-surface-900">Add New Category</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-surface-400 hover:text-surface-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-surface-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Healthcare & Medicine"
                  className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-surface-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Brief description of the sector..."
                  className="w-full p-3 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newCatFeatured}
                  onChange={(e) => setNewCatFeatured(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                <span className="font-semibold text-surface-700">Feature on Homepage</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-surface-600 hover:bg-surface-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
