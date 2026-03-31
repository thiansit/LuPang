# bash set -eo pipefail: Silent Subshell Death in CI

**Date**: 2026-03-31
**Context**: OCC GitLab CI `package-and-import` job — 16 background subshells all failing in <10ms
**Confidence**: High

## Key Learning

When a shell runs with `set -eo pipefail`, any command substitution that produces a non-zero exit code will silently terminate the script. The trap is subtle: `grep -v pattern` exits with code 1 when its input is empty (no lines matched = no output = exit 1). So a line like:

```bash
JAR=$(ls services/$svc/target/*.jar 2>/dev/null | grep -v sources | head -1)
```

…will kill the subshell when no JARs exist, because `grep -v` receives empty stdin and exits 1. With `set -e`, this is treated as a fatal error. In a background subshell (`(cmd) &`), there is zero output — the subshell just dies before printing anything.

The second class of silent failure: when a CI runner (e.g., gitlab-runner) tries to redirect output to a file owned by a different user with `rw-r--r--` permissions, the redirect fails with permission denied. This also causes an immediate subshell exit with no useful trace. The fix is to either use unique per-run filenames (`/tmp/build-$CI_JOB_ID-$svc.log`) or clean stale files at the start of the job.

## The Pattern

```bash
# WRONG (will exit when ls finds nothing):
JAR=$(ls services/$svc/target/*.jar 2>/dev/null | grep -v sources | grep -v javadoc | head -1)

# CORRECT (|| suppresses the pipefail exit):
JAR=$(ls services/$svc/target/*.jar 2>/dev/null | grep -v sources | grep -v javadoc | head -1) || JAR=""

# Also correct (redirect capture with fallback):
OUTPUT=$(some_command 2>&1) || OUTPUT=""

# Defensive subshell cleanup for CI (add as first step):
sudo rm -f /tmp/build-*.log   # prevent stale ownership from blocking writes
```

To correctly simulate gitlab-runner shell behavior:
```bash
# WRONG (HOME stays as current user's home):
sudo -u gitlab-runner bash -eo pipefail

# CORRECT (HOME switches to gitlab-runner's home):
sudo -Hu gitlab-runner bash -eo pipefail << 'HEREDOC'
  set -eo pipefail
  # ... your test code
HEREDOC
```

## Why This Matters

This class of bug is especially painful in CI because:
1. The failure happens in background subshells (`&`) — no output, no stack trace, just exit code
2. The failure is timing-dependent — it only triggers when certain files don't exist (e.g., no JARs on first run, or for unchanged services)
3. The fix is a one-character change (`|| VAR=""`) but finding it requires understanding bash pipefail semantics deeply

File ownership issues are a second invisible class: they appear only on machines where both developers and CI runners share the same filesystem. Traditional CI (docker runners) can't hit this because each job gets a clean container. Shell runners with shared `/tmp` are vulnerable.

Both bugs produce identical symptoms: "subshell exited non-zero immediately with no output."

## Tags

`bash`, `pipefail`, `ci`, `gitlab-runner`, `debugging`, `shell`, `k3s`, `silent-failure`
