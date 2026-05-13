const cheerio = require('cheerio');

const SKIP_PATTERNS = [
  /^data:/i,
  /1x1|pixel|spacer|blank|transparent/i,
  /\.gif$/i,
  /icon.*\.(png|jpg|svg)/i,
  /logo.*\.(png|jpg|svg)/i,
];

const MIN_SIZE = 40; // ignore images with width/height attribute < 40px

/**
 * Extracts image URLs from an HTML string.
 * Resolves relative URLs against baseUrl when provided.
 * Returns a deduplicated array of absolute image URLs.
 */
function extractImages(html, baseUrl = '') {
  const $ = cheerio.load(html);
  const seen = new Set();
  const images = [];

  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
    if (!src) return;

    // Skip tiny images
    const w = parseInt($(el).attr('width') || '0', 10);
    const h = parseInt($(el).attr('height') || '0', 10);
    if ((w > 0 && w < MIN_SIZE) || (h > 0 && h < MIN_SIZE)) return;

    const resolved = resolveUrl(src, baseUrl);
    if (!resolved) return;
    if (SKIP_PATTERNS.some(p => p.test(resolved))) return;
    if (seen.has(resolved)) return;

    seen.add(resolved);
    images.push(resolved);
  });

  // Also pick up og:image / twitter:image meta tags
  $('meta[property="og:image"], meta[name="twitter:image"]').each((_, el) => {
    const content = $(el).attr('content');
    if (!content) return;
    const resolved = resolveUrl(content, baseUrl);
    if (resolved && !seen.has(resolved)) {
      seen.add(resolved);
      images.unshift(resolved); // prioritise meta images
    }
  });

  return images;
}

function resolveUrl(src, base) {
  if (!src) return null;
  try {
    if (/^https?:\/\//i.test(src)) return src;
    if (base) return new URL(src, base).href;
    return null;
  } catch {
    return null;
  }
}

module.exports = { extractImages };
