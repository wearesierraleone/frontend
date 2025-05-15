/**
 * Returns the base URL for API requests
 * @returns {string} The base URL for API requests
 */
function baseUrl() {
    // Check if we're running locally or in production
    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';
    
    // Check if we're on GitHub Pages
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    // In a production environment, this could be loaded from a config file or environment variable
    if (isLocal) {
        return 'http://localhost:8080';
    } else if (isGitHubPages) {
        // When on GitHub Pages, always point to the data in the main backend repository
        return 'https://raw.githubusercontent.com/wearesierraleone/wearesalone/main';
    } else {
        // For other static deployments, use relative paths
        return '';
    }
}

/**
 * Posts content to the server with standardized error handling
 * @param {string} path - The API endpoint path
 * @param {object} data - The data to send to the server
 * @param {string} successMsg - Message to show on success
 * @param {string|null} redirectTo - Optional URL to redirect to after success
 * @param {string} errorMsg - Message to show on error
 * @returns {Promise} - The fetch promise
 */
function postContent(
    path, 
    data, 
    successMsg, 
    redirectTo = null,
    errorMsg = 'Operation failed. Please try again.') {
    
    const url = baseUrl() + path;
    const apiUrl = baseUrl();
    
    // Add timestamp to data for better tracking
    data._timestamp = new Date().toISOString();
    
    // Check if we're in offline/static mode (no backend)
    if (apiUrl === '/api') {
        console.log('Running in static mode - saving to localStorage', data);
        // Store in localStorage for demo purposes
        try {
            // Create a unique ID for this submission
            const submissionId = 'submission_' + Date.now();
            localStorage.setItem(submissionId, JSON.stringify(data));
            
            // Show success and redirect after a delay to simulate server response
            setTimeout(() => {
                showSuccessModal(successMsg + ' (Static Mode)', redirectTo, 2000, 'success');
            }, 1000);
            
            return Promise.resolve({});
        } catch (e) {
            console.error('localStorage error:', e);
            showSuccessModal('Error saving data locally. Storage may be full.', null, 0, 'error');
            return Promise.reject(e);
        }
    }
    
    // Set timeout for fetch to prevent infinite waiting
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        signal: controller.signal
    })
    .then(res => {
        clearTimeout(timeoutId);
        if (res.ok) {
            showSuccessModal(successMsg, redirectTo, 2000, 'success');
            return res.json().catch(() => ({})); // Return empty object if response isn't JSON
        } else {
            console.error(`API error: ${res.status} ${res.statusText}`);
            showSuccessModal(errorMsg, null, 0, 'error');
            return Promise.reject(new Error(`API error: ${res.status}`));
        }
    })
    .catch(err => {
        clearTimeout(timeoutId);
        console.error('Request failed:', err);
        
        let errorMessage = 'Network error. Please try again later.';
        if (err.name === 'AbortError') {
            errorMessage = 'Request timed out. The server may be down or unreachable.';
        }
        
        showSuccessModal(errorMessage, null, 0, 'error');
        return Promise.reject(err);
    });
}

/**
 * Posts content to the server with callback for custom success handling
 * @param {string} path - The API endpoint path
 * @param {object} data - The data to send to the server
 * @param {function} callback - Function to call on successful response
 * @param {string} errorMsg - Optional custom error message
 * @returns {Promise} - The fetch promise
 */
function postContentWithCallback(
    path, 
    data, 
    callback,
    errorMsg = 'Failed to submit data. Please try again.'
) {
    const url = baseUrl() + path;
    const apiUrl = baseUrl();
    
    // Add timestamp to data
    data._timestamp = new Date().toISOString();
    
    // Check if we're in offline/static mode (no backend)
    if (apiUrl === '/api') {
        console.log('Running in static mode - saving to localStorage', data);
        // Store in localStorage for demo purposes
        try {
            // Create a unique ID for this submission
            const submissionId = 'callback_submission_' + Date.now();
            localStorage.setItem(submissionId, JSON.stringify(data));
            
            // Execute callback after a delay to simulate server response
            setTimeout(() => {
                callback(data);
                showSuccessModal('Operation successful (Static Mode)', null, 0, 'success');
            }, 1000);
            
            return Promise.resolve(data);
        } catch (e) {
            console.error('localStorage error:', e);
            showSuccessModal('Error saving data locally. Storage may be full.', null, 0, 'error');
            return Promise.reject(e);
        }
    }
    
    // Set timeout for fetch to prevent infinite waiting
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        signal: controller.signal
    })
    .then(res => {
        clearTimeout(timeoutId);
        if (res.ok) {
            return res.json()
                .then(responseData => {
                    callback(responseData);
                    return responseData;
                })
                .catch(() => {
                    // Handle non-JSON responses
                    callback({});
                    return {};
                });
        } else {
            console.error(`API error: ${res.status} ${res.statusText}`);
            showSuccessModal(errorMsg, null, 0, 'error');
            return Promise.reject(new Error(`API error: ${res.status}`));
        }
    })
    .catch(err => {
        clearTimeout(timeoutId);
        console.error('Request failed:', err);
        
        let errorMessage = 'Network error. Please try again later.';
        if (err.name === 'AbortError') {
            errorMessage = 'Request timed out. The server may be down or unreachable.';
        }
        
        showSuccessModal(errorMessage, null, 0, 'error');
        return Promise.reject(err);
    });
}

/**
 * Loads data from either API or static JSON files with fallbacks
 * @param {string} path - The path to the data file (e.g., 'data/approved.json')
 * @param {object} defaultValue - The default value to return if loading fails
 * @returns {Promise<object>} - The data from the API or default value
 */
async function loadData(path, defaultValue = {}) {
    try {
        // Construct the URL using baseUrl() to handle different environments
        const url = `${baseUrl()}/${path}`;
        console.log(`Loading data from: ${url}`);
        
        // First try loading from the API or direct file path
        const response = await fetch(url);
        
        // Check if the response is ok
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Parse and return the JSON data
        return await response.json();
    } catch (error) {
        console.warn(`Error loading data from ${path}:`, error);
        
        // Try to retrieve from localStorage if available
        try {
            const storedData = localStorage.getItem(`cache_${path.replace(/\//g, '_')}`);
            if (storedData) {
                console.log(`Loaded cached data for ${path}`);
                return JSON.parse(storedData);
            }
        } catch (cacheError) {
            console.error('Cache retrieval failed:', cacheError);
        }
        
        // Return the default value as a last resort
        console.log(`Using default data for ${path}`);
        return defaultValue;
    }
}