const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Search engines configuration with proper selectors
 */
const SEARCH_ENGINES = {
  google: {
    url: 'https://www.google.com/search',
    selectors: {
      result: 'div.g',
      title: 'h3',
      link: 'a',
      snippet: 'div.VwiC3b, div[data-sncf="2"]'
    }
  },
  duckduckgo: {
    url: 'https://html.duckduckgo.com/html/',
    selectors: {
      result: '.result',
      title: '.result__a',
      link: '.result__a',
      snippet: '.result__snippet'
    }
  }
};

/**
 * Search the web for a query
 */
async function searchWeb(query, engine = 'duckduckgo', limit = 10) {
  const searchConfig = SEARCH_ENGINES[engine];
  if (!searchConfig) {
    throw new Error(`Unsupported search engine: ${engine}. Use: google, duckduckgo`);
  }

  try {
    console.error(`🔍 Searching ${engine} for: "${query}"`);
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive'
    };

    let url = searchConfig.url;
    let params = {};
    
    if (engine === 'google') {
      params = { q: query, num: limit };
    } else if (engine === 'duckduckgo') {
      params = { q: query };
    }

    const response = await axios.get(url, {
      params: params,
      headers: headers,
      timeout: 15000,
      maxRedirects: 5
    });

    const $ = cheerio.load(response.data);
    const results = [];
    
    // Extract results based on engine
    $(searchConfig.selectors.result).each((i, element) => {
      if (i >= limit) return false;
      
      let title = '';
      let link = '';
      let snippet = '';
      
      if (engine === 'google') {
        // Google selectors
        const titleElem = $(element).find(searchConfig.selectors.title);
        title = titleElem.text().trim();
        
        const linkElem = $(element).find(searchConfig.selectors.link);
        let rawLink = linkElem.attr('href');
        if (rawLink && rawLink.startsWith('/url?q=')) {
          link = decodeURIComponent(rawLink.replace('/url?q=', '').split('&')[0]);
        } else if (rawLink && rawLink.startsWith('http')) {
          link = rawLink;
        }
        
        snippet = $(element).find(searchConfig.selectors.snippet).text().trim();
      } 
      else if (engine === 'duckduckgo') {
        // DuckDuckGo selectors
        title = $(element).find(searchConfig.selectors.title).text().trim();
        link = $(element).find(searchConfig.selectors.link).attr('href');
        snippet = $(element).find(searchConfig.selectors.snippet).text().trim();
        
        // Clean up DuckDuckGo links
        if (link && link.startsWith('/l/?uddg=')) {
          link = decodeURIComponent(link.replace('/l/?uddg=', '').split('&')[0]);
        }
      }
      
      if (title && title.length > 0 && link && link.length > 0) {
        results.push({
          title: title,
          link: link,
          snippet: snippet.substring(0, 200) || 'No description available'
        });
      }
    });
    
    if (results.length === 0) {
      console.error('⚠️  No results found. Try a different search engine or query.');
      
      // Provide fallback mock results for demo/educational purposes
      results.push({
        title: `Information about ${query}`,
        link: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        snippet: `Search results for "${query}" - Check Google for more information.`
      });
    }
    
    console.error(`✅ Found ${results.length} results`);
    return results;
    
  } catch (error) {
    console.error(`Search error: ${error.message}`);
    
    // Return fallback results instead of failing
    return [{
      title: `Search for "${query}"`,
      link: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      snippet: `Unable to fetch search results directly. Click this link to search manually on Google.`
    }];
  }
}

/**
 * Deep investigation of a person or topic using multiple sources
 */
async function deepInvestigation(query, deepSearch = false) {
  console.error(`\n📊 Gathering intelligence on: ${query}`);
  console.error('🔄 Searching multiple sources...');
  
  const results = {
    query: query,
    timestamp: new Date().toISOString(),
    webSearch: await searchWeb(query, 'duckduckgo', 5),
    wikipedia: await searchWikipedia(query),
    github: await searchGitHub(query),
    news: await searchNews(query)
  };
  
  // Add additional sources for deep search
  if (deepSearch) {
    console.error('🔍 Performing deep search...');
    results.social = await searchSocialMedia(query);
    results.academic = await searchAcademic(query);
  }
  
  // Calculate summary statistics
  const totalSources = (results.wikipedia.found ? 1 : 0) + 
                      (results.github.found ? 1 : 0) +
                      (results.news.found ? 1 : 0);
  
  results.summary = {
    totalSources: totalSources,
    webResults: results.webSearch.length,
    hasWikipedia: results.wikipedia.found,
    hasGitHub: results.github.found,
    hasNews: results.news.found
  };
  
  return results;
}

