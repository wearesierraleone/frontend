/**
 * Petition page loader script
 * Handles loading petitions and display on the petitions page
 * Uses the data_service.js to load data from the new file structure
 */

// Global variables for filtering and sorting
let currentFilter = 'all';
let currentSort = 'latest';
let searchTerm = '';

/**
 * Load all petition data and display on the page
 */
async function loadAndDisplayPetitions() {
  try {
    // Show loading state
    document.getElementById('petitionList').innerHTML = `
      <li class="bg-white border border-gray-200 rounded-lg p-5 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p class="text-gray-600">Loading petitions...</p>
      </li>
    `;

    // Step 1: Load all posts
    const posts = await loadAllPosts();

    // Step 2: For each post, check if it has a petition
    const petitionPostPromises = posts.map(async post => {
      const hasPetition = await checkPetition(post.id);
      if (hasPetition) {
        // Load the petition data
        const petitionResponse = await fetchWithTimeout(getDataUrl(`/data/petitions/${post.id}.json`));
        const petitionData = petitionResponse.ok ? await petitionResponse.json() : null;
        
        // If petition data was loaded, bundle it with the post
        if (petitionData) {
          return {
            post,
            petition: petitionData
          };
        }
      }
      return null;
    });

    // Wait for all petition checks to complete
    const petitionResults = await Promise.all(petitionPostPromises);
    
    // Filter out null results (posts without petitions)
    const petitionPosts = petitionResults.filter(result => result !== null);
    
    // Now process and display the petitions
    processPetitions(petitionPosts, posts);
  } catch (error) {
    console.error("Error loading petitions:", error);
    document.getElementById('petitionList').innerHTML = `
      <li class="bg-red-50 border-l-4 border-red-500 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700">
              Could not load petitions. Please try again later.
            </p>
            <button onclick="loadAndDisplayPetitions()" class="mt-2 text-sm text-blue-600 hover:text-blue-800">
              Try Again
            </button>
          </div>
        </div>
      </li>
    `;

    // Set petition count to 0
    document.getElementById('petitionCount').textContent = '0 petitions';
  }
}

/**
 * Process and display petitions with filtering and sorting
 * @param {Array} petitionPosts - Array of posts with petitions
 * @param {Array} allPosts - Array of all posts (for reference)
 */
async function processPetitions(petitionPosts, allPosts) {
  // Apply search filter
  let filteredPetitions = petitionPosts;
  
  if (searchTerm) {
    const lowerSearchTerm = searchTerm.toLowerCase();
    filteredPetitions = filteredPetitions.filter(item => 
      item.post.title.toLowerCase().includes(lowerSearchTerm) || 
      item.post.body.toLowerCase().includes(lowerSearchTerm) ||
      (item.post.category && item.post.category.toLowerCase().includes(lowerSearchTerm))
    );
  }
  
  // Apply state filter
  if (currentFilter !== 'all') {
    filteredPetitions = filteredPetitions.filter(item => 
      item.petition.state === currentFilter
    );
  }
  
  // Sort petitions
  filteredPetitions = sortPetitions(filteredPetitions);
  
  // Update petition count
  document.getElementById('petitionCount').textContent = `Found ${filteredPetitions.length} petition${filteredPetitions.length === 1 ? '' : 's'}`;
  
  // Display petitions
  displayPetitions(filteredPetitions);
}

/**
 * Sort petitions based on the current sort option
 * @param {Array} petitions - Array of petition objects
 * @returns {Array} Sorted petitions
 */
function sortPetitions(petitions) {
  switch(currentSort) {
    case 'latest':
      return petitions.sort((a, b) => new Date(b.post.timestamp) - new Date(a.post.timestamp));
    
    case 'signatures':
      return petitions.sort((a, b) => {
        const sigA = a.petition.signatures?.length || 0;
        const sigB = b.petition.signatures?.length || 0;
        return sigB - sigA;
      });
    
    case 'deadline':
      const now = new Date();
      return petitions.sort((a, b) => {
        const deadlineA = a.petition.deadline ? new Date(a.petition.deadline) : null;
        const deadlineB = b.petition.deadline ? new Date(b.petition.deadline) : null;
        
        // Petitions without deadline go at the end
        if (!deadlineA && !deadlineB) return 0;
        if (!deadlineA) return 1;
        if (!deadlineB) return -1;
        
        // Expired deadlines go at the end
        const aExpired = now > deadlineA;
        const bExpired = now > deadlineB;
        if (aExpired && !bExpired) return 1;
        if (!aExpired && bExpired) return -1;
        if (aExpired && bExpired) return 0;
        
        // Sort by closest deadline first
        return deadlineA - deadlineB;
      });
      
    default:
      return petitions;
  }
}

