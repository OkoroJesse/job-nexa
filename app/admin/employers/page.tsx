'use client';

import React, { useState } from 'react';
import { Building2, ShieldCheck, CheckCircle2, Globe, Mail, Phone, Plus, MapPin } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  industry: string;
  city: string;
  officialEmail: string;
  officialPhone: string;
  isVerified: boolean;
  totalListings: number;
}

const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp-1',
    name: 'Access Bank Plc',
    industry: 'Commercial Banking & Fintech',
    city: 'Victoria Island, Lagos',
    officialEmail: 'talentacquisition@accessbankplc.com',
    officialPhone: '+234 1 271 2005',
    isVerified: true,
    totalListings: 4,
  },
  {
    id: 'comp-2',
    name: 'Ventures Park Innovation Hub',
    industry: 'Technology & Venture Incubation',
    city: 'Maitama, Abuja (FCT)',
    officialEmail: 'people@theventurespark.com',
    officialPhone: '+234 818 555 3302',
    isVerified: true,
    totalListings: 2,
  },
  {
    id: 'comp-3',
    name: 'Nigeria LNG Limited (NLNG)',
    industry: 'Oil & Gas Exploration & LNG',
    city: 'Port Harcourt, Rivers State',
    officialEmail: 'careers@nlng.com',
    officialPhone: '+234 803 905 2000',
    isVerified: true,
    totalListings: 3,
  },
  {
    id: 'comp-4',
    name: 'Leadway Assurance Company Limited',
    industry: 'Insurance & Asset Management',
    city: 'Ibadan, Oyo State',
    officialEmail: 'ibadan-careers@leadway.com',
    officialPhone: '+234 2 241 1290',
    isVerified: true,
    totalListings: 1,
  },
  {
    id: 'comp-5',
    name: 'Prime Logistics West Africa',
    industry: 'Supply Chain & Transport',
    city: 'Kano, Kano State',
    officialEmail: 'careers@primelogistics.ng',
    officialPhone: '+234 802 000 4488',
    isVerified: false,
    totalListings: 1,
  },
];

export default function AdminEmployersPage() {
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);

  const toggleVerified = (id: string) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isVerified: !c.isVerified } : c))
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
            Employers & Verified Organizations
          </h1>
          <p className="text-xs sm:text-sm text-surface-500 mt-1">
            Audit employer registrations, verify corporate credentials, and manage direct HR desks.
          </p>
        </div>

        <button
          onClick={() => alert('New employer registration modal. All verified contacts are protected under 30-day membership access.')}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-sm flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Verified Employer</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-surface-100 flex items-center justify-between text-xs">
          <span className="font-bold text-surface-900 uppercase tracking-wider">
            Organizations in Directory ({companies.length})
          </span>
          <span className="text-surface-500 font-semibold">Anti-Scam Verified Badge</span>
        </div>

        <div className="divide-y divide-surface-100">
          {companies.map((comp) => (
            <div key={comp.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-surface-900">{comp.name}</span>
                  {comp.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Verified
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] bg-surface-100 text-surface-600 font-medium">
                    {comp.industry}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-surface-500 text-xs">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-surface-400" />
                    {comp.city}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono text-primary font-semibold">
                    <Mail className="w-3.5 h-3.5 text-surface-400" />
                    {comp.officialEmail}
                  </span>
                  <span>•</span>
                  <span>{comp.totalListings} Active Listings</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleVerified(comp.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                    comp.isVerified
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-surface-200 hover:bg-surface-50 text-surface-700'
                  }`}
                >
                  {comp.isVerified ? 'Revoke Verified Badge' : 'Mark as Verified'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
