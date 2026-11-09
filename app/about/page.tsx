import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Target, HeartHandshake, MapPin } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
      <div className="text-center space-y-4">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">
          Our Story & Mission
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-surface-900 tracking-tight">
          Restoring Trust to Job Seeking in Nigeria
        </h1>
        <p className="text-base sm:text-lg text-surface-600 leading-relaxed max-w-2xl mx-auto">
          Built by Nigerian engineers and recruitment researchers who experienced firsthand the frustration of fake interviews, predatory recruitment fees, and regional opportunity bias.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-surface-200 p-8 sm:p-10 shadow-sm space-y-6 text-sm sm:text-base text-surface-700 leading-relaxed">
        <h2 className="text-xl font-bold text-surface-900">The Problem We Are Solving</h2>
        <p>
          Every year, over 500,000 university and polytechnic graduates finish tertiary education and complete their mandatory National Youth Service Corps (NYSC). Despite their drive and technical capabilities, they face an employment ecosystem plagued by bad actors.
        </p>
        <p>
          Syndicates across major commercial hubs advertise enticing managerial and administrative positions, only to lure desperate job seekers to undisclosed locations where they are asked to pay ₦15,000 for &quot;aptitude test registration&quot; or &quot;medical clearance&quot;. Meanwhile, genuine corporate opportunities in mid-tier Nigerian states remain unfilled due to poor distribution.
        </p>

        <h2 className="text-xl font-bold text-surface-900 pt-4 border-t border-surface-100">
          The JobNexa Standard
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-surface-900 text-sm">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>Rigorous Anti-Scam Curation</span>
            </div>
            <p className="text-xs text-surface-600 leading-relaxed">
              Every employer contact, corporate registration, and email domain is reviewed before publication.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-surface-900 text-sm">
              <MapPin className="w-5 h-5 text-primary" />
              <span>All 36 States + FCT</span>
            </div>
            <p className="text-xs text-surface-600 leading-relaxed">
              Real jobs don&apos;t just exist in Lagos and Abuja. We curate verified roles across northern, eastern, and southern Nigeria.
            </p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-surface-900 pt-4 border-t border-surface-100">
          Our Fair Monetization Commitment
        </h2>
        <p>
          We do not sell candidate data, bombard users with intrusive pop-up ads, or set up hidden monthly card debits. Our ₦3,500 30-day all-access pass finances human investigative verification and direct employer outreach, keeping our ecosystem authentic and trustworthy.
        </p>
      </div>
    </div>
  );
}
