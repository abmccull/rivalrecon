#!/usr/bin/env node

/**
 * Script to find all console.log, console.error, and console.warn statements in the codebase
 * Run with: node scripts/find-console-logs.js
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const readFile = util.promisify(fs.readFile);

// Configuration
const rootDir = path.resolve(__dirname, '..');
const excludeDirs = ['node_modules', '.next', 'out', 'build', 'dist', '.git'];
const includeExtensions = ['.js', '.jsx', '.ts', '.tsx'];

// Regular expressions for finding console logs
const consoleLogRegex = /console\.(log|error|warn|info|debug)\s*\(/g;

// Results storage
const results = [];

/**
 * Check if a path should be excluded
 */
function shouldExclude(pathToCheck) {
  return excludeDirs.some(dir => pathToCheck.includes(`/${dir}/`));
}

/**
 * Check if a file should be included based on extension
 */
function shouldIncludeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return includeExtensions.includes(ext);
}

/**
 * Find console logs in a file
 */
async function findConsoleLogs(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    let match;
    const fileResults = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const regex = new RegExp(consoleLogRegex);
      
      while ((match = regex.exec(line)) !== null) {
        fileResults.push({
          file: filePath.replace(rootDir, ''),
          line: i + 1,
          type: match[1],
          content: line.trim()
        });
      }
    }
    
    if (fileResults.length > 0) {
      results.push(...fileResults);
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
  }
}

/**
 * Scan directory recursively
 */
async function scanDirectory(dirPath) {
  try {
    const files = await readdir(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      
      if (shouldExclude(filePath)) {
        continue;
      }
      
      const stats = await stat(filePath);
      
      if (stats.isDirectory()) {
        await scanDirectory(filePath);
      } else if (stats.isFile() && shouldIncludeFile(filePath)) {
        await findConsoleLogs(filePath);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
  }
}

/**
 * Format and print results
 */
function printResults() {
  console.log('\n=== Console Log Finder Results ===\n');
  
  const byFile = {};
  
  // Group by file
  results.forEach(result => {
    if (!byFile[result.file]) {
      byFile[result.file] = [];
    }
    byFile[result.file].push(result);
  });
  
  // Print results by file
  Object.keys(byFile).sort().forEach(file => {
    console.log(`\n\x1b[1m${file}\x1b[0m`);
    
    byFile[file].forEach(match => {
      const colorCode = match.type === 'error' ? '\x1b[31m' : // Red for error
                        match.type === 'warn' ? '\x1b[33m' :  // Yellow for warn
                        '\x1b[36m';                           // Cyan for log/info
      
      console.log(`  ${colorCode}${match.type}\x1b[0m at line ${match.line}: ${match.content}`);
    });
  });
  
  // Summary
  console.log('\n=== Summary ===');
  const byType = {};
  results.forEach(result => {
    byType[result.type] = (byType[result.type] || 0) + 1;
  });
  
  Object.keys(byType).forEach(type => {
    console.log(`${type}: ${byType[type]}`);
  });
  
  console.log(`\nTotal: ${results.length} console statements found in ${Object.keys(byFile).length} files`);
  console.log('\nRun this script again after you\'ve removed console logs to see your progress.');
}

/**
 * Main function
 */
async function main() {
  console.log('Scanning for console.log, console.error, and console.warn statements...');
  
  await scanDirectory(rootDir);
  
  if (results.length > 0) {
    printResults();
  } else {
    console.log('\nNo console statements found! Your codebase is clean.');
  }
}

// Run the script
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
