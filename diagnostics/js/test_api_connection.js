// Test script to verify API connections
// Use this to test both data loading and form submission

document.addEventListener('DOMContentLoaded', function() {
  const testButton = document.createElement('button');
  testButton.textContent = 'Test API Connection';
  testButton.style.position = 'fixed';
  testButton.style.bottom = '10px';
  testButton.style.right = '10px';
  testButton.style.zIndex = '9999';
  testButton.style.backgroundColor = '#4CAF50';
  testButton.style.color = 'white';
  testButton.style.border = 'none';
  testButton.style.padding = '8px 16px';
  testButton.style.borderRadius = '4px';
  testButton.style.cursor = 'pointer';
  
  document.body.appendChild(testButton);
  
  testButton.addEventListener('click', async function() {
    console.clear();
    console.group('🧪 API Connection Tests');
    
    // Test 1: Get Data
    console.log('🔍 Test 1: Loading data from GitHub raw content');
    try {
      const dataUrl = `${baseUrl(true)}/data/approved.json`;
      // Check if we need to append a GitHub token for private repo access
      const token = sessionStorage.getItem('github_access_token');
      const urlWithToken = token && !dataUrl.includes('?token=') ? `${dataUrl}?token=${token}` : dataUrl;
      
      console.log(`Fetching from: ${urlWithToken.replace(/token=([^&]+)/, 'token=****')}`);
      const response = await fetch(urlWithToken);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS: Data loaded successfully', data);
      } else {
        console.error('❌ ERROR: Failed to load data', response.status, response.statusText);
        
        // If this is a 401 or 403, we might need a GitHub token
        if ((response.status === 401 || response.status === 403) && 
            (dataUrl.includes('githubusercontent.com') || dataUrl.includes('github'))) {
          console.log('⚠️ Authentication error - you may need to set a GitHub token for private repository access');
          
          // Prompt for token if the function is available
          if (typeof promptForGitHubToken === 'function') {
            const setToken = confirm('Authentication error. Would you like to set a GitHub token now?');
            if (setToken) {
              promptForGitHubToken();
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ ERROR: Exception during data loading', error);
    }
    
    // Test 2: POST test to Flask API
    console.log('\n🔍 Test 2: Posting to Flask API');
    try {
      const apiUrl = `${baseUrl()}/test`;
      console.log(`Posting to: ${apiUrl}`);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString()
        }),
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS: POST test successful', data);
      } else {
        console.error('❌ ERROR: POST test failed', response.status, response.statusText);
        
        // Try to get response body even for error
        try {
          const errorText = await response.text();
          console.error('Response body:', errorText);
        } catch (e) {
          console.error('Could not read response body');
        }
      }
    } catch (error) {
      console.error('❌ ERROR: Exception during POST test', error);
    }
    
    // Test 3: CORS preflight test
    console.log('\n🔍 Test 3: CORS preflight test');
    try {
      const apiUrl = `${baseUrl()}/test-cors`;
      console.log(`Making OPTIONS request to: ${apiUrl}`);
      const response = await fetch(apiUrl, {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type',
          'Origin': window.location.origin
        }
      });
      
      if (response.ok) {
        console.log('✅ SUCCESS: CORS preflight successful');
        console.log('Response headers:', {
          'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
          'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
          'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        });
      } else {
        console.error('❌ ERROR: CORS preflight failed', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ ERROR: Exception during CORS test', error);
    }
    
    // Print environment information
    console.log('\n📊 Environment Information:');
    console.log('Window Location:', window.location.href);
    console.log('Base URL for API:', baseUrl());
    console.log('Base URL for Data:', baseUrl(true));
    console.log('Is GitHub Pages:', window.location.hostname.includes('github.io'));
    
    console.groupEnd();
  });
});
