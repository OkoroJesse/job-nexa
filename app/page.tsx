import React from 'react';
import Link from 'next/link';
import { getOpportunities, getCategories, getStates } from '@/lib/opportunities';
import JobCard from '@/components/jobs/JobCard';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  ShieldCheck, 
  TrendingUp, 
  Award, 
  GraduationCap, 
  Globe, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Lock,
  Coins
} from 'lucide-react';

export default async function HomePage() {
  const [featuredOpportunities, categories, states] = await Promise.all([
    getOpportunities({ isFeatured: true }),
    getCategories(),
    getStates(),
  ]);

  const topCategories = categories.slice(0, 8);
  const popularStates = states.filter((s) => 
    ['lagos', 'fct-abuja', 'rivers', 'oyo', 'kano', 'kaduna', 'enugu', 'delta'].includes(s.slug)
  );

  return (
    <div className="space-y-12 sm:space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/10 via-primary-light/25 to-surface-50 pt-8 sm:pt-14 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 border-b border-surface-200">
        <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-5">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-primary text-white shadow-sm">
            <ShieldCheck className="w-4 h-4 text-brand-300" />
            <span>Verified Job & Career Opportunities Across Nigeria</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-2xl sm:text-4xl lg:text-[42px] xl:text-5xl font-extrabold text-surface-900 tracking-tight leading-[1.2]">
            Real Nigerian Jobs, NYSC Placements & <span className="text-primary">Global Opportunities</span>
          </h1>

          {/* Subtitle / Description */}
          <p className="text-sm sm:text-base lg:text-lg text-surface-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Direct access to verified corporate openings in all 36 States & FCT, high-stipend NYSC PPAs, graduate trainee programmes, fully funded scholarships, and USD remote work.
          </p>

          {/* Prominent Instant Job Search Interface */}
          <div className="pt-2 sm:pt-3 max-w-3xl mx-auto">
            <form 
              action="/jobs" 
              method="GET"
              className="bg-white p-2 sm:p-2.5 rounded-2xl shadow-lg border border-surface-200 flex flex-col md:flex-row items-center gap-2"
            >
              {/* Keyword / Job Title Search */}
              <div className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 w-full border-b md:border-b-0 md:border-r border-surface-200">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                <input
                  type="text"
                  name="q"
                  placeholder="Job title, skill, or keywords (e.g. Accountant, Trainee, Software)..."
                  className="w-full text-xs sm:text-sm text-surface-900 placeholder-surface-400 focus:outline-none bg-transparent"
                />
              </div>

              {/* State / Location Selector */}
              <div className="flex items-center gap-2 px-3.5 py-2.5 w-full md:w-56 lg:w-64 border-b md:border-b-0 md:border-r border-surface-200">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                <select
                  name="state"
                  className="w-full text-xs sm:text-sm text-surface-700 bg-transparent focus:outline-none cursor-pointer"
                  defaultValue=""
                >
                  <option value="">All 36 States & FCT</option>
                  {states.map((st) => (
                    <option key={st.id} value={st.slug}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Opportunities Submit Button */}
              <button
                type="submit"
                className="w-full md:w-auto px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold bg-primary hover:bg-primary-hover text-white transition shadow-sm flex items-center justify-center gap-2 shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>Search Opportunities</span>
              </button>
            </form>

            {/* Quick Trending Searches */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 mt-3 text-xs text-surface-500">
              <span className="font-semibold text-surface-700">Quick Searches:</span>
              <Link href="/jobs?policy=remote_global" className="text-surface-600 hover:text-primary font-medium transition underline-offset-2 hover:underline">
                Remote Jobs
              </Link>
              <span className="text-surface-300">•</span>
              <Link href="/jobs?type=nysc_ppa" className="text-surface-600 hover:text-primary font-medium transition underline-offset-2 hover:underline">
                NYSC
              </Link>
              <span className="text-surface-300">•</span>
              <Link href="/jobs?type=graduate_trainee" className="text-surface-600 hover:text-primary font-medium transition underline-offset-2 hover:underline">
                Graduate Trainee
              </Link>
              <span className="text-surface-300">•</span>
              <Link href="/opportunities?type=scholarship" className="text-surface-600 hover:text-primary font-medium transition underline-offset-2 hover:underline">
                Scholarships
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Differentiation Signals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-surface-200 shadow-sm flex items-start gap-4">
            <div className="p-3 rounded-xl bg-brand-50 text-brand-700 shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-surface-900">Zero Scam Curation</h4>
              <p className="text-xs text-surface-500 mt-1 leading-relaxed">
                Every listing is verified. Never pay fake interview or recruitment fees in Nigeria.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-xl border border-surface-200 shadow-sm flex items-start gap-4">
            <div className="p-3 rounded-xl bg-brand-50 text-brand-700 shrink-0">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-surface-900">All 36 States & FCT</h4>
              <p className="text-xs text-surface-500 mt-1 leading-relaxed">
                Beyond Lagos & Abuja. High-opportunity roles in Kano, Rivers, Oyo, Enugu, and all regions.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-xl border border-surface-200 shadow-sm flex items-start gap-4">
            <div className="p-3 rounded-xl bg-brand-50 text-brand-700 shrink-0">
              <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-surface-900">Global & USD Roles</h4>
              <p className="text-xs text-surface-500 mt-1 leading-relaxed">
                Earn in foreign currency with vetted remote positions open to Nigerian residents.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-xl border border-surface-200 shadow-sm flex items-start gap-4">
            <div className="p-3 rounded-xl bg-brand-50 text-brand-700 shrink-0">
              <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-surface-900">Fair ₦3,500 Pass</h4>
              <p className="text-xs text-surface-500 mt-1 leading-relaxed">
                Unlock direct HR desks and application instructions for 30 days. No recurring debits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Opportunities Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <span>Handpicked & Verified</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
              Featured Opportunities This Week
            </h2>
          </div>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary-hover hover:underline"
          >
            <span>View All Opportunities</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredOpportunities.slice(0, 6).map((opp) => (
            <JobCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      </section>

      {/* Category Explorer */}
      <section className="bg-surface-100/60 py-14 sm:py-16 px-4 sm:px-6 lg:px-8 border-y border-surface-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
              Explore by Opportunity Sector
            </h2>
            <p className="text-sm text-surface-600 mt-2">
              From corporate banking and tech to youth empowerment and overseas scholarships.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {topCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/jobs?category=${cat.slug}`}
                className="group bg-white p-5 rounded-xl border border-surface-200 hover:border-primary hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-surface-900 group-hover:text-primary transition line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-surface-500 mt-1 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-surface-100 flex items-center justify-between text-xs text-primary font-semibold">
                  <span>Explore Jobs</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/categories"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-primary bg-white border border-surface-300 hover:bg-surface-50 transition"
            >
              <span>View All Categories</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Regional Focus: 36 States & FCT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
              Opportunities Across Nigerian States
            </h2>
            <p className="text-sm text-surface-600 mt-1">
              Find verified vacancies in your home state or desired relocation city.
            </p>
          </div>
          <Link
            href="/locations"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
          >
            <span>All 36 States Directory</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {popularStates.map((st) => (
            <Link
              key={st.id}
              href={`/jobs?state=${st.slug}`}
              className="p-4 rounded-xl bg-white border border-surface-200 hover:border-primary hover:shadow-sm transition flex items-center justify-between group"
            >
              <div>
                <h4 className="text-sm font-bold text-surface-900 group-hover:text-primary transition">
                  {st.name}
                </h4>
                <p className="text-[11px] text-surface-400">{st.geopolitical_zone}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-surface-400 group-hover:text-primary group-hover:translate-x-0.5 transition" />
            </Link>
          ))}
        </div>
      </section>

      {/* The JobNexa Fair-Price Model Explained */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-surface-900 text-white rounded-3xl p-8 sm:p-12 border border-surface-800 relative overflow-hidden">
          <div className="max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              The JobNexa Transparency Promise
            </span>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Why We Charge ₦3,500 for a 30-Day Pass
            </h2>

            <div className="space-y-4 text-sm sm:text-base text-surface-300 leading-relaxed">
              <p>
                In Nigeria, millions of job seekers waste thousands of Naira traveling to fraudulent &quot;interviews&quot; in Ikeja or Garki, only to be pressured into buying marketing kits or paying aptitude test fees.
              </p>
              <p>
                JobNexa operates with <strong>total candidate protection</strong>:
              </p>
              <ul className="space-y-2 text-sm text-surface-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-400" />
                  <span>Free registration and free browsing of all job descriptions and requirements.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-400" />
                  <span>A single, modest ₦3,500 fee unlocks verified direct HR emails and phone lines for 30 days.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-400" />
                  <span><strong>Zero automatic renewal.</strong> You will never be billed unexpectedly on your debit card.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-400" />
                  <span>Dual payment rails: Instant Paystack or manual direct bank transfer with admin verification.</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/pricing"
                className="w-full sm:w-auto text-center px-8 py-3.5 rounded-xl text-sm font-bold bg-brand-500 hover:bg-brand-400 text-slate-950 transition shadow-sm"
              >
                Get Your 30-Day Pass (₦3,500)
              </Link>
              <Link
                href="/about"
                className="w-full sm:w-auto text-center px-6 py-3.5 rounded-xl text-sm font-semibold bg-surface-800 hover:bg-surface-700 text-surface-200 transition border border-surface-700"
              >
                Read About Our Anti-Scam Mission
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
