'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, ArrowLeft, Save, Lock, Trash2, Loader2 } from 'lucide-react';

interface TaxonomyCategory {
  id: string;
  name: string;
}

interface TaxonomyState {
  id: string;
  name: string;
}

export default function EditOpportunityPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<TaxonomyCategory[]>([]);
  const [states, setStates] = useState<TaxonomyState[]>([]);
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stateId, setStateId] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('full_time');
  const [policy, setPolicy] = useState('on_site');
  const [salary, setSalary] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [isLocked, setIsLocked] = useState(true);
  const [employerEmail, setEmployerEmail] = useState('');
  const [employerPhone, setEmployerPhone] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const [status, setStatus] = useState('published');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [oppRes, taxRes] = await Promise.all([
          fetch(`/api/admin/opportunities/${params.id}`),
          fetch('/api/taxonomies'),
        ]);

        const oppData = await oppRes.json();
        const taxData = await taxRes.json();

        if (taxData.categories) setCategories(taxData.categories);
        if (taxData.states) setStates(taxData.states);

        if (oppData.opportunity) {
          const opp = oppData.opportunity;
          setTitle(opp.title || '');
          setOrganization(opp.organization_name || '');
          setCategoryId(opp.category_id || taxData.categories?.[0]?.id || '');
          setStateId(opp.state_id || taxData.states?.[0]?.id || '');
          setCity(opp.city || '');
          setType(opp.opportunity_type || 'full_time');
          setPolicy(opp.workplace_policy || 'on_site');
          setSalary(opp.salary_or_stipend_range || '');
          setDescription(opp.description || '');
          setRequirements(opp.requirements || '');
          setIsLocked(opp.is_locked ?? true);
          setEmployerEmail(opp.employer_email || '');
          setEmployerPhone(opp.employer_phone || '');
          setApplicationUrl(opp.application_url || '');
          setInstructions(opp.application_instructions || '');
          setStatus(opp.status || 'published');
          setIsFeatured(opp.is_featured ?? false);
        }
      } catch (err) {
        console.error('Error loading opportunity:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/opportunities/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          organization_name: organization,
          category_id: categoryId,
          state_id: stateId,
          city,
          opportunity_type: type,
          workplace_policy: policy,
          salary_or_stipend_range: salary,
          description,
          requirements,
          is_locked: isLocked,
          employer_email: employerEmail,
          employer_phone: employerPhone,
          application_url: applicationUrl,
          application_instructions: instructions,
          status,
          is_featured: isFeatured,
        }),
      });

      if (res.ok) {
        alert('Opportunity updated successfully!');
        router.push('/admin/opportunities');
      } else {
        alert('Failed to update opportunity');
      }
    } catch {
      alert('Network error while saving changes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this opportunity?')) return;

    try {
      await fetch(`/api/admin/opportunities/${params.id}`, { method: 'DELETE' });
      alert('Opportunity deleted.');
      router.push('/admin/opportunities');
    } catch {
      alert('Failed to delete');
    }
  };

  if (loading) {
    return <div className="p-8 text-xs text-surface-500">Loading opportunity data...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/admin/opportunities"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-500 hover:text-primary transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Opportunities Catalog</span>
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
            Edit Opportunity
          </h1>
          <p className="text-xs sm:text-sm text-surface-500 mt-1">
            ID: <span className="font-mono">{params.id}</span>
          </p>
        </div>

        <button
          onClick={handleDelete}
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Listing</span>
        </button>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-surface-900 uppercase tracking-wider pb-2 border-b border-surface-100">
            Overview
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Organization</label>
              <input
                type="text"
                required
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">State</label>
              <select
                value={stateId}
                onChange={(e) => setStateId(e.target.value)}
                className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {states.map((st) => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">Description</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
            ></textarea>
          </div>
        </div>

        {/* Private Contact Fields */}
        <div className="bg-emerald-950 text-white p-6 rounded-2xl border border-emerald-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Protected Application Details</span>
            </h3>

            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={isLocked}
                onChange={(e) => setIsLocked(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-0"
              />
              <span className="font-semibold text-emerald-100">Gated behind ₦3,500 Pass</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-emerald-200 mb-1">Employer Email</label>
              <input
                type="email"
                value={employerEmail}
                onChange={(e) => setEmployerEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs text-white bg-emerald-900/80 border border-emerald-700 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-200 mb-1">Recruiter WhatsApp / Phone</label>
              <input
                type="text"
                value={employerPhone}
                onChange={(e) => setEmployerPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs text-white bg-emerald-900/80 border border-emerald-700 rounded-xl font-mono"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-surface-900">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-0"
            />
            <span>Featured Listing</span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white transition shadow-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Updating...' : 'Save Opportunity Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
