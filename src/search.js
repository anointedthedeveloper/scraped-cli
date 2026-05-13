const axios = require('axios');
const cheerio = require('cheerio');
const { extractImages } = require('./imageExtractor');
const { scoreResult } = require('./scorer');
const { matchAndMerge } = require('./entityMatcher');

// ─── HTTP helpers ────────────────────────────────────────────────────────────

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function get(url, params = {}, extraHeaders = {}, timeout = 12000) {
  const response = await axios.get(url, {
    params,
    headers: { ...DEFAULT_HEADERS, ...extraHeaders },
    timeout,
    maxRedirects: 5,
  });
  return response.data;
}

async function safeFetch(url, params, headers, timeout) {
  try {
    return await get(url, params, headers, timeout);
  } catch {
    return null;
  }
}

// ─── DuckDuckGo search ───────────────────────────────────────────────────────

async function duckduckgoSearch(query, limit = 10) {
  const html = await safeFetch('https://html.duckduckgo.com/html/', { q: query });
  if (!html) return [];

  const $ = cheerio.load(html);
  const results = [];

  $('.result').each((i, el) => {
    if (i >= limit) return false;
    const title = $(el).find('.result__a').text().trim();
    let link = $(el).find('.result__a').attr('href') || '';
    const snippet = $(el).find('.result__snippet').text().trim();

    if (link.startsWith('/l/?uddg=')) {
      link = decodeURIComponent(link.replace('/l/?uddg=', '').split('&')[0]);
    }
    if (title && link.startsWith('http')) results.push({ title, link, snippet });
  });

  return results;
}

// ─── GitHub API ──────────────────────────────────────────────────────────────

async function fetchGitHubUser(username) {
  const data = await safeFetch(
    `https://api.github.com/users/${encodeURIComponent(username)}`,
    {},
    { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'scraped-cli/2.0' }
  );
  return data;
}

async function searchGitHubUsers(query, limit = 5) {
  const data = await safeFetch(
    'https://api.github.com/search/users',
    { q: query, per_page: limit },
    { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'scraped-cli/2.0' }
  );
  if (!data || !data.items) return [];
  return data.items.slice(0, limit);
}

// ─── Wikipedia ───────────────────────────────────────────────────────────────

async function fetchWikipediaSummary(query) {
  const data = await safeFetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
    {},
    { 'User-Agent': 'scraped-cli/2.0' }
  );
  if (data && data.extract) return data;

  // Fallback: search API
  const search = await safeFetch(
    'https://en.wikipedia.org/w/api.php',
    { action: 'query', list: 'search', srsearch: query, format: 'json', origin: '*' },
    { 'User-Agent': 'scraped-cli/2.0' }
  );
  if (search && search.query && search.query.search.length > 0) {
    const top = search.query.search[0];
    return {
      title: top.title,
      extract: top.snippet.replace(/<[^>]*>/g, ''),
      content_urls: { desktop: { page: `https://en.wikipedia.org/wiki/${encodeURIComponent(top.title)}` } },
      thumbnail: null,
    };
  }
  return null;
}

// ─── Social profile scraping ─────────────────────────────────────────────────

const SOCIAL_PATTERNS = {
  github: /github\.com\/([A-Za-z0-9_-]+)/i,
  twitter: /(?:twitter|x)\.com\/([A-Za-z0-9_]+)/i,
  linkedin: /linkedin\.com\/in\/([A-Za-z0-9_-]+)/i,
  instagram: /instagram\.com\/([A-Za-z0-9_.]+)/i,
  tiktok: /tiktok\.com\/@([A-Za-z0-9_.]+)/i,
  facebook: /facebook\.com\/([A-Za-z0-9_.]+)/i,
  devto: /dev\.to\/([A-Za-z0-9_]+)/i,
};

function extractSocialsFromText(text) {
  const socials = {};
  for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
    const match = text.match(pattern);
    if (match) socials[platform] = match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
  }
  return socials;
}

function extractSocialsFromLinks($) {
  const socials = {};
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
      if (!socials[platform] && pattern.test(href)) {
        socials[platform] = href.startsWith('http') ? href : `https:${href}`;
      }
    }
  });
  return socials;
}

