#!/bin/bash
# Fix WSL2 cgroup D-state: Go automaxprocs reads /proc/self/cgroup causing hang
export GOMAXPROCS=32
# Inner restart loop — belt-and-suspenders alongside systemd Restart=always
while true; do
    /usr/bin/cloudflared --no-autoupdate --config /etc/cloudflared/config.yml tunnel run
    echo "[cloudflared-run] exited with code $?, restarting in 5s..."
    sleep 5
done
