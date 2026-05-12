const axios = require('axios');

/**
 * Fetches HTML content from a URL
 * @param {string} url - Target URL
 * @param {number} timeout - Request timeout in milliseconds
 * @param {Object} customHeaders - Custom headers to include in request
 * @returns {Promise<string>} - HTML content
 * @throws {Error} - If request fails
 */
async function fetchHTML(url, timeout = 10000, customHeaders = {}) {
  try {
    // Default headers to mimic a real browser
    const defaultHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    };
    
    const headers = { ...defaultHeaders, ...customHeaders };
    
    const response = await axios.get(url, {
      timeout,
      headers,
      maxRedirects: 5
    });
    
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    
    if (error.response) {
      throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
    }
    
    if (error.request) {
      throw new Error(`Network error: Unable to reach ${url}`);
    }
    
    throw new Error(`Failed to fetch URL: ${error.message}`);
  }
}

module.exports = { fetchHTML };