async function scrapeProfilePage(url) {
  const html = await safeFetch(url);
  if (!html) return null;

  const $ = cheerio.load(html);
  const text = $('body').text();

  const bio =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    $('p').first().text().trim().substring(0, 300) ||
    '';

  const name =
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().trim().split(/[-|]/)[0].trim() ||
    '';

  const socials = { ...extractSocialsFromLinks($), ...extractSocialsFromText(text) };
  const images = extractImages(html, url);

  return { name, bio, socials, images };
}

// ─── People aggregation ──────────────────────────────────────────────────────

async function aggregatePeople(query) {
  const results = [];

  // 1. GitHub users
  const ghUsers = await searchGitHubUsers(query, 5);
  for (const user of ghUsers) {
    const detail = await fetchGitHubUser(user.login);
    const entry = {
      name: detail?.name || user.login,
      usernames: [user.login],
      bio: detail?.bio || '',
      location: detail?.location || '',
      socials: {
        github: user.html_url,
        twitter: detail?.twitter_username ? `https://twitter.com/${detail.twitter_username}` : null,
        website: detail?.blog || null,
      },
      images: user.avatar_url ? [user.avatar_url] : [],
      _sources: 1,
    };
    // Remove null socials
    for (const k of Object.keys(entry.socials)) {
      if (!entry.socials[k]) delete entry.socials[k];
    }
    results.push(entry);
  }

  // 2. DuckDuckGo web search — follow top profile-looking links
  const webResults = await duckduckgoSearch(`${query} profile`, 8);
  const profileUrls = webResults
    .map(r => r.link)
    .filter(l => Object.values(SOCIAL_PATTERNS).some(p => p.test(l)))
    .slice(0, 4);

  for (const url of profileUrls) {
    const scraped = await scrapeProfilePage(url);
    if (!scraped) continue;

    // Determine username from URL
    let username = null;
    for (const pattern of Object.values(SOCIAL_PATTERNS)) {
      const m = url.match(pattern);
      if (m) { username = m[1]; break; }
    }

    const entry = {
      name: scraped.name || query,
      usernames: username ? [username] : [],
      bio: scraped.bio || '',
      location: '',
      socials: scraped.socials || {},
      images: scraped.images.slice(0, 5),
      _sources: 1,
    };
    results.push(entry);
  }

  // 3. Wikipedia
  const wiki = await fetchWikipediaSummary(query);
  if (wiki) {
    const wikiImages = wiki.thumbnail?.source ? [wiki.thumbnail.source] : [];
    results.push({
      name: wiki.title || query,
      usernames: [],
      bio: wiki.extract ? wiki.extract.substring(0, 400) : '',
      location: '',
      socials: { wikipedia: wiki.content_urls?.desktop?.page || null },
      images: wikiImages,
      _sources: 2, // Wikipedia is a strong source
    });
  }

  return results;
}

// ─── Places aggregation ──────────────────────────────────────────────────────

async function aggregatePlaces(query) {
  const results = [];

  // 1. DuckDuckGo search
  const webResults = await duckduckgoSearch(`${query} location address`, 10);

  for (const r of webResults.slice(0, 5)) {
    const html = await safeFetch(r.link);
    if (!html) continue;

    const $ = cheerio.load(html);
    const text = $('body').text();

    const name =
      $('meta[property="og:title"]').attr('content') ||
      $('h1').first().text().trim() ||
      r.title;

    const description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      r.snippet ||
      '';

    // Heuristic extraction of address, phone, website
    const phoneMatch = text.match(/(\+?[\d\s\-().]{7,20})/);
    const phone = phoneMatch ? phoneMatch[1].trim() : null;

    const addressMatch = text.match(/\d{1,5}\s[\w\s]{3,50},\s[\w\s]{2,30},?\s[A-Z]{2}/);
    const address = addressMatch ? addressMatch[0].trim() : null;

    const website =
      $('meta[property="og:url"]').attr('content') ||
      r.link;

    const images = extractImages(html, r.link).slice(0, 5);

    results.push({
      name: name.substring(0, 100),
      address: address || '',
      phone: phone || '',
      website,
      description: description.substring(0, 300),
      images,
      _sources: 1,
    });
  }

  // 2. Wikipedia for places
  const wiki = await fetchWikipediaSummary(query);
  if (wiki) {
    results.push({
      name: wiki.title || query,
      address: '',
      phone: '',
      website: wiki.content_urls?.desktop?.page || '',
      description: wiki.extract ? wiki.extract.substring(0, 400) : '',
      images: wiki.thumbnail?.source ? [wiki.thumbnail.source] : [],
      _sources: 2,
    });
  }

  return results;
}

