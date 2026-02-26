#!/bin/bash
# Session End Hook - Flag pending retrospective if work was done
# Works on Windows (Git Bash) and macOS/Linux

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FLAG_FILE="$PROJECT_ROOT/psi/inbox/.pending-retrospective"

if [ -d "$PROJECT_ROOT/.git" ]; then
    cd "$PROJECT_ROOT"

    # Check for uncommitted changes or recent commits
    if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null || \
       [ -n "$(git log --since='30 minutes ago' --oneline 2>/dev/null)" ]; then
        echo "TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')" > "$FLAG_FILE"
        echo "BRANCH=$(git branch --show-current 2>/dev/null)" >> "$FLAG_FILE"
        echo "Retrospective pending - will remind on next session start"
    fi
fi

exit 0
