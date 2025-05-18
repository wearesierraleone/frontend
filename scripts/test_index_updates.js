/**
 * Test script for verifying the index file updating logic
 * 
 * This script simulates the GitHub Actions workflow logic for updating index.json files
 * when new content files are added through PRs.
 */

console.log("Starting index update test script...");
console.log("==============================================");

const fs = require('fs');
const path = require('path');

// Simulate changes to these files
const testChanges = [
  {
    filename: 'data/posts/post-newpost123.json',
    status: 'added',
    additions: 30,
    deletions: 0,
  },
  {
    filename: 'data/comments/post-123/comment-456.json',
    status: 'added',
    additions: 15,
    deletions: 0,
  },
  {
    filename: 'data/comments/post-123/comment-789.json',
    status: 'added',
    additions: 12,
    deletions: 0,
  },
  {
    filename: 'data/comments/post-456/comment-123.json',
    status: 'added',
    additions: 18,
    deletions: 0,
  },
  {
    filename: 'data/votes/post-123.json',
    status: 'modified',
    additions: 5,
    deletions: 2,
  },
  // Simulate an unrelated change that shouldn't be indexed
  {
    filename: 'js/index-loader.js',
    status: 'modified',
    additions: 20,
    deletions: 15,
  }
];

// Mock GitHub context
const context = {
  repo: {
    owner: 'wearesierraleone',
    repo: 'frontend'
  },
  payload: {
    pull_request: {
      number: 123,
      title: 'Add new content',
    }
  }
};

// Mock directories to test with
const DATA_DIR = path.join(__dirname, '..', 'data');
const POSTS_DIR = path.join(DATA_DIR, 'posts');
const COMMENTS_DIR = path.join(DATA_DIR, 'comments');

// Create directories if they don't exist
function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Ensure all required directories exist
ensureDirExists(POSTS_DIR);
ensureDirExists(path.join(COMMENTS_DIR, 'post-123'));
ensureDirExists(path.join(COMMENTS_DIR, 'post-456'));

// Create sample index files if they don't exist
function createSampleIndex(filePath, initialEntries = []) {
  if (!fs.existsSync(filePath)) {
    console.log(`Creating sample index file: ${filePath}`);
    fs.writeFileSync(filePath, JSON.stringify({ files: initialEntries }, null, 2));
  }
}

// Create sample index files
createSampleIndex(path.join(POSTS_DIR, 'index.json'), ['post-existing1.json', 'post-existing2.json']);
createSampleIndex(path.join(COMMENTS_DIR, 'post-123', 'index.json'), ['comment-existing1.json', 'comment-existing2.json']);
createSampleIndex(path.join(COMMENTS_DIR, 'post-456', 'index.json'), []);

// Main function to simulate the index updating logic
async function simulateIndexUpdate() {
  console.log('Simulating PR file changes...');

  // Track which index files we need to update
  const indexUpdates = {
    posts: new Set(),
    comments: new Map() // Stores postId -> Set of comment files
  };

  // Process changed files
  for (const file of testChanges) {
    console.log(`\nChecking file: ${file.filename}`);
    
    // Skip deleted files
    if (file.status === 'removed') {
      console.log(`  Skipping deleted file: ${file.filename}`);
      continue;
    }
    
    // Check for new posts
    if (file.filename.startsWith('data/posts/') && !file.filename.includes('index.json')) {
      console.log(`  Found post file: ${file.filename}`);
      const fileName = path.basename(file.filename);
      
      // Only add to index if this is a new file
      if (file.status === 'added') {
        indexUpdates.posts.add(fileName);
      }
    }
    
    // Check for new comments
    if (file.filename.startsWith('data/comments/')) {
      const pathParts = file.filename.split('/');
      
      // Skip if not the right format (should be data/comments/{postId}/{commentFile})
      if (pathParts.length >= 4 && !pathParts[3].includes('index.json')) {
        const postId = pathParts[2];
        const commentFileName = pathParts[3];
        
        // Only add to index if this is a new file
        if (file.status === 'added') {
          if (!indexUpdates.comments.has(postId)) {
            indexUpdates.comments.set(postId, new Set());
          }
          indexUpdates.comments.get(postId).add(commentFileName);
        }
      }
    }
  }
  
  console.log('\nUpdating indexes...');

  // Update posts index if we found new posts
  if (indexUpdates.posts.size > 0) {
    const postsIndexPath = path.join(POSTS_DIR, 'index.json');
    
    try {
      let postsIndex = { files: [] };
      
      // Read existing index if it exists
      if (fs.existsSync(postsIndexPath)) {
        const indexContent = fs.readFileSync(postsIndexPath, 'utf-8');
        postsIndex = JSON.parse(indexContent);
        
        if (!Array.isArray(postsIndex.files)) {
          postsIndex.files = [];
        }
      }
      
      // Add new entries
      let updatedCount = 0;
      for (const fileName of indexUpdates.posts) {
        if (!postsIndex.files.includes(fileName)) {
          postsIndex.files.push(fileName);
          updatedCount++;
          console.log(`  Added ${fileName} to posts index`);
        }
      }
      
      // Write updated index if we actually added anything
      if (updatedCount > 0) {
        console.log(`  Writing updated posts index with ${updatedCount} new entries`);
        // In the actual workflow, we'd commit this back to the repo
        console.log(`  Updated entries: ${JSON.stringify(postsIndex.files.slice(-updatedCount))}`);
      } else {
        console.log('  No changes to posts index needed');
      }
    } catch (error) {
      console.error(`  Error updating posts index: ${error.message}`);
    }
  } else {
    console.log('  No new posts to add to index');
  }
  
  // Update comment indexes if we found new comments
  if (indexUpdates.comments.size > 0) {
    for (const [postId, commentFiles] of indexUpdates.comments.entries()) {
      const postDir = path.join(COMMENTS_DIR, postId);
      const commentsIndexPath = path.join(postDir, 'index.json');
      
      console.log(`\n  Processing comments for post ${postId}:`);
      
      try {
        // Ensure the directory exists
        if (!fs.existsSync(postDir)) {
          fs.mkdirSync(postDir, { recursive: true });
          console.log(`    Created directory ${postDir}`);
        }
        
        let commentsIndex = { files: [] };
        
        // Read existing index if it exists
        if (fs.existsSync(commentsIndexPath)) {
          const indexContent = fs.readFileSync(commentsIndexPath, 'utf-8');
          commentsIndex = JSON.parse(indexContent);
          
          if (!Array.isArray(commentsIndex.files)) {
            commentsIndex.files = [];
          }
        }
        
        // Add new entries
        let updatedCount = 0;
        for (const fileName of commentFiles) {
          if (!commentsIndex.files.includes(fileName)) {
            commentsIndex.files.push(fileName);
            updatedCount++;
            console.log(`    Added ${fileName} to comments index for ${postId}`);
          }
        }
        
        // Write updated index if we actually added anything
        if (updatedCount > 0) {
          console.log(`    Writing updated comments index with ${updatedCount} new entries`);
          // In the actual workflow, we'd commit this back to the repo
          console.log(`    Updated entries: ${JSON.stringify(commentsIndex.files.slice(-updatedCount))}`);
        } else {
          console.log('    No changes to comments index needed');
        }
      } catch (error) {
        console.error(`    Error updating comments index for ${postId}: ${error.message}`);
      }
    }
  } else {
    console.log('  No new comments to add to indexes');
  }
  
  console.log('\nTest completed.');
}

// Run the simulation
console.log("Running simulation with verbose output...");
simulateIndexUpdate().catch(err => {
  console.error("Error during simulation:", err);
});
