'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SEED_CATEGORIES, SEED_STATES } from '@/lib/mock-data';
import { Briefcase, ArrowLeft, Save, Lock, ShieldCheck, Sparkles } from 'lucide-react';

export default function NewOpportunityPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [categoryId, setCategoryId] = useState(SEED_CATEGORIES[0]?.id || 'cat-1');
  const [stateId, setStateId] = useState(SEED_STATES[0]?.id || 'state-1');
  const [city, setCity] = useState('');
  const [type, setType] = useState('full_time');
  const [policy, setPolicy] = useState('on_site');
  const [salary, setSalary] = useState('');
  const [experience, setExperience] = useState('Entry Level (0-2 years)');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [benefits, setBenefits] = useState('');
  const [isLocked, setIsLocked] = useState(true);
  const [employerEmail, setEmployerEmail] = useState('');
  const [employerPhone, setEmployerPhone] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const [status, setStatus] = useState('published');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/opportunities', {
        method: 'POST',
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
          experience_level: experience,
          application_deadline: deadline ? new Date(deadline).toISOString() : null,
          description,
          requirements,
          benefits,
          is_locked: isLocked,
          employer_email: employerEmail,
          employer_phone: employerPhone,
          application_url: applicationUrl,
          application_instructions: instructions,
          status,
          is_featured: isFeatured,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Opportunity created successfully and saved to catalog!');
        router.push('/admin/opportunities');
      } else {
        alert(`Error: ${data.error || 'Failed to create opportunity'}`);
      }
    } catch {
      alert('Network error while saving opportunity');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/admin/opportunities"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-500 hover:text-primary transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Opportunities Catalog</span>
      </Link>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
          Create New Opportunity
        </h1>
        <p className="text-xs sm:text-sm text-surface-500 mt-1">
          Publish a verified vacancy, scholarship, or trainee programme.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Information */}
        <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-surface-900 uppercase tracking-wider pb-2 border-b border-surface-100">
            1. Role & Employer Overview
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Opportunity Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Graduate Trainee 2027 or Software Engineer"
                className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Organization / Employer Name</label>
              <input
                type="text"
                required
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Access Bank Plc or Flour Mills"
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
                {SEED_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Nigerian State</label>
              <select
                value={stateId}
                onChange={(e) => setStateId(e.target.value)}
                className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {SEED_STATES.map((st) => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">City / Area</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Ikeja, Lagos or Wuse II, Abuja"
                className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Opportunity Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="full_time">Full-time Job</option>
                <option value="nysc_ppa">NYSC PPA Placement</option>
                <option value="graduate_trainee">Graduate Trainee Cycle</option>
                <option value="scholarship">Academic Scholarship</option>
                <option value="grant">SME / Founder Grant</option>
                <option value="fellowship">Fellowship</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Workplace Policy</label>
              <select
                value={policy}
                onChange={(e) => setPolicy(e.target.value)}
                className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="on_site">On-site</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote_nigeria">Remote (Nigeria)</option>
                <option value="remote_global">Remote (Global USD)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Salary / Stipend</label>
              <input
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g. ₦250,000 / month or $2,000"
                className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Public Content */}
        <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-surface-900 uppercase tracking-wider pb-2 border-b border-surface-100">
            2. Public Content (Free for Everyone to Read)
          </h3>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">Job Description</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed overview of the role, responsibilities, and team context..."
              className="w-full p-3 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">Candidate Requirements</label>
            <textarea
              rows={4}
              required
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Educational degree, NYSC status, experience, skills..."
              className="w-full p-3 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
            ></textarea>
          </div>
        </div>

        {/* Protected Locked Application Block */}
        <div className="bg-emerald-950 text-white p-6 rounded-2xl border border-emerald-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>3. Protected Application Dossier (Unlocked with ₦3,500 Pass)</span>
            </h3>

            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={isLocked}
                onChange={(e) => setIsLocked(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-0"
              />
              <span className="font-semibold text-emerald-100">Gated (Requires Pro Pass)</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-emerald-200 mb-1">HR / Recruiter Email</label>
              <input
                type="email"
                value={employerEmail}
                onChange={(e) => setEmployerEmail(e.target.value)}
                placeholder="direct-recruiter@company.com"
                className="w-full px-3 py-2 text-xs text-white bg-emerald-900/80 border border-emerald-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-200 mb-1">Recruiter WhatsApp / Phone Desk</label>
              <input
                type="text"
                value={employerPhone}
                onChange={(e) => setEmployerPhone(e.target.value)}
                placeholder="+234 818 000 0000"
                className="w-full px-3 py-2 text-xs text-white bg-emerald-900/80 border border-emerald-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-400 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-emerald-200 mb-1">Direct Online Application URL</label>
            <input
              type="url"
              value={applicationUrl}
              onChange={(e) => setApplicationUrl(e.target.value)}
              placeholder="https://company.com/careers/apply/123"
              className="w-full px-3 py-2 text-xs text-white bg-emerald-900/80 border border-emerald-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-400 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-emerald-200 mb-1">Specific Application Instructions</label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Email subject must be 'Graduate Trainee - Lagos - Name'. Attach 1-page CV and transcripts."
              className="w-full p-3 text-xs text-white bg-emerald-900/80 border border-emerald-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-400"
            ></textarea>
          </div>
        </div>

        {/* Publishing & Moderation */}
        <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-surface-900">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-0"
              />
              <span>Pin as Featured Listing</span>
            </label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-1.5 text-xs text-surface-800 bg-surface-50 border border-surface-200 rounded-xl font-semibold"
            >
              <option value="published">Publish Immediately</option>
              <option value="draft">Save as Draft</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white transition shadow-sm flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : 'Save & Publish Opportunity'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
