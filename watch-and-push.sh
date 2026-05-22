#!/bin/bash

# Watch for file changes and auto-push to GitHub every N minutes
INTERVAL=${1:-5}  # default: every 5 minutes

echo "Watching for changes every $INTERVAL minutes..."
echo "Press Ctrl+C to stop."

while true; do
    sleep $((INTERVAL * 60))

    if ! git diff --quiet || ! git diff --cached --quiet; then
        TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
        echo "[$TIMESTAMP] Changes detected, pushing..."
        git add .
        git commit -m "Auto-save: $TIMESTAMP"
        git push -u origin "$(git rev-parse --abbrev-ref HEAD)"
        echo "Pushed successfully."
    else
        echo "[$(date '+%H:%M:%S')] No changes."
    fi
done
