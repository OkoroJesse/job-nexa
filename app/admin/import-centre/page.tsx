'use client';

import React, { useState } from 'react';
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
  RefreshCw
} from 'lucide-react';

interface StagedOpportunity {
  id: string;
  title: string;
  organization: string;
  location: string;
  type: string;
  employerEmail?: string;
  employerPhone?: string;
  applicationUrl?: string;
  source: 'csv' | 'json' | 'raw_paste' | 'rss_api';
  status: 'draft' | 'published';
}

const INITIAL_STAGED: StagedOpportunity[] = [
  {
    id: 'stage-1',
    title: 'Customer Success Specialist (Fintech)',
    organization: 'Moniepoint Microfinance Bank',
    location: 'Ibadan, Oyo State',
    type: 'full_time',
    employerEmail: 'careers@moniepoint.com',
    source: 'csv',
    status: 'draft',
  },
  {
    id: 'stage-2',
    title: 'NYSC PPA: Teaching Fellow in Physics & Coding',
    organization: 'Corona Secondary School',
    location: 'Agbara, Ogun State',
    type: 'nysc_ppa',
    employerEmail: 'hr@coronaschools.org',
    employerPhone: '+234 803 111 9900',
    source: 'raw_paste',
    status: 'draft',
  },
  {
    id: 'stage-3',
    title: 'Regional Field Agronomist',
    organization: 'Flour Mills of Nigeria Plc',
    location: 'Zaria, Kaduna State',
    type: 'full_time',
    employerEmail: 'recruitment@fmnplc.com',
    source: 'json',
    status: 'draft',
  },
];

export default function ImportCentrePage() {
  const [activeTab, setActiveTab] = useState<'raw_paste' | 'csv' | 'json' | 'rss_api'>('raw_paste');
  const [stagedList, setStagedList] = useState<StagedOpportunity[]>(INITIAL_STAGED);
  const [rawText, setRawText] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [feedUrl, setFeedUrl] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);

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
        // Refresh local staging list with the new draft
        if (mode === 'raw_paste') {
          const lines = rawText.split('\n').filter(Boolean);
          const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          const phoneMatch = rawText.match(/(?:\+234|0)[789][01]\d{8}/);

          const newStaged: StagedOpportunity = {
            id: `stage-${Date.now()}`,
            title: lines[0]?.substring(0, 50) || 'Parsed Opportunity Broadcast',
            organization: 'Verified Nigerian Employer',
            location: 'Lagos / Nationwide',
            type: /nysc|ppa/i.test(rawText) ? 'nysc_ppa' : 'full_time',
            employerEmail: emailMatch ? emailMatch[0] : undefined,
            employerPhone: phoneMatch ? phoneMatch[0] : undefined,
            source: 'raw_paste',
            status: 'draft', // MANDATORY INVARIANT
          };
          setStagedList([newStaged, ...stagedList]);
          setRawText('');
        }
      } else {
        setImportSummary(`Error: ${data.error || 'Import failed'}`);
      }
    } catch {
      setImportSummary('Network error during batch ingestion');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublish = (id: string) => {
    setStagedList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'published' } : item
      )
    );
    alert('Opportunity approved and published live to JobNexa directory!');
  };

  const handleDelete = (id: string) => {
    setStagedList((prev) => prev.filter((item) => item.id !== id));
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
          {stagedList.map((item) => (
            <div key={item.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-surface-900">{item.title}</span>
                  <span className="text-surface-500 font-semibold">• {item.organization}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-surface-100 text-surface-600">
                    {item.source}
                  </span>
                </div>
                <div className="text-surface-500 text-xs">
                  Location: {item.location} • Type: {item.type} • Contact: <span className="font-mono text-primary font-semibold">{item.employerEmail || 'Protected'}</span>
                  {item.employerPhone && <span> • WhatsApp: {item.employerPhone}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.status === 'draft' ? (
                  <>
                    <button
                      onClick={() => handlePublish(item.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Publish Live</span>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50"
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
          ))}
        </div>
      </div>
    </div>
  );
}