// ─── Main aggregation entry point ────────────────────────────────────────────

/**
 * Aggregates web data for a query.
 * @param {string} query
 * @param {'people'|'places'|'auto'} type
 * @returns {Promise<{ query, type, results }>}
 */
async function aggregateSearch(query, type = 'auto') {

  // Auto-detect type from query if not specified
  let resolvedType = type;
  if (type === 'auto') {
    // Simple heuristic: if query looks like a person name (2+ words, no numbers), default people
    resolvedType = /^[A-Za-z\s'-]{3,}$/.test(query) ? 'people' : 'places';
  }

  let rawResults = [];

  if (resolvedType === 'places') {
    rawResults = await aggregatePlaces(query);
  } else {
    rawResults = await aggregatePeople(query);
  }

  // Score each result
  const scored = rawResults.map(r => ({
    ...r,
    confidence: scoreResult(r, resolvedType, r._sources || 1),
  }));

  // Remove internal _sources field
  scored.forEach(r => delete r._sources);

  // Match and merge similar entities
  const merged = matchAndMerge(scored);

  // Sort by confidence descending
  merged.sort((a, b) => b.confidence - a.confidence);

  return {
    query,
    type: resolvedType,
    results: merged,
  };
}

// ─── Legacy exports (preserved for existing commands) ────────────────────────

const SEARCH_ENGINES = {
  google: {
    url: 'https://www.google.com/search',
    selectors: { result: 'div.g', title: 'h3', link: 'a', snippet: 'div.VwiC3b' },
  },
  duckduckgo: {
    url: 'https://html.duckduckgo.com/html/',
    selectors: { result: '.result', title: '.result__a', link: '.result__a', snippet: '.result__snippet' },
  },
};

async function searchWeb(query, engine = 'duckduckgo', limit = 10) {
  if (engine === 'duckduckgo') {
    const results = await duckduckgoSearch(query, limit);
    if (results.length > 0) return results;
  }

  // Fallback
  return [{
    title: `Search for "${query}"`,
    link: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    snippet: 'Unable to fetch results directly.',
  }];
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

  const totalSources =
    (results.wikipedia.found ? 1 : 0) +
    (results.github.found ? 1 : 0) +
    (results.news.found ? 1 : 0);

  results.summary = {
    totalSources,
    webResults: results.webSearch.length,
    hasWikipedia: results.wikipedia.found,
    hasGitHub: results.github.found,
    hasNews: results.news.found,
  };

  return results;
}

async function searchWikipedia(query) {
  try {
    const data = await fetchWikipediaSummary(query);
    if (!data) return { found: false };
    return {
      found: true,
      title: data.title,
      summary: data.extract ? data.extract.substring(0, 500) : '',
      url: data.content_urls?.desktop?.page,
      image: data.thumbnail?.source,
      description: data.description,
    };
  } catch {
    return { found: false };
  }
}

async function searchGitHub(query) {
  try {
    const users = await searchGitHubUsers(query, 3);
    if (!users.length) return { found: false };
    return {
      found: true,
      users: users.map(u => ({ username: u.login, profileUrl: u.html_url, avatarUrl: u.avatar_url, type: u.type })),
    };
  } catch {
    return { found: false };
  }
}

async function searchNews(query) {
  const newsSearchUrl = `https://news.google.com/search?q=${encodeURIComponent(query)}`;
  return {
    found: true,
    articles: [{ title: `News about "${query}"`, url: newsSearchUrl, source: 'Google News', publishedAt: new Date().toISOString() }],
    note: 'Direct link to news search',
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
