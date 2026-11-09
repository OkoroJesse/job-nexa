'use client';

import React, { useState } from 'react';
import { Mail, MapPin, Phone, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-surface-900 tracking-tight">
          Get in Touch with JobNexa
        </h1>
        <p className="text-sm sm:text-base text-surface-600">
          Have a question about your membership, need bank transfer confirmation support, or wish to report a suspicious job listing?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Info Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider">
              Verification & Support Desks
            </h3>

            <div className="space-y-3 text-xs sm:text-sm text-surface-700">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-surface-900">General Support</span>
                  <a href="mailto:support@jobnexa.ng" className="text-primary hover:underline">support@jobnexa.ng</a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-surface-900">Fraud & Scam Reporting</span>
                  <a href="mailto:fraud-desk@jobnexa.ng" className="text-amber-700 hover:underline">fraud-desk@jobnexa.ng</a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-surface-900">WhatsApp Support Desk</span>
                  <span className="text-surface-600">+234 818 200 4401</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm space-y-3 text-xs text-surface-600">
            <div className="flex items-center gap-2 font-bold text-surface-900 text-sm">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Office Hubs</span>
            </div>
            <p>
              <strong>Abuja HQ:</strong> Ventures Park, 5 Kwaji Close, Maitama, Abuja (FCT), Nigeria.
            </p>
            <p>
              <strong>Lagos Operations:</strong> 14 Admiralty Way, Lekki Phase 1, Lagos, Nigeria.
            </p>
          </div>
        </div>

        {/* Message Form */}
        <div className="md:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-surface-200 shadow-sm">
          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-brand-50 text-primary flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-surface-900">Message Received!</h3>
              <p className="text-xs sm:text-sm text-surface-600 max-w-md mx-auto">
                Thank you for reaching out. A JobNexa support representative will respond to your registered email address within 4 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg font-bold text-surface-900">Send Us an Inquiry</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ibrahim Suleiman"
                    className="w-full px-3.5 py-2 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">Your Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ibrahim@example.com"
                    className="w-full px-3.5 py-2 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Inquiry Category</label>
                <select className="w-full px-3.5 py-2 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="bank_transfer">Bank Transfer Payment Verification</option>
                  <option value="scam_report">Report Suspicious Listing or Fake Employer</option>
                  <option value="employer_post">Employer Direct Listing Inquiry</option>
                  <option value="general">General Support</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Your Message</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Include your payment reference code or the title of the opportunity you are inquiring about..."
                  className="w-full px-3.5 py-2 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                ></textarea>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white transition shadow-sm"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
