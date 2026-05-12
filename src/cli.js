const { fetchHTML } = require('./fetch');
const { extractData, extractMultipleFields } = require('./parser');
const { outputJSON } = require('./output');

/**
 * Sets up the CLI commands and options using commander
 * @param {Object} program - Commander program instance
 */
function setup(program) {
  program
    .name('scraped')
    .description('Extract structured data from websites using CSS selectors')
    .version('1.0.0')
    .argument('<url>', 'URL to scrape')
    .option('-s, --selector <selector>', 'CSS selector to extract text content')
    .option('-m, --map <fields...>', 'Map fields to CSS selectors (format: field:selector, field:selector@attr)')
    .option('-o, --out <file>', 'Output file path (JSON format)')
    .option('-t, --timeout <ms>', 'Request timeout in milliseconds', '10000')
    .option('-h, --headers <headers>', 'Custom headers as JSON string')
    .option('-a, --attribute <attr>', 'Extract specific attribute instead of text (for single selector)', 'text')
    .addHelpText('after', `
Examples:
  scraped https://example.com -s "h1"
  scraped https://example.com -s "img@src"
  scraped https://example.com --map title:h1 price:.price image:img@src
  scraped https://example.com --map title:.title content:.description --out result.json`);

  program.action(async (url, options) => {
    try {
      await executeScrape(url, options);
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });
}

/**
 * Executes the scraping based on provided options
 * @param {string} url - Target URL
 * @param {Object} options - CLI options
 */
async function executeScrape(url, urlOptions) {
  // Validate URL
  if (!isValidUrl(url)) {
    throw new Error('Invalid URL provided. Please include http:// or https://');
  }

  // Validate that either selector or map is provided
  if (!urlOptions.selector && !urlOptions.map) {
    throw new Error('Either --selector (-s) or --map (-m) must be provided');
  }

  // Parse custom headers if provided
  let headers = {};
  if (urlOptions.headers) {
    try {
      headers = JSON.parse(urlOptions.headers);
    } catch (error) {
      throw new Error('Invalid JSON format for headers');
    }
  }

  // Fetch HTML
  const timeout = parseInt(urlOptions.timeout);
  console.error(`Fetching ${url}...`);
  const html = await fetchHTML(url, timeout, headers);

  // Extract data based on mode
  let data;
  if (urlOptions.selector) {
    // Single selector mode
    const { extractAttribute } = extractData(html);
    const selector = urlOptions.selector;
    const attribute = urlOptions.attribute;
    
    // Check if selector includes attribute extraction (selector@attr format)
    let finalSelector = selector;
    let finalAttribute = attribute;
    
    if (selector.includes('@')) {
      const parts = selector.split('@');
      finalSelector = parts[0];
      finalAttribute = parts[1];
    }
    
    const results = extractAttribute(finalSelector, finalAttribute);
    
    if (!results || results.length === 0) {
      console.error('Warning: No elements found with selector:', finalSelector);
    }
    
    data = results.length === 1 ? results[0] : results;
  } else if (urlOptions.map) {
    // Mapped fields mode
    const mapConfig = parseMapConfig(urlOptions.map);
    data = extractMultipleFields(html, mapConfig);
  } else {
    throw new Error('Invalid mode: Neither selector nor map provided');
  }

  // Output results
  await outputJSON(data, urlOptions.out);
  
  // Print to console if not writing to file
  if (!urlOptions.out) {
    console.log(JSON.stringify(data, null, 2));
  }
}

/**
 * Validates URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if URL is valid
 */
function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

/**
 * Parses the map configuration from command line arguments
 * @param {Array} mapArgs - Array of field:selector strings
 * @returns {Object} - Parsed configuration object
 */
function parseMapConfig(mapArgs) {
  const config = {};
  
  for (const arg of mapArgs) {
    // Split field and selector
    const colonIndex = arg.indexOf(':');
    if (colonIndex === -1) {
      throw new Error(`Invalid map format: ${arg}. Expected format: field:selector or field:selector@attr`);
    }
    
    const field = arg.substring(0, colonIndex);
    let selector = arg.substring(colonIndex + 1);
    let attribute = 'text';
    
    // Check for attribute extraction
    if (selector.includes('@')) {
      const parts = selector.split('@');
      selector = parts[0];
      attribute = parts[1];
    }
    
    config[field] = { selector, attribute };
  }
  
  return config;
}

module.exports = { setup, executeScrape };