// This script processes localStorage data submitted by users
// and updates the repository data files with the submitted content

const fs = require('fs');
const path = require('path');

async function main() {
  try {
    console.log('Starting localStorage data processing...');
    
    // Get the client payload data from the environment variable
    let clientPayload;
    
    try {
      if (process.env.CLIENT_PAYLOAD) {
        clientPayload = JSON.parse(process.env.CLIENT_PAYLOAD);
        console.log('Received client payload from GitHub Actions');
      } else {
        console.log('No client payload found, using test data');
        // Use test data for development/testing
        clientPayload = {
          localData: JSON.stringify({
            posts: [],
            comments: [],
            votes: []
          }),
          timestamp: new Date().toISOString(),
          userAgent: 'Test User Agent'
        };
      }
    } catch (parseError) {
      console.error('Error parsing client payload:', parseError);
      console.log('Using empty data as fallback');
      clientPayload = {
        localData: JSON.stringify({
          posts: [],
          comments: [],
          votes: []
        }),
        timestamp: new Date().toISOString()
      };
    }
    
    // Parse the localData from the payload
    let localData;
    try {
      localData = JSON.parse(clientPayload.localData);
      console.log(`Received data: ${localData.posts.length} posts, ${localData.comments.length} comments, ${localData.votes.length} votes`);
    } catch (error) {
      console.error('Error parsing localData:', error);
      localData = { posts: [], comments: [], votes: [] };
    }
    
    // 1. Load existing data files
    const dataDir = path.join(process.cwd(), 'data');
    
    // Ensure the data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('Created data directory');
    }
    
    // Load approved posts
    const approvedPostsPath = path.join(dataDir, 'approved.json');
    let approvedPosts = [];
    if (fs.existsSync(approvedPostsPath)) {
      approvedPosts = JSON.parse(fs.readFileSync(approvedPostsPath, 'utf8'));
      console.log(`Loaded ${approvedPosts.length} existing approved posts`);
    }
    
    // Load pending posts
    const pendingPostsPath = path.join(dataDir, 'pending.json');
    let pendingPosts = [];
    if (fs.existsSync(pendingPostsPath)) {
      pendingPosts = JSON.parse(fs.readFileSync(pendingPostsPath, 'utf8'));
      console.log(`Loaded ${pendingPosts.length} existing pending posts`);
    }
    
    // Load comments
    const commentsPath = path.join(dataDir, 'comments.json');
    let comments = {};
    if (fs.existsSync(commentsPath)) {
      comments = JSON.parse(fs.readFileSync(commentsPath, 'utf8'));
      console.log(`Loaded existing comments`);
    }
    
    // Load votes
    const votesPath = path.join(dataDir, 'votes.json');
    let votes = {};
    if (fs.existsSync(votesPath)) {
      votes = JSON.parse(fs.readFileSync(votesPath, 'utf8'));
      console.log(`Loaded existing votes`);
    }
    
    // 2. Process local storage data
    console.log('Processing localStorage data...');
    
    // Process new posts
    if (localData.posts && localData.posts.length > 0) {
      console.log(`Processing ${localData.posts.length} posts from localStorage`);
      
      // Add new posts to pending
      const newPosts = localData.posts.filter(post => {
        // Check if post already exists in approved or pending
        const existsInApproved = approvedPosts.some(p => p.id === post.id);
        const existsInPending = pendingPosts.some(p => p.id === post.id);
        return !existsInApproved && !existsInPending;
      });
      
      if (newPosts.length > 0) {
        pendingPosts = [...pendingPosts, ...newPosts];
        fs.writeFileSync(pendingPostsPath, JSON.stringify(pendingPosts, null, 2));
        console.log(`Added ${newPosts.length} new pending posts`);
      } else {
        console.log('No new posts to add');
      }
    }
    
    // Process new comments
    if (localData.comments && localData.comments.length > 0) {
      console.log(`Processing ${localData.comments.length} comments from localStorage`);
      
      // Group comments by postId
      localData.comments.forEach(comment => {
        if (!comment.postId) return;
        
        if (!comments[comment.postId]) {
          comments[comment.postId] = [];
        }
        
        // Check if comment already exists
        const exists = comments[comment.postId].some(c => c.id === comment.id);
        if (!exists) {
          comments[comment.postId].push(comment);
        }
      });
      
      fs.writeFileSync(commentsPath, JSON.stringify(comments, null, 2));
      console.log('Updated comments data file');
    }
    
    // Process new votes
    if (localData.votes && localData.votes.length > 0) {
      console.log(`Processing ${localData.votes.length} votes from localStorage`);
      
      // Group votes by postId
      localData.votes.forEach(vote => {
        if (!vote.postId) return;
        
        if (!votes[vote.postId]) {
          votes[vote.postId] = { up: 0, down: 0 };
        }
        
        // Increment the appropriate vote counter
        if (vote.type === 'up' || vote.type === 'upvote') {
          votes[vote.postId].up += 1;
        } else if (vote.type === 'down' || vote.type === 'downvote') {
          votes[vote.postId].down += 1;
        }
      });
      
      fs.writeFileSync(votesPath, JSON.stringify(votes, null, 2));
      console.log('Updated votes data file');
    }
    
    // Also update vote stats file for convenient access
    const voteStatsPath = path.join(dataDir, 'vote_stats.json');
    fs.writeFileSync(voteStatsPath, JSON.stringify(votes, null, 2));
    console.log('Updated vote stats data file');
    
    console.log('Data processing complete.');
    
  } catch (error) {
    console.error('Error processing localStorage data:', error);
    process.exit(1);
  }
}

main();
