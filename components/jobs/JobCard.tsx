'use client';

import React from 'react';
import Link from 'next/link';
import { PublicOpportunity } from '@/types/database';
import { useAuth } from '@/components/providers/AuthProvider';
import { 
  MapPin, 
  Briefcase, 
  Bookmark, 
  Lock, 
  CheckCircle2, 
  ExternalLink,
  Clock,
  Sparkles
} from 'lucide-react';

interface JobCardProps {
  opportunity: PublicOpportunity;
}

export default function JobCard({ opportunity }: JobCardProps) {
  const { isJobSaved, toggleSaveJob, isActiveMember } = useAuth();
  const isSaved = isJobSaved(opportunity.id);

  const formatOpportunityType = (type: string) => {
    switch (type) {
      case 'nysc_ppa':
        return 'NYSC PPA';
      case 'graduate_trainee':
        return 'Graduate Trainee';
      case 'scholarship':
        return 'Scholarship';
      case 'grant':
        return 'Grant / Funding';
      case 'internship':
        return 'Internship';
      case 'contract':
        return 'Contract';
      case 'full_time':
      default:
        return 'Full-time';
    }
  };

  const formatWorkplace = (policy: string) => {
    switch (policy) {
      case 'remote_global':
        return 'Remote (Global USD)';
      case 'remote_nigeria':
        return 'Remote (Nigeria)';
      case 'hybrid':
        return 'Hybrid';
      case 'on_site':
      default:
        return 'On-site';
    }
  };

  return (
    <div className={`group bg-white rounded-xl border transition-all duration-200 hover:shadow-md p-5 sm:p-6 flex flex-col justify-between ${
      opportunity.is_featured 
        ? 'border-brand-200 bg-gradient-to-b from-brand-50/20 to-white ring-1 ring-brand-100' 
        : 'border-surface-200 hover:border-surface-300'
    }`}>
      <div>
        {/* Top Meta Header: Featured Badge + Save Button */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            {opportunity.is_featured && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <Sparkles className="w-3 h-3 text-amber-600" /> Featured
              </span>
            )}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-100 text-surface-700">
              {formatOpportunityType(opportunity.opportunity_type)}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium text-surface-600 bg-surface-50 border border-surface-200">
              {formatWorkplace(opportunity.workplace_policy)}
            </span>
          </div>

          <button
            onClick={() => toggleSaveJob(opportunity.id)}
            className={`p-2 rounded-lg transition ${
              isSaved
                ? 'text-primary bg-primary-light'
                : 'text-surface-400 hover:text-surface-600 hover:bg-surface-100'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save opportunity'}
            aria-label="Save opportunity"
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Title & Organization */}
        <div className="mb-3">
          <Link href={`/jobs/${opportunity.slug}`} className="block group-hover:text-primary transition">
            <h3 className="text-base sm:text-lg font-bold text-surface-900 leading-snug line-clamp-2">
              {opportunity.title}
            </h3>
          </Link>
          <p className="text-sm font-semibold text-primary mt-1">
            {opportunity.organization_name}
          </p>
        </div>

        {/* Location & Salary Chips */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-surface-600 mb-4">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-surface-400 shrink-0" />
            <span>
              {opportunity.city || (opportunity.state ? `${opportunity.state.name} State` : 'Nigeria')}
            </span>
          </div>

          {opportunity.salary_or_stipend_range && (
            <div className="flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              <span>{opportunity.salary_or_stipend_range}</span>
            </div>
          )}
        </div>

        {/* Brief Excerpt */}
        <p className="text-xs sm:text-sm text-surface-600 line-clamp-2 leading-relaxed mb-4">
          {opportunity.description}
        </p>
      </div>

      {/* Card Footer: Access Status + View Button */}
      <div className="pt-3 border-t border-surface-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          {opportunity.is_locked ? (
            isActiveMember ? (
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Contact Unlocked
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded">
                <Lock className="w-3 h-3 text-amber-600" />
                ₦3,500 Pass Required
              </span>
            )
          ) : (
            <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Public Free Apply
            </span>
          )}
        </div>

        <Link
          href={`/jobs/${opportunity.slug}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover hover:underline"
        >
          View Details
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
