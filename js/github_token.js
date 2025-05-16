/**
 * GitHub Token Management
 * 
 * This file contains utility functions for handling GitHub authentication tokens
 * needed for accessing private repository content via raw.githubusercontent.com
 */

/**
 * Sets the GitHub access token in session storage
 * @param {string} token - The GitHub access token to store
 */
function setGitHubToken(token) {
    sessionStorage.setItem('github_access_token', token);
    console.log('GitHub token stored in session storage');
}

/**
 * Removes the GitHub access token from session storage
 */
function clearGitHubToken() {
    sessionStorage.removeItem('github_access_token');
    console.log('GitHub token removed from session storage');
}

/**
 * Checks if a GitHub token is available in session storage
 * @returns {boolean} True if a token is available
 */
function hasGitHubToken() {
    return !!sessionStorage.getItem('github_access_token');
}

/**
 * Shows a modal dialog to ask the user for their GitHub token
 * This requires the modal.js utility to be loaded
 */
function promptForGitHubToken() {
    // Only proceed if we have the showModal function available
    if (typeof showModal !== 'function') {
        console.error('Modal utility not available. Include modal.js before calling this function.');
        return;
    }
    
    const modalContent = `
        <div class="p-4">
            <h3 class="text-lg font-semibold mb-4">GitHub Authentication Required</h3>
            <p class="mb-4">This site uses content from a private GitHub repository. Please enter your GitHub token to access this content.</p>
            <div class="mb-4">
                <label for="github-token" class="block text-sm font-medium text-gray-700">GitHub Token</label>
                <input type="password" id="github-token" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx">
            </div>
            <div class="flex justify-end">
                <button id="save-token-btn" type="button" class="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    Save Token
                </button>
            </div>
            <div class="mt-4 text-sm text-gray-500">
                <p>The token will be stored in your browser's session storage and will be cleared when you close this tab.</p>
                <p class="mt-2">To create a new token, visit <a href="https://github.com/settings/tokens" target="_blank" class="text-blue-600 hover:underline">GitHub Settings > Developer Settings > Personal access tokens</a>.</p>
            </div>
        </div>
    `;
    
    showModal(modalContent, () => {
        // This runs after the modal is shown
        document.getElementById('save-token-btn').addEventListener('click', function() {
            const token = document.getElementById('github-token').value.trim();
            if (token) {
                setGitHubToken(token);
                // Close the modal by removing it
                const modal = document.getElementById('modal');
                if (modal) modal.remove();
                
                // Reload the page to attempt data loading again
                window.location.reload();
            }
        });
    });
}

// Check if we need to prompt for a token on page load in GitHub Pages environment
document.addEventListener('DOMContentLoaded', function() {
    const isGitHubPages = window.location.hostname.includes('github.io');
    if (isGitHubPages && !hasGitHubToken()) {
        // Don't prompt immediately, give the app a chance to load first and see if it needs the token
        setTimeout(() => {
            // Only prompt if the app has reported a 401/403 error when trying to access GitHub content
            if (localStorage.getItem('github_auth_required') === 'true') {
                promptForGitHubToken();
            }
        }, 2000);
    }
});
