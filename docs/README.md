# We Are Sierra Leone - Frontend

This is the frontend component of the We Are Sierra Leone civic platform. It's designed to be deployed on GitHub Pages.

## Repository Structure

This project uses a simplified approach with data files stored directly in the repository:
1. **Frontend Code**: HTML, CSS, and JavaScript files for the public-facing website.
2. **Data Files**: JSON files in the `data/` directory containing posts, petitions, comments, and votes.

## Structure

- HTML files for all pages
- JavaScript files in the `js/` directory
- CSS styles in `style.css`
- Data files in the `data/` directory

## Keeping Data Files Synchronized

To ensure the data files are kept up-to-date, use the included sync script:

```bash
../scripts/sync_data_files.sh
```

This script will copy all data files from the root project directory to the frontend/data directory.

## Deployment

This frontend is configured to be deployed on GitHub Pages.

See `GITHUB_PAGES_DEPLOYMENT.md` for detailed deployment instructions.

## Data Loading

The application uses the following approach for data management:

1. Fetches data from the backend repository's raw GitHub content
2. Falls back to local storage cache if the fetch fails
3. Uses default values as a last resort

## Authentication

### Private Repository Access

If the backend repository is private, the application supports two methods of GitHub token authentication:

#### 1. Automated (Recommended)

Using GitHub Actions and repository secrets:

1. Store a GitHub Personal Access Token as a repository secret named `DATA_TOKEN`
2. The GitHub Actions workflow automatically injects this token during deployment
3. Users can access the site without needing to provide their own tokens
4. Use `../scripts/setup_github_secret.sh` script or GitHub web interface to set up the secret

#### 2. Manual

Using session storage for development or testing:

1. Users will be prompted to enter a GitHub token when needed
2. Tokens are stored in session storage (cleared when browser tab is closed)
3. The diagnostics page (`../diagnostics/diagnostics.html`) provides tools for managing tokens

See `GITHUB_PAGES_LOCALSTORAGE.md` for more details on both authentication methods.

### Diagnostic Tools

All diagnostic and test tools are located in the `../diagnostics/` directory:
- `../diagnostics/url_diagnostic.html` - Tests URL construction
- `../diagnostics/repository_test.html` - Tests repository configuration
- `../diagnostics/content_test.html` - Tests data loading
- `../diagnostics/diagnostics.html` - API connection diagnostics
- `../diagnostics/detect_github_pages_url.sh` - Auto-detect GitHub Pages URL

See `GITHUB_PAGES_DEPLOYMENT.md` for more details on troubleshooting deployment issues.

### API Submission

Form submissions are sent to the Flask Submission Bot API:
- API endpoint: https://flask-submission-bot.onrender.com
- Supported endpoints: `/submit`, `/comments`, `/votes`
- See `API_REFERENCE.md` for detailed API documentation

## Development

To work on the frontend locally:

1. Clone this repository
2. Make your changes to the HTML, CSS, or JavaScript files
3. Start a local development server (see below)
4. Test locally using the server URL
5. Deploy to GitHub Pages using the instructions in `GITHUB_PAGES_DEPLOYMENT.md`

### Local Development Servers

This project supports multiple local development server options with dynamic port selection to avoid conflicts. See `LOCAL_DEVELOPMENT.md` for detailed instructions on:

- Basic static file server
- Enhanced API server with post submission support
- VS Code Live Server compatible options
- Troubleshooting connection issues
