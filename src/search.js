const axios = require('axios');
const cheerio = require('cheerio');
const { extractImages } = require('./imageExtractor');
const { scoreResult } = require('./scorer');
const { matchAndMerge } = require('./entityMatcher');

// ─── HTTP ─────────────────────────────────────────────────────────────────────

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function safeFetch(url, params = {}, extraHeaders = {}, timeout = 14000) {
  try {
    const res = await axios.get(url, {
      params,
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        ...extraHeaders,
      },
      timeout,
      maxRedirects: 5,
    });
    return res.data;
  } catch {
    return null;
  }
}

// ─── DuckDuckGo ───────────────────────────────────────────────────────────────

async function duckduckgoSearch(query, limit = 12) {
  const html = await safeFetch('https://html.duckduckgo.com/html/', { q: query });
  if (!html) return [];

  const $ = cheerio.load(html);
  const results = [];

  $('.result').each((i, el) => {
    if (results.length >= limit) return false;
    const title = $(el).find('.result__a').text().trim();
    let link = $(el).find('.result__a').attr('href') || '';
    const snippet = $(el).find('.result__snippet').text().trim();

    if (link.startsWith('/l/?uddg=')) {
      try { link = decodeURIComponent(link.replace('/l/?uddg=', '').split('&')[0]); } catch { return; }
    }
    if (title && link.startsWith('http')) results.push({ title, link, snippet });
  });

  return results;
}

// ─── GitHub API ───────────────────────────────────────────────────────────────

const GH_HEADERS = { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'scraped-cli/2.0' };

async function searchGitHubUsers(query, limit = 6) {
  const data = await safeFetch('https://api.github.com/search/users', { q: query, per_page: limit }, GH_HEADERS);
  if (!data || !data.items) return [];
  return data.items.slice(0, limit);
}

async function fetchGitHubUser(username) {
  return safeFetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {}, GH_HEADERS);
}

// ─── Social patterns ──────────────────────────────────────────────────────────

const SOCIAL_PATTERNS = {
  github:    /(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_-]+)/i,
  twitter:   /(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/([A-Za-z0-9_]+)/i,
  linkedin:  /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([A-Za-z0-9_%-]+)/i,
  instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9_.]+)/i,
  tiktok:    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([A-Za-z0-9_.]+)/i,
  facebook:  /(?:https?:\/\/)?(?:www\.)?facebook\.com\/([A-Za-z0-9_.]+)/i,
  devto:     /(?:https?:\/\/)?(?:www\.)?dev\.to\/([A-Za-z0-9_]+)/i,
  youtube:   /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:@|c\/|user\/)([A-Za-z0-9_.]+)/i,
};

// Platforms that should NOT be followed as profile pages
const SKIP_DOMAINS = [
  'wikipedia.org', 'google.com', 'bing.com', 'yahoo.com',
  'amazon.com', 'youtube.com', 'reddit.com', 'quora.com',
];

function isSkippedDomain(url) {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    return SKIP_DOMAINS.some(d => host.includes(d));
  } catch { return true; }
}

function isSocialProfileUrl(url) {
  return Object.values(SOCIAL_PATTERNS).some(p => p.test(url));
}

function extractSocialsFromHtml($, pageUrl) {
  const socials = {};

  // From anchor hrefs
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const abs = toAbsolute(href, pageUrl);
    for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
      if (!socials[platform] && pattern.test(abs)) {
        socials[platform] = normaliseUrl(abs);
      }
    }
  });

  // From page text (catches obfuscated links)
  const text = $('body').text();
  for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
    if (!socials[platform]) {
      const m = text.match(pattern);
      if (m) socials[platform] = normaliseUrl(m[0]);
    }
  }

  return socials;
}

// ─── Phone extraction ─────────────────────────────────────────────────────────

const PHONE_RE = /(?:\+?[\d]{1,3}[\s.-]?)?(?:\([\d]{1,4}\)[\s.-]?)?[\d]{3,4}[\s.-]?[\d]{3,4}[\s.-]?[\d]{0,4}/g;

function extractPhones(text) {
  const raw = text.match(PHONE_RE) || [];
  return [...new Set(
    raw
      .map(p => p.trim().replace(/\s+/g, ' '))
      .filter(p => p.replace(/\D/g, '').length >= 7 && p.replace(/\D/g, '').length <= 15)
  )].slice(0, 3);
}

// ─── URL helpers ──────────────────────────────────────────────────────────────

