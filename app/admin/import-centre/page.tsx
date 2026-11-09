'use client';

import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Code, 
  Edit3, 
  CheckCircle2, 
  Trash2, 
  Eye, 
  Sparkles,
  AlertCircle,
  Rss,
  Globe,
  RefreshCw,
  Loader2
} from 'lucide-react';

interface StagedOpportunity {
  id: string;
  title: string;
  organization_name?: string;
  organization?: string;
  city?: string;
  location?: string;
  opportunity_type?: string;
  type?: string;
  employer_email?: string;
  employerEmail?: string;
  employer_phone?: string;
  employerPhone?: string;
  application_url?: string;
  applicationUrl?: string;
  status: 'draft' | 'published';
}

export default function ImportCentrePage() {
  const [activeTab, setActiveTab] = useState<'raw_paste' | 'csv' | 'json' | 'rss_api'>('raw_paste');
  const [stagedList, setStagedList] = useState<StagedOpportunity[]>([]);
  const [loadingStaged, setLoadingStaged] = useState(true);
  const [rawText, setRawText] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [feedUrl, setFeedUrl] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDrafts = async () => {
    setLoadingStaged(true);
    try {
      const res = await fetch('/api/admin/opportunities?status=draft');
      const data = await res.json();
      if (res.ok && data.opportunities) {
        setStagedList(data.opportunities);
      }
    } catch (e) {
      console.warn('Error fetching drafts:', e);
    } finally {
      setLoadingStaged(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handleImportSubmit = async (mode: 'raw_paste' | 'json' | 'csv' | 'rss') => {
    setIsProcessing(true);
    setImportSummary(null);

    let payload: any = null;
    if (mode === 'raw_paste') payload = rawText;
    if (mode === 'json') payload = jsonText;
    if (mode === 'csv' && csvFile) {
      payload = await csvFile.text();
    }

    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, payload, feedUrl }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setImportSummary(data.message);
        setRawText('');
        setJsonText('');
        setCsvFile(null);
        await fetchDrafts();
      } else {
        setImportSummary(`Error: ${data.error || 'Import failed'}`);
      }
    } catch {
      setImportSummary('Network error during batch ingestion');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublish = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published', published_at: new Date().toISOString() }),
      });
      if (res.ok) {
        setStagedList((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: 'published' } : item))
        );
        alert('Opportunity approved and published live to JobNexa directory!');
      } else {
        alert('Failed to publish opportunity');
      }
    } catch {
      alert('Error updating opportunity status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to discard this staged opportunity?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/opportunities/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setStagedList((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert('Failed to discard opportunity');
      }
    } catch {
      alert('Error deleting opportunity');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
          Universal Job Import Centre
        </h1>
        <p className="text-xs sm:text-sm text-surface-500 mt-1">
          Ingest opportunities via raw text broadcast, CSV uploads, JSON bulk arrays, or authorised RSS/API feeds.
        </p>
      </div>

      {/* Security & Moderation Invariant Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3 text-xs text-amber-900">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Mandatory Quality Invariant:</strong> All imported jobs automatically enter as <strong>draft</strong>. They remain invisible to public users until an administrator reviews the contact details and clicks <strong>Approve & Publish Live</strong>. AI extraction never fabricates employer contact emails, salaries, deadlines, or company identities.
        </div>
      </div>

      {/* Ingestion Channels Container */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-2 border-b border-surface-200 pb-3">
          <button
            onClick={() => setActiveTab('raw_paste')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'raw_paste'
                ? 'bg-primary text-white shadow-sm'
                : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Pasted Raw Text Parser</span>
          </button>

          <button
            onClick={() => setActiveTab('csv')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'csv'
                ? 'bg-primary text-white shadow-sm'
                : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>CSV Batch Upload</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'json'
                ? 'bg-primary text-white shadow-sm'
                : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>JSON Array Ingestion</span>
          </button>

          <button
            onClick={() => setActiveTab('rss_api')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'rss_api'
                ? 'bg-primary text-white shadow-sm'
                : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
            }`}
          >
            <Rss className="w-4 h-4" />
            <span>Authorised RSS / API Poller</span>
          </button>
        </div>

        {/* Tab 1: Pasted Raw Text */}
        {activeTab === 'raw_paste' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1">
                Paste Raw Job Broadcast (WhatsApp, LinkedIn, Email, or Gazette)
              </label>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste unstructured job broadcast here... (System automatically detects title, requirements, recruiter email, and WhatsApp numbers)"
                className="w-full p-3.5 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              ></textarea>
            </div>

            <button
              onClick={() => handleImportSubmit('raw_paste')}
              disabled={isProcessing || !rawText.trim()}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white transition shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-brand-300" />
              <span>{isProcessing ? 'Normalizing & Parsing...' : 'Parse & Stage as Draft'}</span>
            </button>
          </div>
        )}

        {/* Tab 2: CSV Batch Upload */}
        {activeTab === 'csv' && (
          <div className="p-8 border-2 border-dashed border-surface-200 rounded-2xl text-center space-y-3">
            <UploadCloud className="w-10 h-10 text-surface-400 mx-auto" />
            <h4 className="text-sm font-bold text-surface-900">Upload CSV Opportunities File</h4>
            <p className="text-xs text-surface-500 max-w-sm mx-auto">
              Required headers: <span className="font-mono">title, company, city, state, type, description, email, phone</span>.
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="text-xs text-surface-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white"
            />
            {csvFile && (
              <div className="pt-2">
                <button
                  onClick={() => handleImportSubmit('csv')}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-primary text-white"
                >
                  {isProcessing ? 'Processing CSV...' : 'Ingest CSV to Review Queue (Drafts)'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: JSON Array */}
        {activeTab === 'json' && (
          <div className="space-y-4">
            <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1">
              Paste JSON Array of Opportunities
            </label>
            <textarea
              rows={6}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='[ { "title": "Senior Accountant", "company": "Zenith Bank", "city": "Lagos", "email": "hr@zenithbank.com" } ]'
              className="w-full p-3.5 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            ></textarea>

            <button
              onClick={() => handleImportSubmit('json')}
              disabled={isProcessing || !jsonText.trim()}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-primary text-white disabled:opacity-50"
            >
              {isProcessing ? 'Validating Schema...' : 'Ingest JSON Batch (Drafts)'}
            </button>
          </div>
        )}

        {/* Tab 4: RSS & API Poller */}
        {activeTab === 'rss_api' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1">
                Authorised Feed / API Endpoint URL
              </label>
              <input
                type="url"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                placeholder="https://partner-portal.gov.ng/api/v1/verified-vacancies.xml"
                className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>

            <button
              onClick={() => handleImportSubmit('rss')}
              disabled={isProcessing || !feedUrl.trim()}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-primary text-white flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>Poll & Import Feed Records</span>
            </button>
          </div>
        )}

        {importSummary && (
          <div className={`p-4 rounded-xl text-xs ${
            importSummary.startsWith('Error')
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
          }`}>
            {importSummary}
          </div>
        )}
      </div>

      {/* Staging & Review Queue */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-surface-100 flex items-center justify-between text-xs">
          <span className="font-bold text-surface-900 uppercase tracking-wider">
            Staging Review Queue ({stagedList.filter((s) => s.status === 'draft').length} Pending Review)
          </span>
          <span className="text-surface-500 font-semibold">Strict Duplicate Detection Active</span>
        </div>

        <div className="divide-y divide-surface-100">
          {loadingStaged ? (
            <div className="p-8 text-center text-surface-400 flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-xs">Loading staged drafts from database...</span>
            </div>
          ) : stagedList.length === 0 ? (
            <div className="p-8 text-center text-xs text-surface-500">
              No staged drafts currently pending review. Upload or parse an opportunity above to stage.
            </div>
          ) : (
            stagedList.map((item) => (
              <div key={item.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-surface-900">{item.title}</span>
                    <span className="text-surface-500 font-semibold">• {item.organization_name || item.organization}</span>
                  </div>
                  <div className="text-surface-500 text-xs">
                    Location: {item.city || item.location || 'Nationwide'} • Type: {item.opportunity_type || item.type || 'Full Time'} • Contact: <span className="font-mono text-primary font-semibold">{item.employer_email || item.employerEmail || 'Protected'}</span>
                    {(item.employer_phone || item.employerPhone) && <span> • WhatsApp: {item.employer_phone || item.employerPhone}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.status === 'draft' ? (
                    <>
                      <button
                        onClick={() => handlePublish(item.id)}
                        disabled={actionLoading === item.id}
                        className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve & Publish Live</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={actionLoading === item.id}
                        className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                        title="Discard listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                      ✓ Published Live to Directory
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
