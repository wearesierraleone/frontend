#!/bin/zsh
# Enhanced local server script with API endpoints for development
# This script starts a Node.js server that can handle API requests

# Change to the directory of the script
cd "$(dirname "$0")/.."
FRONTEND_DIR="$(pwd)"

echo "🚀 Starting enhanced local server in $FRONTEND_DIR"
echo "📂 Files will be served from this directory"
echo "🔌 API endpoints will be available for development"
echo "🔍 Finding an available port..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "❌ Error: Node.js is required for the enhanced server. Please install Node.js."
  exit 1
fi

# Create a temporary server.js file for development
TMP_SERVER_FILE=$(mktemp)
cat > $TMP_SERVER_FILE << 'EOF'
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const net = require('net');

// Will try these ports in order until we find an available one
const PORT_LIST = [5500, 5501, 5502, 5503, 8080, 8081, 3000];
let PORT = process.env.PORT || PORT_LIST[0];
const ROOT_DIR = process.cwd();

// Function to check if a port is available
function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

// Find an available port from our list
async function findAvailablePort() {
  // First try the default port
  if (await checkPortAvailable(PORT)) {
    return PORT;
  }
  
  // If default port is not available, try others in the list
  for (const port of PORT_LIST) {
    if (await checkPortAvailable(port)) {
      console.log(`Port ${PORT} is in use, using port ${port} instead`);
      return port;
    }
  }
  
  // If all preferred ports are in use, let the OS find a random available port
  console.log(`All preferred ports are in use, letting OS choose a port`);
  return 0;
}

// Define MIME types for common file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Special handling for API endpoints
  if (pathname === '/save-post' && req.method === 'POST') {
    handleSavePost(req, res);
    return;
  }
  
  // Handle static file requests
  serveStaticFile(pathname, res);
});

// Start the server with an available port
async function startServer() {
  // Find an available port
  const availablePort = await findAvailablePort();
  
  server.listen(availablePort, () => {
    console.log(`\n✅ Server running at http://localhost:${availablePort}/`);
    console.log(`✅ API endpoints available: POST /save-post\n`);
  });
}

// Start the server
startServer();

// Function to handle POST /save-post endpoint
function handleSavePost(req, res) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const post = data.post;
      const allPosts = data.allPosts;
      
      // Check if post data is valid
      if (!post || !post.id || !post.title || !post.body) {
        sendJsonResponse(res, 400, { success: false, error: 'Invalid post data' });
        return;
      }
      
      // Write the updated posts array to the approved.json file
      fs.writeFile(
        path.join(ROOT_DIR, 'data', 'approved.json'),
        JSON.stringify(allPosts, null, 2),
        err => {
          if (err) {
            console.error('Error writing to approved.json:', err);
            sendJsonResponse(res, 500, { success: false, error: 'Failed to save post' });
            return;
          }
          
          sendJsonResponse(res, 200, { 
            success: true, 
            message: 'Post saved successfully',
            postId: post.id
          });
          
          console.log(`✅ New post saved: ${post.title} (ID: ${post.id})`);
        }
      );
    } catch (error) {
      console.error('Error processing post data:', error);
      sendJsonResponse(res, 400, { success: false, error: 'Invalid JSON' });
    }
  });
}

// Function to serve a static file
function serveStaticFile(pathname, res) {
  // If pathname is '/', serve index.html
  const filePath = path.join(
    ROOT_DIR,
    pathname === '/' ? 'index.html' : pathname.substring(1)
  );
  
  // Read the file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        // Server error
        res.writeHead(500);
        res.end('500 Internal Server Error');
      }
      return;
    }
    
    // Get the file extension and MIME type
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    // Send the file
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

// Helper function to send a JSON response
function sendJsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}
EOF

# Start the Node.js server
echo "📡 Starting API-enabled server..."
node $TMP_SERVER_FILE

# Clean up the temporary file when the server exits
trap 'rm -f $TMP_SERVER_FILE' EXIT
