import React from 'react';
import Link from 'next/link';
import { getOpportunities, getCategories, getStates } from '@/lib/opportunities';
import JobCard from '@/components/jobs/JobCard';
import { Search, MapPin, Briefcase, Filter, X, RotateCcw } from 'lucide-react';

interface JobsPageProps {
  searchParams: {
    q?: string;
    category?: string;
    state?: string;
    type?: string;
    policy?: string;
  };
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const [categories, states] = await Promise.all([
    getCategories(),
    getStates(),
  ]);

  const opportunities = await getOpportunities({
    query: searchParams.q,
    categorySlug: searchParams.category,
    stateSlug: searchParams.state,
    opportunityType: searchParams.type,
    workplacePolicy: searchParams.policy,
  });

  const hasActiveFilters = Boolean(
    searchParams.q || searchParams.category || searchParams.state || searchParams.type || searchParams.policy
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="border-b border-surface-200 pb-6">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight">
          Browse Verified Jobs & Opportunities
        </h1>
        <p className="text-sm sm:text-base text-surface-600 mt-2">
          Explore genuine openings across Nigeria&apos;s 36 States & FCT, verified NYSC PPAs, graduate trainees, and remote roles.
        </p>
      </div>

      {/* Main Content Layout: Filter Sidebar + Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filter Sidebar (Desktop) */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-surface-100">
              <div className="flex items-center gap-2 font-bold text-sm text-surface-900">
                <Filter className="w-4 h-4 text-primary" />
                <span>Filters</span>
              </div>

              {hasActiveFilters && (
                <Link
                  href="/jobs"
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </Link>
              )}
            </div>

            <form method="GET" action="/jobs" className="space-y-4">
              {/* Keyword Filter */}
              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1.5">
                  Search Keywords
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-surface-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    name="q"
                    defaultValue={searchParams.q || ''}
                    placeholder="e.g. Accounting, Engineer..."
                    className="w-full pl-9 pr-3 py-2 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* State Filter */}
              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1.5">
                  State / Location
                </label>
                <select
                  name="state"
                  defaultValue={searchParams.state || ''}
                  className="w-full px-3 py-2 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All 36 States & FCT</option>
                  {states.map((st) => (
                    <option key={st.id} value={st.slug}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1.5">
                  Opportunity Category
                </label>
                <select
                  name="category"
                  defaultValue={searchParams.category || ''}
                  className="w-full px-3 py-2 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Opportunity Type */}
              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1.5">
                  Opportunity Type
                </label>
                <select
                  name="type"
                  defaultValue={searchParams.type || ''}
                  className="w-full px-3 py-2 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Types</option>
                  <option value="full_time">Full-time Roles</option>
                  <option value="nysc_ppa">NYSC PPA Placements</option>
                  <option value="graduate_trainee">Graduate Trainee Cycles</option>
                  <option value="scholarship">Scholarships</option>
                  <option value="grant">Grants & Funding</option>
                  <option value="internship">Internships</option>
                  <option value="contract">Contract Roles</option>
                </select>
              </div>

              {/* Workplace Policy */}
              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1.5">
                  Workplace Mode
                </label>
                <select
                  name="policy"
                  defaultValue={searchParams.policy || ''}
                  className="w-full px-3 py-2 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Any Policy</option>
                  <option value="on_site">On-site Only</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="remote_nigeria">Remote (Nigeria)</option>
                  <option value="remote_global">Remote (Global USD)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg text-xs font-bold bg-primary hover:bg-primary-hover text-white transition shadow-sm"
              >
                Apply Filters
              </button>
            </form>
          </div>
        </aside>

        {/* Listings Section */}
        <main className="lg:col-span-3 space-y-6">
          {/* Active Filter Pills Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-surface-200">
            <span className="text-xs font-semibold text-surface-600">
              Showing <strong className="text-surface-900">{opportunities.length}</strong> opportunities
            </span>

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {searchParams.q && (
                  <span className="px-2.5 py-1 rounded-md bg-surface-100 text-surface-700 font-medium">
                    Keyword: &quot;{searchParams.q}&quot;
                  </span>
                )}
                {searchParams.state && (
                  <span className="px-2.5 py-1 rounded-md bg-surface-100 text-surface-700 font-medium">
                    State: {searchParams.state}
                  </span>
                )}
                {searchParams.type && (
                  <span className="px-2.5 py-1 rounded-md bg-surface-100 text-surface-700 font-medium">
                    Type: {searchParams.type}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Opportunities Grid */}
          {opportunities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {opportunities.map((opp) => (
                <JobCard key={opp.id} opportunity={opp} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-surface-200 p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-surface-100 text-surface-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-surface-900">No matching opportunities found</h3>
              <p className="text-xs sm:text-sm text-surface-500 max-w-md mx-auto leading-relaxed">
                Try widening your search terms or clearing your location filter. We curate new verified openings daily across all 36 States.
              </p>
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-primary text-white"
              >
                Clear All Filters
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
