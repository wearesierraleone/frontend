# We Are Sierra Leone - Frontend

This is the frontend component of the We Are Sierra Leone civic platform. It's designed to be deployed on GitHub Pages and fetches data from the main backend repository.

## Repository Structure

This project has been split into two repositories:
1. **Frontend Repository** (this repo): Located at https://github.com/wearesierraleone/frontend - Contains all HTML, CSS, and JavaScript files needed for the public-facing website.
2. **Backend Repository**: Located at https://github.com/wearesierraleone/wearesalone - Contains the server-side code.

**Note (May 2025 Update)**: Data files are now stored in the frontend repository under the `/data` directory.

## Structure

- HTML files for all pages
- JavaScript files in the `js/` directory
- CSS styles in `style.css`

## Deployment

This frontend is configured to be deployed on GitHub Pages. It will automatically fetch data from the main backend repository.

See `GITHUB_PAGES_DEPLOYMENT.md` for detailed deployment instructions.

## Data Loading

The application uses the following simplified approach for data management:

1. Fetches data directly from the data directory
2. Falls back to built-in fallback data if fetching fails
3. Implements retry mechanism for better reliability

## Post Status System

Posts follow a simple status workflow:

1. **Pending**: New posts are added with "pending" status and are not shown on the public site
2. **Approved**: Only posts with "approved" status are displayed on the homepage
3. **Rejected**: Posts that have been reviewed and rejected

Administrators can use the admin.html page to review pending posts and change their status.

## Local Development

### Using the Local Server

For local development, you have three options:

#### 1. Basic Local Server

```bash
# Start a simple local development server
./scripts/start_local_server.sh
```

This will start a Python HTTP server on port 8080, allowing you to access the site at:
http://localhost:8080

*Note: The basic server only serves static files and doesn't support saving new posts.*

#### 2. Enhanced Local Server with API Endpoints

```bash
# Start the enhanced server with API support
./scripts/start_local_server_with_api.sh
```

This starts a Node.js server that includes API endpoints for saving posts.
It allows you to test the full post submission flow locally.
The server automatically finds an available port (starting with 5500, 5501, etc.) and shows the URL in the terminal.

#### 3. VS Code Live Server Compatible API Server

```bash
# Start a server compatible with VS Code's Live Server
./scripts/start_vscode_server_with_api.sh
```

If you're using VS Code's Live Server extension, this server will detect an available port
and provide API endpoints to avoid CORS issues. It tries to use port 5500 first (VS Code's default),
but will automatically choose another port (5501, 5502, etc.) if the default is already in use.

### Post Management Demo

You can use the approve_demo.sh script to simulate changing a post's status:

```bash
# Change post status (replace with actual post ID)
./scripts/approve_demo.sh post1234 approved
```

Valid status values are: `approved`, `pending`, and `rejected`

## Diagnostics & Validation

Several diagnostic tools are available to help debug issues:

### Browser Console Diagnostics

The `diagnostics.js` file includes automatic checks that run in the browser console:
- Form submission monitoring
- Post status validation
- Data loading diagnostics

### Command Line Tools

```bash
# Validate JSON files
./scripts/validate_json.sh

# Check post status counts
./scripts/validate_json.sh | grep Statistics -A 4
```

## Features

### Modular Comment System
The comment and reply system has been refactored for better maintainability:
- Separated reply functionality into dedicated reply-handler.js module
- Clean integration with post display via post-loader.js
- Improved error handling and user feedback
- Default "approved" status for all comments and replies
- Support for multi-level nested replies

### Expandable FAQ Section
The FAQ page includes an interactive, accessible implementation with the following features:
- Collapsible FAQ items with smooth animations
- Table of contents with smooth scrolling
- "Expand All" and "Collapse All" functionality
- "Back to Top" button for better navigation
- ARIA attributes for better accessibility
- Responsive design for mobile devices

### Direct Petition Creation
The petition creation process has been streamlined:
- Direct server submission without modal interruptions
- Improved user flow with immediate feedback
- Enhanced error handling with simple alert messages

## Authentication

### Private Repository Access

If the backend repository is private, the application supports two methods of GitHub token authentication:

#### 1. Automated (Recommended)

Using GitHub Actions and repository secrets:

1. Store a GitHub Personal Access Token as a repository secret named `DATA_TOKEN`
2. The GitHub Actions workflow automatically injects this token during deployment
3. Users can access the site without needing to provide their own tokens
4. Use `setup_github_secret.sh` script or GitHub web interface to set up the secret

#### 2. Manual

Using session storage for development or testing:

1. Users will be prompted to enter a GitHub token when needed
2. Tokens are stored in session storage (cleared when browser tab is closed)
3. The diagnostics page (`diagnostics.html`) provides tools for managing tokens

See `GITHUB_PAGES_LOCALSTORAGE.md` for more details on both authentication methods.

### API Submission

Form submissions are sent to the Flask Submission Bot API:
- API endpoint: https://flask-submission-bot.onrender.com
- Supported endpoints: `/submit`, `/comments`, `/votes`
- See `API_REFERENCE.md` for detailed API documentation

## Development

To work on the frontend locally:

1. Clone this repository
2. Make your changes to the HTML, CSS, or JavaScript files
3. Test locally by opening the HTML files in a browser
4. Deploy to GitHub Pages using the instructions in `GITHUB_PAGES_DEPLOYMENT.md`

## Content Contribution Workflow

This project includes an automated system for handling content contributions:

### Auto-Merge Workflow

The repository includes a GitHub Actions workflow that automatically processes pull requests containing content changes:

1. **Validation**: Automatically validates JSON files in the PR
2. **Smart Merging**: Auto-merges PRs that only modify content files (comments, votes, posts) 
3. **Branch Cleanup**: Automatically deletes branches after successful merges
4. **Simplified Collaboration**: Makes it easier for community members to contribute content

For detailed information, see [AUTO_MERGE_WORKFLOW.md](docs/AUTO_MERGE_WORKFLOW.md)
