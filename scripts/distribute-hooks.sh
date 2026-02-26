#!/bin/bash
# Distribute hooks and settings to all incubate repos
# Usage: bash scripts/distribute-hooks.sh
# Works on Windows (Git Bash) and macOS/Linux

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_SRC="$PROJECT_ROOT/.claude/hooks"
SETTINGS_SRC="$PROJECT_ROOT/.claude/settings.json"
INCUBATE_DIR="$PROJECT_ROOT/psi/incubate"

if [ ! -d "$INCUBATE_DIR" ]; then
    echo "No incubate directory found at $INCUBATE_DIR"
    exit 0
fi

COUNT=0
for repo in "$INCUBATE_DIR"/*/; do
    [ -d "$repo" ] || continue
    [ -d "$repo/.git" ] || continue

    REPO_NAME=$(basename "$repo")
    echo "--- $REPO_NAME ---"

    # Create .claude/hooks/ in target
    mkdir -p "$repo/.claude/hooks"

    # Copy hooks
    cp "$HOOKS_SRC"/safety-check.sh "$repo/.claude/hooks/"
    cp "$HOOKS_SRC"/git-workflow-validator.sh "$repo/.claude/hooks/"
    cp "$HOOKS_SRC"/session-start.sh "$repo/.claude/hooks/"
    cp "$HOOKS_SRC"/session-end.sh "$repo/.claude/hooks/"

    # Copy settings (only if not exists, don't overwrite custom settings)
    if [ ! -f "$repo/.claude/settings.json" ]; then
        cp "$SETTINGS_SRC" "$repo/.claude/settings.json"
        echo "  [NEW] settings.json"
    else
        echo "  [SKIP] settings.json (already exists)"
    fi

    echo "  hooks copied"
    COUNT=$((COUNT + 1))
done

echo ""
echo "Done: $COUNT repos updated"
