# WSL2 Instability: Check Boot Config Before Services

**Date**: 2026-03-30
**Context**: WSL2 server running GitLab CE, k3s, cloudflared — crashing every 1-2 minutes
**Confidence**: High

## Key Learning

When debugging WSL2 instability, check `/etc/wsl.conf` boot configuration **first**, before investigating services. The `[boot] command` runs as PID ~11 (very early, before systemd) and can start processes that bypass all `systemctl disable` commands. We spent 3 hours disabling gitlab-runner, k3s, Docker, gitlab-runsvdir — while a single line in wsl.conf was starting the fatemate Node.js application on every boot.

The pattern that should have triggered this investigation earlier: WSL2 crashed at a **suspiciously consistent 55-second interval** even after all services were disabled. Consistent timing = scheduled or boot-triggered cause, not random service behavior.

The true root cause was Node.js (inside a Docker container started by the boot command) triggering a `smp_processor_id in preemptible code` kernel bug on WSL2 kernel 6.6.87.2. Once the boot command was commented out and Windows restarted (to clear accumulated kernel taint), WSL2 ran 20+ minutes stable.

## The Pattern

```ini
# /etc/wsl.conf — CHECK THIS FIRST when WSL2 is unstable
[boot]
systemd=true
# This runs as early PID, BEFORE systemd, bypasses systemctl disable:
command = service docker start && cd /opt/fatemate && docker compose up -d
```

**The fix**: comment out or remove the `command =` line, then `wsl --shutdown` to apply.

**Investigation order for WSL2 crashes**:
1. `/etc/wsl.conf` boot command
2. `systemctl list-units --state=active` — what's actually running
3. `ps aux | sort -n` — look at low PIDs (11-25) for surprises
4. Kernel bug pattern: consistent interval = scheduled trigger

## Why This Matters

On WSL2, the `[boot] command` runs with root privileges before systemd and bypasses all service management. Any Go/Ruby/Node.js process started here can trigger kernel bugs (automaxprocs cgroup reads, fork races on WSL2 kernel 6.6.87.2). Always verify boot config is clean before debugging services.

Also: **Windows restart clears accumulated kernel taint**. After many WSL2 crashes, kernel state becomes corrupted (taint: G W) and crashes happen faster. A clean Windows restart is necessary to get reliable diagnostic results.

## Tags

`wsl2`, `debugging`, `kernel-bugs`, `boot-config`, `fatemate`, `gomaxprocs`
