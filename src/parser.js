const cheerio = require('cheerio');

/**
 * Extracts data from HTML using CSS selectors
 * @param {string} html - HTML content
 * @returns {Object} - Cheerio instance and extraction helpers
 */
function extractData(html) {
  const $ = cheerio.load(html);
  
  /**
   * Extracts attribute from elements matching selector
   * @param {string} selector - CSS selector
   * @param {string} attribute - Attribute to extract ('text', 'html', or any attribute name)
   * @returns {Array|string} - Extracted values
   */
  const extractAttribute = (selector, attribute = 'text') => {
    const elements = $(selector);
    
    if (elements.length === 0) {
      return [];
    }
    
    const results = [];
    
    elements.each((i, element) => {
      let value;
      
      switch (attribute) {
        case 'text':
          value = $(element).text().trim();
          break;
        case 'html':
          value = $(element).html()?.trim();
          break;
        default:
          value = $(element).attr(attribute);
      }
      
      if (value !== undefined && value !== null) {
        results.push(value);
      }
    });
    
    return results;
  };
  
  return { $, extractAttribute };
}

/**
 * Extracts multiple fields based on configuration
 * @param {string} html - HTML content
 * @param {Object} fieldConfig - Field configuration object
 * @returns {Object} - Extracted data object
 */
function extractMultipleFields(html, fieldConfig) {
  const result = {};
  const { extractAttribute } = extractData(html);
  
  for (const [field, config] of Object.entries(fieldConfig)) {
    const { selector, attribute } = config;
    const values = extractAttribute(selector, attribute);
    
    // If multiple values found, return as array; if single, return as string
    if (values.length === 0) {
      result[field] = null;
    } else if (values.length === 1) {
      result[field] = values[0];
    } else {
      result[field] = values;
    }
  }
  
  return result;
}

module.exports = { extractData, extractMultipleFields };