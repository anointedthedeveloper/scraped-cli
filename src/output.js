const fs = require('fs').promises;
const path = require('path');

/**
 * Outputs data as JSON to console or file
 * @param {Object|Array|string} data - Data to output
 * @param {string|null} outputFile - Output file path (null for console output)
 * @returns {Promise<string>} - JSON string
 * @throws {Error} - If file write fails
 */
async function outputJSON(data, outputFile = null) {
  let jsonString;
  
  try {
    // Convert data to JSON string with pretty formatting
    jsonString = JSON.stringify(data, null, 2);
  } catch (error) {
    throw new Error(`Failed to stringify data: ${error.message}`);
  }
  
  if (outputFile) {
    try {
      // Ensure directory exists
      const outputDir = path.dirname(outputFile);
      await fs.mkdir(outputDir, { recursive: true });
      
      // Write to file
      await fs.writeFile(outputFile, jsonString, 'utf8');
      console.error(`✅ Results saved to: ${outputFile}`);
    } catch (error) {
      throw new Error(`Failed to write output file: ${error.message}`);
    }
  }
  
  return jsonString;
}

module.exports = { outputJSON };