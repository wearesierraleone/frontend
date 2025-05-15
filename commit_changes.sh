#!/bin/zsh
# Script to commit and push changes to the frontend repository

cd /Users/ernestsaidukamara/Documents/wearesalone/frontend

echo "Staging all changes..."
git add .

echo "Committing changes..."
git commit -m "Update API integration: Flask API for forms, raw GitHub for data files"

echo "Pushing to GitHub..."
git push origin main

# Create or update gh-pages branch
echo "Creating/updating gh-pages branch..."
git checkout -B gh-pages
git merge main

echo "Pushing gh-pages branch..."
git push -u origin gh-pages

# Return to main branch
git checkout main

echo "Done! Your changes have been committed and the gh-pages branch has been updated."
echo "GitHub Pages should now be deploying from the gh-pages branch."
