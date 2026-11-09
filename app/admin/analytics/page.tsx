import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  CreditCard, 
  Users, 
  MapPin, 
  Briefcase, 
  Sparkles,
  ArrowUpRight 
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
          Platform Analytics & Revenue Reports
        </h1>
        <p className="text-xs sm:text-sm text-surface-500 mt-1">
          Monitor subscription cash flow, conversion funnels, and geographic demand across Nigeria.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
            Total 30-Day Passes Sold
          </span>
          <div className="text-3xl font-extrabold text-surface-900">238 Passes</div>
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+18% from last month</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
            Gross Subscription Revenue
          </span>
          <div className="text-3xl font-extrabold text-primary">₦833,000</div>
          <span className="text-[11px] text-surface-400">At ₦3,500 per 30-day unlock</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
            Payment Rail Breakdown
          </span>
          <div className="text-sm font-bold text-surface-900 pt-1 space-y-1">
            <div className="flex justify-between">
              <span>Paystack (Cards/USSD):</span>
              <strong className="text-primary">68%</strong>
            </div>
            <div className="flex justify-between">
              <span>Bank Transfer (Verified):</span>
              <strong className="text-emerald-700">32%</strong>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
            Lead-to-Unlock Conversion
          </span>
          <div className="text-3xl font-extrabold text-surface-900">4.8%</div>
          <span className="text-[11px] text-surface-400">Visitors upgrading to 30-Day Pass</span>
        </div>
      </div>

      {/* Regional Demand & Top Sectors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Regional Search Density */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-surface-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span>Geographic Search Distribution Across Nigeria</span>
          </h3>

          <div className="space-y-3 pt-2">
            {[
              { state: 'Lagos State', percent: 42, count: '3,890 searches' },
              { state: 'Federal Capital Territory (Abuja)', percent: 28, count: '2,610 searches' },
              { state: 'Rivers State (Port Harcourt)', percent: 12, count: '1,120 searches' },
              { state: 'Oyo State (Ibadan)', percent: 9, count: '840 searches' },
              { state: 'Kano State', percent: 5, count: '460 searches' },
              { state: 'Other 32 States Combined', percent: 4, count: '380 searches' },
            ].map((item) => (
              <div key={item.state} className="space-y-1 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-surface-800">{item.state}</span>
                  <span className="text-surface-500">{item.percent}% ({item.count})</span>
                </div>
                <div className="w-full bg-surface-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${item.percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Highest Converting Opportunity Types */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-surface-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            <span>Highest Converting Opportunity Verticals</span>
          </h3>

          <div className="divide-y divide-surface-100 text-xs">
            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-surface-900 block">Graduate Trainee Cycles</span>
                <span className="text-surface-500">Access Bank, PwC, GTCO</span>
              </div>
              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                8.4% Unlock Rate
              </span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-surface-900 block">High-Stipend NYSC PPAs</span>
                <span className="text-surface-500">Abuja & Lagos Innovation Hubs</span>
              </div>
              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                7.1% Unlock Rate
              </span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-surface-900 block">Remote Jobs (USD Salary)</span>
                <span className="text-surface-500">Engineers, Virtual Assistants</span>
              </div>
              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                6.8% Unlock Rate
              </span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-surface-900 block">Mid-Level Corporate Banking</span>
                <span className="text-surface-500">Accountants, Compliance Officers</span>
              </div>
              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                3.9% Unlock Rate
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
