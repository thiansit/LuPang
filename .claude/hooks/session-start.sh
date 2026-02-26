#!/bin/bash
# Session Start Hook - Show Oracle context
# Works on Windows (Git Bash) and macOS/Linux

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "=== LuPang Oracle ==="
echo ""

# Show current focus
if [ -f "$PROJECT_ROOT/psi/inbox/focus.md" ]; then
    cat "$PROJECT_ROOT/psi/inbox/focus.md"
    echo ""
fi

# Check pending retrospective
if [ -f "$PROJECT_ROOT/psi/inbox/.pending-retrospective" ]; then
    echo "PENDING RETROSPECTIVE DETECTED"
    echo "Last session had work but no retrospective."
    echo "Run: /rrr"
    echo ""
fi

# Show recent activity
if [ -f "$PROJECT_ROOT/psi/memory/logs/activity.log" ]; then
    echo "--- Recent Activity ---"
    tail -5 "$PROJECT_ROOT/psi/memory/logs/activity.log" 2>/dev/null
    echo ""
fi

echo "Ready. Type /recap for full context."
