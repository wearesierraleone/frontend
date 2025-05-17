/**
 * Server Port Checker
 * This script checks for API endpoints across various common development ports
 * to help diagnose connection issues with the API server
 */

// Common ports used by our dynamic port selection system
const COMMON_DEV_PORTS = [5500, 5501, 5502, 5503, 8080, 8081, 3000, 3001];

/**
 * Checks if the API server is running on any of the common ports
 * @returns {Promise<Object>} - Object with port and status information
 */
async function checkApiServerPorts() {
  const results = {};
  const portChecks = [];
  
  console.log('🔍 Checking for API servers on common development ports...');
  
  // Check each port
  for (const port of COMMON_DEV_PORTS) {
    const checkPromise = checkApiEndpoint(port)
      .then(isAvailable => {
        results[port] = {
          checked: true,
          available: isAvailable,
          url: `http://localhost:${port}`
        };
      })
      .catch(() => {
        results[port] = {
          checked: true,
          available: false,
          error: true,
          url: `http://localhost:${port}`
        };
      });
      
    portChecks.push(checkPromise);
  }
  
  // Wait for all port checks to complete
  await Promise.all(portChecks);
  
  // Log results
  console.log('✅ Port scan complete');
  
  // Find available port
  const availablePorts = Object.entries(results)
    .filter(([_, info]) => info.available)
    .map(([port, _]) => port);
    
  if (availablePorts.length > 0) {
    console.log(`🌐 API server found on port(s): ${availablePorts.join(', ')}`);
  } else {
    console.log('❌ No API servers found on common ports');
    console.log('ℹ️ Try running: ./scripts/start_local_server_with_api.sh');
  }
  
  return {
    checkedPorts: results,
    availablePorts: availablePorts,
    currentPort: window.location.port
  };
}

/**
 * Checks if the API endpoint is available on the given port
 * @param {number} port - The port to check
 * @returns {Promise<boolean>} - True if the API is available
 */
function checkApiEndpoint(port) {
  return new Promise((resolve, reject) => {
    // We use a HEAD request to check if the server responds
    // without transferring the full content
    fetch(`http://localhost:${port}/data/approved.json`, { 
      method: 'HEAD',
      // Short timeout to keep the check fast
      signal: AbortSignal.timeout(1000)
    })
    .then(response => {
      resolve(response.ok);
    })
    .catch(error => {
      resolve(false);
    });
  });
}

// Export functions if we're in a module environment
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = {
    checkApiServerPorts,
    checkApiEndpoint,
    COMMON_DEV_PORTS
  };
}
