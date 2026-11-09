// app/api/cron/import-jobs/route.ts
// Vercel Cron endpoint — runs every 6 hours
// Protected by CRON_SECRET header
// Triggers all active sources whose poll time has passed

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5-minute max for Vercel Pro

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  // Vercel sends the secret in the Authorization header automatically
  const authHeader = req.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Delegate to the run-all endpoint internally
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  try {
    const response = await fetch(`${appUrl}/api/admin/sources/run-all`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json({ cron: 'import-jobs', timestamp: new Date().toISOString(), ...data });
  } catch (err) {
    return NextResponse.json(
      { error: `Cron job failed: ${String(err)}` },
      { status: 500 },
    );
  }
}