/**
 * Display petitions in the UI
 * @param {Array} petitions - Array of filtered and sorted petitions
 */
async function displayPetitions(petitions) {
  const list = document.getElementById('petitionList');
  const noResults = document.getElementById('noResults');
  
  list.innerHTML = '';
  
  // Show no results message if needed
  if (petitions.length === 0) {
    list.innerHTML = '';
    noResults.classList.remove('hidden');
    return;
  } else {
    noResults.classList.add('hidden');
  }
  
  // Load votes for all petition posts
  const votePromises = petitions.map(item => loadVotes(item.post.id));
  const votesData = await Promise.all(votePromises);
  
  // Load signatures for all petition posts
  const signaturePromises = petitions.map(item => loadSignatures(item.post.id));
  const signaturesData = await Promise.all(signaturePromises);
  
  // Render each petition
  petitions.forEach((item, index) => {
    const post = item.post;
    const petition = item.petition;
    const voteCount = votesData[index].up - votesData[index].down || 0;
    const signatureCount = signaturesData[index].length || 0;
    
    renderPetitionCard(post, petition, voteCount, signatureCount, list);
  });
}

/**
 * Render a single petition card in the UI
 * @param {Object} post - The post object
 * @param {Object} petition - The petition object
 * @param {number} voteCount - Vote count for the post
 * @param {number} signatureCount - Signature count for the petition
 * @param {HTMLElement} list - The container to append the card to
 */
