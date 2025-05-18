/**
 * Post detail page loader
 * Uses the new data_service.js for loading post data, comments, votes, and petitions
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Start loading data as soon as possible
  loadPostDetails();
  
  // Set up event handlers for the vote buttons
  setupVoteHandlers();
  
  // Set up other UI interactions
  setupUIHandlers();
  
  // Set up comment form submission
  setupCommentForm();
});

/**
 * Main function to load all post details
 */
async function loadPostDetails() {
  const postId = new URLSearchParams(window.location.search).get('id');
  if (!postId) {
    showNotFoundError();
    return;
  }
  
  try {
    // Show loading state
    const postContent = document.getElementById('postContent');
    if (postContent) {
      postContent.innerHTML = `
        <div class="bg-white shadow-lg rounded-lg p-8 text-center">
          <div class="flex justify-center mb-4">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
          <p class="text-gray-600">Loading post details...</p>
        </div>
      `;
    }
    
    // Load the post data
    const post = await loadPost(postId);
    
    if (!post) {
      showNotFoundError();
      return;
    }
    
    // Render the post content
    renderPostDetails(post);
    
    // Load and display vote statistics
    const voteData = await loadVotes(postId);
    updateVoteUI(voteData);
    
    // Check if user has already voted
    const voteKey = `voted-${postId}`;
    if (localStorage.getItem(voteKey) === 'true') {
      disableVoteButtons();
    }
    
    // Check if this post can be or already is a petition
    checkPetitionStatus(postId, voteData);
    
    // Load comments in the background
    loadPostComments(postId);
    
  } catch (error) {
    console.error('Error loading post details:', error);
    showErrorMessage('Failed to load post details. Please try refreshing the page.');
  }
}

/**
 * Render the post details in the UI
 * @param {object} post - The post data
 */
