/**
 * Data Structure Testing Script for We Are Sierra Leone
 * 
 * This script tests the data loading capabilities using the new per-post file structure.
 * It verifies that basic data operations work correctly with the new structure.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Base directory for data files
const DATA_DIR = path.join(__dirname, '..', 'data');

// Set different colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

// Print test header
function printHeader(title) {
  console.log('\n' + colors.bright + colors.blue + '====================================' + colors.reset);
  console.log(colors.bright + colors.blue + `  ${title}` + colors.reset);
  console.log(colors.bright + colors.blue + '====================================' + colors.reset);
}

// Print test result
function printResult(name, success, message = '') {
  const icon = success ? '✅' : '❌';
  const color = success ? colors.green : colors.red;
  console.log(`${icon} ${color}${name}${colors.reset} ${message}`);
}

// Test that a directory exists and has files
async function testDirectoryWithFiles(dirPath, description) {
  try {
    const stats = await stat(dirPath);
    if (!stats.isDirectory()) {
      printResult(description, false, `- Path exists but is not a directory`);
      return false;
    }
    
    const files = await readdir(dirPath);
    if (files.length === 0) {
      printResult(description, false, `- Directory exists but is empty`);
      return false;
    }
    
    printResult(description, true, `- Found ${files.length} files`);
    return true;
  } catch (error) {
    printResult(description, false, `- ${error.message}`);
    return false;
  }
}

// Test loading post data
async function testPostsStructure() {
  printHeader('Testing Posts Structure');
  
  // Test posts directory
  await testDirectoryWithFiles(path.join(DATA_DIR, 'posts'), 'Posts directory');
  
  // Test post index file
  try {
    const indexPath = path.join(DATA_DIR, 'posts', 'index.json');
    const indexContent = await readFile(indexPath, 'utf8');
    const index = JSON.parse(indexContent);
    
    if (!index.files || !Array.isArray(index.files)) {
      printResult('Posts index file', false, '- Invalid format (missing "files" array)');
    } else {
      printResult('Posts index file', true, `- Contains ${index.files.length} posts`);
      
      // Test a sample post file
      if (index.files.length > 0) {
        const samplePostFile = index.files[0];
        const samplePostPath = path.join(DATA_DIR, 'posts', samplePostFile);
        
        try {
          const postContent = await readFile(samplePostPath, 'utf8');
          const post = JSON.parse(postContent);
          
          if (!post.id || !post.title) {
            printResult('Sample post file', false, '- Missing required fields');
          } else {
            printResult('Sample post file', true, `- Successfully loaded post "${post.title}"`);
          }
        } catch (error) {
          printResult('Sample post file', false, `- ${error.message}`);
        }
      }
    }
  } catch (error) {
    printResult('Posts index file', false, `- ${error.message}`);
  }
}

// Test loading comments data
async function testCommentsStructure() {
  printHeader('Testing Comments Structure');
  
  // Test comments directory
  const commentsExists = await testDirectoryWithFiles(path.join(DATA_DIR, 'comments'), 'Comments directory');
  
  if (commentsExists) {
    // Get a sample post directory
    try {
      const postDirs = await readdir(path.join(DATA_DIR, 'comments'));
      
      // Filter for directories that might contain comments
      for (const postDir of postDirs) {
        const postDirPath = path.join(DATA_DIR, 'comments', postDir);
        const stats = await stat(postDirPath);
        
        if (stats.isDirectory()) {
          printResult(`Comments for post ${postDir}`, true, `- Directory exists`);
          
          // Check for index file
          try {
            const indexPath = path.join(postDirPath, 'index.json');
            const indexContent = await readFile(indexPath, 'utf8');
            const index = JSON.parse(indexContent);
            
            if (!index.files || !Array.isArray(index.files)) {
              printResult('Comments index file', false, '- Invalid format (missing "files" array)');
            } else {
              printResult('Comments index file', true, `- Contains ${index.files.length} comments`);
            }
          } catch (error) {
            printResult('Comments index file', false, `- ${error.message}`);
          }
          
          // No need to check more post dirs
          break;
        }
      }
    } catch (error) {
      printResult('Sample post comments', false, `- ${error.message}`);
    }
  }
}

// Test loading votes data
async function testVotesStructure() {
  printHeader('Testing Votes Structure');
  
  // Test votes directories
  await testDirectoryWithFiles(path.join(DATA_DIR, 'votes'), 'Votes directory');
  await testDirectoryWithFiles(path.join(DATA_DIR, 'upvotes'), 'Upvotes directory');
  await testDirectoryWithFiles(path.join(DATA_DIR, 'downvotes'), 'Downvotes directory');
}

// Test loading petitions data
async function testPetitionsStructure() {
  printHeader('Testing Petitions Structure');
  
  // Test petitions directory
  await testDirectoryWithFiles(path.join(DATA_DIR, 'petitions'), 'Petitions directory');
  await testDirectoryWithFiles(path.join(DATA_DIR, 'signatures'), 'Signatures directory');
}

// Main test function
async function runTests() {
  console.log(colors.bright + colors.cyan + '\nWe Are Sierra Leone - Data Structure Tests' + colors.reset);
  console.log(colors.bright + colors.cyan + '=======================================' + colors.reset);
  console.log('Testing data structure at:', DATA_DIR);
  
  try {
    await testPostsStructure();
    await testCommentsStructure();
    await testVotesStructure();
    await testPetitionsStructure();
    
    console.log('\n' + colors.bright + colors.green + '✅ Tests completed!' + colors.reset);
  } catch (error) {
    console.error('\n' + colors.bright + colors.red + '❌ Tests failed with error:' + colors.reset, error);
  }
}

// Run all tests
runTests();
