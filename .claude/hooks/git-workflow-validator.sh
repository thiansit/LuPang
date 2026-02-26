#!/bin/bash
# Git Workflow Validator Hook
# Prevents: commits on main, push to main, force push
# Works on Windows (Git Bash) and macOS/Linux

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null)
TOOL=$(echo "$INPUT" | jq -r '.tool // ""' 2>/dev/null)

# Skip if not Bash or not git command
if [[ "$TOOL" != "Bash" ]] || ! echo "$COMMAND" | grep -q "git"; then
    exit 0
fi

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")

# No commits on main/master
if [[ "$COMMAND" =~ git[[:space:]]+commit ]]; then
    if [[ "$CURRENT_BRANCH" == "main" ]] || [[ "$CURRENT_BRANCH" == "master" ]]; then
        echo "" >&2
        echo "BLOCKED: Cannot commit directly to $CURRENT_BRANCH" >&2
        echo "Create feature branch first: git checkout -b feat/[name]" >&2
        exit 2
    fi
fi

# No push to main/master
if [[ "$COMMAND" =~ git[[:space:]]+push ]] && [[ "$COMMAND" =~ origin[[:space:]]+(main|master) ]]; then
    echo "BLOCKED: Cannot push directly to main/master" >&2
    exit 2
fi

# No force push
if [[ "$COMMAND" =~ git[[:space:]]+push.*(-f|--force) ]]; then
    echo "BLOCKED: Force push is forbidden" >&2
    exit 2
fi

# No --amend
if [[ "$COMMAND" =~ git[[:space:]]+commit.*--amend ]]; then
    echo "BLOCKED: git commit --amend is forbidden" >&2
    exit 2
fi

exit 0
