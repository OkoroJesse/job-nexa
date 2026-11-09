// ============================================================
// lib/aggregation/dedup.ts
// Deduplication hash computation for job opportunities
// ============================================================

/**
 * Compute a deterministic deduplication hash for a job listing.
 *
 * Algorithm: stable string derived from normalised title + org + application_url
 * This is NOT a cryptographic hash — it is a stable fingerprint for deduplication.
 * We use a simple djb2-style string hash that can run in both Node.js and Edge runtimes.
 */
export function computeDedupHash(
  title: string,
  organizationName: string,
  applicationUrl: string,
): string {
  const normalised = [
    title.toLowerCase().trim(),
    organizationName.toLowerCase().trim(),
    applicationUrl.toLowerCase().trim().replace(/\?.*$/, ''), // strip query params
  ]
    .join('|')
    .replace(/\s+/g, ' ');

  // djb2 hash — collision-resistant enough for deduplication purposes
  let hash = 5381;
  for (let i = 0; i < normalised.length; i++) {
    hash = (hash << 5) + hash + normalised.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Return as unsigned hex string prefixed with length for extra uniqueness
  const unsigned = (hash >>> 0).toString(16).padStart(8, '0');
  return `${unsigned}-${normalised.length.toString(16)}`;
}
