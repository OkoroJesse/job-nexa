'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SEED_OPPORTUNITIES } from '@/lib/mock-data';
import { 
  Briefcase, 
  Sparkles, 
  MapPin, 
  Plus, 
  Edit3, 
  ExternalLink, 
  Filter, 
  CheckCircle2, 
  EyeOff, 
  Trash2 
} from 'lucide-react';

export default function AdminOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState(SEED_OPPORTUNITIES);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const toggleFeatured = (id: string) => {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, is_featured: !o.is_featured } : o))
    );
  };

  const toggleLocked = (id: string) => {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, is_locked: !o.is_locked } : o))
    );
  };

  const filteredOpportunities = opportunities.filter((opp) => {
    if (typeFilter !== 'all' && opp.opportunity_type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
            Opportunities & Content Catalog
          </h1>
          <p className="text-xs sm:text-sm text-surface-500 mt-1">
            Manage corporate jobs, scholarships, NYSC PPAs, graduate trainees, and remote USD roles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/opportunities/new"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-sm flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Opportunity</span>
          </Link>
          <Link
            href="/admin/import-centre"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-surface-900 hover:bg-surface-800 text-white shadow-sm flex items-center gap-2 shrink-0"
          >
            <span>Import Centre</span>
          </Link>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-surface-700 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-primary" />
            <span>Vertical:</span>
          </span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1 text-xs text-surface-800 bg-surface-50 border border-surface-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Opportunity Types</option>
            <option value="full_time">Full-time Roles</option>
            <option value="nysc_ppa">NYSC PPAs</option>
            <option value="graduate_trainee">Graduate Trainees</option>
            <option value="scholarship">Academic Scholarships</option>
            <option value="grant">SME Grants & Funding</option>
            <option value="internship">Internships</option>
          </select>
        </div>

        <span className="text-surface-500">
          Showing <strong>{filteredOpportunities.length}</strong> listings
        </span>
      </div>

      {/* Table Listing */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-surface-100">
          {filteredOpportunities.map((opp) => (
            <div key={opp.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm text-surface-900">{opp.title}</span>
                  {opp.is_featured && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      ★ Featured
                    </span>
                  )}
                  {opp.is_locked ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-100 text-surface-700">
                      Locked (₦3,500 Pass)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800">
                      Public Free Apply
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-surface-500 text-xs">
                  <span className="font-semibold text-primary">{opp.organization_name}</span>
                  <span>•</span>
                  <span>{opp.city || (opp.state ? opp.state.name : 'Nigeria')}</span>
                  <span>•</span>
                  <span>Views: {opp.views_count}</span>
                  <span>•</span>
                  <span className="font-mono text-[11px] text-surface-400">/{opp.slug}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleFeatured(opp.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
                    opp.is_featured
                      ? 'border-amber-300 bg-amber-50 text-amber-800'
                      : 'border-surface-200 hover:bg-surface-50 text-surface-600'
                  }`}
                  title="Toggle Featured Pin"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{opp.is_featured ? 'Unpin' : 'Pin'}</span>
                </button>

                <button
                  onClick={() => toggleLocked(opp.id)}
                  className="px-2.5 py-1.5 rounded-lg border border-surface-200 hover:bg-surface-50 text-surface-600 text-xs font-medium"
                  title="Toggle Paywall Gating"
                >
                  {opp.is_locked ? 'Set to Public Free' : 'Lock behind ₦3,500'}
                </button>

                <Link
                  href={`/admin/opportunities/${opp.id}/edit`}
                  className="px-3 py-1.5 rounded-lg border border-surface-200 hover:bg-surface-50 text-surface-700 font-semibold flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5 text-surface-400" />
                  <span>Edit</span>
                </Link>

                <Link
                  href={`/jobs/${opp.slug}`}
                  target="_blank"
                  className="p-1.5 rounded-lg border border-surface-200 hover:bg-surface-50 text-surface-600"
                  title="View Live Listing"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
