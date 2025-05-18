/**
 * Index page loader script
 * Handles loading posts and display on the index page
 * Uses the data_service.js to load data from the new file structure
 */

/**
 * Load and display all posts on the index page
 */
async function loadAndDisplayPosts() {
  try {
    // Status message to indicate we're loading
    const list = document.getElementById('postList');
    list.innerHTML = '<div class="text-center p-4"><div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div><p class="mt-2 text-gray-600">Loading posts...</p></div>';
    
    // Load all posts using the data service
    const posts = await loadAllPosts();
    
    // Apply category and search filters
    const category = document.getElementById('categorySelector')?.value || 'all';
    const query = document.getElementById('searchInput')?.value.toLowerCase() || '';
    
    let filteredPosts = posts.filter(post => post.status === 'approved');
    
    if (category !== 'all') {
      filteredPosts = filteredPosts.filter(p => p.category === category);
    }
    
    if (query) {
      filteredPosts = filteredPosts.filter(p => 
        p.title.toLowerCase().includes(query) || 
        p.body.toLowerCase().includes(query)
      );
    }
    
    // Sort posts based on the selected sort option
    const sortType = document.getElementById('sortSelector')?.value || 'newest';
    if (sortType === 'votes' || sortType === 'comments') {
      // Load vote and comment data for all filtered posts
      const votePromises = filteredPosts.map(post => loadVotes(post.id));
      const commentPromises = filteredPosts.map(post => loadComments(post.id));
      
      const votesData = await Promise.all(votePromises);
      const commentsData = await Promise.all(commentPromises);
      
      // Create lookup maps for efficient sorting
      const voteCountMap = {};
      const commentCountMap = {};
      
      filteredPosts.forEach((post, index) => {
        // Sum up and down votes
        const votes = votesData[index];
        voteCountMap[post.id] = (votes.up || 0) - (votes.down || 0);
        
        // Count comments
        commentCountMap[post.id] = commentsData[index].length || 0;
      });
      
      // Sort posts
      if (sortType === 'votes') {
        filteredPosts.sort((a, b) => voteCountMap[b.id] - voteCountMap[a.id]);
      } else if (sortType === 'comments') {
        filteredPosts.sort((a, b) => commentCountMap[b.id] - commentCountMap[a.id]);
      }
    } else {
      // Sort by date (newest first)
      filteredPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    // Update post count in the UI
    document.getElementById('postCount').innerText = `${filteredPosts.length} Reports`;
    
    // Display results
    displayFilteredPosts(filteredPosts);
  } catch (error) {
    console.error("Error loading posts:", error);
    
    // Try to use fallback data if available
    if (typeof getFallbackPosts === 'function') {
      console.log('Using fallback post data');
      const fallbackPosts = getFallbackPosts();
      
      // Display the fallback posts with a notice
      displayFilteredPosts(fallbackPosts);
      
      // Add a notice at the top of the list
      const notice = document.createElement('div');
      notice.className = 'bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4';
      notice.innerHTML = `
        <p class="text-yellow-700">
          <strong>Note:</strong> Using example content because post data couldn't be loaded.
        </p>
      `;
      document.getElementById('postList').prepend(notice);
    } else {
      // Show error message
      document.getElementById('postList').innerHTML = `
        <div class="bg-red-50 border-l-4 border-red-500 p-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-700 mb-2">
                Could not load posts. Please try again later.
              </p>
              <p class="text-xs text-gray-600">
                This could be due to network connectivity issues or server problems.
              </p>
              <button onclick="loadAndDisplayPosts()" class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs">
                Try Again
              </button>
            </div>
          </div>
        </div>
      `;
    }
    
    document.getElementById('postCount').innerText = '0 Reports';
  }
}

/**
 * Display the filtered posts
 * @param {Array} filteredPosts - Array of filtered posts to display
 */
async function displayFilteredPosts(filteredPosts) {
  const list = document.getElementById('postList');
  list.innerHTML = '';
  
  if (filteredPosts.length === 0) {
    list.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-8 text-center">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-gray-600 mb-6 text-lg">No reports found for this category or sort order.</p>
        <a href="submit.html" class="inline-block bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition transform hover:-translate-y-1">
          ✍️ Submit a Post
        </a>
      </div>`;
    return;
  }
  
  // Process each post
  for (const post of filteredPosts) {
    // Load vote data for this post
    const voteData = await loadVotes(post.id);
    const voteCount = (voteData.up || 0) - (voteData.down || 0);
    
    // Load comments for this post
    const comments = await loadComments(post.id);
    const commentCount = comments.length;
    
    // Check if post has an active petition
    const hasPetition = await checkPetition(post.id);
    
    // Format the date
    const dateObj = new Date(post.timestamp);
    const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
    const date = dateObj.toLocaleString('en-GB', options).replace(',', '');
    
    // Create the list item for this post
    const li = document.createElement('li');
    li.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow';
    
    li.innerHTML = `
      <div class="flex flex-col md:flex-row">
        ${post.imageUrl ?
        `<div class="md:w-1/4 flex-shrink-0">
            <img src="${post.imageUrl}" alt="Post thumbnail" class="h-full w-full object-cover md:h-40 md:w-full">
          </div>` : ''}
        <div class="flex-1 p-5">
          <div class="flex flex-wrap gap-2 mb-2">
            ${post.category ? `<span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">${post.category}</span>` : ''}
            ${hasPetition ? '<span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Petition Active</span>' : ''}
          </div>
          <a href='post.html?id=${post.id}' class='text-xl font-bold text-blue-800 hover:underline block mb-2'>${post.title}</a>
          <p class="text-gray-700 line-clamp-2 mb-3">${post.body}</p>
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-500">${date}</div>
            <div class="flex items-center space-x-3 text-sm">
              <span class="flex items-center"><svg class="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>${voteCount}</span>
              <span class="flex items-center"><svg class="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>${commentCount}</span>
            </div>
          </div>
        </div>
      </div>
    `;
    list.appendChild(li);
  }
}

// Initialize when the window loads
window.onload = () => {
  loadAndDisplayPosts();
  
  // Set up event listeners for filters and search
  document.getElementById('searchInput').addEventListener('input', () => {
    loadAndDisplayPosts();
  });
  document.getElementById('categorySelector').addEventListener('change', () => {
    loadAndDisplayPosts();
  });
  document.getElementById('sortSelector').addEventListener('change', () => {
    loadAndDisplayPosts();
  });
};
