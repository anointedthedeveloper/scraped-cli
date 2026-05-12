/**
 * scraped-cli - Command-line web scraping tool
 * Entry point for the CLI application
 */

const { program } = require('commander');
const cli = require('../src/cli');

// Set up CLI with commander
cli.setup(program);

// Parse command line arguments
program.parse(process.argv);

// Handle case where no command is provided
if (!process.argv.slice(2).length) {
  program.help();
}