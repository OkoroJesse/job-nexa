'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  UploadCloud, FileText, Code, Edit3, CheckCircle2, Trash2,
  Sparkles, AlertCircle, Rss, RefreshCw, Loader2, Database,
  Play, TestTube2, ToggleLeft, ToggleRight, Plus, Clock,
  TrendingUp, XCircle, Eye, History, Settings, Globe, Zap,
  ChevronLeft, ChevronRight, ExternalLink, Shield,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Source {
  id: string;
  name: string;
  source_type: string;
  endpoint_url: string;
  is_active: boolean;
  auto_publish: boolean;
  import_frequency_minutes: number;
  last_polled_at: string | null;
  last_poll_status: string | null;
  next_scheduled_poll_at: string | null;
  total_imported_records: number;
  default_attribution: string | null;
  commercial_republication_status: string;
  last_error_message: string | null;
  config: Record<string, unknown>;
}

interface ImportLog {
  id: string;
  source_name: string | null;
  started_at: string;
  completed_at: string | null;
  status: string;
  discovered_count: number;
  imported_count: number;
  duplicates_count: number;
  errors_count: number;
  triggered_by: string;
}

interface StagedOpportunity {
  id: string;
  title: string;
  organization_name?: string;
  city?: string;
  opportunity_type?: string;
  status: string;
  source_name?: string | null;
  application_deadline?: string | null;
  created_at?: string;
}

interface SourceTestResult {
  success?: boolean;
  discovered?: number;
  error?: string | null;
  sample_jobs?: Array<{ title: string; organization: string; location: string }>;
}

type MainTab = 'sources' | 'auto_imports' | 'pending_review' | 'published' | 'expired' | 'history' | 'manual_import';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(iso: string | null): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function statusBadge(status: string | null) {
  if (!status) return null;
  const map: Record<string, string> = {
    success: 'bg-emerald-100 text-emerald-800',
    partial: 'bg-amber-100 text-amber-800',
    error: 'bg-red-100 text-red-800',
    running: 'bg-blue-100 text-blue-800',
    failed: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${map[status] ?? 'bg-surface-100 text-surface-600'}`}>
      {status}
    </span>
  );
}

function sourceTypeBadge(type: string) {
  const map: Record<string, string> = {
    greenhouse: 'bg-green-100 text-green-800',
    lever: 'bg-purple-100 text-purple-800',
    jooble: 'bg-blue-100 text-blue-800',
    rss: 'bg-orange-100 text-orange-800',
    json_api: 'bg-indigo-100 text-indigo-800',
    partner_api: 'bg-pink-100 text-pink-800',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${map[type] ?? 'bg-surface-100 text-surface-600'}`}>
      {type}
    </span>
  );
}

// ─── Add Source Modal ─────────────────────────────────────────────────────────

function AddSourceModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '', source_type: 'greenhouse', endpoint_url: '',
    import_frequency_minutes: 1440, auto_publish: false,
    default_attribution: '', attribution_required: true,
    commercial_republication_status: 'under_review',
    board_token: '', site_name: '', country_filter: 'Nigeria',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true); setError(null);
    const config: Record<string, unknown> = {};
    if (form.source_type === 'greenhouse') config.board_token = form.board_token;
    if (form.source_type === 'lever') config.site_name = form.site_name;
    if (form.country_filter) config.country_filter = form.country_filter.split(',').map(s => s.trim()).filter(Boolean);

    const res = await fetch('/api/admin/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name, source_type: form.source_type,
        endpoint_url: form.endpoint_url,
        import_frequency_minutes: form.import_frequency_minutes,
        auto_publish: form.auto_publish,
        default_attribution: form.default_attribution || null,
        attribution_required: form.attribution_required,
        commercial_republication_status: form.commercial_republication_status,
        config, is_active: false,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) { onCreated(); onClose(); }
    else setError(data.error ?? 'Failed to create source');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-extrabold text-surface-900">Add Job Source</h3>
        {error && <div className="p-3 rounded-xl bg-red-50 text-red-800 text-xs">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-surface-700 mb-1">Source Name *</label>
            <input className="w-full px-3 py-2 text-xs border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Acme Corp Careers (Greenhouse)" />
          </div>
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1">Source Type *</label>
            <select className="w-full px-3 py-2 text-xs border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary" value={form.source_type} onChange={e => setForm(f => ({ ...f, source_type: e.target.value }))}>
              <option value="greenhouse">Greenhouse ATS</option>
              <option value="lever">Lever ATS</option>
              <option value="jooble">Jooble API</option>
              <option value="rss">RSS / XML Feed</option>
              <option value="json_api">JSON API</option>
              <option value="partner_api">Partner API</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1">Poll Frequency</label>
            <select className="w-full px-3 py-2 text-xs border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary" value={form.import_frequency_minutes} onChange={e => setForm(f => ({ ...f, import_frequency_minutes: parseInt(e.target.value) }))}>
              <option value={360}>Every 6 hours</option>
              <option value={720}>Every 12 hours</option>
              <option value={1440}>Daily</option>
              <option value={10080}>Weekly</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-surface-700 mb-1">Endpoint URL *</label>
            <input className="w-full px-3 py-2 text-xs border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-mono" value={form.endpoint_url} onChange={e => setForm(f => ({ ...f, endpoint_url: e.target.value }))} placeholder="https://boards-api.greenhouse.io/v1/boards/COMPANY/jobs?content=true" />
          </div>
          {form.source_type === 'greenhouse' && (
            <div className="col-span-2">
              <label className="block text-xs font-bold text-surface-700 mb-1">Greenhouse Board Token</label>
              <input className="w-full px-3 py-2 text-xs border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-mono" value={form.board_token} onChange={e => setForm(f => ({ ...f, board_token: e.target.value }))} placeholder="e.g. flutterwave" />
            </div>
          )}
          {form.source_type === 'lever' && (
            <div className="col-span-2">
              <label className="block text-xs font-bold text-surface-700 mb-1">Lever Site Name</label>
              <input className="w-full px-3 py-2 text-xs border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-mono" value={form.site_name} onChange={e => setForm(f => ({ ...f, site_name: e.target.value }))} placeholder="e.g. paystack" />
            </div>
          )}
          <div className="col-span-2">
            <label className="block text-xs font-bold text-surface-700 mb-1">Country / Location Filter <span className="font-normal text-surface-400">(comma-separated, e.g. Nigeria, Lagos, Remote)</span></label>
            <input className="w-full px-3 py-2 text-xs border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary" value={form.country_filter} onChange={e => setForm(f => ({ ...f, country_filter: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-surface-700 mb-1">Default Attribution</label>
            <input className="w-full px-3 py-2 text-xs border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary" value={form.default_attribution} onChange={e => setForm(f => ({ ...f, default_attribution: e.target.value }))} placeholder="Acme Corp Careers via Official ATS Feed" />
          </div>
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1">Republication Status</label>
            <select className="w-full px-3 py-2 text-xs border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary" value={form.commercial_republication_status} onChange={e => setForm(f => ({ ...f, commercial_republication_status: e.target.value }))}>
              <option value="permitted">Permitted</option>
              <option value="attribution_required">Attribution Required</option>
              <option value="partner_agreement">Partner Agreement</option>
              <option value="under_review">Under Review</option>
            </select>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input type="checkbox" id="auto_publish" checked={form.auto_publish} onChange={e => setForm(f => ({ ...f, auto_publish: e.target.checked }))} className="rounded" />
            <label htmlFor="auto_publish" className="text-xs font-semibold text-surface-700">Auto-publish imports <span className="text-surface-400 font-normal">(skip review queue)</span></label>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-surface-600 hover:bg-surface-100 rounded-xl">Cancel</button>
          <button onClick={submit} disabled={loading || !form.name || !form.endpoint_url} className="px-5 py-2 text-xs font-bold bg-primary text-white rounded-xl disabled:opacity-50">
            {loading ? 'Creating...' : 'Add Source (Inactive)'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ImportCentrePage() {
  const [activeTab, setActiveTab] = useState<MainTab>('sources');
  const [sources, setSources] = useState<Source[]>([]);
  const [pendingJobs, setPendingJobs] = useState<StagedOpportunity[]>([]);
  const [publishedJobs, setPublishedJobs] = useState<StagedOpportunity[]>([]);
  const [expiredJobs, setExpiredJobs] = useState<StagedOpportunity[]>([]);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [runningSourceId, setRunningSourceId] = useState<string | null>(null);
  const [testingSourceId, setTestingSourceId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, SourceTestResult>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Manual import state (legacy tabs preserved)
  const [manualTab, setManualTab] = useState<'raw_paste' | 'csv' | 'json' | 'rss_api'>('raw_paste');
  const [rawText, setRawText] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [feedUrl, setFeedUrl] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  // ── Stats ──
  const activeSources = sources.filter(s => s.is_active).length;
  const totalImported = sources.reduce((a, s) => a + (s.total_imported_records ?? 0), 0);

  const fetchSources = useCallback(async () => {
    const res = await fetch('/api/admin/sources');
    if (res.ok) { const d = await res.json(); setSources(d.sources ?? []); }
  }, []);

  const fetchOpportunities = useCallback(async (status: string, setter: (v: StagedOpportunity[]) => void) => {
    const res = await fetch(`/api/admin/opportunities?status=${status}&limit=50`);
    if (res.ok) { const d = await res.json(); setter(d.opportunities ?? []); }
  }, []);

  const fetchLogs = useCallback(async (page = 1) => {
    const res = await fetch(`/api/admin/import-logs?page=${page}&limit=25`);
    if (res.ok) {
      const d = await res.json();
      setImportLogs(d.logs ?? []);
      setLogTotal(d.total ?? 0);
      setLogPage(page);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchSources(),
      fetchOpportunities('pending_review', setPendingJobs),
      fetchOpportunities('published', setPublishedJobs),
      fetchOpportunities('expired', setExpiredJobs),
      fetchLogs(1),
    ]).finally(() => setLoading(false));
  }, [fetchSources, fetchOpportunities, fetchLogs]);

  const handleToggle = async (source: Source) => {
    setTogglingId(source.id);
    await fetch(`/api/admin/sources/${source.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !source.is_active }),
    });
    await fetchSources();
    setTogglingId(null);
  };

  const handleRunSource = async (sourceId: string) => {
    setRunningSourceId(sourceId);
    const res = await fetch(`/api/admin/sources/${sourceId}/run`, { method: 'POST' });
    const data = await res.json();
    setRunningSourceId(null);
    await Promise.all([fetchSources(), fetchOpportunities('pending_review', setPendingJobs), fetchLogs(1)]);
    if (data.result) {
      const r = data.result;
      alert(`Import complete!\n✓ ${r.imported_count} imported\n⊘ ${r.duplicates_count} duplicates\n✗ ${r.errors_count} errors`);
    }
  };

  const handleTestSource = async (sourceId: string) => {
    setTestingSourceId(sourceId);
    const res = await fetch(`/api/admin/sources/${sourceId}/test`, { method: 'POST' });
    const data = await res.json();
    setTestResults(prev => ({ ...prev, [sourceId]: data }));
    setTestingSourceId(null);
  };

  const handleRunAll = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/sources/run-all', { method: 'POST' });
    const data = await res.json();
    setLoading(false);
    await Promise.all([fetchSources(), fetchOpportunities('pending_review', setPendingJobs), fetchLogs(1)]);
    alert(`Batch import done!\n${data.results?.length ?? 0} source(s) processed.`);
  };

  const handlePublish = async (id: string) => {
    setActionLoading(id);
    const res = await fetch(`/api/admin/opportunities/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published', published_at: new Date().toISOString() }),
    });
    if (res.ok) {
      await Promise.all([
        fetchOpportunities('pending_review', setPendingJobs),
        fetchOpportunities('published', setPublishedJobs),
      ]);
    }
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject and discard this opportunity?')) return;
    setActionLoading(id);
    const res = await fetch(`/api/admin/opportunities/${id}`, { method: 'DELETE' });
    if (res.ok) await fetchOpportunities('pending_review', setPendingJobs);
    setActionLoading(null);
  };

  const handleManualImport = async (mode: 'raw_paste' | 'json' | 'csv' | 'rss') => {
    setIsProcessing(true); setImportSummary(null);
    let payload: string | null = null;
    if (mode === 'raw_paste') payload = rawText;
    if (mode === 'json') payload = jsonText;
    if (mode === 'csv' && csvFile) payload = await csvFile.text();
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, payload, feedUrl }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setImportSummary(data.message); setRawText(''); setJsonText(''); setCsvFile(null);
        await fetchOpportunities('pending_review', setPendingJobs);
      } else { setImportSummary(`Error: ${data.error || 'Import failed'}`); }
    } catch { setImportSummary('Network error during import'); }
    finally { setIsProcessing(false); }
  };

  const tabs: { key: MainTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'sources', label: 'Job Sources', icon: <Globe className="w-4 h-4" />, count: sources.length },
    { key: 'auto_imports', label: 'Auto Imports', icon: <Zap className="w-4 h-4" /> },
    { key: 'pending_review', label: 'Pending Review', icon: <Eye className="w-4 h-4" />, count: pendingJobs.length },
    { key: 'published', label: 'Published', icon: <CheckCircle2 className="w-4 h-4" />, count: publishedJobs.length },
    { key: 'expired', label: 'Expired', icon: <XCircle className="w-4 h-4" />, count: expiredJobs.length },
    { key: 'history', label: 'Import History', icon: <History className="w-4 h-4" /> },
    { key: 'manual_import', label: 'Manual Import', icon: <UploadCloud className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">Import Centre</h1>
          <p className="text-xs text-surface-500 mt-0.5">Automated job aggregation, source management, and review workflow.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRunAll} disabled={loading || activeSources === 0} className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover disabled:opacity-50 flex items-center gap-2 shadow-sm">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Run All Active
          </button>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 rounded-xl text-xs font-bold border border-surface-200 text-surface-700 hover:bg-surface-50 flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" /> Add Source
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Sources', value: sources.length, sub: `${activeSources} active`, icon: <Database className="w-4 h-4 text-primary" /> },
          { label: 'Pending Review', value: pendingJobs.length, sub: 'awaiting approval', icon: <Eye className="w-4 h-4 text-amber-500" /> },
          { label: 'Total Imported', value: totalImported, sub: 'all time', icon: <TrendingUp className="w-4 h-4 text-emerald-500" /> },
          { label: 'Expired Jobs', value: expiredJobs.length, sub: 'past deadline', icon: <XCircle className="w-4 h-4 text-red-400" /> },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-surface-200 p-4 flex items-center gap-3">
            <div className="p-2 bg-surface-50 rounded-xl">{stat.icon}</div>
            <div>
              <div className="text-xl font-extrabold text-surface-900">{stat.value}</div>
              <div className="text-[11px] text-surface-500 font-semibold">{stat.label}</div>
              <div className="text-[10px] text-surface-400">{stat.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Security notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Review-first by default:</strong> All automated imports land as <strong>Pending Review</strong> unless a source has auto-publish explicitly enabled. No imported job is visible to the public until an admin approves it. Never fabricate salary, deadlines, employer contacts or identities.
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b border-surface-100 px-4 gap-1 pt-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-bold whitespace-nowrap transition shrink-0 ${
                activeTab === tab.key
                  ? 'bg-primary text-white'
                  : 'text-surface-500 hover:text-surface-900 hover:bg-surface-50'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-surface-100 text-surface-600'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">

          {/* ── Tab: Job Sources ── */}
          {activeTab === 'sources' && (
            <div className="space-y-3">
              {sources.length === 0 ? (
                <div className="text-center py-12 text-xs text-surface-400">
                  No sources configured yet. Click <strong>Add Source</strong> above.
                </div>
              ) : (
                sources.map((source) => (
                  <div key={source.id} className="border border-surface-200 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-surface-900">{source.name}</span>
                          {sourceTypeBadge(source.source_type)}
                          {statusBadge(source.last_poll_status)}
                          {source.auto_publish && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 uppercase">Auto-Publish</span>
                          )}
                        </div>
                        <div className="text-[11px] text-surface-500 font-mono break-all">{source.endpoint_url}</div>
                        <div className="flex items-center gap-4 text-[11px] text-surface-500">
                          <span><Clock className="w-3 h-3 inline mr-1" />Last run: {relativeTime(source.last_polled_at)}</span>
                          <span>Next: {relativeTime(source.next_scheduled_poll_at)}</span>
                          <span className="font-semibold text-primary">{source.total_imported_records ?? 0} imported</span>
                        </div>
                        {source.last_error_message && (
                          <div className="text-[11px] text-red-600 bg-red-50 px-2 py-1 rounded-lg">{source.last_error_message}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleTestSource(source.id)}
                          disabled={testingSourceId === source.id}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-surface-200 text-surface-600 hover:bg-surface-50 flex items-center gap-1 disabled:opacity-50"
                        >
                          {testingSourceId === source.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <TestTube2 className="w-3 h-3" />}
                          Test
                        </button>
                        <button
                          onClick={() => handleRunSource(source.id)}
                          disabled={runningSourceId === source.id}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-primary text-white hover:bg-primary-hover flex items-center gap-1 disabled:opacity-50"
                        >
                          {runningSourceId === source.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                          Run Now
                        </button>
                        <button
                          onClick={() => handleToggle(source)}
                          disabled={togglingId === source.id}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition ${source.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-surface-100 text-surface-500 hover:bg-surface-200'}`}
                        >
                          {togglingId === source.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : source.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          {source.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </div>

                    {/* Test result inline */}
                    {testResults[source.id] && (
                      <div className={`p-3 rounded-xl text-xs ${testResults[source.id].success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                        {testResults[source.id].success
                          ? `✓ Connected — ${testResults[source.id].discovered ?? 0} jobs found`
                          : `✗ ${testResults[source.id].error || 'Connection failed'}`}
                        {Boolean(testResults[source.id].sample_jobs && testResults[source.id].sample_jobs!.length > 0) && (
                          <div className="mt-1 space-y-0.5">
                            {testResults[source.id].sample_jobs!.map((j, i) => (
                              <div key={i} className="text-[10px] text-emerald-700">• {j.title} @ {j.organization} ({j.location})</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Tab: Auto Imports Config ── */}
          {activeTab === 'auto_imports' && (
            <div className="space-y-3">
              <p className="text-xs text-surface-500">Configure automatic import scheduling and auto-publish behaviour per source. Cron runs every 6 hours via Vercel.</p>
              {sources.map((source) => (
                <div key={source.id} className="border border-surface-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-sm text-surface-900">{source.name}</div>
                    <div className="text-[11px] text-surface-500">
                      Polls every {source.import_frequency_minutes >= 1440
                        ? `${source.import_frequency_minutes / 1440}d`
                        : `${source.import_frequency_minutes / 60}h`}
                      {' · '}Next: {relativeTime(source.next_scheduled_poll_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-surface-500 font-semibold">Auto-publish:</span>
                      <button
                        onClick={async () => {
                          await fetch(`/api/admin/sources/${source.id}`, {
                            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ auto_publish: !source.auto_publish }),
                          });
                          await fetchSources();
                        }}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold ${source.auto_publish ? 'bg-purple-100 text-purple-700' : 'bg-surface-100 text-surface-500'}`}
                      >
                        {source.auto_publish ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        {source.auto_publish ? 'ON — skips review' : 'OFF — review required'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {sources.length === 0 && <div className="text-center py-8 text-xs text-surface-400">No sources configured.</div>}
            </div>
          )}

          {/* ── Tab: Pending Review ── */}
          {activeTab === 'pending_review' && (
            <div className="space-y-2">
              {pendingJobs.length === 0 ? (
                <div className="text-center py-12 text-xs text-surface-400">No jobs pending review. Run an import to fetch new opportunities.</div>
              ) : (
                pendingJobs.map((job) => (
                  <div key={job.id} className="border border-surface-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-sm text-surface-900">{job.title}</div>
                      <div className="text-xs text-surface-500">
                        {job.organization_name} · {job.city || 'Nationwide'} · {job.opportunity_type?.replace('_', ' ')}
                        {job.source_name && <span> · <span className="font-semibold text-primary">{job.source_name}</span></span>}
                        {job.application_deadline && <span> · Deadline: {new Date(job.application_deadline).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handlePublish(job.id)} disabled={actionLoading === job.id} className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold bg-primary text-white flex items-center gap-1 disabled:opacity-50">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Publish
                      </button>
                      <button onClick={() => handleReject(job.id)} disabled={actionLoading === job.id} className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Tab: Published ── */}
          {activeTab === 'published' && (
            <div className="space-y-2">
              <p className="text-xs text-surface-500 mb-3">Showing last 50 published opportunities from automated imports.</p>
              {publishedJobs.length === 0 ? (
                <div className="text-center py-12 text-xs text-surface-400">No published jobs from automated imports yet.</div>
              ) : (
                publishedJobs.map((job) => (
                  <div key={job.id} className="border border-surface-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm text-surface-900">{job.title}</div>
                      <div className="text-xs text-surface-500">{job.organization_name} · {job.city || 'Nationwide'}{job.source_name && <span> · <span className="font-semibold text-primary">{job.source_name}</span></span>}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Live</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Tab: Expired ── */}
          {activeTab === 'expired' && (
            <div className="space-y-2">
              {expiredJobs.length === 0 ? (
                <div className="text-center py-12 text-xs text-surface-400">No expired jobs.</div>
              ) : (
                expiredJobs.map((job) => (
                  <div key={job.id} className="border border-surface-200 rounded-xl p-3 flex items-center justify-between opacity-70">
                    <div>
                      <div className="font-semibold text-sm text-surface-900">{job.title}</div>
                      <div className="text-xs text-surface-500">{job.organization_name} · {job.application_deadline ? `Deadline: ${new Date(job.application_deadline).toLocaleDateString()}` : 'No deadline set'}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Expired</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Tab: Import History ── */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-[11px] font-bold text-surface-500 uppercase tracking-wider border-b border-surface-100">
                      <th className="pb-2 pr-4">Source</th>
                      <th className="pb-2 pr-4">Started</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2 pr-4">Discovered</th>
                      <th className="pb-2 pr-4">Imported</th>
                      <th className="pb-2 pr-4">Dupes</th>
                      <th className="pb-2">Trigger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-50">
                    {importLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-50">
                        <td className="py-2 pr-4 font-semibold text-surface-900">{log.source_name ?? '—'}</td>
                        <td className="py-2 pr-4 text-surface-500">{relativeTime(log.started_at)}</td>
                        <td className="py-2 pr-4">{statusBadge(log.status)}</td>
                        <td className="py-2 pr-4 text-surface-700">{log.discovered_count}</td>
                        <td className="py-2 pr-4 text-emerald-700 font-bold">{log.imported_count}</td>
                        <td className="py-2 pr-4 text-surface-400">{log.duplicates_count}</td>
                        <td className="py-2 text-surface-500">{log.triggered_by}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {logTotal > 25 && (
                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-surface-400">{logTotal} total logs</span>
                  <div className="flex gap-2">
                    <button onClick={() => fetchLogs(logPage - 1)} disabled={logPage <= 1} className="p-1.5 rounded-lg border border-surface-200 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="px-3 py-1.5 font-semibold text-surface-700">Page {logPage}</span>
                    <button onClick={() => fetchLogs(logPage + 1)} disabled={logPage * 25 >= logTotal} className="p-1.5 rounded-lg border border-surface-200 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
              {importLogs.length === 0 && <div className="text-center py-8 text-xs text-surface-400">No import history yet. Run an import to see logs.</div>}
            </div>
          )}

          {/* ── Tab: Manual Import (legacy tabs preserved) ── */}
          {activeTab === 'manual_import' && (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2 border-b border-surface-200 pb-3">
                {[
                  { key: 'raw_paste' as const, label: 'Raw Text', icon: <Edit3 className="w-4 h-4" /> },
                  { key: 'csv' as const, label: 'CSV Upload', icon: <FileText className="w-4 h-4" /> },
                  { key: 'json' as const, label: 'JSON Array', icon: <Code className="w-4 h-4" /> },
                  { key: 'rss_api' as const, label: 'RSS / API URL', icon: <Rss className="w-4 h-4" /> },
                ].map(t => (
                  <button key={t.key} onClick={() => setManualTab(t.key)} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${manualTab === t.key ? 'bg-primary text-white' : 'text-surface-600 hover:bg-surface-100'}`}>
                    {t.icon}{t.label}
                  </button>
                ))}
              </div>

              {manualTab === 'raw_paste' && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider">Paste Raw Job Broadcast</label>
                  <textarea rows={6} value={rawText} onChange={e => setRawText(e.target.value)} placeholder="Paste unstructured job broadcast here (WhatsApp, LinkedIn, Email)..." className="w-full p-3.5 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
                  <button onClick={() => handleManualImport('raw_paste')} disabled={isProcessing || !rawText.trim()} className="px-6 py-2.5 rounded-xl text-xs font-bold bg-primary text-white flex items-center gap-2 disabled:opacity-50">
                    <Sparkles className="w-4 h-4" />{isProcessing ? 'Parsing...' : 'Parse & Stage as Draft'}
                  </button>
                </div>
              )}
              {manualTab === 'csv' && (
                <div className="p-8 border-2 border-dashed border-surface-200 rounded-2xl text-center space-y-3">
                  <UploadCloud className="w-10 h-10 text-surface-400 mx-auto" />
                  <h4 className="text-sm font-bold text-surface-900">Upload CSV File</h4>
                  <p className="text-xs text-surface-500">Required headers: <span className="font-mono">title, company, city, state, type, description, email, phone</span></p>
                  <input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files?.[0] || null)} className="text-xs text-surface-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white" />
                  {csvFile && <button onClick={() => handleManualImport('csv')} disabled={isProcessing} className="px-6 py-2.5 rounded-xl text-xs font-bold bg-primary text-white">{isProcessing ? 'Processing...' : 'Ingest CSV to Review Queue'}</button>}
                </div>
              )}
              {manualTab === 'json' && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider">Paste JSON Array</label>
                  <textarea rows={6} value={jsonText} onChange={e => setJsonText(e.target.value)} placeholder='[{ "title": "...", "company": "...", "city": "Lagos" }]' className="w-full p-3.5 text-xs text-surface-900 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
                  <button onClick={() => handleManualImport('json')} disabled={isProcessing || !jsonText.trim()} className="px-6 py-2.5 rounded-xl text-xs font-bold bg-primary text-white disabled:opacity-50">{isProcessing ? 'Validating...' : 'Ingest JSON Batch'}</button>
                </div>
              )}
              {manualTab === 'rss_api' && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider">Feed / API URL</label>
                  <input type="url" value={feedUrl} onChange={e => setFeedUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 text-xs border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
                  <button onClick={() => handleManualImport('rss')} disabled={isProcessing || !feedUrl.trim()} className="px-6 py-2.5 rounded-xl text-xs font-bold bg-primary text-white flex items-center gap-2 disabled:opacity-50">
                    <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />Poll & Import
                  </button>
                </div>
              )}
              {importSummary && (
                <div className={`p-4 rounded-xl text-xs ${importSummary.startsWith('Error') ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-900 border border-emerald-200'}`}>
                  {importSummary}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAddModal && <AddSourceModal onClose={() => setShowAddModal(false)} onCreated={fetchSources} />}
    </div>
  );
}
