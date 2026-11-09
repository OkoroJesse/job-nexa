'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CheckSquare, 
  UploadCloud, 
  Briefcase, 
  Users, 
  CreditCard, 
  Building2,
  FolderTree,
  BookOpen,
  Bell,
  BarChart3,
  History,
  Settings, 
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const coreLinks = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Bank Verifications', href: '/admin/verifications', icon: CheckSquare, badge: 'Active' },
    { name: 'Paystack Transactions', href: '/admin/paystack', icon: CreditCard },
    { name: 'Opportunities Catalog', href: '/admin/opportunities', icon: Briefcase },
    { name: 'Job Import Centre', href: '/admin/import-centre', icon: UploadCloud },
  ];

  const managementLinks = [
    { name: 'User Accounts', href: '/admin/users', icon: Users },
    { name: 'Employers & Companies', href: '/admin/employers', icon: Building2 },
    { name: 'Categories & 36 States', href: '/admin/taxonomies', icon: FolderTree },
    { name: 'Blog & Editorial CMS', href: '/admin/blog', icon: BookOpen },
    { name: 'In-App Notifications', href: '/admin/notifications', icon: Bell },
  ];

  const systemLinks = [
    { name: 'Analytics & Revenue', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Admin Audit Logs', href: '/admin/activity-logs', icon: History },
    { name: 'Platform Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-surface-100 flex flex-col lg:flex-row font-sans">
      {/* Admin Sidebar */}
      <aside className="w-full lg:w-72 bg-surface-900 text-white p-5 border-r border-surface-800 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-2">
            <Image
              src="/brand/jobnexa-icon.png"
              alt="JobNexa"
              width={36}
              height={36}
              className="w-9 h-9 object-contain"
            />
            <div>
              <div className="text-sm font-bold text-white tracking-tight">JobNexa Console</div>
              <div className="text-[10px] text-brand-400 font-semibold uppercase tracking-wider">Admin & Business Hub</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400 px-3 block mb-1.5">
                Core Operations
              </span>
              <nav className="space-y-0.5">
                {coreLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-surface-300 hover:text-white hover:bg-surface-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{link.name}</span>
                      </div>
                      {link.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400 text-slate-900">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400 px-3 block mb-1.5">
                Business Management
              </span>
              <nav className="space-y-0.5">
                {managementLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-surface-300 hover:text-white hover:bg-surface-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400 px-3 block mb-1.5">
                System & Security
              </span>
              <nav className="space-y-0.5">
                {systemLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-surface-300 hover:text-white hover:bg-surface-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-surface-800 mt-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-surface-400 hover:text-white transition px-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Public Website</span>
          </Link>
        </div>
      </aside>

      {/* Main Admin View */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
