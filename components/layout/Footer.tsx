import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Briefcase, ShieldCheck, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-surface-900 text-surface-300 pt-16 pb-12 border-t border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-surface-800">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image
                src="/brand/jobnexa-icon.png"
                alt="JobNexa"
                width={36}
                height={36}
                className="w-9 h-9 object-contain group-hover:scale-105 transition-transform"
              />
              <span className="text-xl font-bold tracking-tight text-white font-sans">
                Job<span className="text-brand-400">Nexa</span>
              </span>
            </Link>
            <p className="text-sm text-surface-400 leading-relaxed max-w-sm">
              Nigeria&apos;s verified opportunities network. Curating genuine jobs across all 36 States and the FCT, high-stipend NYSC PPAs, graduate trainee cycles, fully funded scholarships, and USD remote work.
            </p>
            <div className="flex items-center gap-2 text-xs text-brand-400 font-medium pt-2">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span>Strict anti-scam curation. Verified employer contacts.</span>
            </div>
          </div>

          {/* Opportunities Column */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Opportunities
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/jobs" className="hover:text-white transition">Browse All Jobs</Link>
              </li>
              <li>
                <Link href="/jobs?type=nysc_ppa" className="hover:text-white transition">NYSC PPA Listings</Link>
              </li>
              <li>
                <Link href="/jobs?type=graduate_trainee" className="hover:text-white transition">Graduate Trainees</Link>
              </li>
              <li>
                <Link href="/jobs?policy=remote_global" className="hover:text-white transition">Remote Jobs (USD)</Link>
              </li>
              <li>
                <Link href="/opportunities?type=scholarship" className="hover:text-white transition">Scholarships & Grants</Link>
              </li>
            </ul>
          </div>

          {/* Regional Hubs */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              36 States & FCT
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/jobs?state=lagos" className="hover:text-white transition">Lagos State Jobs</Link>
              </li>
              <li>
                <Link href="/jobs?state=fct-abuja" className="hover:text-white transition">Abuja (FCT) Vacancies</Link>
              </li>
              <li>
                <Link href="/jobs?state=rivers" className="hover:text-white transition">Rivers / Port Harcourt</Link>
              </li>
              <li>
                <Link href="/jobs?state=kano" className="hover:text-white transition">Kano & Northern Hubs</Link>
              </li>
              <li>
                <Link href="/locations" className="hover:text-white transition text-brand-400">View All 36 States →</Link>
              </li>
            </ul>
          </div>

          {/* Company & Support */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/pricing" className="hover:text-white transition">Membership (₦3,500)</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition">About JobNexa</Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition">Career Advice & Tips</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">Contact & Verification</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with NDPA / Legal Note */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-surface-500">
          <p>© {new Date().getFullYear()} JobNexa Technologies Nigeria. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Compliant with Nigeria Data Protection Act (NDPA)</span>
            <span>Paystack Secured</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
