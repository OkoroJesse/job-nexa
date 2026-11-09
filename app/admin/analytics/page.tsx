'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  CreditCard, 
  Users, 
  MapPin, 
  Briefcase, 
  Sparkles,
  ArrowUpRight,
  Loader2
} from 'lucide-react';

interface AnalyticsData {
  totalPassesSold: number;
  grossRevenueNaira: number;
  paystackPercent: number;
  bankTransferPercent: number;
  activeSubscribers: number;
  stateDistribution: { state: string; count: number; percent: number }[];
  verticalDistribution: { type: string; count: number; percent: number }[];
  totalOpportunities: number;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((res) => res.json())
      .then((json) => {
        if (!json.error) {
          setData(json);
        }
      })
      .catch((err) => console.warn('Error fetching analytics:', err))
      .finally(() => setLoading(false));
  }, []);

  const formatVerticalLabel = (type: string) => {
    switch (type) {
      case 'full_time': return 'Full-Time Positions';
      case 'nysc_ppa': return 'NYSC Primary Assignment';
      case 'graduate_trainee': return 'Graduate Trainee Schemes';
      case 'scholarship': return 'Academic Scholarships';
      case 'grant': return 'SME / Innovation Grants';
      case 'internship': return 'Internships & Fellowships';
      default: return type.replace(/_/g, ' ');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-surface-400 flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-xs">Compiling live platform revenue and demand analytics...</p>
      </div>
    );
  }

  const d = data || {
    totalPassesSold: 0,
    grossRevenueNaira: 0,
    paystackPercent: 0,
    bankTransferPercent: 0,
    activeSubscribers: 0,
    stateDistribution: [],
    verticalDistribution: [],
    totalOpportunities: 0,
  };

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
          <div className="text-3xl font-extrabold text-surface-900">{d.totalPassesSold} Passes</div>
          <span className="text-[11px] text-surface-400">Verified transactions across all rails</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
            Gross Subscription Revenue
          </span>
          <div className="text-3xl font-extrabold text-primary">₦{d.grossRevenueNaira.toLocaleString()}</div>
          <span className="text-[11px] text-surface-400">At ₦3,500 per 30-day unlock</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
            Payment Rail Breakdown
          </span>
          <div className="text-sm font-bold text-surface-900 pt-1 space-y-1">
            <div className="flex justify-between">
              <span>Paystack:</span>
              <strong className="text-primary">{d.paystackPercent}%</strong>
            </div>
            <div className="flex justify-between">
              <span>Bank Transfer:</span>
              <strong className="text-emerald-700">{d.bankTransferPercent}%</strong>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
            Active Paid Subscribers
          </span>
          <div className="text-3xl font-extrabold text-surface-900">{d.activeSubscribers}</div>
          <span className="text-[11px] text-surface-400">Members with current active pass</span>
        </div>
      </div>

      {/* Regional Demand & Top Sectors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Regional Opportunity Distribution */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-surface-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span>Geographic Distribution of Listings</span>
          </h3>

          {d.stateDistribution.length === 0 ? (
            <p className="text-xs text-surface-400 pt-4">No regional data available yet. Listings will populate this distribution.</p>
          ) : (
            <div className="space-y-3 pt-2">
              {d.stateDistribution.map((item) => (
                <div key={item.state} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-surface-800">{item.state}</span>
                    <span className="text-surface-500">{item.percent}% ({item.count} listings)</span>
                  </div>
                  <div className="w-full bg-surface-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Opportunity Types Breakdown */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-surface-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            <span>Opportunity Verticals ({d.totalOpportunities} Total)</span>
          </h3>

          {d.verticalDistribution.length === 0 ? (
            <p className="text-xs text-surface-400 pt-4">No opportunity verticals indexed yet.</p>
          ) : (
            <div className="divide-y divide-surface-100 text-xs">
              {d.verticalDistribution.map((item) => (
                <div key={item.type} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-surface-900 block">{formatVerticalLabel(item.type)}</span>
                    <span className="text-surface-500">{item.count} opportunities</span>
                  </div>
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    {item.percent}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
