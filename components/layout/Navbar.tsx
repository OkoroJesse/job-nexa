'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { 
  Briefcase, 
  Search, 
  Award, 
  MapPin, 
  Bookmark, 
  User, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X,
  CreditCard,
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, isActiveMember, logout, loginDemoUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: 'Browse Jobs', href: '/jobs', icon: Briefcase },
    { name: 'Scholarships & Grants', href: '/opportunities', icon: Award },
    { name: '36 States & FCT', href: '/locations', icon: MapPin },
    { name: 'Categories', href: '/categories', icon: Layers },
    { name: 'Pricing (₦3,500)', href: '/pricing', icon: CreditCard },
    { name: 'Blog', href: '/blog', icon: FileText },
  ];

  const isHomepage = pathname === '/';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-surface-200">
      {/* Top Banner with Trust Signal (Clean, public-safe) */}
      <div className="bg-primary text-white text-xs py-1.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-brand-300 shrink-0" />
            <span className="truncate">JobNexa • Nigeria&apos;s Verified Opportunities Network across all 36 States & FCT</span>
          </div>

          {/* Test perspective switcher: Only rendered in development on non-homepage routes */}
          {process.env.NODE_ENV === 'development' && !isHomepage && (
            <div className="hidden xl:flex items-center gap-2 text-[11px] bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-600/40">
              <span className="text-emerald-300 font-mono text-[10px]">Dev Testing:</span>
              <button
                onClick={() => loginDemoUser('free')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
                  user && !isActiveMember
                    ? 'bg-amber-400 text-slate-900 font-bold'
                    : 'text-emerald-100 hover:text-white'
                }`}
                title="Switch to Free Seeker (Locked Contact view)"
              >
                Free
              </button>
              <span className="text-emerald-600">|</span>
              <button
                onClick={() => loginDemoUser('pro')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
                  isActiveMember
                    ? 'bg-brand-400 text-slate-900 font-bold'
                    : 'text-emerald-100 hover:text-white'
                }`}
                title="Switch to Active Pro Member (Unlocked Contact view)"
              >
                Pro (₦3,500)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <Image
            src="/brand/jobnexa-icon.png"
            alt="JobNexa"
            width={38}
            height={38}
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain group-hover:scale-105 transition-transform"
            priority
          />
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-surface-900 font-sans leading-none">
              Job<span className="text-primary">Nexa</span>
            </span>
            <span className="text-[9px] sm:text-[10px] text-surface-400 uppercase tracking-wider font-semibold mt-0.5">
              Nigeria
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links — strict single-line, compact spacing */}
        <div className="hidden lg:flex items-center gap-0.5 xl:gap-1.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`whitespace-nowrap px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-lg text-xs xl:text-sm font-medium transition ${
                  isActive
                    ? 'text-primary bg-primary-light font-semibold'
                    : 'text-surface-700 hover:text-primary hover:bg-surface-50'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* User Actions & Auth State */}
        <div className="hidden md:flex items-center gap-2 xl:gap-3 shrink-0">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-surface-200 hover:border-surface-300 bg-surface-50 transition"
              >
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                  {user.full_name ? user.full_name.charAt(0) : 'U'}
                </div>
                <div className="text-left pr-1">
                  <div className="text-xs font-semibold text-surface-900 line-clamp-1 max-w-[110px] xl:max-w-[140px]">
                    {user.full_name}
                  </div>
                  <div className="text-[10px] font-medium flex items-center gap-1">
                    {isActiveMember ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> 30-Day Pro
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium">Free Seeker</span>
                    )}
                  </div>
                </div>
              </button>

              {userDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-surface-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-surface-100">
                    <p className="text-[11px] text-surface-400">Signed in as</p>
                    <p className="text-xs font-semibold text-surface-900 truncate">{user.email}</p>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-surface-800 hover:bg-surface-50 font-medium"
                  >
                    <User className="w-4 h-4 text-surface-400" />
                    Dashboard & Profile
                  </Link>

                  <Link
                    href="/dashboard/saved"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-surface-800 hover:bg-surface-50 font-medium"
                  >
                    <Bookmark className="w-4 h-4 text-surface-400" />
                    Saved Opportunities
                  </Link>

                  <Link
                    href="/pricing"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-surface-800 hover:bg-surface-50 font-medium"
                  >
                    <CreditCard className="w-4 h-4 text-surface-400" />
                    Membership Status
                  </Link>

                  <div className="border-t border-surface-100 my-1"></div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="whitespace-nowrap px-3 py-1.5 xl:px-3.5 xl:py-2 text-xs xl:text-sm font-semibold text-surface-700 hover:text-primary transition rounded-lg hover:bg-surface-50"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="whitespace-nowrap px-3.5 py-1.5 xl:px-4 xl:py-2 text-xs xl:text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-sm transition"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-surface-700 hover:text-surface-900 hover:bg-surface-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-primary" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer with Backdrop */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative z-50 lg:hidden border-t border-surface-200 bg-white px-4 pt-3 pb-6 shadow-2xl max-h-[calc(100vh-80px)] overflow-y-auto">
            <div className="space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? 'text-primary bg-primary-light font-semibold'
                        : 'text-surface-800 hover:text-primary hover:bg-surface-50'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-surface-400'}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-surface-200 pt-4 mt-3">
              {user ? (
                <div className="space-y-2">
                  <div className="px-3.5 py-2 bg-surface-50 rounded-xl border border-surface-100">
                    <p className="text-sm font-bold text-surface-900">{user.full_name}</p>
                    <p className="text-xs text-surface-500 truncate">{user.email}</p>
                    <div className="mt-1.5">
                      {isActiveMember ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-brand-100 text-brand-900 border border-brand-200">
                          <Sparkles className="w-3 h-3 text-brand-700" /> Active 30-Day Pro
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface-200 text-surface-700">
                          Free Seeker
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-sm font-medium text-surface-700 hover:bg-surface-50"
                  >
                    <User className="w-4 h-4 text-surface-400" />
                    <span>Dashboard & Profile</span>
                  </Link>

                  <Link
                    href="/dashboard/saved"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-sm font-medium text-surface-700 hover:bg-surface-50"
                  >
                    <Bookmark className="w-4 h-4 text-surface-400" />
                    <span>Saved Opportunities</span>
                  </Link>

                  <Link
                    href="/pricing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-sm font-medium text-surface-700 hover:bg-surface-50"
                  >
                    <CreditCard className="w-4 h-4 text-surface-400" />
                    <span>Pricing & Membership</span>
                  </Link>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-2.5 w-full text-left px-3.5 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 text-sm font-semibold text-surface-800 border border-surface-200 rounded-xl hover:bg-surface-50 transition"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm transition"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
