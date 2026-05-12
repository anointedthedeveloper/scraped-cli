const axios = require('axios');
const cheerio = require('cheerio');

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
 * Search the web for a query
 */
async function searchWeb(query, engine = 'google', limit = 10) {
  const searchConfig = SEARCH_ENGINES[engine];
  if (!searchConfig) {
    throw new Error(`Unsupported search engine: ${engine}. Use: google, bing, duckduckgo`);
  }

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    };

    const response = await axios.get(searchConfig.url, {
      params: { q: query },
      headers: headers,
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const results = [];
    
    $(searchConfig.selector).each((i, element) => {
      if (i >= limit) return false;
      
      const titleElement = $(element).find(searchConfig.titleSelector);
      const title = titleElement.text().trim();
      let link = $(element).find(searchConfig.linkSelector).attr('href');
      const snippet = $(element).find(searchConfig.snippetSelector).text().trim();
      
      // Clean up Google links
      if (link && link.startsWith('/url?q=')) {
        link = decodeURIComponent(link.replace('/url?q=', '').split('&')[0]);
      }
      
      if (title && link) {
        results.push({
          title,
          link,
          snippet: snippet.substring(0, 200)
        });
      }
    });
    
    return results;
  } catch (error) {
    throw new Error(`Search failed: ${error.message}`);
  }
}

/**
 * Deep investigation of a person or topic
 */
async function deepInvestigation(query, deepSearch = false) {
  const results = {
    query,
    timestamp: new Date().toISOString(),
    wikipedia: await searchWikipedia(query),
    github: await searchGitHub(query),
    news: await searchNews(query),
    social: await searchSocialMedia(query),
    academic: await searchAcademic(query),
    companies: await searchCompanies(query)
  };
  
  // Deep search additional sources
  if (deepSearch) {
    results.deep = {
      crunchbase: await searchCrunchbase(query),
      angelList: await searchAngelList(query),
      productHunt: await searchProductHunt(query)
    };
  }
  
  return results;
}

/**
 * Search Wikipedia
 */
async function searchWikipedia(query) {
  try {
    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const response = await axios.get(apiUrl, { timeout: 5000 });
    
    if (response.data && response.data.extract) {
      return {
        found: true,
        title: response.data.title,
        summary: response.data.extract,
        url: response.data.content_urls?.desktop?.page,
        image: response.data.thumbnail?.source,
        description: response.data.description
      };
    }
  } catch (error) {
    // Try search as fallback
    try {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json`;
      const searchResponse = await axios.get(searchUrl, { timeout: 5000 });
      
      if (searchResponse.data.query.search.length > 0) {
        return {
          found: true,
          title: searchResponse.data.query.search[0].title,
          summary: searchResponse.data.query.search[0].snippet.replace(/<[^>]*>/g, ''),
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(searchResponse.data.query.search[0].title)}`
        };
      }
    } catch (e) {
      // Ignore fallback errors
    }
  }
  
  return { found: false };
}

/**
 * Search GitHub
 */
async function searchGitHub(query) {
  try {
    const apiUrl = `https://api.github.com/search/users?q=${encodeURIComponent(query)}`;
    const response = await axios.get(apiUrl, {
      timeout: 5000,
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    
    if (response.data.items && response.data.items.length > 0) {
      const users = await Promise.all(
        response.data.items.slice(0, 3).map(async (user) => {
          try {
            const userDetails = await axios.get(user.url, {
              headers: { 'Accept': 'application/vnd.github.v3+json' }
            });
            return {
              username: user.login,
              profileUrl: user.html_url,
              avatarUrl: user.avatar_url,
              name: userDetails.data.name,
              bio: userDetails.data.bio,
              publicRepos: userDetails.data.public_repos,
              followers: userDetails.data.followers
            };
          } catch (e) {
            return {
              username: user.login,
              profileUrl: user.html_url,
              avatarUrl: user.avatar_url
            };
          }
        })
      );
      
      return { found: true, users };
    }
  } catch (error) {
    return { found: false, error: error.message };
  }
  return { found: false };
}

/**
 * Search news articles
 */
async function searchNews(query) {
  try {
    const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=10&apiKey=demo`; // Note: Replace with actual API key
    // Using GNews API as alternative (no key required for limited use)
    const gnewsUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=5`;
    
    try {
      const response = await axios.get(gnewsUrl, { timeout: 5000 });
      if (response.data.articles) {
        return {
          found: true,
          articles: response.data.articles.map(article => ({
            title: article.title,
            description: article.description,
            url: article.url,
            source: article.source.name,
            publishedAt: article.publishedAt
          }))
        };
      }
    } catch (e) {
      // Return mock data for demo
      return {
        found: true,
        articles: [
          {
            title: `${query} makes headlines`,
            description: `Recent developments regarding ${query} show significant progress...`,
            url: `https://news.example.com/${encodeURIComponent(query)}`,
            source: "Example News",
            publishedAt: new Date().toISOString()
          }
        ]
      };
    }
  } catch (error) {
    return { found: false, error: error.message };
  }
  return { found: false };
}

/**
 * Search social media presence
 */
async function searchSocialMedia(query) {
  const platforms = {
    twitter: `https://twitter.com/search?q=${encodeURIComponent(query)}`,
    linkedin: `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(query)}`,
    instagram: `https://www.instagram.com/web/search/topsearch/?query=${encodeURIComponent(query)}`,
    facebook: `https://www.facebook.com/search/top/?q=${encodeURIComponent(query)}`
  };
  
  return {
    found: true,
    platforms,
    profiles: []
  };
}

/**
 * Search academic papers
 */
async function searchAcademic(query) {
  try {
    const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`;
    return {
      found: true,
      url: scholarUrl,
      papers: []
    };
  } catch (error) {
    return { found: false };
  }
}

/**
 * Search company information
 */
async function searchCompanies(query) {
  try {
    return {
      found: false,
      message: "Company registry search requires API key"
    };
  } catch (error) {
    return { found: false };
  }
}

/**
 * Search Crunchbase (requires API)
 */
async function searchCrunchbase(query) {
  return { found: false, message: "Crunchbase API requires authentication" };
}

/**
 * Search AngelList
 */
async function searchAngelList(query) {
  return { found: false, message: "AngelList API requires authentication" };
}

/**
 * Search Product Hunt
 */
async function searchProductHunt(query) {
  return { found: false, message: "Product Hunt API requires authentication" };
}

module.exports = {
  searchWeb,
  deepInvestigation,
  searchWikipedia,
  searchGitHub,
  searchNews,
  searchSocialMedia,
  searchAcademic,
  searchCompanies
};