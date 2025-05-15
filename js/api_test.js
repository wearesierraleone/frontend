/**
 * Test script to verify API connections and data loading
 * Use this in the browser console to troubleshoot API issues
 */

async function testApiConnections() {
  console.log('=== Testing API Connections ===');
  console.log('Current hostname:', window.location.hostname);

  // 1. Test baseUrl function
  console.log('\n1. Testing baseUrl function:');
  console.log('API URL:', baseUrl());
  console.log('Data URL:', baseUrl(true));

  // 2. Test data loading
  console.log('\n2. Testing data loading:');
  try {
    console.log('Fetching approved.json...');
    const posts = await loadData('data/approved.json', []);
    console.log(`Success! Loaded ${posts.length} posts`, posts.slice(0, 2));
  } catch (error) {
    console.error('Failed to load posts:', error);
  }

  // 3. Test localStorage collections
  console.log('\n3. Examining localStorage:');
  const collections = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('collection_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        collections[key] = {
          count: data.length,
          sample: data.slice(0, 2)
        };
      } catch (e) {
        collections[key] = { error: 'Could not parse JSON' };
      }
    }
  }
  console.log('LocalStorage collections:', collections);

  // 4. Test POST request (dry run)
  console.log('\n4. Testing POST request configuration (dry run):');
  const testPost = { 
    title: 'TEST - Please ignore', 
    body: 'This is a test post to verify API connections', 
    _timestamp: new Date().toISOString(),
    dryRun: true
  };
  console.log('Would POST to:', baseUrl() + '/submit');
  console.log('With data:', testPost);
  console.log('To actually submit a test post, call testSubmitPost()');
}

async function testSubmitPost() {
  const testPost = { 
    title: 'TEST - API Connection Test', 
    body: 'This post was submitted as a test of the API connection. You may delete it.', 
    category: 'Other',
    timestamp: new Date().toISOString(),
    status: 'pending'
  };
  
  try {
    console.log('Submitting test post to:', baseUrl() + '/submit');
    const response = await fetch(baseUrl() + '/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testPost),
      mode: 'cors',
      credentials: 'same-origin'
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      console.log('Success! Server response:', data);
    } else {
      console.error('API error:', response.status, response.statusText);
      const errorText = await response.text().catch(() => '');
      console.error('Error response:', errorText);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

// Run the tests automatically when the script is included
document.addEventListener('DOMContentLoaded', () => {
  console.log('API Test Script loaded. Run testApiConnections() to test connections.');
});