function renderPostDetails(post) {
  // Reset the post content area
  const postContent = document.getElementById('postContent');
  postContent.innerHTML = `
    <div class="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
      <div id="imageWrap" class="w-full"></div>
      <div class="p-6">
        <div id="meta" class="flex flex-wrap gap-2 mb-3"></div>
        <h1 id="title" class="text-3xl font-bold text-gray-800 mb-4">${post.title}</h1>
        <p id="body" class="text-gray-700 text-lg leading-relaxed mb-6">${post.body}</p>
        <div class="border-t border-b py-4 mb-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button id="upvoteBtn" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors disabled:opacity-50 disabled:hover:bg-green-600">
                <svg class="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                </svg>
                Upvote
              </button>
              <button id="downvoteBtn" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors disabled:opacity-50 disabled:hover:bg-red-600">
                <svg class="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
                Downvote
              </button>
            </div>
            <div id="voteStats" class="text-gray-600 font-medium"></div>
          </div>
        </div>
      </div>
    </div>
    
    <div id="convertPetitionWrap" class="my-6 hidden">
      <button id="convertToPetition" class="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg flex items-center transition-colors shadow-md">
        <svg class="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Convert to Petition
      </button>
      <p class="text-sm text-gray-500 mt-2">This post has enough votes to become a petition. Converting means people can sign it to show support.</p>
    </div>
    
    <div class="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-800 flex items-center">
            <svg class="w-6 h-6 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            Comments <span class="text-gray-500 font-normal">(<span id="commentCount">0</span>)</span>
          </h2>
        </div>
        <ul id="commentList" class="space-y-4 mb-6">
          <div class="text-center py-4">
            <span class="inline-block animate-spin mr-2">⏳</span> Loading comments...
          </div>
        </ul>
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 class="text-lg font-medium text-gray-700 mb-3">Add your comment</h3>
          <form id="commentForm" class="space-y-4">
            <div class="relative">
              <textarea name="comment" placeholder="What are your thoughts on this issue?" required class="w-full border border-gray-300 p-4 rounded-lg h-28 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"></textarea>
            </div>
            <div class="flex justify-end">
              <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center transition-colors">
                <svg class="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Post Comment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <div class="bg-gray-100 rounded-lg p-6 mb-8">
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div class="flex items-center space-x-2">
          <a href="index.html" class="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center shadow-sm">
            <svg class="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </a>
          
          <a href="#" id="reportLink" class="text-red-600 hover:text-red-700 font-medium transition-colors flex items-center">
            <svg class="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Report Post
          </a>
        </div>

        <div class="bg-white rounded-lg px-4 py-3 border border-gray-200 shadow-sm">
          <div class="flex items-center">
            <span class="font-medium text-gray-700 mr-3">Share:</span>
            <div class="flex space-x-3">
              <a id="twitterShare" target="_blank" class="text-blue-500 hover:text-blue-600 transition-colors p-1" title="Share on Twitter">
                <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              <a id="whatsappShare" target="_blank" class="text-green-500 hover:text-green-600 transition-colors p-1" title="Share on WhatsApp">
                <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
              <button id="copyLink" class="text-blue-500 hover:text-blue-600 transition-colors p-1" title="Copy link">
                <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add image if available
  if (post.imageUrl) {
    const img = document.createElement('img');
    img.src = post.imageUrl;
    img.alt = "Post image";
    img.className = "rounded w-full max-h-96 object-cover mb-4";
    document.getElementById('imageWrap').appendChild(img);
  }

  // Format and add metadata
  const dateObj = new Date(post.timestamp);
  const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
  const formattedDate = dateObj.toLocaleString('en-GB', options).replace(',', '');
  const category = post.category ? `<span class="bg-gray-200 px-2 py-1 rounded text-xs text-gray-700">${post.category}</span>` : '';
  document.getElementById('meta').innerHTML = `${category} <span class="ml-2">${formattedDate}</span>`;

  // Add status indicator for moderators (visible only for moderators and admins)
  if (post.status) {
    const statusElement = document.createElement('div');
    statusElement.className = `text-sm ${post.status === 'approved' ? 'text-green-600' : 'text-yellow-600'} font-medium mt-2`;
    statusElement.innerHTML = `Status: ${post.status.toUpperCase()}`;
    document.getElementById('title').parentNode.insertBefore(statusElement, document.getElementById('body'));
  }

  // Update the page title and meta tags
  document.getElementById('pageTitle').innerText = `${post.title} | We Are Sierra Leone`;
  document.querySelector('meta[property="og:title"]').setAttribute('content', post.title);
  document.querySelector('meta[property="og:description"]').setAttribute('content', post.body.substring(0, 150) + '...');

  // Set up share links
  const twitterURL = `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`;
  const whatsappURL = `https://wa.me/?text=${encodeURIComponent(post.title + ' ' + window.location.href)}`;
  document.getElementById('twitterShare').href = twitterURL;
  document.getElementById('whatsappShare').href = whatsappURL;
  
  // Set up event handlers (will be done in setupUIHandlers function)
}

/**
 * Update the vote UI with the vote data
 * @param {object} voteData - The vote data { up: number, down: number }
 */
function updateVoteUI(voteData) {
  const voteStats = document.getElementById('voteStats');
  if (!voteStats) return;
  
  const upvotes = voteData?.up || 0;
  const downvotes = voteData?.down || 0;
  
  voteStats.innerHTML = `
    <div class="flex items-center space-x-3">
      <span class="flex items-center">
        <svg class="w-4 h-4 text-green-600 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
        </svg>
        <span id="voteCount">${upvotes}</span>
      </span>
      <span class="flex items-center">
        <svg class="w-4 h-4 text-red-600 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
        <span>${downvotes}</span>
      </span>
    </div>
  `;
}

/**
 * Load and display comments for a post
 * @param {string} postId - The ID of the post
 */