function toAbsolute(href, base) {
  if (!href) return '';
  try {
    if (/^https?:\/\//i.test(href)) return href;
    return new URL(href, base).href;
  } catch { return href; }
}

function normaliseUrl(url) {
  if (!url) return url;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

// ─── Profile page scraper ─────────────────────────────────────────────────────

async function scrapeProfilePage(url) {
  const html = await safeFetch(url);
  if (!html) return null;

  const $ = cheerio.load(html);
  const bodyText = $('body').text();

  const name = (
    $('meta[property="og:title"]').attr('content') ||
    $('h1').first().text() ||
    $('title').text().split(/[-|–]/)[0]
  ).trim().substring(0, 120);

  const bio = (
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    $('p').first().text()
  ).trim().substring(0, 400);

  const location = (
    $('[itemprop="addressLocality"]').first().text() ||
    $('[class*="location"]').first().text() ||
    $('[class*="city"]').first().text()
  ).trim().substring(0, 100);

  const phones = extractPhones(bodyText);
  const socials = extractSocialsFromHtml($, url);
  const images = extractImages(html, url).slice(0, 6);

  // Username from URL
  let username = null;
  for (const pattern of Object.values(SOCIAL_PATTERNS)) {
    const m = url.match(pattern);
    if (m && m[1]) { username = m[1]; break; }
  }

  return { name, bio, location, phones, socials, images, username };
}

// ─── People aggregation ───────────────────────────────────────────────────────

async function aggregatePeople(query) {
  const raw = [];

  // 1. GitHub — most reliable structured source
  const ghUsers = await searchGitHubUsers(query, 6);
  for (const user of ghUsers) {
    const d = await fetchGitHubUser(user.login);
    const entry = {
      name: d?.name || user.login,
      usernames: [user.login],
      bio: d?.bio || '',
      location: d?.location || '',
      phones: [],
      socials: {
        github: user.html_url,
        ...(d?.twitter_username ? { twitter: `https://twitter.com/${d.twitter_username}` } : {}),
        ...(d?.blog ? { website: normaliseUrl(d.blog) } : {}),
      },
      images: user.avatar_url ? [user.avatar_url] : [],
      _sources: 1,
    };
    raw.push(entry);
  }

  // 2. DuckDuckGo — search for the person's name across the web
  const queries = [
    `"${query}" site:linkedin.com OR site:twitter.com OR site:instagram.com OR site:github.com`,
    `"${query}" profile bio`,
    `"${query}" contact phone`,
  ];

  const seenUrls = new Set();

  for (const q of queries) {
    const webResults = await duckduckgoSearch(q, 10);

    for (const r of webResults) {
      if (seenUrls.has(r.link) || isSkippedDomain(r.link)) continue;
      seenUrls.add(r.link);

      const scraped = await scrapeProfilePage(r.link);
      if (!scraped) continue;

      // Only keep if the name is plausibly related to the query
      const queryWords = query.toLowerCase().split(/\s+/);
      const nameWords = scraped.name.toLowerCase().split(/\s+/);
      const overlap = queryWords.filter(w => w.length > 2 && nameWords.some(n => n.includes(w)));
      if (overlap.length === 0 && !isSocialProfileUrl(r.link)) continue;

      raw.push({
        name: scraped.name || query,
        usernames: scraped.username ? [scraped.username] : [],
        bio: scraped.bio || r.snippet || '',
        location: scraped.location || '',
        phones: scraped.phones || [],
        socials: scraped.socials || {},
        images: scraped.images,
        _sources: isSocialProfileUrl(r.link) ? 2 : 1,
      });
    }
  }

  return raw;
}

// ─── Places aggregation ───────────────────────────────────────────────────────

async function aggregatePlaces(query) {
  const raw = [];
  const seenUrls = new Set();

  const webResults = await duckduckgoSearch(`${query} address phone website`, 12);

  for (const r of webResults.slice(0, 8)) {
    if (seenUrls.has(r.link) || isSkippedDomain(r.link)) continue;
    seenUrls.add(r.link);

    const html = await safeFetch(r.link);
    if (!html) continue;

    const $ = cheerio.load(html);
    const bodyText = $('body').text();

    const name = (
      $('meta[property="og:title"]').attr('content') ||
      $('h1').first().text() ||
      r.title
    ).trim().substring(0, 120);

    const description = (
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      r.snippet || ''
    ).trim().substring(0, 400);

    const phones = extractPhones(bodyText);

    const addressMatch = bodyText.match(/\d{1,5}\s[\w\s.]{3,60},\s[\w\s]{2,40},?\s(?:[A-Z]{2}|\w+\s\d{4,6})/);
    const address = addressMatch ? addressMatch[0].trim() : '';

    const website = $('meta[property="og:url"]').attr('content') || r.link;
    const images = extractImages(html, r.link).slice(0, 5);

    raw.push({
      name,
      address,
      phones,
      website,
      description,
      images,
      _sources: 1,
    });
  }

  return raw;
}

// ─── Number duplicate profiles ────────────────────────────────────────────────

function numberDuplicates(results) {
  // Group by normalised first name token
  const nameCount = {};
  for (const r of results) {
    const key = (r.name || '').toLowerCase().split(/\s+/)[0];
    nameCount[key] = (nameCount[key] || 0) + 1;
  }

  const seen = {};
  return results.map(r => {
    const key = (r.name || '').toLowerCase().split(/\s+/)[0];
    if (nameCount[key] > 1) {
      seen[key] = (seen[key] || 0) + 1;
      return { ...r, profileIndex: seen[key] };
    }
    return r;
  });
}

// ─── Main entry point ─────────────────────────────────────────────────────────

async function aggregateSearch(query, type = 'auto') {
  let resolvedType = type;
  if (type === 'auto') {
    resolvedType = /^[A-Za-z\s'.,-]{3,}$/.test(query) ? 'people' : 'places';
  }

  const rawResults = resolvedType === 'places'
    ? await aggregatePlaces(query)
    : await aggregatePeople(query);

  // Score
  const scored = rawResults.map(r => ({
    ...r,
    confidence: scoreResult(r, resolvedType, r._sources || 1),
  }));
  scored.forEach(r => delete r._sources);

  // Merge similar entities
  const merged = matchAndMerge(scored);

  // Sort by confidence
  merged.sort((a, b) => b.confidence - a.confidence);

  // Number profiles that share a first name
  const numbered = numberDuplicates(merged);

  return { query, type: resolvedType, results: numbered };
}

// ─── Legacy exports ───────────────────────────────────────────────────────────

async function searchWeb(query, engine = 'duckduckgo', limit = 10) {
  const results = await duckduckgoSearch(query, limit);
  return results.length > 0 ? results : [{
    title: `Search for "${query}"`,
    link: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    snippet: 'Unable to fetch results directly.',
  }];
}

async function searchWikipedia(query) {
  try {
    const data = await safeFetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
      {}, { 'User-Agent': 'scraped-cli/2.0' }
    );
    if (data && data.extract) {
      return { found: true, title: data.title, summary: data.extract.substring(0, 500), url: data.content_urls?.desktop?.page };
    }
    return { found: false };
  } catch { return { found: false }; }
}

async function searchGitHub(query) {
  try {
    const users = await searchGitHubUsers(query, 3);
    if (!users.length) return { found: false };
    return { found: true, users: users.map(u => ({ username: u.login, profileUrl: u.html_url, avatarUrl: u.avatar_url })) };
  } catch { return { found: false }; }
}

async function searchNews(query) {
  return {
    found: true,
    articles: [{ title: `News about "${query}"`, url: `https://news.google.com/search?q=${encodeURIComponent(query)}`, source: 'Google News', publishedAt: new Date().toISOString() }],
  };
}

async function searchSocialMedia(query) {
  return {
    found: true,
    platforms: {
      twitter: `https://twitter.com/search?q=${encodeURIComponent(query)}`,
      linkedin: `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(query)}`,
      instagram: `https://www.instagram.com/explore/tags/${encodeURIComponent(query.replace(/ /g, ''))}/`,
    },
  };
}

async function searchAcademic(query) {
  return { found: true, url: `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}` };
}

async function deepInvestigation(query, deepSearch = false) {
  const results = {
    query,
    timestamp: new Date().toISOString(),
    webSearch: await searchWeb(query, 'duckduckgo', 5),
    wikipedia: await searchWikipedia(query),
    github: await searchGitHub(query),
    news: await searchNews(query),
  };
  if (deepSearch) {
    results.social = await searchSocialMedia(query);
    results.academic = await searchAcademic(query);
  }
  results.summary = {
    totalSources: (results.wikipedia.found ? 1 : 0) + (results.github.found ? 1 : 0) + (results.news.found ? 1 : 0),
    webResults: results.webSearch.length,
    hasWikipedia: results.wikipedia.found,
    hasGitHub: results.github.found,
    hasNews: results.news.found,
  };
  return results;
}

module.exports = {
  aggregateSearch,
  searchWeb,
  deepInvestigation,
  searchWikipedia,
  searchGitHub,
  searchNews,
  searchSocialMedia,
  searchAcademic,
};
