#!/bin/bash

# Check if correct number of arguments is passed
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <project-name> <organization-name>"
    exit 1
fi

PROJECT_NAME=$1
ORG_NAME=$2

# Initialize git repository
git init

# Add and commit the README file
git add *
git commit -m "Initial commit"

# Create the repository on GitHub using hub
hub create "$ORG_NAME/$PROJECT_NAME"

# Set the main branch name explicitly (if needed)
git branch -M main

git config http.postBuffer 524288000

# Push to GitHub
git push -u origin main

echo "Repository '$ORG_NAME/$PROJECT_NAME' created and pushed successfully!"
