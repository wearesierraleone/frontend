# Deploying to GitHub Pages

This document provides comprehensive instructions for deploying the We Are Sierra Leone civic platform frontend to GitHub Pages.

## Prerequisites

1. GitHub account with access to the repository
2. Git installed on your local machine
3. Basic understanding of GitHub Actions and GitHub Pages

## Deployment Steps

### 1. Prepare Your Local Repository

Ensure your local repository has the correct configuration:

```bash
# Clone the repository if you haven't already
git clone <your-repo-url>
cd frontend

# Make sure all data files are in sync
./scripts/sync_data_files.sh

# Test locally before deploying
python -m http.server 8000  # or any static server of your choice
```

### 2. Verify Configuration

Run the verification script to ensure your deployment is ready:

```bash
cd ..  # Go to the parent directory if you're in the frontend directory
./diagnostics/verify_deployment.sh
```

The script will check:
- Data directories and files
- The baseUrl function in utils.js
- Whether all pages use loadData correctly
- GitHub Actions workflow configuration

### 3. Automatic Deployment with GitHub Actions

We've configured a GitHub Actions workflow that automatically deploys to GitHub Pages whenever you push to the main branch:

1. Push your changes to the main branch:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. The GitHub Actions workflow will:
   - Check out your code
   - Verify data files exist (and copy them if missing)
   - Create a .nojekyll file to bypass Jekyll processing
   - Deploy to the gh-pages branch

3. Once the workflow completes, your site will be available at:
   ```
   https://<username>.github.io/frontend/
   ```

### 4. Manual Deployment (Alternative)

If you prefer to deploy manually:

```bash
# Create a clean branch for GitHub Pages
git checkout -b gh-pages

# Push the branch to GitHub
git push -u origin gh-pages
```
### 5. Configure GitHub Pages in Repository Settings

1. Go to your repository on GitHub
2. Click on "Settings" in the top navigation bar
3. In the left sidebar, scroll down and click on "Pages" 
4. Under "Build and deployment > Source", select "GitHub Actions" 
   (The workflow will handle deployment to the gh-pages branch)
5. Click "Save"

### 6. Verify the Deployment

1. Check the "Actions" tab to see if the workflow ran successfully
2. Once complete, your site will be available at:
   ```
   https://<username>.github.io/frontend/
   ```
3. Open the URL in your browser and verify:
   - All pages load correctly
   - Navigation works
   - Data is loading properly (check the browser console)
   - Forms submit correctly

### 7. Diagnostic Tools

We've included several diagnostic tools in the `diagnostics/` directory to help troubleshoot deployment issues:

1. **diagnostics/url_diagnostic.html** - Shows how URLs are constructed for different environments
2. **diagnostics/repository_test.html** - Tests the repository configuration
3. **diagnostics/content_test.html** - Tests data loading across all pages
4. **diagnostics/detect_github_pages_url.sh** - Script to automatically detect the correct GitHub Pages URL
5. **diagnostics/verify_deployment.sh** - Script to verify deployment configuration

## Troubleshooting

If you encounter issues with your deployed site:

### 1. Data Loading Issues

If data doesn't load correctly:
- Check that data files exist in the `/data` directory
- Verify the baseUrl function returns '/frontend' for GitHub Pages
- Run the `diagnostics/content_test.html` diagnostic page

```javascript
// The baseUrl function should look like this for GitHub Pages:
if (isGitHubPages) {
    if (forDataOnly) {
        return '/frontend';
    } else {
        // For API submissions, use the Flask submission bot
        return 'https://flask-submission-bot.onrender.com';
    }
}
```

### 2. 404 Errors

If pages show 404 errors:
- Make sure the GitHub Pages source is set correctly
- Verify that the GitHub Actions workflow ran successfully
- Check that all links use relative paths, not absolute paths

### 3. JavaScript Errors

If you see JavaScript errors in the console:
- Look for path-related errors, which may indicate incorrect URL construction
- Check for missing files that should be included in the deployment
- Verify that all HTML pages are using loadData instead of direct fetch calls

## Data Architecture

### Data Synchronization

The platform uses a simplified approach with data files stored directly in the frontend repository:

1. **Local Development**:
   - Main data files are in the root `/data` directory
   - Use `./scripts/sync_data_files.sh` to copy data to `/frontend/data`

2. **GitHub Pages Deployment**:
   - The GitHub Actions workflow ensures data files exist in frontend/data
   - The baseUrl function is configured to load from `/frontend/data`

### Why This Approach Works

1. **Direct Data Access**: GitHub Pages can directly serve JSON files
2. **No CORS Issues**: All files are served from the same domain
3. **Simplified Deployment**: No need for complex backend integrations
4. **Fallback Mechanism**: localStorage provides offline capability

## Maintaining Your Deployment

1. **Updating Data**:
   - Update files in the root `/data` directory
   - Run `./scripts/sync_data_files.sh` to synchronize
   - Commit and push changes to trigger deployment

2. **Monitoring**:
   - Regularly check GitHub Actions for deployment status
   - Use the diagnostic tools in the `diagnostics/` directory to verify functionality

3. **Troubleshooting**:
   - Run `./diagnostics/verify_deployment.sh` to identify issues
   - Review GitHub Actions logs for detailed error information

1. **Organization**:
   - All data files are stored in the `/data` directory 
   - Main data files include:
     - `approved.json`: Approved posts/stories
     - `petitions.json`: Active petitions
     - `comments.json`: User comments
     - `votes.json`: User votes
     - `vote_stats.json`: Aggregated vote statistics

2. **Updating Data Files**:
   - Data files can be edited directly in the repository
   - After pushing changes, GitHub Actions automatically deploys the updated site
   - No authentication is required to access these files in the deployed site

### Advantages of This Approach

- **Simplicity**: No need for complex token-based authentication
- **Performance**: Faster data loading with no authentication overhead
- **Reliability**: No dependency on external private repositories 
- **Maintainability**: Easier for contributors to update and maintain

For more detailed information on the data architecture, see the [DATA_ARCHITECTURE.md](DATA_ARCHITECTURE.md) file.

### Automated Deployment with GitHub Actions

For a more streamlined deployment process that automatically handles private repository authentication, you can use GitHub Actions:

#### Setting Up GitHub Actions Deployment

1. Create the GitHub Actions workflow file:
   - Create a directory: `.github/workflows/`
   - Add the file `deploy-github-pages.yml` (already included in the repository)

2. Add a Repository Secret for Private Data Access:
   - Go to your repository Settings
   - Navigate to "Secrets and variables" → "Actions"
   - Click "New repository secret"
   - Name: `DATA_TOKEN`
   - Value: [Your GitHub Personal Access Token with 'repo' scope]
   - Click "Add secret"

3. Trigger the Workflow:
   - Push changes to the `main` or `gh-pages-clean` branch
   - OR manually trigger the workflow from the "Actions" tab in your repository
   
4. Monitor Deployment:
   - Go to the "Actions" tab in your repository
   - Click on the running workflow to see its progress
   - Once completed, your site will be available at your GitHub Pages URL

#### Benefits of GitHub Actions Deployment

- Automatically injects the GitHub token during build time
- Users don't need to provide their own token
- Consistent deployment process
- Can be triggered manually or automatically on push
- Handles all necessary build steps in one process
