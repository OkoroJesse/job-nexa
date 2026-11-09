import React from 'react';
import Link from 'next/link';
import { getCategories } from '@/lib/opportunities';
import { Briefcase, ArrowRight } from 'lucide-react';

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="border-b border-surface-200 pb-6">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight">
          Browse by Industry & Opportunity Category
        </h1>
        <p className="text-sm sm:text-base text-surface-600 mt-2 max-w-2xl">
          Find vacancies and funding tailored to your career specialization, from technology and finance to agriculture and health.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/jobs?category=${cat.slug}`}
            className="group bg-white p-6 rounded-2xl border border-surface-200 hover:border-primary hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-surface-900 group-hover:text-primary transition">
                {cat.name}
              </h3>
              <p className="text-xs sm:text-sm text-surface-500 mt-2 leading-relaxed">
                {cat.description || 'Verified job openings, internships, and growth opportunities.'}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-surface-100 flex items-center justify-between text-xs font-bold text-primary">
              <span>View Listings</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
