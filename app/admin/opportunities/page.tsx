'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Trash2,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface OpportunityItem {
  id: string;
  title: string;
  slug: string;
  organization_name: string;
  opportunity_type: string;
  city?: string;
  is_featured: boolean;
  is_locked: boolean;
  views_count: number;
  status: string;
  state?: { name: string } | null;
  category?: { name: string } | null;
}

export default function AdminOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/opportunities');
      const data = await res.json();
      if (res.ok && data.opportunities) {
        setOpportunities(data.opportunities);
      } else {
        setError(data.error || 'Failed to load opportunities');
      }
    } catch {
      setError('Network error while loading opportunities');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatured = async (id: string, currentVal: boolean) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !currentVal }),
      });
      if (res.ok) {
        setOpportunities((prev) =>
          prev.map((o) => (o.id === id ? { ...o, is_featured: !currentVal } : o))
        );
      } else {
        alert('Failed to update featured status');
      }
    } catch {
      alert('Error updating featured status');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleLocked = async (id: string, currentVal: boolean) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_locked: !currentVal }),
      });
      if (res.ok) {
        setOpportunities((prev) =>
          prev.map((o) => (o.id === id ? { ...o, is_locked: !currentVal } : o))
        );
      } else {
        alert('Failed to update lock status');
      }
    } catch {
      alert('Error updating lock status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/opportunities/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setOpportunities((prev) => prev.filter((o) => o.id !== id));
      } else {
        alert('Failed to delete opportunity');
      }
    } catch {
      alert('Error deleting opportunity');
    } finally {
      setActionLoading(null);
    }
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
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-sm flex items-center gap-2 shrink-0 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Opportunity</span>
          </Link>
          <Link
            href="/admin/import-centre"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-surface-900 hover:bg-surface-800 text-white shadow-sm flex items-center gap-2 shrink-0 transition"
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
        {loading ? (
          <div className="p-12 text-center text-surface-400 flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs">Loading opportunities from database...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            <p className="text-xs font-medium">{error}</p>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Briefcase className="w-10 h-10 text-surface-300 mx-auto" />
            <div className="text-sm font-bold text-surface-900">No opportunities found</div>
            <p className="text-xs text-surface-500 max-w-sm mx-auto">
              {opportunities.length === 0
                ? 'Your catalog is currently empty. Click "Create Opportunity" or use the "Import Centre" to ingest listings.'
                : 'No opportunities match your selected filter.'}
            </p>
            {opportunities.length === 0 && (
              <Link
                href="/admin/opportunities/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Opportunity</span>
              </Link>
            )}
          </div>
        ) : (
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
                    <span>Views: {opp.views_count || 0}</span>
                    <span>•</span>
                    <span className="font-mono text-[11px] text-surface-400">/{opp.slug}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleFeatured(opp.id, opp.is_featured)}
                    disabled={actionLoading === opp.id}
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
                    onClick={() => toggleLocked(opp.id, opp.is_locked)}
                    disabled={actionLoading === opp.id}
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

                  <button
                    onClick={() => handleDelete(opp.id, opp.title)}
                    disabled={actionLoading === opp.id}
                    className="p-1.5 rounded-lg border border-surface-200 hover:bg-red-50 text-surface-400 hover:text-red-600 transition"
                    title="Delete Opportunity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
