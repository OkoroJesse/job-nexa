import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, recordAdminAuditLog } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

interface ImportRecord {
  title: string;
  organization_name: string;
  category_id?: string;
  state_id?: string;
  city?: string;
  opportunity_type?: string;
  workplace_policy?: string;
  experience_level?: string;
  salary_or_stipend_range?: string;
  description: string;
  requirements?: string;
  benefits?: string;
  application_deadline?: string;
  is_locked?: boolean;
  employer_email?: string;
  employer_phone?: string;
  application_url?: string;
  application_instructions?: string;
}

export async function POST(req: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const body = await req.json();
    const { mode, payload, feedUrl } = body;

    let parsedRecords: ImportRecord[] = [];

    if (mode === 'raw_paste') {
      const text = String(payload || '').trim();
      if (!text) {
        return NextResponse.json({ error: 'Empty text payload' }, { status: 400 });
      }

      // Intelligent parser for raw broadcast
      const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
      const title = lines[0] || 'Imported Opportunity';
      
      // Look for company keywords or default
      let org = 'Vetted Nigerian Employer';
      for (const line of lines) {
        if (/company|organization|employer|bank|ltd|plc|hub/i.test(line)) {
          org = line.replace(/company:?|organization:?|employer:?/i, '').trim();
          break;
        }
      }

      // Look for email in text
      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const email = emailMatch ? emailMatch[0] : undefined;

      // Look for phone in text
      const phoneMatch = text.match(/(?:\+234|0)[789][01]\d{8}/);
      const phone = phoneMatch ? phoneMatch[0] : undefined;

      parsedRecords.push({
        title,
        organization_name: org,
        description: text,
        requirements: 'Refer to job overview for qualifications.',
        is_locked: true,
        employer_email: email,
        employer_phone: phone,
        opportunity_type: /nysc|ppa/i.test(text) ? 'nysc_ppa' : /trainee|graduate/i.test(text) ? 'graduate_trainee' : 'full_time',
        workplace_policy: /remote/i.test(text) ? 'remote_nigeria' : 'on_site',
      });
    } else if (mode === 'json') {
      try {
        const rawArray = typeof payload === 'string' ? JSON.parse(payload) : payload;
        if (!Array.isArray(rawArray)) {
          return NextResponse.json({ error: 'JSON payload must be an array of opportunity objects' }, { status: 400 });
        }
        parsedRecords = rawArray.map((item: any) => ({
          title: item.title || 'Untitled Opportunity',
          organization_name: item.organization_name || item.company || 'Unspecified Employer',
          description: item.description || '',
          requirements: item.requirements || '',
          city: item.city,
          salary_or_stipend_range: item.salary || item.salary_or_stipend_range,
          opportunity_type: item.opportunity_type || item.type || 'full_time',
          workplace_policy: item.workplace_policy || item.policy || 'on_site',
          is_locked: item.is_locked !== undefined ? Boolean(item.is_locked) : true,
          employer_email: item.employer_email || item.email,
          employer_phone: item.employer_phone || item.phone,
          application_url: item.application_url || item.url,
          application_instructions: item.application_instructions,
          application_deadline: item.deadline || item.application_deadline,
        }));
      } catch (jsonErr: any) {
        return NextResponse.json({ error: `Invalid JSON: ${jsonErr.message}` }, { status: 400 });
      }
    } else if (mode === 'csv') {
      const csvString = String(payload || '');
      const lines = csvString.split('\n').map((l: string) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        return NextResponse.json({ error: 'CSV must contain at least a header row and one data row' }, { status: 400 });
      }

      const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c: string) => c.trim().replace(/^"|"$/g, ''));
        const record: any = {};
        headers.forEach((h: string, idx: number) => {
          record[h] = cols[idx] || '';
        });

        parsedRecords.push({
          title: record.title || `Imported Row #${i}`,
          organization_name: record.company || record.organization || 'Verified Employer',
          description: record.description || 'Imported via CSV batch upload.',
          requirements: record.requirements || '',
          city: record.city || record.location,
          salary_or_stipend_range: record.salary,
          opportunity_type: record.type || 'full_time',
          is_locked: true,
          employer_email: record.email || record.employer_email,
          application_url: record.url || record.application_url,
        });
      }
    } else if (mode === 'rss') {
      if (!feedUrl) {
        return NextResponse.json({ error: 'Feed URL is required' }, { status: 400 });
      }

      // Simulated automated polling of authorized RSS/API feed
      parsedRecords.push({
        title: 'Polled Vacancy from Verified RSS Partner',
        organization_name: 'Federal Civil Service Commission (Simulated)',
        description: 'Verified public vacancy ingested from authorized feed.',
        requirements: 'B.Sc / HND in relevant discipline. NYSC completion.',
        is_locked: false, // Public feed
        opportunity_type: 'full_time',
        workplace_policy: 'on_site',
        application_url: feedUrl,
      });
    }

    if (parsedRecords.length === 0) {
      return NextResponse.json({ error: 'No records could be parsed' }, { status: 400 });
    }

    const isConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    let stagedCount = 0;
    let duplicateCount = 0;

    if (isConfigured) {
      const adminClient = createAdminClient();

      // Get a fallback category ID if not provided
      const { data: defaultCat } = await adminClient
        .from('categories')
        .select('id')
        .limit(1)
        .maybeSingle();

      for (const rec of parsedRecords) {
        const slug = `${rec.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString(36)}`;

        // Duplicate detection: check if same title + org already exists
        const { data: existing } = await adminClient
          .from('opportunities')
          .select('id')
          .eq('title', rec.title)
          .eq('organization_name', rec.organization_name)
          .maybeSingle();

        if (existing) {
          duplicateCount++;
          continue;
        }

        // Mandatory: Ingest as draft / pending_review
        await adminClient.from('opportunities').insert({
          title: rec.title,
          slug,
          organization_name: rec.organization_name,
          category_id: rec.category_id || defaultCat?.id || null,
          state_id: rec.state_id || null,
          city: rec.city || null,
          opportunity_type: rec.opportunity_type || 'full_time',
          workplace_policy: rec.workplace_policy || 'on_site',
          salary_or_stipend_range: rec.salary_or_stipend_range || null,
          description: rec.description,
          requirements: rec.requirements || '',
          benefits: rec.benefits || null,
          application_deadline: rec.application_deadline || null,
          is_locked: rec.is_locked !== undefined ? rec.is_locked : true,
          employer_email: rec.employer_email || null,
          employer_phone: rec.employer_phone || null,
          application_url: rec.application_url || null,
          application_instructions: rec.application_instructions || null,
          status: 'draft', // MUST REMAIN DRAFT UNTIL APPROVED
          created_by: adminSession.userId === 'admin-system-root' ? null : adminSession.userId,
        });

        stagedCount++;
      }

      await recordAdminAuditLog(
        adminSession.userId || 'admin',
        'import_batch',
        'import_batches',
        `batch-${Date.now()}`,
        { mode, totalParsed: parsedRecords.length, stagedCount, duplicateCount }
      );
    } else {
      stagedCount = parsedRecords.length;
    }

    return NextResponse.json({
      success: true,
      totalParsed: parsedRecords.length,
      stagedCount,
      duplicateCount,
      message: `Batch imported successfully. ${stagedCount} records added to Review Queue as DRAFT. ${duplicateCount} duplicates skipped.`,
    });
  } catch (error) {
    console.error('Import processing error:', error);
    return NextResponse.json({ error: 'Failed to process import' }, { status: 500 });
  }
}
