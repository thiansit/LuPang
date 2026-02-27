# LuPang SSH Server

Docker-based SSH server accessible via Cloudflare Tunnel.

## Setup

### 1. ตั้ง Cloudflare Tunnel

1. ไป [Cloudflare Zero Trust](https://one.dash.cloudflare.com)
2. **Networks → Tunnels → Create a tunnel**
3. ตั้งชื่อ เช่น `lupang-server`
4. เลือก **Docker** → copy token
5. ตั้ง Public Hostname:
   - Subdomain: `ssh`
   - Domain: `yourdomain.com`
   - Service: `SSH` → URL: `ssh-server:22`

### 2. ตั้งค่า .env

```bash
cp .env.example .env
# แก้ TUNNEL_TOKEN ใส่ token จาก Cloudflare
```

### 3. เพิ่ม SSH Public Key

ใส่ public key ของคนที่จะ remote เข้ามาใน `authorized_keys`:

```
ssh-ed25519 AAAAC3... user@machine
```

### 4. รัน

```bash
docker compose up -d
```

---

## วิธี SSH เข้า (ฝั่ง client)

ลง cloudflared ก่อน: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

```bash
ssh dev@ssh.yourdomain.com \
  -o ProxyCommand="cloudflared access ssh --hostname %h"
```

หรือเพิ่มใน `~/.ssh/config`:

```
Host lupang
  HostName ssh.yourdomain.com
  User dev
  ProxyCommand cloudflared access ssh --hostname %h
```

แล้ว `ssh lupang` ได้เลย

---

## Structure

```
server/
├── Dockerfile          Ubuntu + SSH server
├── docker-compose.yml  SSH + cloudflared containers
├── authorized_keys     SSH public keys (tracked — ไม่มี secret)
├── .env                TUNNEL_TOKEN (gitignored)
├── .env.example        Template
└── workspace/          Persistent storage (gitignored)
```
