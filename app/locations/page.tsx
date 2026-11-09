import React from 'react';
import Link from 'next/link';
import { getStates } from '@/lib/opportunities';
import { MapPin, ArrowRight } from 'lucide-react';

export default async function LocationsPage() {
  const states = await getStates();

  const zones = [
    'South West',
    'South South',
    'South East',
    'North Central',
    'North West',
    'North East',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="border-b border-surface-200 pb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider mb-2">
          <MapPin className="w-4 h-4 text-brand-500" />
          <span>Nationwide Coverage</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight">
          Opportunities Across Nigeria&apos;s 36 States & the FCT
        </h1>
        <p className="text-sm sm:text-base text-surface-600 mt-2 max-w-3xl">
          JobNexa actively curates verified opportunities in every geopolitical zone of Nigeria. Select your state to view dedicated local opportunities, NYSC primary assignments, and corporate vacancies.
        </p>
      </div>

      <div className="space-y-10">
        {zones.map((zone) => {
          const zoneStates = states.filter((s) => s.geopolitical_zone === zone);
          return (
            <div key={zone} className="space-y-4">
              <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2 border-b border-surface-200 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                <span>{zone} Zone</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {zoneStates.map((st) => (
                  <Link
                    key={st.id}
                    href={`/jobs?state=${st.slug}`}
                    className="p-4 rounded-xl bg-white border border-surface-200 hover:border-primary hover:shadow-sm transition flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-surface-900 group-hover:text-primary transition">
                        {st.name}
                      </h4>
                      <span className="text-[11px] text-surface-500">Explore openings →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
