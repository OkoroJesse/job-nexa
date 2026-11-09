'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import JobCard from '@/components/jobs/JobCard';
import { Bookmark, ArrowLeft } from 'lucide-react';
import { PublicOpportunity } from '@/types/database';

export default function SavedJobsPage() {
  const { user, savedJobIds, isLoading: authLoading } = useAuth();
  const [savedOpportunities, setSavedOpportunities] = useState<PublicOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSaved() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('saved_opportunities')
          .select(`
            opportunity_id,
            opportunity:opportunities(
              id, title, slug, organization_name, organization_logo_url,
              category_id, state_id, city, workplace_policy, opportunity_type,
              salary_or_stipend_range, description, application_deadline,
              is_locked, is_featured, created_at,
              category:categories(id, name, slug, icon_name),
              state:locations_states(id, name, slug, geopolitical_zone)
            )
          `)
          .eq('user_id', user.id);

        if (!error && data) {
          const list = data
            .map((item: any) => item.opportunity)
            .filter(Boolean) as PublicOpportunity[];
          setSavedOpportunities(list);
        }
      } catch (err) {
        console.warn('Error loading saved opportunities:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSaved();
  }, [user, savedJobIds]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-500 hover:text-primary transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>

      <div className="border-b border-surface-200 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-primary" />
          <span>Saved Opportunities ({savedOpportunities.length})</span>
        </h1>
        <p className="text-sm text-surface-600 mt-1">
          Review and prepare applications for your bookmarked Nigerian and remote openings.
        </p>
      </div>

      {loading || authLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-surface-200 text-center">
          <p className="text-xs text-surface-500">Loading your saved opportunities...</p>
        </div>
      ) : savedOpportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedOpportunities.map((opp) => (
            <JobCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-surface-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-surface-100 text-surface-400 flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-surface-900">No saved opportunities yet</h3>
          <p className="text-xs sm:text-sm text-surface-500 max-w-sm mx-auto">
            Click the bookmark icon on any job card to save listings for later reference and tracking.
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white transition shadow-sm mt-2"
          >
            <span>Explore Opportunities</span>
          </Link>
        </div>
      )}
    </div>
  );
}
