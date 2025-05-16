/**
 * Enhanced diagnostic logging for API requests
 * @param {string} url - The URL being called
 * @param {string} method - The HTTP method being used
 * @param {object} data - The data being sent (for POST requests)
 */
function logApiRequest(url, method, data = null) {
    console.group(`API Request: ${method} ${url}`);
    console.log(`🌐 URL: ${url}`);
    console.log(`📝 Method: ${method}`);
    if (data) {
        const truncatedData = JSON.stringify(data).length > 200 
            ? JSON.stringify(data).substring(0, 200) + '...'
            : JSON.stringify(data);
        console.log(`📦 Request Body: ${truncatedData}`);
    }
    console.log(`⏱️ Time: ${new Date().toISOString()}`);
    console.log(`🌍 Host: ${window.location.hostname}`);
    console.log(`🔄 Environment: ${window.location.hostname.includes('github.io') ? 'GitHub Pages' : 
                            (window.location.hostname === 'localhost' ? 'Local Development' : 'Other')}`)
    console.groupEnd();
}

/**
 * Returns the base URL for API requests
 * @param {boolean} forDataOnly - If true, returns the URL for data files only, not API endpoints
 * @returns {string} The base URL for API requests or data files
 */
function baseUrl(forDataOnly = false) {
    // Check if we're running locally or in production
    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';
    
    // Check if we're on GitHub Pages
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    // In a production environment, this could be loaded from a config file or environment variable
    if (isLocal) {
        return 'http://localhost:8080';
    } else if (isGitHubPages) {
        // Use different URLs for data files vs API endpoints
        if (forDataOnly) {
            // For GitHub Pages, we need to use the full path to the data files
            // including the repository name in the URL
            return '/frontend';
        } else {
            // For API submissions, use the Flask submission bot
            return 'https://flask-submission-bot.onrender.com';
        }
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
    
    // Use baseUrl() without parameters to get the API URL (not the data URL)
    const url = baseUrl() + path;
    const apiUrl = baseUrl();
    
    // Use enhanced logging
    logApiRequest(url, 'POST', data);
    
    // Add timestamp to data for better tracking
    data._timestamp = new Date().toISOString();
    
    // Check if we're in offline/static mode or on GitHub Pages
    const isGitHubPages = window.location.hostname.includes('github.io');
    // If we're on GitHub Pages, we should be using the Flask API
    const hasSubmissionAPI = apiUrl.includes('flask-submission-bot.onrender.com') || apiUrl.includes('localhost');
    
    // Use localStorage fallback only if we don't have a submission API
    if (apiUrl === '' || apiUrl === '/api') {
        console.log('Running in static/GitHub Pages mode - saving to localStorage', data);
        // Store in localStorage for demo purposes
        try {
            // Create a unique ID for this submission
            const submissionId = 'submission_' + Date.now();
            localStorage.setItem(submissionId, JSON.stringify(data));
            
            // Also add to the specific collection in localStorage if path indicates a collection
            const collectionPath = path.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
            if (collectionPath) {
                // Try to get existing collection data
                const existingData = localStorage.getItem(`collection_${collectionPath}`) || '[]';
                try {
                    const collection = JSON.parse(existingData);
                    // Add new item with generated ID
                    const newItem = { ...data, id: `local_${Date.now()}` };
                    collection.push(newItem);
                    localStorage.setItem(`collection_${collectionPath}`, JSON.stringify(collection));
                } catch (e) {
                    console.error('Error updating collection:', e);
                }
            }
            
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
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data),
        signal: controller.signal,
        mode: 'cors',
        credentials: 'same-origin'
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
    // Use baseUrl() without parameters to get the API URL (not the data URL)
    const url = baseUrl() + path;
    const apiUrl = baseUrl();
    
    // Use enhanced logging
    logApiRequest(url, 'POST', data);
    
    // Add timestamp to data
    data._timestamp = new Date().toISOString();
    
    // Check if we're in offline/static mode 
    const isGitHubPages = window.location.hostname.includes('github.io');
    // If we're on GitHub Pages, we should be using the Flask API
    const hasSubmissionAPI = apiUrl.includes('flask-submission-bot.onrender.com') || apiUrl.includes('localhost');
    
    // Use localStorage fallback only if we don't have a submission API
    if (apiUrl === '' || apiUrl === '/api') {
        console.log('Running in static/GitHub Pages mode - saving to localStorage', data);
        // Store in localStorage for demo purposes
        try {
            // Create a unique ID for this submission
            const submissionId = 'callback_submission_' + Date.now();
            localStorage.setItem(submissionId, JSON.stringify(data));
            
            // Also add to the specific collection in localStorage if path indicates a collection
            const collectionPath = path.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
            if (collectionPath) {
                // Try to get existing collection data
                const existingData = localStorage.getItem(`collection_${collectionPath}`) || '[]';
                try {
                    const collection = JSON.parse(existingData);
                    // Add new item with generated ID
                    const newItem = { ...data, id: `local_${Date.now()}` };
                    collection.push(newItem);
                    localStorage.setItem(`collection_${collectionPath}`, JSON.stringify(collection));
                } catch (e) {
                    console.error('Error updating collection:', e);
                }
            }
            
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
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data),
        signal: controller.signal,
        mode: 'cors',
        credentials: 'same-origin'
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
    // Check if we're on GitHub Pages - if so, first check for local collections
    const isGitHubPages = window.location.hostname.includes('github.io');
    const collectionPath = path.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
    
    // First, check if we have a local collection for this path (created via POST)
    if (isGitHubPages) {
        try {
            const localCollection = localStorage.getItem(`collection_${collectionPath}`);
            if (localCollection) {
                console.log(`Loading local collection data for ${path}`);
                const localData = JSON.parse(localCollection);
                if (localData && localData.length > 0) {
                    return localData;
                }
            }
        } catch (localError) {
            console.warn(`Error reading local collection for ${path}:`, localError);
        }
    }
    
    try {
        // Construct the URL using baseUrl() with forDataOnly=true to get the data URL
        // With our new approach, this will be a local path within the repository
        let url = `${baseUrl(true)}/${path}`;
        
        // Use enhanced logging
        logApiRequest(url, 'GET');
        
        // Try loading from the data URL or direct file path
        const response = await fetch(url);
        
        // Check if the response is ok
        if (!response.ok) {
            // If we get a 401 (Unauthorized) or 403 (Forbidden) from GitHub, we need a token
            if ((response.status === 401 || response.status === 403) && 
                (url.includes('githubusercontent.com') || url.includes('github'))) {
                
                // Mark that we need GitHub authentication
                localStorage.setItem('github_auth_required', 'true');
                
                // If we have the promptForGitHubToken function available, call it
                if (typeof promptForGitHubToken === 'function') {
                    promptForGitHubToken();
                }
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Parse the JSON data
        const data = await response.json();
        
        // Cache the data in localStorage
        try {
            localStorage.setItem(`cache_${path.replace(/\//g, '_')}`, JSON.stringify(data));
        } catch (cacheError) {
            console.warn('Could not cache data:', cacheError);
        }
        
        return data;
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