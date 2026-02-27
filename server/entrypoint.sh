#!/bin/bash
# Fix authorized_keys permissions on every start
if [ -f /tmp/authorized_keys ]; then
  cp /tmp/authorized_keys /home/dev/.ssh/authorized_keys
  chown dev:dev /home/dev/.ssh/authorized_keys
  chmod 600 /home/dev/.ssh/authorized_keys
fi

exec /usr/sbin/sshd -D
