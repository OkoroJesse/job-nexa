'use client';

import React, { useState } from 'react';
import { History, Shield, CheckCircle2, XCircle, Edit3, UserCheck } from 'lucide-react';

interface AuditLogItem {
  id: string;
  adminName: string;
  action: string;
  targetTable: string;
  targetRef: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

const INITIAL_LOGS: AuditLogItem[] = [
  {
    id: 'log-1',
    adminName: 'Mallam Ibrahim (Finance Auditor)',
    action: 'approve_bank_receipt',
    targetTable: 'payment_transactions',
    targetRef: 'JN-BT-77A91B (Emeka Chukwu)',
    details: 'Verified ₦3,500 credit on Zenith Bank statement. Activated 30-Day Pro membership.',
    timestamp: '09 Nov 2026, 14:15 WAT',
    ipAddress: '102.89.41.20',
  },
  {
    id: 'log-2',
    adminName: 'Super Administrator',
    action: 'publish_opportunity',
    targetTable: 'opportunities',
    targetRef: 'Access Bank Graduate Trainee 2027',
    details: 'Reviewed and published from staging queue to live directory. Pinned to Featured.',
    timestamp: '09 Nov 2026, 12:40 WAT',
    ipAddress: '197.210.55.12',
  },
  {
    id: 'log-3',
    adminName: 'Mallam Ibrahim (Finance Auditor)',
    action: 'reject_bank_receipt',
    targetTable: 'payment_transactions',
    targetRef: 'JN-BT-44F10A (Anonymous User)',
    details: 'Rejected receipt. Reason: Transaction amount was ₦1,000 instead of ₦3,500.',
    timestamp: '08 Nov 2026, 17:22 WAT',
    ipAddress: '102.89.41.20',
  },
  {
    id: 'log-4',
    adminName: 'Super Administrator',
    action: 'update_user_role',
    targetTable: 'profiles',
    targetRef: 'Ibrahim Suleiman (ibrahim.finance@jobnexa.ng)',
    details: 'Promoted role from job_seeker to finance_auditor.',
    timestamp: '01 Nov 2026, 10:00 WAT',
    ipAddress: '197.210.55.12',
  },
];

export default function AdminActivityLogsPage() {
  const [logs] = useState<AuditLogItem[]>(INITIAL_LOGS);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'approve_bank_receipt':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Bank Approved</span>;
      case 'reject_bank_receipt':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">Bank Rejected</span>;
      case 'publish_opportunity':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-100 text-primary">Opportunity Published</span>;
      case 'update_user_role':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">Role Modified</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-100 text-surface-700">{action}</span>;
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

        <div className="divide-y divide-surface-100">
          {logs.map((log) => (
            <div key={log.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-surface-900">{log.adminName}</span>
                  {getActionBadge(log.action)}
                </div>

                <div className="text-surface-700 text-xs font-semibold">
                  Target: {log.targetRef}
                </div>

                <p className="text-surface-600 text-xs leading-relaxed">
                  {log.details}
                </p>
              </div>

              <div className="text-right text-surface-400 text-[11px] shrink-0 font-mono">
                <div>{log.timestamp}</div>
                <div>IP: {log.ipAddress}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
