#!/bin/bash

# Auto-commit and push changes to GitHub
BRANCH=$(git rev-parse --abbrev-ref HEAD)
MESSAGE=${1:-"Auto-save: $(date '+%Y-%m-%d %H:%M:%S')"}

echo "Checking for changes..."

if git diff --quiet && git diff --cached --quiet; then
    echo "No changes to push."
    exit 0
fi

echo "Changes detected. Committing and pushing to $BRANCH..."

git add .
git commit -m "$MESSAGE"
git push -u origin "$BRANCH"

echo "Done! Code pushed to github.com/herry-maker/Herry"
