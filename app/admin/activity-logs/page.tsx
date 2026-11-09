'use client';

import React, { useState, useEffect } from 'react';
import { History, Shield, CheckCircle2, XCircle, Edit3, UserCheck, Loader2 } from 'lucide-react';

interface AuditLogRecord {
  id: string;
  admin_id?: string | null;
  action: string;
  target_table: string;
  target_id: string;
  new_state: any;
  ip_address: string;
  created_at: string;
  admin?: {
    full_name: string;
    role: string;
  } | null;
}

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/activity-logs')
      .then((res) => res.json())
      .then((data) => {
        if (data.logs) {
          setLogs(data.logs);
        }
      })
      .catch((err) => console.warn('Error fetching logs:', err))
      .finally(() => setLoading(false));
  }, []);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'approve_bank_receipt':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Bank Approved</span>;
      case 'reject_bank_receipt':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">Bank Rejected</span>;
      case 'create_opportunity':
      case 'publish_opportunity':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-100 text-primary">Opportunity Published</span>;
      case 'update_user_role':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">Role Modified</span>;
      case 'import_batch':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Batch Ingestion</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-100 text-surface-700">{action}</span>;
    }
  };

  const formatDetails = (log: AuditLogRecord) => {
    if (!log.new_state) return `Target ID: ${log.target_id}`;
    if (typeof log.new_state === 'string') return log.new_state;
    try {
      const entries = Object.entries(log.new_state)
        .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
        .join(' • ');
      return entries || `Target ID: ${log.target_id}`;
    } catch {
      return `Target ID: ${log.target_id}`;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
          Administrative Audit Logs
        </h1>
        <p className="text-xs sm:text-sm text-surface-500 mt-1">
          Immutable system audit trail tracking financial approvals, moderation actions, and permission changes.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-surface-100 flex items-center justify-between text-xs">
          <span className="font-bold text-surface-900 uppercase tracking-wider">
            System Activity Log ({logs.length} Recorded Entries)
          </span>
          <span className="text-surface-500 font-semibold">Security Tamper-Proof</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-surface-400 flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs">Loading audit logs from database...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <History className="w-10 h-10 text-surface-300 mx-auto" />
            <div className="text-sm font-bold text-surface-900">No activity recorded yet</div>
            <p className="text-xs text-surface-500 max-w-sm mx-auto">
              System actions such as user role modifications, bank verifications, and opportunity publishing will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {logs.map((log) => {
              const adminDisplayName = log.admin?.full_name
                ? `${log.admin.full_name} (${log.admin.role})`
                : 'System / Root Administrator';

              return (
                <div key={log.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-surface-900">{adminDisplayName}</span>
                      {getActionBadge(log.action)}
                    </div>

                    <div className="text-surface-700 text-xs font-semibold">
                      Target: {log.target_table} ({log.target_id})
                    </div>

                    <p className="text-surface-600 text-xs leading-relaxed">
                      {formatDetails(log)}
                    </p>
                  </div>

                  <div className="text-right text-surface-400 text-[11px] shrink-0 font-mono">
                    <div>{new Date(log.created_at).toLocaleString('en-GB')}</div>
                    <div>IP: {log.ip_address || '127.0.0.1'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
