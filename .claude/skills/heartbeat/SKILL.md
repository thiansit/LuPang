---
name: heartbeat
description: Daily proactive check - pending tasks, activity review, focus suggestions. Use when user says "heartbeat", "morning check", "daily pulse", or at start of day.
version: 1.0.0
author: Yamimi (Benz)
inspired_by: OpenClaw Heartbeat System
---

# /heartbeat - Daily Proactive Check

Inspired by OpenClaw's heartbeat pattern - proactive daily awareness.

## When to Use

- Start of day / morning routine
- User says "heartbeat", "pulse", "daily check"
- After long break from work
- When feeling lost about priorities

## The Heartbeat Flow

### 1. Gather Context (Parallel)

```bash
# Activity log (last 24h)
tail -20 psi/memory/logs/activity.log

# Current focus
cat psi/inbox/focus-agent-main.md

# Recent commits
git log --oneline -5 --since="24 hours ago"

# Pending retrospective?
ls psi/inbox/.pending-retrospective
```

### 2. Generate Pulse Report

```markdown
## Yamimi Heartbeat — [DATE]

### Last 24 Hours
- Commits: [N]
- Tasks completed: [list]
- Time spent: [estimate]

### Current Focus
[From focus.md]

### Attention Needed
- [ ] Pending retrospective?
- [ ] Uncommitted changes?
- [ ] Stale incubate projects?

### Suggested Focus Today
Based on patterns:
1. [Priority 1]
2. [Priority 2]
3. [Priority 3]

### Proactive Suggestions
- [Thing you might forget]
- [Follow-up from yesterday]
```

### 3. Optional Actions

After pulse report, offer:
- `/rrr` if retrospective pending
- Update focus.md
- Start on suggested task

## Output Format

Keep it concise - this is a pulse check, not a full analysis.
Show actionable items, not just status.

## Philosophy

> "The heartbeat keeps the Oracle alive"

Proactive > Reactive. Check before asked.

## Integration

Works with:
- `/standup` - more detailed morning routine
- `/rrr` - if retrospective needed
- `/recap` - if context refresh needed

## Example

```
User: heartbeat

Yamimi:
 Yamimi Heartbeat — 2026-01-31

 Last 24h: 3 commits, research session complete
 Focus: OpenClaw/SHRIMP research
 Pending: Retrospective not created

 Suggested:
1. Run /rrr to capture learnings
2. Continue Moltbook integration
3. Review incubate/ cleanup

 Don't forget: Issue #3 response posted, await feedback
```

---

*Inspired by OpenClaw Heartbeat System*
*Yamimi v1.0.0*
