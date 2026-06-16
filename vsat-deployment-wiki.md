# Deploying VSAT on a Linux Server

VSAT can be deployed on a small Linux VPS using Docker Compose. This page covers what you need and the steps to get it running.

## Requirements

- **Disk space: ~6 GB free during build, ~1.7 GB after cleanup.** See [Disk space breakdown](#disk-space-breakdown) below for details.
- **RAM**: 1 GB is sufficient for the app + Postgres containers.
- **Docker and Docker Compose** installed.
- **nginx** (or another reverse proxy) if you need HTTPS for VR/device sensor access.

## Quick start

1. Clone the repo and create a `.env` file:

```bash
git clone https://github.com/holtzermann17/vsat.git
cd vsat
cp .env.example .env  # or create manually — see below
```

2. Minimal `.env`:

```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/vsat
DEV_AUTH_BYPASS=1
DEV_AUTH_BYPASS_EMAIL=dev@localhost
DEV_AUTH_BYPASS_NAME=Dev User
MAGIC_SECRET_KEY=sk_live_YOUR_KEY
MAGIC_PUBLISHABLE_KEY=pk_live_YOUR_KEY
CLOUDINARY_URL=cloudinary://YOUR_CLOUDINARY_URL
```

3. Start the stack:

```bash
docker compose up -d
```

This brings up three containers:
- **VSAT** (Node/Express/Astro SSR) on port 3000
- **DB** (Postgres 17) on port 5432
- **Dozzle** (log viewer) on port 8080

The VSAT container automatically runs migrations on startup.

4. Seed demo content (9 stories with inter-story links):

```bash
npm install          # needed for local tooling
npm run build:server # compile seed script
npm run db:seed:local
```

Then restart the VSAT container so it picks up the seeded data:

```bash
docker restart VSAT
```

5. Visit `http://your-server:3000/story/vsatlatarium?view=planetarium`

## HTTPS with nginx

A-Frame's VR mode and device sensor APIs require a secure context (HTTPS). If you're accessing the site over a public IP, you'll see a warning: *"Access this site over HTTPS to enter VR mode and grant access to the device sensors."*

To fix this, set up nginx as an SSL-terminating reverse proxy. Example config (assuming Let's Encrypt certs):

```nginx
# /etc/nginx/sites-available/vsat
server {
    listen 3443 ssl;
    server_name your-hostname;

    ssl_certificate /etc/letsencrypt/live/your-hostname/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-hostname/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/vsat /etc/nginx/sites-enabled/vsat
sudo nginx -t && sudo systemctl reload nginx
```

For Let's Encrypt setup, see [certbot instructions](https://certbot.eff.org/).

## Disk space breakdown

The Docker build is surprisingly hungry for a web app. Here's where the space goes (as of March 2025):

| Component | Size | Notes |
|-----------|------|-------|
| Docker build cache | **4.5 GB** | `npm ci` + Astro build inside the multi-stage Dockerfile. This is the bulk of the cost — the Node/npm ecosystem pulls ~1,000 packages, and the build stage compiles TypeScript and bundles the Astro site. |
| VSAT image | **1.0 GB** | Ships the full `node_modules` (no devDependency pruning yet) plus compiled output. |
| Postgres image | **625 MB** | `postgres:17-bookworm` base image. |
| Postgres data | **~50 MB** | Actual story data is tiny. |
| **Total during build** | **~6.2 GB** | |
| **After `docker builder prune`** | **~1.7 GB** | Just the two images + data. |

The build cache is fully reclaimable — it's only needed for the initial `docker compose build` (or rebuild). Run `docker builder prune` afterwards to reclaim the 4.5 GB. On a constrained VPS, this matters.

### Reducing the footprint

- **Prune build cache** after building: `docker builder prune`
- **Monitor with** `docker system df` to see where space is going
- The 1 GB VSAT image could potentially be slimmed by pruning devDependencies in the release stage — this hasn't been optimized yet

## Local development (without Docker)

For iterating on code, run directly on the host:

```bash
npm run dev:hot    # Astro dev (4321) + API server (3001)
```

This requires a local Postgres with the `DATABASE_URL` in `.env` pointing to it. See the main README and `npm run run:vsat` for a one-command startup that handles Postgres, migrations, and the dev stack.