async function loadPostComments(postId) {
  try {
    const comments = await loadComments(postId);
    
    const commentList = document.getElementById('commentList');
    if (!commentList) return;
    
    // Clear the loading indicator
    commentList.innerHTML = '';
    
    // Update the comment count - add replies to the count
    const commentCount = document.getElementById('commentCount');
    if (commentCount) {
      let totalCount = comments.length;
      
      // Count replies recursively
      const countReplies = (items) => {
        let count = 0;
        if (!items) return count;
        
        items.forEach(item => {
          if (item.replies && item.replies.length > 0) {
            count += item.replies.length;
            count += countReplies(item.replies);
          }
        });
        return count;
      };
      
      totalCount += countReplies(comments);
      commentCount.innerText = totalCount.toString();
    }
    
    // Display "no comments" message if there are no comments
    if (!comments || comments.length === 0) {
      const noCommentsEl = document.createElement('div');
      noCommentsEl.className = 'bg-white rounded-lg shadow-sm p-8 text-center';
      noCommentsEl.innerHTML = `
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p class="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
      `;
      commentList.appendChild(noCommentsEl);
      return;
    }
    
    // Sort comments by timestamp (newest first)
    const sortedComments = [...comments].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    // Display the comments
    sortedComments.forEach(comment => {
      if (comment.status === 'rejected') return; // Skip rejected comments
      
      const li = document.createElement('li');
      li.className = "bg-white border border-gray-100 p-4 rounded-lg shadow-sm mb-4";
      li.id = `comment-${comment.id}`;
      
      // Format the date
      const date = new Date(comment.timestamp);
      const dateStr = date.toLocaleString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).replace(',', '');
      
      // Create the comment HTML
      li.innerHTML = `
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center">
            <div class="bg-blue-100 text-blue-700 rounded-full p-2 mr-3">
              <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <strong class="font-medium text-gray-800">${comment.anonId || 'Anonymous'}</strong>
          </div>
          <span class="text-gray-500 text-sm">${dateStr}</span>
        </div>
        <div class="pl-10 text-gray-700 leading-relaxed mb-2">${escapeHtml(comment.text)}</div>
        <div class="pl-10 flex justify-between items-center text-sm">
          <div class="flex space-x-4">
            <button class="text-blue-600 hover:text-blue-800 flex items-center text-xs" onclick="showReplyForm('${comment.id}')">
              <svg class="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Reply
            </button>
            
            <button class="text-gray-500 hover:text-orange-600 flex items-center text-xs" onclick="flagComment('${postId}', '${comment.id}')">
              <svg class="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
              </svg>
              Flag
            </button>
          </div>
          ${comment.status === 'flagged' ? '<span class="text-orange-600">This comment has been flagged for review</span>' : ''}
        </div>
        
        <!-- Reply Form -->
        <div id="reply-form-${comment.id}" class="mt-3 pl-10 hidden">
          <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <textarea 
              id="reply-text-${comment.id}" 
              class="w-full border border-gray-300 p-2 rounded-md text-sm" 
              rows="2" 
              placeholder="Write your reply..."
            ></textarea>
            <div class="flex justify-end mt-2 space-x-2">
              <button class="px-2 py-1 text-xs text-gray-600 hover:text-gray-800" onclick="hideReplyForm('${comment.id}')">Cancel</button>
              <button class="px-4 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700" onclick="submitReply('${postId}', '${comment.id}')">Reply</button>
            </div>
          </div>
        </div>
        
        <!-- Replies Section -->
        ${comment.replies && comment.replies.length > 0 ? 
          `<div id="replies-${comment.id}" class="mt-3 pl-8">
            ${renderReplies(comment, postId)}
           </div>` 
          : ''}
      `;
      
      commentList.appendChild(li);
    });
  } catch (error) {
    console.error('Error loading comments:', error);
    const commentList = document.getElementById('commentList');
    if (commentList) {
      commentList.innerHTML = '<div class="text-red-500 p-4">Failed to load comments. Please try refreshing the page.</div>';
    }
  }
}

/**
 * Check if a post can be or already is a petition
 * @param {string} postId - The ID of the post
 * @param {object} voteData - The vote data { up: number, down: number }
 */
