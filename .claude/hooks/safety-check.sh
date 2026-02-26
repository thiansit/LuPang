#!/bin/bash
# Safety check hook - blocks dangerous commands
# Works on Windows (Git Bash) and macOS/Linux

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null)

# Block rm -rf
if echo "$CMD" | grep -qE '(^|;|&&|\|\|)\s*rm\s+-rf\s'; then
  echo "BLOCKED: rm -rf not allowed." >&2
  exit 2
fi

# Block force flags
if echo "$CMD" | grep -qE '(^|;|&&|\|\|)\s*(git|npm|yarn|pnpm)\s+[a-z-]+\s+.*(\s-f(\s|$)|--force(\s|$))'; then
  echo "BLOCKED: Force flags not allowed." >&2
  exit 2
fi

# Block reset --hard
if echo "$CMD" | grep -qE '(^|;|&&|\|\|)\s*git\s+reset\s+--hard'; then
  echo "BLOCKED: git reset --hard not allowed." >&2
  exit 2
fi

# Block git commit --amend
if echo "$CMD" | grep -qE 'git\s+commit\s+.*--amend'; then
  echo "BLOCKED: Never use --amend. Create new commit instead." >&2
  exit 2
fi

exit 0
