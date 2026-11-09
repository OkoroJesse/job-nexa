import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getOpportunityBySlug } from '@/lib/opportunities';
import { getServerAuthSession } from '@/lib/auth-helpers';
import LockedPaywallCard from '@/components/jobs/LockedPaywallCard';
import UnlockedContactCard from '@/components/jobs/UnlockedContactCard';
import { UnlockedOpportunity } from '@/types/database';
import { 
  MapPin, 
  Briefcase, 
  Clock, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  Share2, 
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface JobDetailPageProps {
  params: {
    slug: string;
  };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  // Check active membership status from server session or cookie
  const cookieStore = cookies();
  const sessionActiveCookie = cookieStore.get('jobnexa_is_active')?.value === 'true';
  const { isActiveMember: sessionActiveFromDb } = await getServerAuthSession();
  
  const hasActiveAccess = sessionActiveCookie || sessionActiveFromDb;

  // Retrieve opportunity data with strict server-level masking
  const { opportunity, isUnlocked } = await getOpportunityBySlug(params.slug, hasActiveAccess);

  if (!opportunity) {
    notFound();
  }

  // Dual-Schema SEO Generator
  // Invariant: Do NOT output JobPosting schema on locked listings to avoid Google penalties!
  const structuredData = !opportunity.is_locked
    ? {
        '@context': 'https://schema.org/',
        '@type': 'JobPosting',
        title: opportunity.title,
        description: opportunity.description,
        identifier: {
          '@type': 'PropertyValue',
          name: 'JobNexa',
          value: opportunity.id,
        },
        datePosted: opportunity.created_at,
        validThrough: opportunity.application_deadline,
        employmentType: opportunity.opportunity_type.toUpperCase(),
        hiringOrganization: {
          '@type': 'Organization',
          name: opportunity.organization_name,
        },
        jobLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: opportunity.city || 'Abuja',
            addressRegion: opportunity.state?.name || 'Nigeria',
            addressCountry: 'NG',
          },
        },
      }
    : {
        '@context': 'https://schema.org/',
        '@type': 'Article',
        headline: opportunity.title,
        description: opportunity.description,
        author: {
          '@type': 'Organization',
          name: 'JobNexa Editorial Team',
        },
        publisher: {
          '@type': 'Organization',
          name: 'JobNexa Nigeria',
          logo: {
            '@type': 'ImageObject',
            url: 'https://jobnexa.ng/logo.png',
          },
        },
        datePublished: opportunity.created_at,
      };

  return (
    <>
      {/* Inject Structured Data JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Back Link */}
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-500 hover:text-primary transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Opportunities Directory</span>
        </Link>

        {/* Opportunity Header Card */}
        <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {opportunity.is_featured && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Featured Listing
                </span>
              )}
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-light text-primary">
                {opportunity.category?.name || 'Opportunity'}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-surface-100 text-surface-700">
                {opportunity.workplace_policy.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-surface-500">
              <Calendar className="w-4 h-4 text-surface-400" />
              <span>
                Posted: {new Date(opportunity.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight leading-snug">
              {opportunity.title}
            </h1>
            <div className="flex items-center gap-2 mt-2 text-base font-bold text-primary">
              <Building2 className="w-5 h-5 text-surface-400" />
              <span>{opportunity.organization_name}</span>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-surface-100 text-xs sm:text-sm">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-5 h-5 text-surface-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-surface-400 text-xs block">Location</span>
                <span className="font-semibold text-surface-800">
                  {opportunity.city || (opportunity.state ? `${opportunity.state.name} State` : 'Nigeria')}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="w-5 h-5 text-surface-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-surface-400 text-xs block">Application Deadline</span>
                <span className="font-semibold text-surface-800">
                  {opportunity.application_deadline 
                    ? new Date(opportunity.application_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Ongoing Intake'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Briefcase className="w-5 h-5 text-surface-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-surface-400 text-xs block">Salary / Stipend</span>
                <span className="font-bold text-emerald-800">
                  {opportunity.salary_or_stipend_range || 'Competitive / Stated Upon Application'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Description & Requirements */}
        <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-sm space-y-8">
          {/* Overview */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-surface-900">About the Opportunity</h2>
            <p className="text-sm sm:text-base text-surface-700 leading-relaxed whitespace-pre-line">
              {opportunity.description}
            </p>
          </div>

          {/* Requirements */}
          <div className="space-y-3 pt-6 border-t border-surface-100">
            <h2 className="text-lg font-bold text-surface-900">Candidate Requirements & Qualifications</h2>
            <div className="text-sm sm:text-base text-surface-700 leading-relaxed whitespace-pre-line">
              {opportunity.requirements}
            </div>
          </div>

          {/* Benefits */}
          {opportunity.benefits && (
            <div className="space-y-3 pt-6 border-t border-surface-100">
              <h2 className="text-lg font-bold text-surface-900">Benefits & Stipend Details</h2>
              <p className="text-sm sm:text-base text-surface-700 leading-relaxed">
                {opportunity.benefits}
              </p>
            </div>
          )}
        </div>

        {/* The Application & Contact Section (Locked vs Unlocked) */}
        <section className="pt-2">
          {isUnlocked ? (
            <UnlockedContactCard opportunity={opportunity as UnlockedOpportunity} />
          ) : (
            <LockedPaywallCard />
          )}
        </section>

        {/* Anti-Scam Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>JobNexa Verification Notice:</strong> Legitimate employers in Nigeria will <em>never</em> ask you to pay money for interview registration, medical testing kits, or job orientation. If an employer requests money during the recruitment process, report them immediately to <span className="font-mono font-semibold">fraud-desk@jobnexa.ng</span>.
          </div>
        </div>
      </div>
    </>
  );
}
