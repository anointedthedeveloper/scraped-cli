const { fetchHTML } = require('./fetch');
const { extractData, extractMultipleFields } = require('./parser');
const { outputJSON } = require('./output');

/**
 * Sets up the CLI commands and options using commander
 * @param {Object} program - Commander program instance
 */
function setup(program) {
  // Main scraping command
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
  scraped https://example.com --map title:h1 price:.price
  scraped https://example.com --map title:.title content:.description --out result.json

Search Commands:
  scraped search "query" - Search the web
  scraped investigate "name" - Generate intelligence report about a person/topic
  scraped batch queries.txt - Batch search multiple queries`);

  program.action(async (url, options) => {
    try {
      await executeScrape(url, options);
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

  // Setup search command
  setupSearchCommand(program);
  
  // Setup investigate command
  setupInvestigateCommand(program);
  
  // Setup batch command
  setupBatchCommand(program);
}

/**
 * Search command - search the web for a query
 */
function setupSearchCommand(program) {
  program
    .command('search <query>')
    .description('Search the web for a query')
    .option('-e, --engine <engine>', 'Search engine (duckduckgo, google)', 'duckduckgo')
    .option('-l, --limit <number>', 'Number of results', '10')
    .option('-o, --out <file>', 'Save results to file')
    .action(async (query, options) => {
      try {
        const { searchWeb } = require('./search');
        
        const results = await searchWeb(query, options.engine, parseInt(options.limit));
        
        const output = {
          query,
          engine: options.engine,
          timestamp: new Date().toISOString(),
          totalResults: results.length,
          results
        };
        
        if (options.out) {
          const { outputJSON } = require('./output');
          await outputJSON(output, options.out);
          console.error(`✅ Search results saved to: ${options.out}`);
        } else {
          // Display results in console
          console.log('\n' + '='.repeat(70));
          console.log(`🔍 SEARCH RESULTS for: "${query}"`);
          console.log('='.repeat(70));
          
          if (results.length === 0) {
            console.log('\n❌ No results found. Try a different search term.\n');
          } else {
            results.forEach((result, index) => {
              console.log(`\n${index + 1}. ${result.title}`);
              console.log(`   🔗 ${result.link}`);
              if (result.snippet) {
                console.log(`   📝 ${result.snippet.substring(0, 150)}${result.snippet.length > 150 ? '...' : ''}`);
              }
            });
            
            console.log('\n' + '='.repeat(70));
            console.log(`📊 Total: ${results.length} results`);
            console.log('='.repeat(70) + '\n');
          }
        }
        
      } catch (error) {
        console.error('❌ Search error:', error.message);
        process.exit(1);
      }
    });
}

/**
 * Investigate command - deep dive into a person/topic
 */
function setupInvestigateCommand(program) {
  program
    .command('investigate <name>')
    .description('Generate detailed intelligence report about a person or topic')
    .option('-d, --deep', 'Perform deep search across all sources', false)
    .option('-o, --out <file>', 'Save report to file', 'intelligence-report.json')
    .option('-f, --format <format>', 'Output format (json, text)', 'json')
    .action(async (name, options) => {
      try {
        console.error(`\n🔍 STARTING INTELLIGENCE INVESTIGATION`);
        console.error(`📋 Target: ${name}`);
        console.error(`⏱️  This may take a moment...\n`);
        
        const { deepInvestigation } = require('./search');
        const { generateIntelligenceReport } = require('./report');
        
        // Show progress
        const progressInterval = setInterval(() => {
          process.stdout.write('.');
        }, 1000);
        
        // Gather data from multiple sources
        const investigationData = await deepInvestigation(name, options.deep);
        
        clearInterval(progressInterval);
        console.error('\n✅ Investigation complete!\n');
        
        // Generate comprehensive report
        const report = generateIntelligenceReport(name, investigationData);
        
        // Save report
        const { saveReport } = require('./report');
        const filename = await saveReport(report, options.out);
        console.error(`📄 Full report saved to: ${filename}`);
        
        // Display summary
        displayInvestigationSummary(report);
        
        if (options.format === 'json' && !options.out) {
          console.log(JSON.stringify(report, null, 2));
        }
        
      } catch (error) {
        console.error('\n❌ Investigation error:', error.message);
        process.exit(1);
      }
    });
}

/**
 * Batch command - search multiple queries from file
 */
function setupBatchCommand(program) {
  program
    .command('batch <file>')
    .description('Batch search from a file containing queries (one per line)')
    .option('-o, --outdir <dir>', 'Output directory for results', './reports')
    .option('-e, --engine <engine>', 'Search engine', 'duckduckgo')
    .option('-t, --type <type>', 'Type: search or investigate', 'search')
    .action(async (file, options) => {
      try {
        const fs = require('fs').promises;
        const path = require('path');
        
        // Read queries from file
        const content = await fs.readFile(file, 'utf8');
        const queries = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        
        console.error(`\n📋 Loading ${queries.length} queries from ${file}`);
        console.error(`🎯 Type: ${options.type}\n`);
        
        // Create output directory
        await fs.mkdir(options.outdir, { recursive: true });
        
        const results = [];
        
        // Process each query
        for (let i = 0; i < queries.length; i++) {
          const query = queries[i];
          console.error(`\n[${i + 1}/${queries.length}] Processing: ${query}`);
          
          try {
            let result;
            
            if (options.type === 'investigate') {
              const { deepInvestigation } = require('./search');
              const { generateIntelligenceReport } = require('./report');
              const investigationData = await deepInvestigation(query, false);
              result = generateIntelligenceReport(query, investigationData);
            } else {
              const { searchWeb } = require('./search');
              const searchResults = await searchWeb(query, options.engine, 10);
              result = {
                query,
                engine: options.engine,
                timestamp: new Date().toISOString(),
                results: searchResults
              };
            }
            
            const outputFile = path.join(options.outdir, `${query.replace(/[^a-z0-9]/gi, '_')}.json`);
            await fs.writeFile(outputFile, JSON.stringify(result, null, 2));
            console.error(`✅ Saved to: ${outputFile}`);
            results.push({ query, success: true, file: outputFile });
          } catch (error) {
            console.error(`❌ Failed: ${query} - ${error.message}`);
            results.push({ query, success: false, error: error.message });
          }
        }
        
        // Save batch report
        const batchReport = {
          timestamp: new Date().toISOString(),
          totalQueries: queries.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results
        };
        
        const batchFile = path.join(options.outdir, '_batch_report.json');
        await fs.writeFile(batchFile, JSON.stringify(batchReport, null, 2));
        
        console.error('\n' + '='.repeat(60));
        console.error(`✅ BATCH PROCESSING COMPLETE`);
        console.error(`📊 Total: ${queries.length} | ✅ Success: ${batchReport.successful} | ❌ Failed: ${batchReport.failed}`);
        console.error(`📁 Results saved to: ${options.outdir}`);
        console.error(`📄 Batch report: ${batchFile}`);
      } catch (error) {
        console.error('Batch search error:', error.message);
        process.exit(1);
      }
    });
}

/**
 * Display investigation summary in a readable format
 */
function displayInvestigationSummary(report) {
  console.log('\n' + '='.repeat(70));
  console.log(`📊 INTELLIGENCE REPORT: ${report.query.toUpperCase()}`);
  console.log('='.repeat(70));
  
  console.log(`\n📅 Generated: ${new Date(report.generatedAt).toLocaleString()}`);
  console.log(`🎯 Confidence Score: ${report.summary.confidence}/100`);
  console.log(`📚 Total Sources: ${report.metadata.totalSources}`);
  console.log(`ℹ️  Data Points: ${report.metadata.dataPoints}`);
  
  console.log('\n📝 SUMMARY:');
  console.log('-'.repeat(70));
  console.log(report.summary.overview);
  
  if (report.sections.biography && report.sections.biography.summary) {
    console.log('\n👤 BIOGRAPHY:');
    console.log('-'.repeat(70));
    console.log(report.sections.biography.summary.substring(0, 300) + '...');
  }
  
  if (report.sections.webPresence && Object.keys(report.sections.webPresence).length > 0) {
    console.log('\n🌐 WEB PRESENCE:');
    console.log('-'.repeat(70));
    if (report.sections.webPresence.websites && report.sections.webPresence.websites.length > 0) {
      report.sections.webPresence.websites.forEach(site => {
        console.log(`  • ${site}`);
      });
    }
  }
  
  if (report.sources && report.sources.length > 0) {
    console.log('\n📚 SOURCES:');
    console.log('-'.repeat(70));
    report.sources.forEach(source => {
      console.log(`  • ${source.name} (${source.type})`);
      if (source.url) console.log(`    ${source.url}`);
    });
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('💡 TIP: Use --out <file> to save full JSON report');
  console.log('='.repeat(70) + '\n');
}

/**
 * Executes the scraping based on provided options
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
  console.error(`🌐 Fetching ${url}...`);
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
      console.error('⚠️  Warning: No elements found with selector:', finalSelector);
    } else {
      console.error(`✅ Found ${results.length} element(s)`);
    }
    
    data = results.length === 1 ? results[0] : results;
  } else if (urlOptions.map) {
    // Mapped fields mode
    const mapConfig = parseMapConfig(urlOptions.map);
    data = extractMultipleFields(html, mapConfig);
    console.error(`✅ Extracted ${Object.keys(data).length} fields`);
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
 */
function parseMapConfig(mapArgs) {
  const config = {};
  
  for (const arg of mapArgs) {
    const colonIndex = arg.indexOf(':');
    if (colonIndex === -1) {
      throw new Error(`Invalid map format: ${arg}. Expected format: field:selector or field:selector@attr`);
    }
    
    const field = arg.substring(0, colonIndex);
    let selector = arg.substring(colonIndex + 1);
    let attribute = 'text';
    
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