async function checkPetitionStatus(postId, voteData) {
  const upvotes = voteData?.up || 0;
  
  try {
    // Check if this post already has a petition
    const hasPetition = await checkPetition(postId);
    
    // Show the button if has enough votes or already has a petition
    if ((upvotes >= 10) || hasPetition) {
      const petitionWrap = document.getElementById('convertPetitionWrap');
      const convertBtn = document.getElementById('convertToPetition');
      const helpText = convertBtn.nextElementSibling;
      
      if (hasPetition) {
        // Update button to "Go to Petition" if petition exists
        convertBtn.innerHTML = `
          <svg class="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          Go to Petition
        `;
        convertBtn.classList.replace('bg-yellow-500', 'bg-blue-500');
        convertBtn.classList.replace('hover:bg-yellow-600', 'hover:bg-blue-600');
        
        // Update the help text
        helpText.textContent = "This post has been converted to a petition. Click to view and sign it.";
      }
      
      petitionWrap.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error checking petition status:', error);
  }
}

/**
 * Set up event handlers for the vote buttons
 */
function setupVoteHandlers() {
  const postId = new URLSearchParams(window.location.search).get('id');
  if (!postId) return;
  
  // Upvote button handler
  const upvoteBtn = document.getElementById('upvoteBtn');
  if (upvoteBtn) {
    upvoteBtn.addEventListener('click', async () => {
      const downvoteBtn = document.getElementById('downvoteBtn');
      
      // Disable both buttons to prevent double clicks
      upvoteBtn.disabled = true;
      downvoteBtn.disabled = true;
      
      // Show loading state
      const originalUpvoteHtml = upvoteBtn.innerHTML;
      upvoteBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Voting...</span>
      `;
      
      try {
        // Submit the vote using the data service
        const success = await submitVote(postId, 'up');
        
        if (success) {
          // Mark as voted in localStorage
          localStorage.setItem(`voted-${postId}`, 'true');
          
          // Update button state
          upvoteBtn.innerHTML = `
            <svg class="w-5 h-5 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
            <span>Voted</span>
          `;
          upvoteBtn.classList.add('bg-green-700');
          upvoteBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
          
          // Keep both buttons disabled
          upvoteBtn.disabled = true;
          downvoteBtn.disabled = true;
          
          // Update vote count in the UI
          const voteCountElement = document.getElementById('voteCount');
          if (voteCountElement) {
            const currentCount = parseInt(voteCountElement.textContent || '0', 10);
            voteCountElement.textContent = (currentCount + 1).toString();
          }
        } else {
          throw new Error('Vote submission failed');
        }
      } catch (error) {
        console.error('Error submitting vote:', error);
        
        // Reset button state on error
        upvoteBtn.innerHTML = originalUpvoteHtml;
        upvoteBtn.disabled = false;
        downvoteBtn.disabled = false;
        
        // Show error message
        showSuccessModal('Failed to save your vote. Please try again.', null, 0, 'error');
      }
    });
  }
  
  // Downvote button handler
  const downvoteBtn = document.getElementById('downvoteBtn');
  if (downvoteBtn) {
    downvoteBtn.addEventListener('click', async () => {
      // Similar implementation as upvote button...
      const upvoteBtn = document.getElementById('upvoteBtn');
      
      // Disable both buttons to prevent double clicks
      upvoteBtn.disabled = true;
      downvoteBtn.disabled = true;
      
      // Show loading state
      const originalDownvoteHtml = downvoteBtn.innerHTML;
      downvoteBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Voting...</span>
      `;
      
      try {
        // Submit the vote using the data service
        const success = await submitVote(postId, 'down');
        
        if (success) {
          // Mark as voted in localStorage
          localStorage.setItem(`voted-${postId}`, 'true');
          
          // Update button state
          downvoteBtn.innerHTML = `
            <svg class="w-5 h-5 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span>Voted</span>
          `;
          downvoteBtn.classList.add('bg-red-700');
          downvoteBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
          
          // Keep both buttons disabled
          upvoteBtn.disabled = true;
          downvoteBtn.disabled = true;
        } else {
          throw new Error('Vote submission failed');
        }
      } catch (error) {
        console.error('Error submitting vote:', error);
        
        // Reset button state on error
        downvoteBtn.innerHTML = originalDownvoteHtml;
        upvoteBtn.disabled = false;
        downvoteBtn.disabled = false;
        
        // Show error message
        showSuccessModal('Failed to save your vote. Please try again.', null, 0, 'error');
      }
    });
  }
}

/**
 * Set up other UI interaction handlers
 */
function setupUIHandlers() {
  const postId = new URLSearchParams(window.location.search).get('id');
  if (!postId) return;
  
  // Convert to petition button
  document.addEventListener('click', event => {
    const target = event.target;
    
    // Find if the click was on the convert button or any of its children
    const convertBtn = target.closest('#convertToPetition');
    if (convertBtn) {
      handleConvertToPetition(postId, convertBtn);
    }
    
    // Copy link button
    const copyLinkBtn = target.closest('#copyLink');
    if (copyLinkBtn) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        // Create a temporary toast notification
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300';
        toast.innerText = 'Link copied to clipboard';
        document.body.appendChild(toast);

        // Remove the toast after 2 seconds
        setTimeout(() => {
          toast.style.opacity = '0';
          setTimeout(() => {
            document.body.removeChild(toast);
          }, 300);
        }, 2000);
      });
    }
    
    // Report link handler
    const reportLink = target.closest('#reportLink');
    if (reportLink) {
      event.preventDefault();
      showReportModal(postId);
    }
  });
}

