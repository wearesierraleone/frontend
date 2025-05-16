# We Are Sierra Leone - Frontend

This is the frontend component of the We Are Sierra Leone civic platform. It's designed to be deployed on GitHub Pages and fetches data from the main backend repository.

## Repository Structure

This project has been split into two repositories:
1. **Frontend Repository** (this repo): Contains all HTML, CSS, and JavaScript files needed for the public-facing website.
2. **Backend Repository**: Located at https://github.com/wearesierraleone/wearesalone - Contains the data files and server-side code.

## Structure

- HTML files for all pages
- JavaScript files in the `js/` directory
- CSS styles in `style.css`

## Deployment

This frontend is configured to be deployed on GitHub Pages. It will automatically fetch data from the main backend repository.

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

1. Store a GitHub Personal Access Token as a repository secret named `GITHUB_DATA_TOKEN`
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
