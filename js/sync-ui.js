/**
 * Sync UI Component
 * Provides UI elements for users to control data synchronization
 */

/**
 * Creates and injects the sync UI button into the page
 * @param {string} containerId - ID of the container element to inject the button into
 */
function injectSyncButton(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container element with ID '${containerId}' not found`);
    return;
  }

  // Create the sync button element
  const syncButtonEl = document.createElement('div');
  syncButtonEl.className = 'fixed bottom-6 right-6';
  
  syncButtonEl.innerHTML = `
    <button id="syncButton" class="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 text-white font-medium rounded-full px-4 py-2 shadow-lg transition duration-300 ease-in-out transform hover:scale-105">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <span>Sync Data</span>
    </button>
    <div id="syncStatus" class="text-sm text-center mt-2 hidden bg-gray-800 text-white py-1 px-3 rounded-full"></div>
  `;
  
  container.appendChild(syncButtonEl);
  
  // Set up event listener
  setupSyncButtonListener();
}

/**
 * Sets up the event listener for the sync button
 */
function setupSyncButtonListener() {
  const syncButton = document.getElementById('syncButton');
  if (!syncButton) return;
  
  syncButton.addEventListener('click', async () => {
    // Show GitHub token modal
    showGitHubTokenModal();
  });
}

/**
 * Shows a modal to collect GitHub token for sync
 */
function showGitHubTokenModal() {
  // Check if modal.js is loaded
  if (typeof showModal !== 'function') {
    console.error('Modal utility not available. Include modal.js before calling this function.');
    alert('Cannot sync data: modal utility not available.');
    return;
  }
  
  // Create modal content
  const modalContent = `
    <div class="p-4">
      <h3 class="text-lg font-bold mb-4">Sync Your Contributions</h3>
      <p class="mb-4">To sync your contributions (votes, comments, and posts) with our GitHub repository, please provide your GitHub personal access token with 'repo' scope permissions.</p>
      
      <div class="mb-4">
        <label for="github-token" class="block text-sm font-medium text-gray-700 mb-1">GitHub Token</label>
        <input type="password" id="github-token" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx">
        <p class="text-xs text-gray-500 mt-1">Your token will only be used for this sync operation and won't be stored.</p>
      </div>
      
      <div class="mb-4">
        <p class="text-sm text-gray-700">Don't have a token? 
          <a href="https://github.com/settings/tokens/new" target="_blank" class="text-blue-600 hover:text-blue-800">
            Create one here
          </a>
        </p>
        <p class="text-xs text-gray-600 mt-1">Make sure to select the 'repo' scope when creating your token.</p>
      </div>
    </div>
  `;
  
  // Show the modal
  showModal(modalContent, 'Sync Contributions', () => {
    const token = document.getElementById('github-token').value.trim();
    if (!token) {
      alert('Please enter a valid GitHub token to continue.');
      return false;
    }
    
    triggerSync(token);
    return true;
  }, 'Sync', 'Cancel');
}

/**
 * Triggers the sync process with the provided GitHub token
 * @param {string} token - GitHub personal access token
 */
async function triggerSync(token) {
  if (!token) return;
  
  updateSyncStatus('Syncing...', true);
  
  try {
    // Call the triggerGitHubSync function from local_storage_sync.js
    if (typeof triggerGitHubSync !== 'function') {
      throw new Error('Sync function not available');
    }
    
    const success = await triggerGitHubSync(token);
    
    if (success) {
      updateSyncStatus('Sync successful!', true);
      // Hide status after 3 seconds
      setTimeout(() => updateSyncStatus('', false), 3000);
      
      // Show success modal
      if (typeof showSuccessModal === 'function') {
        showSuccessModal(
          'Your contributions have been queued for sync with our GitHub repository. The changes will be reviewed and merged shortly.',
          null,
          5000,
          'success'
        );
      }
    } else {
      updateSyncStatus('Sync failed', true);
      setTimeout(() => updateSyncStatus('', false), 3000);
      
      if (typeof showSuccessModal === 'function') {
        showSuccessModal(
          'Failed to sync your contributions. Please try again later.',
          null,
          5000,
          'error'
        );
      }
    }
  } catch (error) {
    console.error('Error during sync:', error);
    updateSyncStatus('Sync error', true);
    setTimeout(() => updateSyncStatus('', false), 3000);
    
    if (typeof showSuccessModal === 'function') {
      showSuccessModal(
        'An error occurred during sync: ' + error.message,
        null,
        5000,
        'error'
      );
    }
  }
}

/**
 * Updates the sync status indicator
 * @param {string} message - Status message to display
 * @param {boolean} show - Whether to show the status indicator
 */
function updateSyncStatus(message, show) {
  const statusEl = document.getElementById('syncStatus');
  if (!statusEl) return;
  
  if (show) {
    statusEl.textContent = message;
    statusEl.classList.remove('hidden');
  } else {
    statusEl.classList.add('hidden');
  }
}

// Initialize the sync button when the document is ready
document.addEventListener('DOMContentLoaded', () => {
  // Only proceed if we're on GitHub Pages
  if (window.location.hostname.includes('github.io')) {
    injectSyncButton('footer');
  }
});