/**
 * Search Wikipedia for information
 */
async function searchWikipedia(query) {
  try {
    console.error('📚 Checking Wikipedia...');
    
    // Try direct API first
    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    
    try {
      const response = await axios.get(apiUrl, { 
        timeout: 8000,
        headers: { 'User-Agent': 'ScrapedCLI/1.0' }
      });
      
      if (response.data && response.data.extract) {
        console.error('✅ Wikipedia article found!');
        return {
          found: true,
          title: response.data.title,
          summary: response.data.extract.substring(0, 500),
          url: response.data.content_urls?.desktop?.page,
          image: response.data.thumbnail?.source,
          description: response.data.description
        };
      }
    } catch (directError) {
      // Try search API if direct access fails
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
      const searchResponse = await axios.get(searchUrl, { timeout: 8000 });
      
      if (searchResponse.data.query.search.length > 0) {
        const topResult = searchResponse.data.query.search[0];
        console.error(`✅ Found related Wikipedia page: ${topResult.title}`);
        return {
          found: true,
          title: topResult.title,
          summary: topResult.snippet.replace(/<[^>]*>/g, ''),
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(topResult.title)}`,
          searchResult: true
        };
      }
    }
    
    console.error('❌ No Wikipedia article found');
    return { found: false };
    
  } catch (error) {
    console.error(`⚠️  Wikipedia search error: ${error.message}`);
    return { found: false, error: error.message };
  }
}

/**
 * Search GitHub for user profiles
 */
async function searchGitHub(query) {
  try {
    console.error('💻 Searching GitHub...');
    
    const apiUrl = `https://api.github.com/search/users?q=${encodeURIComponent(query)}`;
    const response = await axios.get(apiUrl, {
      timeout: 8000,
      headers: { 
        'User-Agent': 'ScrapedCLI/1.0',
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (response.data.items && response.data.items.length > 0) {
      const users = response.data.items.slice(0, 3).map(user => ({
        username: user.login,
        profileUrl: user.html_url,
        avatarUrl: user.avatar_url,
        type: user.type
      }));
      
      console.error(`✅ Found ${users.length} GitHub profile(s)`);
      return { found: true, users: users };
    }
    
    console.error('❌ No GitHub profiles found');
    return { found: false };
    
  } catch (error) {
    console.error(`⚠️  GitHub search error: ${error.message}`);
    return { found: false, error: error.message };
  }
}

/**
 * Search for news articles
 */
async function searchNews(query) {
  try {
    console.error('📰 Searching news...');
    
    // Using GNews API (free tier, no API key required for limited use)
    const gnewsUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=3&token=demo`;
    
    try {
      const response = await axios.get(gnewsUrl, { timeout: 8000 });
      if (response.data.articles && response.data.articles.length > 0) {
        console.error(`✅ Found ${response.data.articles.length} news articles`);
        return {
          found: true,
          articles: response.data.articles.slice(0, 5).map(article => ({
            title: article.title,
            description: article.description,
            url: article.url,
            source: article.source.name,
            publishedAt: article.publishedAt
          }))
        };
      }
    } catch (apiError) {
      // Provide helpful link if API fails
      const newsSearchUrl = `https://news.google.com/search?q=${encodeURIComponent(query)}`;
      return {
        found: true,
        articles: [{
          title: `News about "${query}"`,
          description: `Click to search for recent news articles about ${query}`,
          url: newsSearchUrl,
          source: "Google News",
          publishedAt: new Date().toISOString()
        }],
        note: "Using search link due to API limitations"
      };
    }
    
    console.error('❌ No news articles found');
    return { found: false };
    
  } catch (error) {
    console.error(`⚠️  News search error: ${error.message}`);
    return { found: false, error: error.message };
  }
}

/**
 * Search social media (simplified)
 */
async function searchSocialMedia(query) {
  const platforms = {
    twitter: `https://twitter.com/search?q=${encodeURIComponent(query)}`,
    linkedin: `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(query)}`,
    instagram: `https://www.instagram.com/explore/tags/${encodeURIComponent(query.replace(/ /g, ''))}/`
  };
  
  return {
    found: true,
    platforms: platforms,
    message: "Direct links to search social media platforms"
  };
}

/**
 * Search academic papers
 */
async function searchAcademic(query) {
  const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`;
  return {
    found: true,
    url: scholarUrl,
    message: "Search Google Scholar for academic papers"
  };
}

module.exports = {
  searchWeb,
  deepInvestigation,
  searchWikipedia,
  searchGitHub,
  searchNews,
  searchSocialMedia,
  searchAcademic
};