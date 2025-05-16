/**
 * Sync Status Indicator
 * Provides visual feedback about the online/offline status and sync queue
 */

document.addEventListener('DOMContentLoaded', () => {
  // Create the status indicator container
  createSyncStatusIndicator();
  
  // Update status immediately and set up listeners
  updateSyncStatus();
  setupStatusListeners();
});

/**
 * Create the sync status indicator in the DOM
 */
function createSyncStatusIndicator() {
  const container = document.createElement('div');
  container.id = 'syncStatusContainer';
  container.className = 'fixed bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50 flex items-center space-x-2 text-sm font-medium transition-all duration-300 transform translate-y-20 opacity-0';
  
  // Create connection status indicator
  const statusIndicator = document.createElement('div');
  statusIndicator.id = 'connectionStatus';
  statusIndicator.className = 'w-3 h-3 rounded-full bg-gray-400'; // Gray by default
  container.appendChild(statusIndicator);
  
  // Create status text
  const statusText = document.createElement('div');
  statusText.id = 'syncStatusText';
  statusText.innerText = 'Checking connection...';
  container.appendChild(statusText);
  
  // Create sync button
  const syncButton = document.createElement('button');
  syncButton.id = 'forceSyncButton';
  syncButton.className = 'ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors hidden';
  syncButton.innerText = 'Sync Now';
  syncButton.onclick = () => {
    if (typeof syncWithServer === 'function') {
      updateSyncButtonState(true);
      syncWithServer(() => updateSyncButtonState(false));
    }
  };
  container.appendChild(syncButton);
  
  // Add to the DOM
  document.body.appendChild(container);
  
  // Show the indicator after a short delay
  setTimeout(() => {
    container.classList.remove('translate-y-20', 'opacity-0');
  }, 1000);
}

/**
 * Update the sync button state
 * @param {boolean} isSyncing - Whether sync is in progress
 */
function updateSyncButtonState(isSyncing) {
  const button = document.getElementById('forceSyncButton');
  if (!button) return;
  
  if (isSyncing) {
    button.disabled = true;
    button.innerText = 'Syncing...';
    button.className = 'ml-2 px-2 py-1 bg-gray-400 text-white text-xs rounded cursor-not-allowed';
  } else {
    button.disabled = false;
    button.innerText = 'Sync Now';
    button.className = 'ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors';
  }
}

/**
 * Update the sync status indicator
 */
function updateSyncStatus() {
  const statusIndicator = document.getElementById('connectionStatus');
  const statusText = document.getElementById('syncStatusText');
  const syncButton = document.getElementById('forceSyncButton');
  
  if (!statusIndicator || !statusText || !syncButton) return;
  
  // Check if we're offline
  const offline = typeof isOfflineMode === 'function' ? isOfflineMode() : !navigator.onLine;
  
  // Get the sync queue length
  let queueLength = 0;
  try {
    const queueStr = localStorage.getItem('sync_queue');
    if (queueStr) {
      const queue = JSON.parse(queueStr);
      queueLength = queue.length;
    }
  } catch (e) {
    console.error('Error checking sync queue:', e);
  }
  
  // Update the UI based on status
  if (offline) {
    statusIndicator.className = 'w-3 h-3 rounded-full bg-red-500';
    statusText.innerText = 'Offline';
    syncButton.classList.add('hidden');
  } else {
    statusIndicator.className = 'w-3 h-3 rounded-full bg-green-500';
    
    if (queueLength > 0) {
      statusText.innerText = `Online (${queueLength} items waiting)`;
      syncButton.classList.remove('hidden');
    } else {
      statusText.innerText = 'Online';
      syncButton.classList.add('hidden');
    }
  }
}

/**
 * Set up listeners for online/offline events and sync status changes
 */
function setupStatusListeners() {
  // Listen for online/offline events
  window.addEventListener('online', updateSyncStatus);
  window.addEventListener('offline', updateSyncStatus);
  
  // Check periodically for changes in the sync queue
  setInterval(updateSyncStatus, 5000);
}