/**
 * Handle conversion to petition
 * @param {string} postId - The ID of the post
 * @param {HTMLElement} convertBtn - The convert button element
 */
async function handleConvertToPetition(postId, convertBtn) {
  try {
    // Check if petition already exists
    const hasPetition = await checkPetition(postId);
    
    if (hasPetition) {
      // If petition exists, navigate to it
      window.location.href = `petition.html?id=${postId}`;
      return;
    }
    
    // Show loading state
    convertBtn.disabled = true;
    const originalHtml = convertBtn.innerHTML;
    convertBtn.innerHTML = `
      <svg class="animate-spin mr-2 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Processing...
    `;
    
    // Create a new petition
    // In a real implementation, this would call a function to create a petition
    // For now, we'll just simulate a successful creation
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    
    // TODO: Add actual petition creation logic here 
    // This would be handled via data_service.js
    
    // For demo purposes, we'll just redirect with a delay
    setTimeout(() => {
      window.location.href = `petition.html?id=${postId}`;
    }, 1000);
    
  } catch (error) {
    console.error('Error converting to petition:', error);
    convertBtn.disabled = false;
    convertBtn.innerHTML = originalHtml;
    showSuccessModal('Failed to create petition.', 'Please try again later.', 0, 'error');
  }
}

/**
 * Show the report modal dialog
 * @param {string} postId - The ID of the post
 */
