# Local Development Environment

This document explains how to set up and use the local development environment for this project, including the dynamic port selection feature.

## Development Server Options

### 1. Basic Static Server

```bash
./scripts/start_local_server.sh
```

This starts a simple Python HTTP server on port 8080. It only serves static files and doesn't support API endpoints.

- **Use when**: Just viewing the site without needing to save posts or make API calls
- **Access at**: http://localhost:8080
- **Limitations**: Cannot save posts or update post status

### 2. Enhanced API Server

```bash
./scripts/start_local_server_with_api.sh
```

This starts a Node.js server with dynamic port selection that includes API endpoints for post submission and status updates.

- **Use when**: Testing full functionality including post submission and status changes
- **Access at**: The URL shown in the terminal (e.g., http://localhost:5500 or another available port)
- **Features**:
  - Automatically finds an available port (tries 5500, 5501, 5502, etc.)
  - Provides `/save-post` API endpoint
  - Provides `/create-petition` endpoint with direct submission
  - Provides `/update-comments` and `/comment` endpoints
  - Writes directly to data/approved.json and data/petitions.json

### 3. VS Code Live Server Compatible API Server

```bash
./scripts/start_vscode_server_with_api.sh
```

Similar to the enhanced server, but specifically designed to work with VS Code's Live Server extension.

- **Use when**: Using VS Code's Live Server but also need API endpoints
- **Access at**: The URL shown in the terminal (typically http://localhost:5500)
- **Features**:
  - Attempts to use the same port as VS Code's Live Server (5500)
  - Falls back to other ports (5501, 5502, etc.) if 5500 is already in use
  - Compatible with VS Code Live Server debugging tools

## Dynamic Port Selection

All our API servers now include dynamic port selection to avoid conflicts:

1. The server first tries to use the default port (5500)
2. If the default port is in use, it tries alternative ports (5501, 5502, etc.)
3. The available port is displayed in the terminal when the server starts
4. The submission forms automatically detect which port is in use

## Troubleshooting Server Connections

If you're having trouble with server connections, use our diagnostic tools:

```
./diagnostics/server_port_checker.html
```

This tool checks all common development ports and shows which ones have active API servers.

## Port Conflicts

If you see errors like "port already in use", it means another application (possibly another instance of the server or VS Code's Live Server) is already using that port. The dynamic port selection should handle this automatically, but you can:

1. Close other applications that might be using the port
2. Use a different terminal to run the server
3. Manually specify a different port: `PORT=3000 ./scripts/start_local_server_with_api.sh`
