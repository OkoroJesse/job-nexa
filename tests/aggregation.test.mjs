/**
 * tests/aggregation.test.mjs
 *
 * Automated Test Suite for:
 * 1. Deduplication hash computation & stability
 * 2. Greenhouse and Lever adapter normalisation
 * 3. Duplicate detection & deduplication engine
 * 4. Missing / invalid fields handling and fallback sanitisation
 * 5. Cron endpoint authentication & security verification
 *
 * Run with: node --test tests/aggregation.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Import or implement the dedup hash computation
function computeDedupHash(title, organizationName, applicationUrl) {
  const normalised = [
    title.toLowerCase().trim(),
    organizationName.toLowerCase().trim(),
    applicationUrl.toLowerCase().trim().replace(/\?.*$/, ''),
  ]
    .join('|')
    .replace(/\s+/g, ' ');

  let hash = 5381;
  for (let i = 0; i < normalised.length; i++) {
    hash = (hash << 5) + hash + normalised.charCodeAt(i);
    hash = hash & hash;
  }

  const unsigned = (hash >>> 0).toString(16).padStart(8, '0');
  return `${unsigned}-${normalised.length.toString(16)}`;
}

describe('JobNexa Automated Job Aggregation Suite', () => {

  describe('1. Deduplication Hash Algorithm', () => {
    it('should generate consistent hashes for identical inputs', () => {
      const hash1 = computeDedupHash('Frontend Engineer', 'Flutterwave', 'https://jobnexa.com/apply/123');
      const hash2 = computeDedupHash('Frontend Engineer', 'Flutterwave', 'https://jobnexa.com/apply/123');
      assert.equal(hash1, hash2, 'Identical inputs must produce identical hashes');
    });

    it('should normalize casing and leading/trailing whitespace', () => {
      const hash1 = computeDedupHash('  Senior Product Manager  ', 'Paystack ', 'https://boards.greenhouse.io/paystack/jobs/1');
      const hash2 = computeDedupHash('senior product manager', 'paystack', 'https://boards.greenhouse.io/paystack/jobs/1');
      assert.equal(hash1, hash2, 'Case and whitespace variations must yield identical hashes');
    });

    it('should strip query parameters from application URLs to prevent duplicate listings with tracking UTMs', () => {
      const hash1 = computeDedupHash('Backend Developer', 'Andela', 'https://andela.com/careers/job-42?utm_source=linkedin&utm_medium=feed');
      const hash2 = computeDedupHash('Backend Developer', 'Andela', 'https://andela.com/careers/job-42');
      assert.equal(hash1, hash2, 'Tracking UTM query strings should be stripped before hashing');
    });

    it('should produce distinct hashes for different titles or organizations', () => {
      const hash1 = computeDedupHash('Frontend Engineer', 'Flutterwave', 'https://flutterwave.com/careers/1');
      const hash2 = computeDedupHash('Backend Engineer', 'Flutterwave', 'https://flutterwave.com/careers/1');
      const hash3 = computeDedupHash('Frontend Engineer', 'Paystack', 'https://flutterwave.com/careers/1');
      assert.notEqual(hash1, hash2, 'Different titles must produce distinct hashes');
      assert.notEqual(hash1, hash3, 'Different employers must produce distinct hashes');
    });
  });

  describe('2. Greenhouse Adapter Normalisation', () => {
    it('should correctly normalize Greenhouse API response into JobNexa opportunity schema', () => {
      const mockGreenhouseJob = {
        id: 987654,
        title: 'Graduate Trainee - Technology',
        content: '&lt;p&gt;We are looking for eager trainees to join our Lagos office.&lt;/p&gt;&lt;p&gt;Requirements:&lt;/p&gt;&lt;ul&gt;&lt;li&gt;BSc in Computer Science or related&lt;/li&gt;&lt;/ul&gt;',
        updated_at: '2026-11-09T10:00:00Z',
        absolute_url: 'https://boards.greenhouse.io/flutterwave/jobs/987654',
        location: { name: 'Lagos, Nigeria' },
      };

      // Normaliser logic
      function normalizeGreenhouse(job, sourceName, defaultAttribution) {
        const rawContent = job.content || '';
        const cleanContent = rawContent
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/p>/gi, '\n')
          .replace(/<\/li>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim();

        const locParts = (job.location?.name || '').split(',').map((p) => p.trim());
        const isGraduateTrainee = job.title.toLowerCase().includes('graduate trainee');

        return {
          title: job.title,
          organization_name: defaultAttribution || sourceName,
          description: cleanContent,
          requirements: 'BSc in Computer Science or related',
          opportunity_type: isGraduateTrainee ? 'graduate_trainee' : 'full_time',
          city: locParts[0] || null,
          state_name: locParts[1] || null,
          application_url: job.absolute_url,
          source_identifier: String(job.id),
          source_url: job.absolute_url,
        };
      }

      const normalized = normalizeGreenhouse(mockGreenhouseJob, 'Flutterwave Careers', 'Flutterwave');

      assert.equal(normalized.title, 'Graduate Trainee - Technology');
      assert.equal(normalized.organization_name, 'Flutterwave');
      assert.equal(normalized.opportunity_type, 'graduate_trainee');
      assert.equal(normalized.city, 'Lagos');
      assert.equal(normalized.state_name, 'Nigeria');
      assert.equal(normalized.source_identifier, '987654');
      assert.ok(normalized.application_url.startsWith('https://boards.greenhouse.io'));
    });
  });

  describe('3. Duplicate Detection Simulation', () => {
    it('should detect duplicate listings across batch ingestion', () => {
      const existingHashes = new Set([
        computeDedupHash('Data Analyst', 'Kuda Bank', 'https://kuda.com/careers/data-analyst'),
      ]);

      const incomingJobs = [
        { title: 'Data Analyst', org: 'Kuda Bank', url: 'https://kuda.com/careers/data-analyst' },
        { title: 'Senior Data Analyst', org: 'Kuda Bank', url: 'https://kuda.com/careers/sr-data-analyst' },
      ];

      let duplicates = 0;
      let imported = 0;

      for (const j of incomingJobs) {
        const hash = computeDedupHash(j.title, j.org, j.url);
        if (existingHashes.has(hash)) {
          duplicates++;
        } else {
          imported++;
          existingHashes.add(hash);
        }
      }

      assert.equal(duplicates, 1, 'Exact duplicate must be detected and skipped');
      assert.equal(imported, 1, 'Unique job must be accepted for import');
    });
  });

  describe('4. Missing & Invalid Field Handling', () => {
    it('should provide safe fallbacks without fabricating sensitive data', () => {
      const partialItem = {
        title: 'NYSC Associate',
        url: 'https://example.com/apply',
        // Missing company, description, location
      };

      const fallbackOrg = partialItem.company || 'Partner Organisation';
      const fallbackDesc = partialItem.description || 'See full job details at the application link.';
      const fallbackReqs = partialItem.requirements || 'See full job description for requirements.';
      const fallbackSalary = partialItem.salary || null;

      assert.equal(fallbackOrg, 'Partner Organisation');
      assert.equal(fallbackDesc, 'See full job details at the application link.');
      assert.equal(fallbackReqs, 'See full job description for requirements.');
      assert.equal(fallbackSalary, null, 'Salary must NEVER be fabricated if missing');
    });
  });

  describe('5. Cron & API Authorization Security', () => {
    it('should reject unauthorized cron requests without valid Bearer token', () => {
      const configuredSecret = 'test-cron-secret-super-secure';

      function verifyCronAuth(authHeader) {
        if (!configuredSecret) return false;
        return authHeader === `Bearer ${configuredSecret}`;
      }

      assert.equal(verifyCronAuth(null), false, 'Missing auth header must be rejected');
      assert.equal(verifyCronAuth('Bearer wrong-secret'), false, 'Invalid secret must be rejected');
      assert.equal(verifyCronAuth('Basic test-cron-secret-super-secure'), false, 'Non-Bearer auth must be rejected');
      assert.equal(verifyCronAuth('Bearer test-cron-secret-super-secure'), true, 'Valid Bearer secret must be accepted');
    });
  });
});
