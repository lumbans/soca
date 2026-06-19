# Soca — Deployment

Customized Uptime Kuma **2.4.0** fork. On a **fresh DB the schema + all Soca migrations
run automatically** on first start (incident lifecycle, incident↔monitor, daily notes) — no
manual SQL. Requires **Node ≥ 20.4.0**.

There are two ways to deploy. Pick one.

---

## Option 1 — Docker (self-contained)

From the project root:

```bash
DOCKER_BUILDKIT=1 docker build -t soca .
docker run -d --name soca \
  -p 3001:3001 \
  -v soca-data:/app/data \
  --restart unless-stopped \
  soca
```

- Frontend is built **inside** the image (`Dockerfile`), using `Dockerfile.dockerignore`
  (does not touch the upstream `docker/` build).
- The named volume `soca-data` keeps the SQLite DB persistent.
- Open `http://SERVER:3001` → first-run setup (choose SQLite, create admin).

---

## Option 2 — rsync + systemd (no Docker)

### One-time server prep
```bash
sudo useradd -r -s /usr/sbin/nologin kuma          # service user
sudo mkdir -p /opt/soca && sudo chown kuma /opt/soca
# install Node 20+ (e.g. via nodesource) and ensure `node` is on PATH
```

### Deploy from your laptop (repeatable)
```bash
SERVER=deploy@your-server ./deploy/deploy.sh
```
This rsyncs the working tree (excluding `node_modules`, `data*`, `dist`), then runs
`npm ci && npm run build` on the server and restarts the service.

### Install the service (first time only, on the server)
```bash
sudo cp /opt/soca/deploy/soca.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now soca
sudo systemctl status soca
```

Adjust `User=`, the node path in `ExecStart=`, port, and `--data-dir` in
`soca.service` to match your server.

---

## Notes
- **Do not copy your local `data/` or `data-v2/`** — those are dev databases. Let the server
  create a fresh one (both deploy paths exclude them).
- Migrations are **DB-agnostic** (knex), so choosing **MariaDB** at setup also works.
- **HTTPS:** put nginx in front, proxy to `:3001`, and forward WebSocket upgrade headers
  (Uptime Kuma uses socket.io):
  ```nginx
  location / {
      proxy_pass http://127.0.0.1:3001;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header Host $host;
  }
  ```
