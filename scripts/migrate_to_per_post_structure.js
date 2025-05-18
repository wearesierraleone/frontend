/**
 * Migration Script for We Are Sierra Leone Platform
 * 
 * This script migrates data from the old single aggregated files structure
 * to the new per-post file structure.
 * 
 * Old structure:
 * - /data/approved.json
 * - /data/pending.json
 * - /data/comments.json
 * - /data/votes.json
 * - /data/vote_stats.json
 * - /data/petitions.json
 * 
 * New structure:
 * - /data/posts/post-123.json
 * - /data/comments/post-123/comment-456.json
 * - /data/votes/post-123.json
 * - /data/upvotes/post-123.json
 * - /data/downvotes/post-123.json
 * - /data/petitions/post-123.json
 * - /data/reports/report-xxx.json
 * - /data/signatures/post-123.json
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// Base directory for data files
const DATA_DIR = path.join(__dirname, '..', 'data');

// Directory paths for new structure
const DIRS = {
  posts: path.join(DATA_DIR, 'posts'),
  comments: path.join(DATA_DIR, 'comments'),
  votes: path.join(DATA_DIR, 'votes'),
  upvotes: path.join(DATA_DIR, 'upvotes'),
  downvotes: path.join(DATA_DIR, 'downvotes'),
  petitions: path.join(DATA_DIR, 'petitions'),
  signatures: path.join(DATA_DIR, 'signatures'),
  reports: path.join(DATA_DIR, 'reports')
};

// Create directories if they don't exist
async function createDirectories() {
  console.log('Creating directories for new structure...');
  
  for (const dir of Object.values(DIRS)) {
    try {
      await mkdir(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.error(`Error creating directory ${dir}:`, error);
        throw error;
      }
    }
  }
}

// Load data from a JSON file
async function loadJsonFile(filePath) {
  try {
    const data = await readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`File not found: ${filePath}, returning empty object`);
      return {};
    }
    console.error(`Error reading ${filePath}:`, error);
    throw error;
  }
}

// Save data to a JSON file
async function saveJsonFile(filePath, data) {
  try {
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Saved: ${filePath}`);
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    throw error;
  }
}

// Migrate posts (approved.json and pending.json)
async function migratePosts() {
  console.log('Migrating posts...');
  
  // Load approved posts
  const approvedPosts = await loadJsonFile(path.join(DATA_DIR, 'approved.json'));
  
  // Load pending posts
  const pendingPosts = await loadJsonFile(path.join(DATA_DIR, 'pending.json'));
  
  // Create a post index
  const postIndex = { files: [] };
  
  // Process approved posts
  for (const post of approvedPosts) {
    const postId = post.id;
    const postFileName = `post-${postId}.json`;
    
    // Save post to individual file
    await saveJsonFile(path.join(DIRS.posts, postFileName), post);
    
    // Add to index
    postIndex.files.push(postFileName);
  }
  
  // Process pending posts
  for (const post of pendingPosts) {
    const postId = post.id;
    const postFileName = `post-${postId}.json`;
    
    // Save post to individual file
    await saveJsonFile(path.join(DIRS.posts, postFileName), post);
    
    // We don't add pending posts to the index as they shouldn't be publicly accessible
  }
  
  // Save the post index
  await saveJsonFile(path.join(DIRS.posts, 'index.json'), postIndex);
}

// Migrate comments
async function migrateComments() {
  console.log('Migrating comments...');
  
  // Load comments
  const commentsData = await loadJsonFile(path.join(DATA_DIR, 'comments.json'));
  
  // Process comments for each post
  for (const [postId, comments] of Object.entries(commentsData)) {
    // Create directory for this post's comments
    const postCommentsDir = path.join(DIRS.comments, postId);
    await mkdir(postCommentsDir, { recursive: true });
    
    // Create a comment index
    const commentIndex = { files: [] };
    
    // Process each comment
    if (Array.isArray(comments)) {
      for (const comment of comments) {
        const commentId = comment.id;
        const commentFileName = `comment-${commentId}.json`;
        
        // Save comment to individual file
        await saveJsonFile(path.join(postCommentsDir, commentFileName), comment);
        
        // Add to index
        commentIndex.files.push(commentFileName);
      }
    }
    
    // Save all comments for this post in a single file too (for backward compatibility)
    await saveJsonFile(path.join(DIRS.comments, `${postId}.json`), comments || []);
    
    // Save the comment index
    await saveJsonFile(path.join(postCommentsDir, 'index.json'), commentIndex);
  }
}

// Migrate votes
async function migrateVotes() {
  console.log('Migrating votes...');
  
  // Load votes
  const votesData = await loadJsonFile(path.join(DATA_DIR, 'votes.json'));
  const voteStats = await loadJsonFile(path.join(DATA_DIR, 'vote_stats.json'));
  
  // Process votes for each post
  for (const [postId, votes] of Object.entries(votesData)) {
    // Create combined votes file
    await saveJsonFile(path.join(DIRS.votes, `${postId}.json`), votes);
    
    // Check if we have upvotes/downvotes in vote_stats
    if (voteStats[postId]) {
      // Create separate upvotes and downvotes files
      await saveJsonFile(path.join(DIRS.upvotes, `${postId}.json`), {
        count: voteStats[postId].upvotes || 0
      });
      
      await saveJsonFile(path.join(DIRS.downvotes, `${postId}.json`), {
        count: voteStats[postId].downvotes || 0
      });
    } else if (votes && typeof votes === 'object') {
      // Create separate upvotes and downvotes files from votes object
      await saveJsonFile(path.join(DIRS.upvotes, `${postId}.json`), {
        count: votes.up || 0
      });
      
      await saveJsonFile(path.join(DIRS.downvotes, `${postId}.json`), {
        count: votes.down || 0
      });
    }
  }
}

// Migrate petitions
async function migratePetitions() {
  console.log('Migrating petitions...');
  
  // Load petitions
  const petitionsData = await loadJsonFile(path.join(DATA_DIR, 'petitions.json'));
  
  // Process each petition
  for (const [postId, petition] of Object.entries(petitionsData)) {
    // Save petition to individual file
    await saveJsonFile(path.join(DIRS.petitions, `${postId}.json`), petition);
    
    // If the petition has signatures, create a signatures file
    if (petition.signatures && Array.isArray(petition.signatures)) {
      await saveJsonFile(path.join(DIRS.signatures, `${postId}.json`), petition.signatures);
    }
  }
}

// Main migration function
async function migrate() {
  try {
    console.log('Starting migration to per-post file structure...');
    
    // Create all necessary directories
    await createDirectories();
    
    // Migrate data
    await migratePosts();
    await migrateComments();
    await migrateVotes();
    await migratePetitions();
    
    console.log('Migration completed successfully!');
    console.log('\nYou should now update your application code to use the new structure.');
    console.log('The old files have been preserved for backward compatibility.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrate();
