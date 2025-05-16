# Deploying to GitHub Pages

This document provides step-by-step instructions for deploying the We Are Sierra Leone civic platform frontend to GitHub Pages.

## Prerequisites

1. GitHub account with access to the repository: https://github.com/wearesierraleone/frontend.git
2. Git installed on your local machine or GitHub Desktop
3. Authentication set up for GitHub (HTTPS or SSH)

## Deployment Steps

### 1. Prepare Your Repository

We've already prepared the repository with the necessary changes:

- Updated the `baseUrl()` function in `js/utils.js` to work with GitHub Pages
- Set up integration with the Flask API at https://flask-submission-bot.onrender.com
- Created a `.nojekyll` file to prevent Jekyll processing
- Removed unnecessary files from the public directory

### 2. Creating a Clean Branch for GitHub Pages

#### Using GitHub Desktop (Recommended):

1. Open GitHub Desktop
2. Make sure your repository is selected (if not, add it via File > Add Local Repository)
3. Ensure you're on the `gh-pages-clean` branch using the dropdown menu
4. Click "Publish branch" (if it's a new branch) or "Push origin" (if the branch exists remotely)
5. If publishing for the first time, make sure the repository is set to "Public"

#### Using Command Line (Alternative):

```bash
# First, authenticate with GitHub (if needed)
# For HTTPS: You might be prompted for your username and personal access token
# For SSH: Make sure your SSH keys are set up correctly

# Push the branch to GitHub
git push -u origin gh-pages-clean

# If you want to rename it to the standard gh-pages branch on GitHub:
git branch -m gh-pages-clean gh-pages
git push -u origin gh-pages
```

### 3. Configure GitHub Pages in Repository Settings

1. Go to the repository on GitHub:
   * https://github.com/wearesierraleone/frontend
2. Click on "Settings" in the top navigation bar
3. In the left sidebar, scroll down and click on "Pages" 
4. Under "Source", select the branch you just pushed (`gh-pages` or `gh-pages-clean`)
5. Select "/ (root)" as the folder
6. Click "Save"

GitHub will now build and deploy your site. This typically takes a few minutes. You can check deployment progress in the "Actions" tab of your repository.

### 4. Access Your Deployed Site

Once GitHub Pages has finished building your site, it will be available at:

* `https://wearesierraleone.github.io/frontend/`

You can find the exact URL in the repository's "Settings > Pages" section after deployment.

### 5. Testing

After deployment, verify that:

1. All pages load correctly
2. Navigation works as expected
3. Data is loading properly from the backend repository (check the browser console)
4. The local storage-based API fallback is functioning properly if the backend is unavailable
5. Forms submit correctly and store data in localStorage
6. The site looks good on mobile devices

## Troubleshooting

If you encounter issues with your deployed site:

1. **404 errors**: Make sure GitHub Pages is configured correctly in repository settings
2. **Missing assets**: Check that all file paths use relative paths, not absolute paths
3. **JavaScript errors**: Open the browser console to check for specific errors
4. **API-related issues**: Verify that the `baseUrl()` function is handling GitHub Pages URLs correctly

## Maintenance

### Updating Your GitHub Pages Site

#### Using GitHub Desktop:
1. Open GitHub Desktop and select the repository
2. Make sure you're on the `gh-pages` branch
3. Make your changes to the code
4. In GitHub Desktop, review your changes
5. Add a commit summary and description
6. Click "Commit to gh-pages"
7. Click "Push origin"
8. GitHub Pages will automatically rebuild and deploy the updated site

#### Using Command Line:
1. Make changes to your code
2. Commit them to your `gh-pages` branch
3. Push the changes to GitHub
4. GitHub Pages will automatically rebuild and deploy the updated site

## Managing Repository Visibility

### Making a Private Repository Public (GitHub Desktop):
1. Go to the repository on GitHub
2. Click "Settings"
3. Scroll down to the "Danger Zone"
4. Click "Change visibility"
5. Select "Make public" and follow the confirmation steps

### Making a Public Repository Private:
Note that with a free GitHub account, GitHub Pages works only with public repositories. Making your repository private will disable GitHub Pages unless you have GitHub Pro, Team, or Enterprise.

## Data File Management

The platform now uses a simplified architecture with data files stored directly in the frontend repository:

### Data File Structure

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
