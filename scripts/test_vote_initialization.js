/**
 * Test Vote Initialization Feature
 * 
 * This script tests the automatic initialization of vote files
 * for new posts to prevent 404 errors when loading vote data.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT_DIR = process.cwd();
const TEST_POST_ID = `test-post-${Date.now()}`;

// Data directories for votes
const DATA_DIRS = {
  upvotes: path.join(ROOT_DIR, 'data', 'upvotes'),
  downvotes: path.join(ROOT_DIR, 'data', 'downvotes'),
};

// Make sure directories exist
Object.values(DATA_DIRS).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Remove any existing test files
function cleanupTestFiles() {
  const upvotesPath = path.join(DATA_DIRS.upvotes, `${TEST_POST_ID}.json`);
  const downvotesPath = path.join(DATA_DIRS.downvotes, `${TEST_POST_ID}.json`);
  
  if (fs.existsSync(upvotesPath)) {
    fs.unlinkSync(upvotesPath);
  }
  
  if (fs.existsSync(downvotesPath)) {
    fs.unlinkSync(downvotesPath);
  }
}

// Test the local server vote initialization
async function testLocalServerInitialization() {
  console.log(`\n🔍 Testing vote initialization for post ${TEST_POST_ID} on local server...`);
  
  // Clean up first
  cleanupTestFiles();
  
  // Check that files don't exist before test
  const upvotesBefore = fs.existsSync(path.join(DATA_DIRS.upvotes, `${TEST_POST_ID}.json`));
  const downvotesBefore = fs.existsSync(path.join(DATA_DIRS.downvotes, `${TEST_POST_ID}.json`));
  
  if (upvotesBefore || downvotesBefore) {
    console.log('❌ Test files already exist. Could not clean up properly.');
    process.exit(1);
  }
  
  // Try to initialize vote files via local server
  try {
    const port = await findFirstPort([5500, 5501, 5502, 5503, 8080]);
    
    if (!port) {
      console.log('❌ No local server found running. Please start the enhanced server first.');
      process.exit(1);
    }
    
    console.log(`✅ Found local server on port ${port}`);
    
    // Send request to initialize votes
    const result = await sendInitializeVotesRequest(port, TEST_POST_ID);
    console.log(`✅ Server response: ${JSON.stringify(result)}`);
    
    // Check if files were created
    const upvotesAfter = fs.existsSync(path.join(DATA_DIRS.upvotes, `${TEST_POST_ID}.json`));
    const downvotesAfter = fs.existsSync(path.join(DATA_DIRS.downvotes, `${TEST_POST_ID}.json`));
    
    if (upvotesAfter && downvotesAfter) {
      console.log('✅ Vote files were successfully created!');
      
      // Check vote file content
      const upvotesContent = JSON.parse(fs.readFileSync(path.join(DATA_DIRS.upvotes, `${TEST_POST_ID}.json`)));
      const downvotesContent = JSON.parse(fs.readFileSync(path.join(DATA_DIRS.downvotes, `${TEST_POST_ID}.json`)));
      
      if (upvotesContent.count === 0 && downvotesContent.count === 0) {
        console.log('✅ Vote files have correct initial count of 0');
      } else {
        console.log('❌ Vote files have incorrect initial count');
      }
    } else {
      console.log('❌ Vote files were not created');
    }
  } catch (error) {
    console.error('❌ Error testing vote initialization:', error);
  } finally {
    // Clean up test files
    cleanupTestFiles();
  }
}

// Send HTTP request to initialize votes
function sendInitializeVotesRequest(port, postId) {
  return new Promise((resolve, reject) => {
    const requestData = JSON.stringify({
      postId,
      timestamp: new Date().toISOString()
    });
    
    const options = {
      hostname: 'localhost',
      port,
      path: '/initialize-votes',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(new Error(`Invalid response: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(requestData);
    req.end();
  });
}

// Check if a server is running on the specified port
function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port,
      path: '/',
      method: 'GET',
      timeout: 300
    }, () => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// Find the first available port from a list
async function findFirstPort(ports) {
  for (const port of ports) {
    if (await checkPort(port)) {
      return port;
    }
  }
  return null;
}

// Run the tests
testLocalServerInitialization().catch(console.error);
