'use client';

import React, { useState } from 'react';
import { Bell, Send, CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  target: string;
  sentAt: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'New Graduate Trainee Cycle: Access Bank 2027',
    message: 'Access Bank has officially opened applications for 2027 operations trainees. Check the directory now.',
    type: 'job_alert',
    target: 'All Registered Candidates',
    sentAt: '08 Nov 2026, 09:00 WAT',
  },
  {
    id: 'notif-2',
    title: 'PTDF Overseas Postgraduate Scholarship Reminder',
    message: 'The Federal Government PTDF scholarship deadline is approaching. Ensure your NIN and transcripts are ready.',
    type: 'info',
    target: 'All Registered Candidates',
    sentAt: '05 Nov 2026, 14:30 WAT',
  },
  {
    id: 'notif-3',
    title: 'Zenith Bank Transfer Verification Desk Live',
    message: 'Direct bank transfer receipts are audited within 2-4 hours during business days.',
    type: 'system',
    target: 'All Registered Candidates',
    sentAt: '01 Nov 2026, 08:00 WAT',
  },
];

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('job_alert');

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      target: 'All Registered Candidates',
      sentAt: 'Just now',
    };

    setNotifications([newNotif, ...notifications]);
    setTitle('');
    setMessage('');
    alert('Broadcast notification sent to all candidate accounts!');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
          In-App Notifications & Candidate Broadcasts
        </h1>
        <p className="text-xs sm:text-sm text-surface-500 mt-1">
          Dispatch real-time opportunity alerts and platform announcements to registered job seekers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Send Broadcast Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-surface-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" />
            <span>Send Notification Broadcast</span>
          </h3>

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Notification Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Access Bank Trainee 2027 Live..."
                className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Alert Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="job_alert">New Job / Opportunity Alert</option>
                <option value="subscription">Membership & Payment Update</option>
                <option value="info">General Advisory</option>
                <option value="system">System Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Message Body</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Brief, actionable message shown in the candidate notification drawer..."
                className="w-full p-3 text-xs text-surface-900 border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white transition shadow-sm flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Broadcast to Users</span>
            </button>
          </form>
        </div>

        {/* Sent History */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-surface-100 flex items-center justify-between text-xs">
            <span className="font-bold text-surface-900 uppercase tracking-wider">
              Recent Broadcast History ({notifications.length})
            </span>
            <span className="text-surface-500 font-semibold">In-App Delivery</span>
          </div>

          <div className="divide-y divide-surface-100">
            {notifications.map((item) => (
              <div key={item.id} className="p-4 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-surface-900 text-sm">{item.title}</span>
                  <span className="text-[11px] text-surface-400">{item.sentAt}</span>
                </div>
                <p className="text-surface-600 leading-relaxed">{item.message}</p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-surface-400">
                  <span className="px-2 py-0.5 rounded bg-surface-100 text-surface-600 font-medium uppercase">
                    {item.type}
                  </span>
                  <span>• Target: {item.target}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
