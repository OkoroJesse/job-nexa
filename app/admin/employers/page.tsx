'use client';

import React, { useState, useEffect } from 'react';
import { Building2, ShieldCheck, CheckCircle2, Globe, Mail, Phone, Plus, MapPin, Loader2, X } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  industry: string;
  headquarters_city: string | null;
  official_email: string | null;
  official_phone: string | null;
  is_verified: boolean;
  total_listings_count: number;
}

export default function AdminEmployersPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Add employer modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/employers');
      const data = await res.json();
      if (res.ok && data.companies) {
        setCompanies(data.companies);
      }
    } catch (e) {
      console.warn('Error fetching companies:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleVerified = async (id: string, currentVal: boolean) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/employers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_verified: !currentVal }),
      });
      if (res.ok) {
        setCompanies((prev) =>
          prev.map((c) => (c.id === id ? { ...c, is_verified: !currentVal } : c))
        );
      } else {
        alert('Failed to update verification status');
      }
    } catch {
      alert('Error updating employer');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddEmployer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/employers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          industry: industry.trim() || 'Corporate',
          headquarters_city: city.trim() || null,
          official_email: email.trim() || null,
          official_phone: phone.trim() || null,
          is_verified: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.company) {
        setCompanies((prev) => [data.company, ...prev]);
        setIsModalOpen(false);
        setName('');
        setIndustry('');
        setCity('');
        setEmail('');
        setPhone('');
      } else {
        alert(data.error || 'Failed to add employer');
      }
    } catch {
      alert('Error creating employer');
    } finally {
      setSubmitting(false);
    }
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
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-sm flex items-center gap-2 shrink-0 transition"
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

        {loading ? (
          <div className="p-12 text-center text-surface-400 flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs">Loading verified employers from database...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Building2 className="w-10 h-10 text-surface-300 mx-auto" />
            <div className="text-sm font-bold text-surface-900">No employers registered yet</div>
            <p className="text-xs text-surface-500 max-w-sm mx-auto">
              Click &quot;Add Verified Employer&quot; above to add a company and assign the Anti-Scam Verified badge.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {companies.map((comp) => (
              <div key={comp.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-surface-900">{comp.name}</span>
                    {comp.is_verified && (
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
                      {comp.headquarters_city || 'Nigeria'}
                    </span>
                    {comp.official_email && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono text-primary font-semibold">
                          <Mail className="w-3.5 h-3.5 text-surface-400" />
                          {comp.official_email}
                        </span>
                      </>
                    )}
                    {comp.official_phone && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-surface-400" />
                          {comp.official_phone}
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span>{comp.total_listings_count || 0} Active Listings</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleVerified(comp.id, comp.is_verified)}
                    disabled={actionLoading === comp.id}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                      comp.is_verified
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-surface-200 hover:bg-surface-50 text-surface-700'
                    }`}
                  >
                    {comp.is_verified ? 'Revoke Verified Badge' : 'Mark as Verified'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Employer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-surface-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-surface-900">Add Verified Employer</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-surface-400 hover:text-surface-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEmployer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-surface-700 mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Zenith Bank Plc"
                  className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-surface-700 mb-1">Industry / Sector</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Banking & Financial Services"
                  className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-surface-700 mb-1">City / Headquarters</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Victoria Island, Lagos"
                  className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-surface-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="careers@company.com"
                    className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-surface-700 mb-1">Official Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234..."
                    className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-surface-600 hover:bg-surface-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold transition disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Employer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
