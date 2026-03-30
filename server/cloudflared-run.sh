#!/bin/bash
# Fix WSL2 cgroup D-state: Go automaxprocs reads /proc/self/cgroup causing hang
export GOMAXPROCS=32
# Wrapper to keep cloudflared running — systemd Restart=always has edge cases
# This loop ensures cloudflared restarts on any exit (code 0, crash, etc.)
while true; do
    /usr/bin/cloudflared --no-autoupdate --config /etc/cloudflared/config.yml tunnel run
    echo "[cloudflared-run] exited with code $?, restarting in 5s..."
    sleep 5
done
