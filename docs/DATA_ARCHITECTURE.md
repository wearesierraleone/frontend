# Data Storage Architecture

This document describes the data storage architecture for the We Are Sierra Leone civic platform.

## Overview

Initially, our architecture separated the frontend and data into different repositories:
- `wearesierraleone/frontend`: Public repository for the frontend code
- `wearesierraleone/wearesalone`: Private repository for data storage

## New Approach: Embedded Data Files

We have simplified the architecture by embedding data directly in the frontend repository:

### Benefits:
- No authentication required for data access
- Simplified deployment process
- No need for GitHub tokens or complex cross-repository access
- Better user experience with faster load times

### Implementation:
1. Data files are stored in `/data/*.json` files
2. The frontend loads these files directly using relative paths
3. No token-based authentication is needed

### Updating Data:

For contributors who need to update the data:

1. Make changes to the data files in the `/data` directory
2. Commit and push changes to the repository
3. The GitHub Actions workflow will automatically deploy the updated site

## Migrating from Previous Architecture

If you were using the previous cross-repository architecture with token-based authentication:

1. The token storage functionality has been removed
2. You no longer need to set the `DATA_TOKEN` secret in GitHub Actions
3. All data should be committed directly to the frontend repository

## Local Development

When developing locally:

1. Clone the frontend repository
2. Make sure the `/data` directory contains up-to-date JSON files
3. Run a local server as usual
