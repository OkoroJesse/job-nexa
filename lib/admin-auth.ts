import { createServerSupabaseClient } from './supabase/server';
import { createAdminClient } from './supabase/admin';
import { UserRole } from '@/types/database';

export interface AdminSession {
  isAdmin: boolean;
  userId: string | null;
  email: string | null;
  role: UserRole | null;
  fullName: string | null;
}

export async function getAdminSession(): Promise<AdminSession> {
  try {
    const isConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (isConfigured) {
      const supabase = createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Query profile role
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, full_name, role')
          .eq('id', user.id)
          .single();

        if (profile && ['super_admin', 'admin', 'finance_auditor', 'moderator'].includes(profile.role)) {
          return {
            isAdmin: true,
            userId: profile.id,
            email: profile.email,
            role: profile.role as UserRole,
            fullName: profile.full_name,
          };
        }
      }

      // Supabase is configured: non-admin or unauthenticated requests MUST be rejected
      return {
        isAdmin: false,
        userId: null,
        email: null,
        role: null,
        fullName: null,
      };
    }
  } catch (err) {
    console.warn('Admin session verification error:', err);
    return {
      isAdmin: false,
      userId: null,
      email: null,
      role: null,
      fullName: null,
    };
  }

  // Local development / demo fallback only (disabled in production):
  if (process.env.NODE_ENV === 'production') {
    return {
      isAdmin: false,
      userId: null,
      email: null,
      role: null,
      fullName: null,
    };
  }

  // Local development / demo fallback:
  // When operating in demo mode, provide an active super_admin session for the admin console
  return {
    isAdmin: true,
    userId: 'admin-system-root',
    email: 'admin@jobnexa.ng',
    role: 'super_admin',
    fullName: 'JobNexa Systems Administrator',
  };
}

/**
 * Log an immutable administrative action to the database.
 */
export async function recordAdminAuditLog(
  adminId: string,
  action: string,
  targetTable: string,
  targetId: string,
  details: Record<string, unknown> = {}
) {
  try {
    const isConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (isConfigured) {
      const adminClient = createAdminClient();
      await adminClient.from('admin_audit_logs').insert({
        admin_id: adminId === 'admin-system-root' ? null : adminId,
        action,
        target_table: targetTable,
        target_id: targetId,
        new_state: details,
        ip_address: '127.0.0.1',
      });
    }
  } catch (err) {
    console.warn('Audit log write error:', err);
  }
}