function renderPetitionCard(post, petition, voteCount, signatureCount, list) {
  let petitionState = petition.state || 'Open';
  const targetSignatures = petition.targetSignatures || 100;
  const deadlineDate = petition.deadline ? new Date(petition.deadline) : null;
  const now = new Date();
  
  // Check if petition has expired but still marked as open
  if (deadlineDate && now > deadlineDate && petitionState === 'Open') {
    petitionState = 'Closed (Expired)';
  }
  
  // Calculate days remaining if deadline exists
  let daysRemaining = null;
  let deadlineStatus = '';
  if (deadlineDate) {
    if (now > deadlineDate) {
      deadlineStatus = 'expired';
    } else {
      const diffTime = deadlineDate - now;
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (daysRemaining <= 7) {
        deadlineStatus = 'urgent';
      } else if (daysRemaining <= 30) {
        deadlineStatus = 'approaching';
      }
    }
  }
  
  // Format creation date
  const date = new Date(post.timestamp).toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).replace(',', '');
  
  // Format deadline date if available
  let deadlineFormatted = 'No deadline';
  let deadlineHtml = '';
  if (deadlineDate) {
    deadlineFormatted = deadlineDate.toLocaleDateString('en-GB', { 
      day: 'numeric', month: 'long', year: 'numeric' 
    });
    
    if (deadlineStatus === 'expired') {
      deadlineHtml = `<span class="text-red-600 font-medium">Deadline: ${deadlineFormatted} (Expired)</span>`;
    } else if (deadlineStatus === 'urgent') {
      deadlineHtml = `
        <span class="text-red-600 font-medium">Deadline: ${deadlineFormatted}</span>
        <span class="inline-flex items-center ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left
        </span>`;
    } else if (deadlineStatus === 'approaching') {
      deadlineHtml = `
        <span class="text-orange-600 font-medium">Deadline: ${deadlineFormatted}</span>
        <span class="text-xs text-gray-600 ml-2">(${daysRemaining} days left)</span>`;
    } else {
      deadlineHtml = `<span class="font-medium">Deadline: ${deadlineFormatted}</span>`;
    }
  } else {
    deadlineHtml = `<span class="font-medium">Deadline: Not set</span>`;
  }

  // Determine progress percentage
  const progressPercent = Math.min(Math.round((signatureCount / targetSignatures) * 100), 100);
  
  // Determine state class based on petition state
  let stateClass = 'bg-green-100 text-green-800'; // Default for Open
  let displayState = petitionState;
  
  switch(petitionState) {
    case 'Closed':
      stateClass = 'bg-red-100 text-red-800';
      break;
    case 'Closed (Expired)':
      stateClass = 'bg-red-100 text-red-800';
      break;
    case 'Draft':
      stateClass = 'bg-gray-100 text-gray-800';
      break;
    case 'Rejected':
      stateClass = 'bg-red-100 text-red-800';
      break;
    case 'Awaiting government':
      stateClass = 'bg-yellow-100 text-yellow-800';
      break;
    case 'Government responses':
      stateClass = 'bg-blue-100 text-blue-800';
      break;
    case 'Awaiting a debate':
      stateClass = 'bg-purple-100 text-purple-800';
      break;
    case 'Debated in Parliament':
      stateClass = 'bg-indigo-100 text-indigo-800';
      break;
    case 'Not debated':
      stateClass = 'bg-gray-100 text-gray-800';
      break;
  }
  
  // Progress bar color based on percentage
  let progressBarClass = 'bg-blue-600';
  if (progressPercent >= 100) {
    progressBarClass = 'bg-green-600';
  } else if (progressPercent >= 75) {
    progressBarClass = 'bg-green-500';
  } else if (progressPercent >= 50) {
    progressBarClass = 'bg-yellow-500';
  } else if (progressPercent >= 25) {
    progressBarClass = 'bg-orange-500';
  } else {
    progressBarClass = 'bg-red-500';
  }
  
  const li = document.createElement('li');
  li.className = 'bg-white border border-gray-200 rounded-lg shadow-sm p-5 petition-card';
  li.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-center gap-4">
      <div class="flex-1">
        <div class="flex flex-wrap items-center gap-2 mb-1">
          <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Petition</span>
          <span class="${stateClass} text-xs font-medium px-2.5 py-0.5 rounded-full">${displayState}</span>
          ${post.category ? `<span class="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">${post.category}</span>` : ''}
        </div>
        <a href="post.html?id=${post.id}" class="text-xl font-bold text-blue-800 hover:text-blue-600 transition-colors">${post.title}</a>
        <p class="text-gray-700 mt-2 mb-3 line-clamp-2">${post.body}</p>
        
        <div class="mb-3">
          <div class="flex justify-between text-xs text-gray-600 mb-1">
            <span>${signatureCount} of ${targetSignatures} signatures</span>
            <span>${progressPercent}% complete</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="${progressBarClass} h-2.5 rounded-full" style="width: ${progressPercent}%"></div>
          </div>
        </div>
        
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4">
          <div class="flex flex-col text-sm space-y-1">
            <span class="text-gray-600"><span class="font-medium">Created:</span> ${date}</span>
            <span class="text-gray-600">${deadlineHtml}</span>
          </div>
          <div class="flex items-center gap-4 text-sm mt-2 sm:mt-0">
            <span class="flex items-center">
              <svg class="w-4 h-4 mr-1 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
              </svg>
              ${voteCount} votes
            </span>
            <span class="flex items-center">
              <svg class="w-4 h-4 mr-1 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
              ${signatureCount} signatures
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
  list.appendChild(li);
}

/**
 * Setup event listeners for search, filter, and sort controls
 */
function setupEventListeners() {
  // Search input listener
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', debounce(function() {
    searchTerm = this.value.trim();
    loadAndDisplayPetitions();
  }, 300));
  
  // State filter dropdown
  const stateFilter = document.getElementById('stateFilter');
  stateFilter.addEventListener('change', function() {
    currentFilter = this.value;
    updateStatusPills(currentFilter);
    loadAndDisplayPetitions();
  });
  
  // Sort options dropdown
  const sortOption = document.getElementById('sortOption');
  sortOption.addEventListener('change', function() {
    currentSort = this.value;
    loadAndDisplayPetitions();
  });
  
  // Status filter pills
  const statusPills = document.querySelectorAll('.status-pill');
  statusPills.forEach(pill => {
    pill.addEventListener('click', function() {
      currentFilter = this.dataset.status;
      updateStatusPills(currentFilter);
      // Update the dropdown to match
      document.getElementById('stateFilter').value = currentFilter;
      loadAndDisplayPetitions();
    });
  });
}

/**
 * Update the status pills UI to reflect the currently selected status
 * @param {string} selectedStatus - The currently selected status
 */
function updateStatusPills(selectedStatus) {
  const pills = document.querySelectorAll('.status-pill');
  pills.forEach(pill => {
    if (pill.dataset.status === selectedStatus) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });
}

/**
 * Debounce function to limit how often a function is called
 * @param {Function} func - The function to debounce
 * @param {number} wait - The wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

// Initialize when the window loads
window.onload = function() {
  loadAndDisplayPetitions();
  setupEventListeners();
};
