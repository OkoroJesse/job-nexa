'use client';

import React, { useState } from 'react';
import { UnlockedOpportunity } from '@/types/database';
import { 
  CheckCircle2, 
  Mail, 
  Phone, 
  ExternalLink, 
  Copy, 
  Check, 
  MessageSquare, 
  FileText,
  Sparkles
} from 'lucide-react';

interface UnlockedContactCardProps {
  opportunity: UnlockedOpportunity;
}

export default function UnlockedContactCard({ opportunity }: UnlockedContactCardProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopy = (text: string, type: 'email' | 'phone') => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  return (
    <div className="bg-emerald-950 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-emerald-800 relative overflow-hidden">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-emerald-800/80">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-full bg-emerald-500/20 text-brand-300">
            <CheckCircle2 className="w-5 h-5 text-brand-400" />
          </span>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Employer Contact Unlocked
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Active Member
              </span>
            </h3>
            <p className="text-xs text-emerald-200">
              Verified HR contacts & direct submission instructions for {opportunity.organization_name}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Email Submission Box */}
        {opportunity.employer_email && (
          <div className="bg-emerald-900/60 rounded-xl p-4 border border-emerald-800 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold uppercase tracking-wider mb-2">
              <Mail className="w-4 h-4 text-brand-400" />
              <span>Direct HR / Recruiter Email</span>
            </div>

            <div className="text-sm sm:text-base font-mono font-bold text-white select-all break-all mb-3">
              {opportunity.employer_email}
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`mailto:${opportunity.employer_email}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-400 text-slate-950 transition"
              >
                <Mail className="w-3.5 h-3.5" />
                Open Email
              </a>

              <button
                onClick={() => handleCopy(opportunity.employer_email!, 'email')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition border border-emerald-700"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5 text-brand-300" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedEmail ? 'Copied!' : 'Copy Email'}
              </button>
            </div>
          </div>
        )}

        {/* WhatsApp / Phone Box */}
        {opportunity.employer_phone && (
          <div className="bg-emerald-900/60 rounded-xl p-4 border border-emerald-800 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold uppercase tracking-wider mb-2">
              <MessageSquare className="w-4 h-4 text-brand-400" />
              <span>Recruiter WhatsApp / Direct Desk</span>
            </div>

            <div className="text-sm sm:text-base font-mono font-bold text-white select-all mb-3">
              {opportunity.employer_phone}
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/${opportunity.employer_phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Chat on WhatsApp
              </a>

              <button
                onClick={() => handleCopy(opportunity.employer_phone!, 'phone')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition border border-emerald-700"
              >
                {copiedPhone ? <Check className="w-3.5 h-3.5 text-brand-300" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedPhone ? 'Copied!' : 'Copy Number'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* External Portal Link (if applicable) */}
      {opportunity.application_url && (
        <div className="bg-emerald-900/40 rounded-xl p-4 border border-emerald-800 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-brand-400 shrink-0" />
            <div>
              <span className="text-xs text-emerald-200 font-medium">Official Online Career Portal:</span>
              <p className="text-sm font-semibold text-white break-all">{opportunity.application_url}</p>
            </div>
          </div>
          <a
            href={opportunity.application_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-white text-emerald-950 hover:bg-emerald-50 transition shrink-0"
          >
            Open Official Portal
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Application Instructions */}
      {opportunity.application_instructions && (
        <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-300 uppercase tracking-wider mb-2">
            <FileText className="w-4 h-4" />
            <span>Specific Application Instructions & Subject Line</span>
          </div>
          <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed whitespace-pre-line">
            {opportunity.application_instructions}
          </p>
        </div>
      )}
    </div>
  );
}
