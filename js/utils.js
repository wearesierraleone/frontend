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
    // Check if we're on GitHub Pages
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    if (isGitHubPages) {
        // Use different URLs for data files vs API endpoints
        if (forDataOnly) {
            // When loading data (JSON files), use the raw GitHub content
            return 'https://raw.githubusercontent.com/wearesierraleone/wearesalone/refs/heads/main';
        } else {
            // For API submissions, use the Flask submission bot
            return 'https://flask-submission-bot.onrender.com';
        }
    } else {
        // For all other cases, just use empty base URL (relative paths)
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
 * Loads data from either API or static JSON files with simplified approach
 * @param {string} path - The path to the data file (e.g., 'data/approved.json')
 * @param {object} defaultValue - The default value to return if loading fails
 * @returns {Promise<object>} - The data from the API or default value
 */
async function loadData(path, defaultValue = {}) {
    try {
        // Simple direct URL construction - just get the file directly
        let url = path;
        
        // Only use baseUrl if we're on GitHub Pages or other special environments
        const isGitHubPages = window.location.hostname.includes('github.io');
        if (isGitHubPages) {
            url = `${baseUrl(true)}/${path}`;
        }
        
        console.log(`Loading data from ${url}`);
        
        // Set up a timeout for the fetch operation
        const fetchPromise = fetch(url);
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timed out')), 5000); // 5 second timeout
        });
        
        // Race between fetch and timeout
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        // Check if the response is ok
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        try {
            // Parse the JSON data
            const data = await response.json();
            return data;
        } catch (jsonError) {
            console.error(`JSON parsing error for ${path}:`, jsonError);
            throw new Error(`Invalid JSON in ${path}`);
        }
    } catch (error) {
        console.error(`Error loading data from ${path}:`, error);
        
        // Try to use fallback data if available
        if (path === 'data/approved.json' && typeof getFallbackPosts === 'function') {
            console.log('Using fallback posts data');
            return getFallbackPosts();
        }
        
        // Just return the default value
        console.log(`Using default data for ${path}`);
        return defaultValue;
    }
}