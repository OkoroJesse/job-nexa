'use client';

import React, { useState } from 'react';
import { SEED_CATEGORIES, SEED_STATES } from '@/lib/mock-data';
import { FolderTree, MapPin, Plus, CheckCircle2 } from 'lucide-react';

export default function AdminTaxonomiesPage() {
  const [categories, setCategories] = useState(SEED_CATEGORIES);
  const [states, setStates] = useState(SEED_STATES);
  const [activeTab, setActiveTab] = useState<'categories' | 'states'>('categories');

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

      {activeTab === 'categories' ? (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-surface-100 flex items-center justify-between text-xs">
            <span className="font-bold text-surface-900 uppercase tracking-wider">
              Opportunity Sectors
            </span>
            <button
              onClick={() => alert('New category creation dialog')}
              className="text-xs font-bold text-primary hover:underline"
            >
              + Add Category
            </button>
          </div>

          <div className="divide-y divide-surface-100">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-surface-900 text-sm">{cat.name}</div>
                  <div className="text-surface-500 text-[11px] font-mono mt-0.5">slug: {cat.slug}</div>
                  <p className="text-surface-600 text-xs mt-1">{cat.description}</p>
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
    </div>
  );
}
