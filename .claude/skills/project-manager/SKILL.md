---
name: project-manager
description: Clone and track external repos. Use when user shares GitHub URL to study or develop. Actions - learn (clone for study), incubate (clone for development), find (search repos), list (show tracked).
---

# project-manager

Track and manage external repos: Learn (study) | Incubate (develop)

## Golden Rule

**ghq owns the clone → psi/ owns the symlink**

Never copy. Always symlink. One source of truth.

## When to Use

Invoke this skill when:
- User shares a GitHub URL and wants to study/clone it
- User mentions wanting to learn from a codebase
- User wants to start developing on an external repo
- Need to find where a previously cloned project lives

## Actions

### learn [url|slug]

Clone repo for **study** (read-only reference).

```bash
# 1. Clone via ghq
ghq get -u https://github.com/owner/repo

# 2. Create flat symlink (NOT nested!)
GHQ_ROOT=$(ghq root)
git clone "$GHQ_ROOT/github.com/owner/repo" psi/learn/repo-name
```

**Output**: " Linked [repo] to psi/learn/repo-name"

### incubate [url|slug]

Clone repo for **active development**.

```bash
# Same flow, different target
ghq get -u https://github.com/owner/repo
GHQ_ROOT=$(ghq root)
git clone "$GHQ_ROOT/github.com/owner/repo" psi/incubate/repo-name
```

**Output**: " Linked [repo] to psi/incubate/repo-name"

### find [query]

Search for project across all locations:

```bash
# Search ghq repos
ghq list | grep -i "query"

# Search learn/incubate symlinks
ls -la psi/learn/ psi/incubate/ | grep -i "query"
```

**Output**: List matches with their ghq paths

### list

Show all tracked projects:

```bash
echo " Learn"
ls -la psi/learn/ | grep "^l" | awk '{print "  " $NF " → " $11}'

echo " Incubate"
ls -la psi/incubate/ | grep "^l" | awk '{print "  " $NF " → " $11}'

echo " External (ghq)"
ghq list | grep -v "thiansit/LuPang" | head -10
```

## Directory Structure

```
psi/
├── learn/<slug>     → ~/Code/github.com/owner/repo  (symlink)
└── incubate/<slug>  → ~/Code/github.com/owner/repo  (symlink)

~/Code/               ← ghq root (source of truth)
└── github.com/owner/repo/  (actual clone)
```

## Health Check

When listing, verify symlinks are valid:

```bash
# Check for broken symlinks
find psi/learn psi/incubate -type l ! -exec test -e {} \; -print
```

If broken: `ghq get -u [url]` to restore source.

## Examples

```
# User shares URL
User: "I want to learn from https://github.com/SawyerHood/dev-browser"
→ ghq get -u https://github.com/SawyerHood/dev-browser
→ git clone ~/Code/github.com/SawyerHood/dev-browser psi/learn/dev-browser

# User wants to develop
User: "I want to contribute to claude-mem"
→ ghq get -u https://github.com/thedotmack/claude-mem
→ git clone ~/Code/github.com/thedotmack/claude-mem psi/incubate/claude-mem
```

## Anti-Patterns

|  Wrong |  Right |
|----------|----------|
| `git clone` directly to psi/ | `ghq get` then symlink |
| Nested paths: `psi/learn/repo/github.com/...` | Flat: `psi/learn/repo-name` |
| Copy files | Symlink always |
| Manual clone outside ghq | Everything through ghq |

## Quick Reference

```bash
# Add to learn
ghq get -u URL && git clone "$(ghq root)/github.com/owner/repo" psi/learn/name

# Add to incubate
ghq get -u URL && git clone "$(ghq root)/github.com/owner/repo" psi/incubate/name

# Update source
ghq get -u URL

# Find repo
ghq list | grep name
```
