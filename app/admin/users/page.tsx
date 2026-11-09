'use client';

import React, { useState, useEffect } from 'react';
import { Users, Shield, Sparkles, CheckCircle2, XCircle, Search, MoreVertical, Edit2 } from 'lucide-react';

interface ManagedUser {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  role: string;
  created_at: string;
  subscription?: {
    id: string;
    status: string;
    plan_name: string;
    expires_at: string | null;
  }[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (e) {
      console.warn('Error fetching users:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        alert(`User role updated to ${newRole}`);
      }
    } catch {
      alert('Failed to update role');
    }
  };

  const handleGrantSubscription = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'grant_subscription', durationDays: 30 }),
      });
      if (res.ok) {
        alert('30-Day Pro membership manually granted to user!');
        fetchUsers();
      }
    } catch {
      alert('Failed to grant membership');
    }
  };

  const filteredUsers = users.filter((u) =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
            User Accounts & Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-surface-500 mt-1">
            Manage permissions, inspect candidate profiles, and manage 30-day membership passes.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-surface-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 text-xs text-surface-900 bg-white border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-surface-100 flex items-center justify-between text-xs">
          <span className="font-bold text-surface-900 uppercase tracking-wider">
            Registered Users ({filteredUsers.length})
          </span>
          <span className="text-surface-500 font-semibold">Role-Based Access Protected</span>
        </div>

        <div className="divide-y divide-surface-100 overflow-x-auto">
          {filteredUsers.map((user) => {
            const activeSub = user.subscription?.find(
              (s) => s.status === 'active' && s.expires_at && new Date(s.expires_at) > new Date()
            );

            return (
              <div key={user.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-surface-900">{user.full_name}</span>
                    <span className="text-surface-400">({user.email})</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-100 text-surface-700 uppercase">
                      {user.role}
                    </span>
                  </div>

                  <div className="text-surface-500 text-xs flex items-center gap-3">
                    <span>Phone: {user.phone_number || 'N/A'}</span>
                    <span>•</span>
                    <span>
                      Registered: {new Date(user.created_at).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {/* Subscription Pill */}
                  {activeSub ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      30-Day Pro (Expires {new Date(activeSub.expires_at!).toLocaleDateString('en-GB')})
                    </span>
                  ) : (
                    <button
                      onClick={() => handleGrantSubscription(user.id)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-primary-light text-primary hover:bg-primary hover:text-white transition"
                    >
                      + Grant 30-Day Pass
                    </button>
                  )}

                  {/* Role Selector */}
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="px-2.5 py-1 text-xs text-surface-700 bg-surface-50 border border-surface-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
                  >
                    <option value="job_seeker">Job Seeker</option>
                    <option value="moderator">Moderator</option>
                    <option value="finance_auditor">Finance Auditor</option>
                    <option value="admin">Administrator</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
