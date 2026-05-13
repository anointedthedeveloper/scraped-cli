/**
 * Entity matching: groups results that likely refer to the same person/place
 * using name similarity and shared usernames/links.
 * No external dependencies — uses a pure-JS Levenshtein distance.
 */

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

/**
 * Returns a 0–1 similarity score between two strings (case-insensitive).
 */
function stringSimilarity(a, b) {
  if (!a || !b) return 0;
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 1;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(s1, s2) / maxLen;
}

/**
 * Checks whether two result objects likely refer to the same entity.
 * Returns { match: boolean, confidence: number }
 */
function compareEntities(a, b) {
  const scores = [];

  // Name similarity
  if (a.name && b.name) scores.push(stringSimilarity(a.name, b.name) * 1.5);

  // Username overlap
  const ausernames = (a.usernames || []).map(u => u.toLowerCase());
  const busernames = (b.usernames || []).map(u => u.toLowerCase());
  const sharedUsernames = ausernames.filter(u => busernames.includes(u));
  if (ausernames.length || busernames.length) {
    scores.push(sharedUsernames.length > 0 ? 1 : 0);
  }

  // Social link overlap
  const aLinks = Object.values(a.socials || {}).filter(Boolean).map(l => l.toLowerCase());
  const bLinks = Object.values(b.socials || {}).filter(Boolean).map(l => l.toLowerCase());
  const sharedLinks = aLinks.filter(l => bLinks.includes(l));
  if (aLinks.length || bLinks.length) {
    scores.push(sharedLinks.length > 0 ? 1 : 0);
  }

  if (scores.length === 0) return { match: false, confidence: 0 };

  const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
  const confidence = Math.min(1, parseFloat(avg.toFixed(2)));
  return { match: confidence >= 0.55, confidence };
}

/**
 * Takes an array of result objects and merges those that likely refer to the
 * same entity. Returns a new array with possibleMatch + confidence fields set.
 */
function matchAndMerge(results) {
  if (!results || results.length === 0) return [];

  const merged = [];
  const used = new Set();

  for (let i = 0; i < results.length; i++) {
    if (used.has(i)) continue;
    let base = { ...results[i] };
    const group = [i];

    for (let j = i + 1; j < results.length; j++) {
      if (used.has(j)) continue;
      const { match, confidence } = compareEntities(base, results[j]);
      if (match) {
        group.push(j);
        used.add(j);
        // Merge fields from the matched entity into base
        base = mergeEntities(base, results[j], confidence);
      }
    }

    used.add(i);
    base.possibleMatch = group.length > 1;
    merged.push(base);
  }

  return merged;
}

/**
 * Merges two entity objects, preferring non-empty values and deduplicating arrays.
 */
function mergeEntities(a, b, confidence) {
  const merged = { ...a };

  // Keep higher confidence
  merged.confidence = Math.max(a.confidence || 0, b.confidence || 0, confidence);

  // Merge usernames
  merged.usernames = [...new Set([...(a.usernames || []), ...(b.usernames || [])])];

  // Merge images
  merged.images = [...new Set([...(a.images || []), ...(b.images || [])])];

  // Merge phones
  merged.phones = [...new Set([...(a.phones || []), ...(b.phones || [])])];

  // Merge socials (prefer non-empty)
  merged.socials = { ...(b.socials || {}), ...(a.socials || {}) };
  for (const [k, v] of Object.entries(b.socials || {})) {
    if (!merged.socials[k]) merged.socials[k] = v;
  }

  // Prefer non-empty scalar fields from b if a is missing them
  for (const field of ['bio', 'location', 'address', 'phone', 'website', 'description']) {
    if (!merged[field] && b[field]) merged[field] = b[field];
  }

  return merged;
}

module.exports = { matchAndMerge, compareEntities, stringSimilarity };
