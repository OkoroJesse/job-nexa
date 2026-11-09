import React from 'react';
import Link from 'next/link';
import { getOpportunities } from '@/lib/opportunities';
import JobCard from '@/components/jobs/JobCard';
import { Award, GraduationCap, Coins, Sparkles } from 'lucide-react';

export default async function OpportunitiesPage() {
  const [scholarships, grants, trainees] = await Promise.all([
    getOpportunities({ opportunityType: 'scholarship' }),
    getOpportunities({ opportunityType: 'grant' }),
    getOpportunities({ opportunityType: 'graduate_trainee' }),
  ]);

  const allAcademicAndGrants = [...scholarships, ...grants, ...trainees];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="border-b border-surface-200 pb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider mb-2">
          <Award className="w-4 h-4 text-brand-500" />
          <span>Academic & Entrepreneurial Growth</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight">
          Scholarships, Fellowships & SME Grants
        </h1>
        <p className="text-sm sm:text-base text-surface-600 mt-2 max-w-3xl">
          Curated non-dilutive funding, international study scholarships, youth development fellowships, and competitive graduate intakes for Nigerian candidates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary-light text-primary">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-surface-900">Postgraduate Scholarships</h3>
            <p className="text-xs text-surface-500 mt-1">PTDF, Chevening, Commonwealth, and European fully funded MSc/PhD grants.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary-light text-primary">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-surface-900">SME & Founder Grants</h3>
            <p className="text-xs text-surface-500 mt-1">Tony Elumelu Foundation, Bank of Industry, and agricultural youth funding.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary-light text-primary">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-surface-900">Graduate Trainees</h3>
            <p className="text-xs text-surface-500 mt-1">Direct corporate fast-track intakes with commercial banks and FMCGs.</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-surface-900">Available Listings ({allAcademicAndGrants.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allAcademicAndGrants.map((opp) => (
            <JobCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      </div>
    </div>
  );
}
