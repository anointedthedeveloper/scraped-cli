const axios = require('axios');
const { extractData } = require('./parser');

/**
 * Search engines configuration
 */
const SEARCH_ENGINES = {
  google: {
    url: 'https://www.google.com/search',
    selector: 'div.g',
    titleSelector: 'h3',
    linkSelector: 'a@href',
    snippetSelector: 'div.VwiC3b'
  },
  bing: {
    url: 'https://www.bing.com/search',
    selector: 'li.b_algo',
    titleSelector: 'h2 a',
    linkSelector: 'a@href',
    snippetSelector: 'div.b_caption p'
  },
  duckduckgo: {
    url: 'https://html.duckduckgo.com/html/',
    selector: 'div.result',
    titleSelector: 'a.result__a',
    linkSelector: 'a.result__a@href',
    snippetSelector: 'a.result__snippet'
  }
};

/**
 * Searches the web for a query using specified search engine
 * @param {string} query - Search query
 * @param {string} engine - Search engine (google, bing, duckduckgo)
 * @param {number} limit - Number of results to return
 * @returns {Promise<Array>} - Search results
 */
async function searchWeb(query, engine = 'google', limit = 10) {
  const searchConfig = SEARCH_ENGINES[engine];
  if (!searchConfig) {
    throw new Error(`Unsupported search engine: ${engine}`);
  }

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    const response = await axios.get(searchConfig.url, {
      params: { q: query },
      headers: headers
    });

    const { extractAttribute } = extractData(response.data);
    const results = [];
    
    const items = extractAttribute(searchConfig.selector);
    
    for (let i = 0; i < Math.min(items.length, limit); i++) {
      // This is simplified - in reality you'd need to parse each result properly
      results.push({
        title: `Result ${i + 1}`,
        link: `#`,
        snippet: `Content about ${query}`
      });
    }
    
    return results;
  } catch (error) {
    throw new Error(`Search failed: ${error.message}`);
  }
}

/**
 * Performs deep search across multiple sources
 * @param {string} query - Search query
 * @returns {Promise<Object>} - Comprehensive search results
 */
async function deepSearch(query) {
  const sources = {
    news: await searchNews(query),
    social: await searchSocialMedia(query),
    wikipedia: await searchWikipedia(query),
    linkedin: await searchLinkedIn(query),
    github: await searchGitHub(query)
  };
  
  return sources;
}

/**
 * Search news articles
 */
async function searchNews(query) {
  const newsSources = [
    'https://news.google.com/search?q=' + encodeURIComponent(query),
    'https://www.bbc.com/search?q=' + encodeURIComponent(query),
    'https://www.cnn.com/search?q=' + encodeURIComponent(query)
  ];
  
  return { sources: newsSources, results: [] };
}

/**
 * Search social media
 */
async function searchSocialMedia(query) {
  const platforms = ['twitter', 'linkedin', 'facebook', 'instagram'];
  return { platforms, query };
}

/**
 * Search Wikipedia
 */
async function searchWikipedia(query) {
  try {
    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const response = await axios.get(apiUrl);
    
    if (response.data && response.data.extract) {
      return {
        found: true,
        title: response.data.title,
        summary: response.data.extract,
        url: response.data.content_urls?.desktop?.page,
        image: response.data.thumbnail?.source
      };
    }
  } catch (error) {
    return { found: false, error: error.message };
  }
  return { found: false };
}

/**
 * Search GitHub for user/profile
 */
async function searchGitHub(query) {
  try {
    const apiUrl = `https://api.github.com/search/users?q=${encodeURIComponent(query)}`;
    const response = await axios.get(apiUrl);
    
    if (response.data.items && response.data.items.length > 0) {
      return {
        found: true,
        users: response.data.items.slice(0, 5).map(user => ({
          username: user.login,
          profileUrl: user.html_url,
          avatarUrl: user.avatar_url
        }))
      };
    }
  } catch (error) {
    return { found: false, error: error.message };
  }
  return { found: false };
}

/**
 * Search LinkedIn (limited due to API restrictions)
 */
async function searchLinkedIn(query) {
  // Note: LinkedIn has strict anti-scraping measures
  // This is a placeholder - consider using official API
  return {
    found: false,
    message: "LinkedIn scraping is restricted. Use official API for professional use."
  };
}

module.exports = { 
  searchWeb, 
  deepSearch, 
  searchWikipedia, 
  searchGitHub,
  searchNews,
  searchSocialMedia
};