function showReportModal(postId) {
  // Create modal element
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 shadow-xl max-w-md w-full m-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-gray-800">Report this post</h3>
        <button id="closeReportModal" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <p class="text-gray-600 mb-4">Please select a reason for reporting this post:</p>
      <form id="reportForm" class="space-y-4">
        <div class="space-y-2">
          <label class="flex items-center">
            <input type="radio" name="reportReason" value="misinformation" class="mr-2">
            <span>Misinformation</span>
          </label>
          <label class="flex items-center">
            <input type="radio" name="reportReason" value="hate_speech" class="mr-2">
            <span>Hate speech or harassment</span>
          </label>
          <label class="flex items-center">
            <input type="radio" name="reportReason" value="violence" class="mr-2">
            <span>Violence or dangerous content</span>
          </label>
          <label class="flex items-center">
            <input type="radio" name="reportReason" value="spam" class="mr-2">
            <span>Spam or misleading</span>
          </label>
          <label class="flex items-center">
            <input type="radio" name="reportReason" value="other" class="mr-2">
            <span>Other</span>
          </label>
        </div>
        <div id="otherReasonContainer" class="hidden">
          <textarea 
            id="otherReason" 
            placeholder="Please describe the issue..." 
            class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          ></textarea>
        </div>
        <div class="flex justify-end gap-3">
          <button type="button" id="cancelReport" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
          <button type="submit" id="submitReport" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Report Post</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close modal handlers
  const closeModal = () => document.body.removeChild(modal);
  document.getElementById('closeReportModal').addEventListener('click', closeModal);
  document.getElementById('cancelReport').addEventListener('click', closeModal);
  
  // Toggle "other" reason text area
  const radioButtons = document.querySelectorAll('input[name="reportReason"]');
  radioButtons.forEach(radio => {
    radio.addEventListener('change', () => {
      const otherContainer = document.getElementById('otherReasonContainer');
      otherContainer.classList.toggle('hidden', radio.value !== 'other');
    });
  });
  
  // Handle form submission
  document.getElementById('reportForm').addEventListener('submit', async event => {
    event.preventDefault();
    
    const selectedReason = document.querySelector('input[name="reportReason"]:checked');
    if (!selectedReason) {
      alert('Please select a reason for reporting.');
      return;
    }
    
    let reason = selectedReason.value;
    if (reason === 'other') {
      const otherText = document.getElementById('otherReason').value.trim();
      if (!otherText) {
        alert('Please provide details for your report.');
        return;
      }
      reason += ': ' + otherText;
    }
    
    // Get anonymous ID from localStorage or generate a new one
    const anonId = localStorage.getItem('anonId') || 'anon-' + Math.floor(Math.random() * 99999);
    localStorage.setItem('anonId', anonId);
    
    // Create report object
    const report = {
      postId,
      reporter: anonId,
      timestamp: new Date().toISOString(),
      reason: reason
    };
    
    try {
      // Submit the report using the data service
      const success = await submitReport(report);
      
      if (success) {
        closeModal();
        showSuccessModal('Report submitted successfully', 'Thank you for helping keep our community safe. A moderator will review this report.', undefined, 'success');
      } else {
        throw new Error('Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      showSuccessModal('Error submitting report', 'Please try again later or contact support if the problem persists.', undefined, 'error');
    }
  });
}

/**
 * Show a 404 not found error
 */
function showNotFoundError() {
  document.getElementById('postContent').classList.add('hidden');
  document.getElementById('notFoundError').classList.remove('hidden');
}

/**
 * Show an error message in the post content area
 * @param {string} message - The error message to show
 */
function showErrorMessage(message) {
  const postContent = document.getElementById('postContent');
  if (!postContent) return;
  
  postContent.innerHTML = `
    <div class="bg-red-50 shadow-lg rounded-lg overflow-hidden p-8 text-center">
      <div class="flex flex-col items-center">
        <div class="bg-red-100 p-4 rounded-full mb-4">
          <svg class="w-12 h-12 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-red-600 mb-2">Error</h2>
        <p class="text-gray-600 mb-6">${message}</p>
        <button onclick="location.reload()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center transition-colors">
          <svg class="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Page
        </button>
      </div>
    </div>
  `;
}

/**
 * Disable both vote buttons
 */
function disableVoteButtons() {
  const upvoteBtn = document.getElementById('upvoteBtn');
  const downvoteBtn = document.getElementById('downvoteBtn');
  
  if (upvoteBtn) {
    upvoteBtn.disabled = true;
    upvoteBtn.classList.add('cursor-not-allowed', 'opacity-50');
    upvoteBtn.innerText = 'Voted';
  }
  
  if (downvoteBtn) {
    downvoteBtn.disabled = true;
    downvoteBtn.classList.add('cursor-not-allowed', 'opacity-50');
  }
}

// Note: The flagComment function is now handled by reply-handler.js
// We don't need to expose it to the global scope as it's already done in reply-handler.js

/**
 * Set up the main comment form submission
 */
function setupCommentForm() {
  const postId = new URLSearchParams(window.location.search).get('id');
  if (!postId) return;
  
  const commentForm = document.getElementById('commentForm');
  if (!commentForm) return;
  
  commentForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    // Get the comment text
    const textarea = commentForm.querySelector('textarea');
    if (!textarea || !textarea.value.trim()) {
      console.log('Comment text is empty');
      return;
    }
    
    const commentText = textarea.value.trim();
    
    // Disable the submit button to prevent double submission
    const submitBtn = commentForm.querySelector('button[type="submit"]');
    const originalButtonHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Posting...
    `;
    
    try {
      // Get anonymous ID from localStorage or generate a new one
      const anonId = localStorage.getItem('anonId') || 'anon-' + Math.floor(Math.random() * 99999);
      localStorage.setItem('anonId', anonId);
      
      // Create the comment object
      const comment = {
        id: 'comment-' + Date.now(),
        postId: postId,
        anonId: anonId,
        text: commentText,
        timestamp: new Date().toISOString(),
        status: 'approved',
        replies: []
      };
      
      // Submit the comment
      const success = await submitComment({
        postId: postId,
        comment: comment,
        action: 'add'
      });
      
      if (success) {
        // Clear the form
        textarea.value = '';
        
        // Refresh the comments section
        loadPostComments(postId);
      } else {
        throw new Error('Failed to submit comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      // Re-enable the submit button
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalButtonHTML;
    }
  });
}

/**
 * Helper function to escape HTML to prevent XSS
 * @param {string} unsafe - The unsafe string
 * @returns {string} - The escaped string
 */
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
