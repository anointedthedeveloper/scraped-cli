/**
 * Computes a 0.0–1.0 confidence score for a result object.
 *
 * Scoring weights (people):
 *   name present          → 0.15
 *   bio present           → 0.10
 *   location present      → 0.05
 *   ≥1 username           → 0.10
 *   ≥1 social link        → 0.10 (+ 0.03 per extra, max 0.15)
 *   ≥1 image              → 0.10
 *   sources count         → up to 0.25 (0.05 per source, max 5)
 *   cross-source match    → 0.10 bonus
 *
 * Scoring weights (places):
 *   name present          → 0.20
 *   address present       → 0.15
 *   phone present         → 0.10
 *   website present       → 0.10
 *   description present   → 0.10
 *   ≥1 image              → 0.10
 *   sources count         → up to 0.25
 */

function scorePerson(result, sourceCount = 1) {
  let score = 0;

  if (result.name) score += 0.15;
  if (result.bio) score += 0.10;
  if (result.location) score += 0.05;
  if ((result.usernames || []).length > 0) score += 0.10;
  if ((result.phones || []).length > 0) score += 0.05;

  const socialCount = Object.values(result.socials || {}).filter(Boolean).length;
  if (socialCount > 0) score += Math.min(0.15, 0.10 + (socialCount - 1) * 0.03);

  if ((result.images || []).length > 0) score += 0.10;

  score += Math.min(0.20, sourceCount * 0.05);

  return parseFloat(Math.min(1, score).toFixed(2));
}

function scorePlace(result, sourceCount = 1) {
  let score = 0;

  if (result.name) score += 0.20;
  if (result.address) score += 0.15;
  if ((result.phones || []).length > 0) score += 0.10;
  if (result.website) score += 0.10;
  if (result.description) score += 0.10;
  if ((result.images || []).length > 0) score += 0.10;

  score += Math.min(0.25, sourceCount * 0.05);

  return parseFloat(Math.min(1, score).toFixed(2));
}

function scoreResult(result, type = 'people', sourceCount = 1) {
  return type === 'places'
    ? scorePlace(result, sourceCount)
    : scorePerson(result, sourceCount);
}

module.exports = { scoreResult, scorePerson, scorePlace };
