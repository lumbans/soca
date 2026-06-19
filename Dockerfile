# Soca — Uptime Kuma 2.4.0 fork
# Self-contained multi-stage build: compile frontend + native deps in a full image,
# then ship a slim runtime. Uses Dockerfile.dockerignore (BuildKit) so it does NOT
# interfere with the upstream docker/ build that relies on the root .dockerignore.
#
# Build:  DOCKER_BUILDKIT=1 docker build -t soca .
# Run:    docker run -d --name soca -p 3001:3001 -v soca-data:/app/data soca

# 1) Build stage — full deps, build frontend, then drop dev deps
FROM node:20-bookworm AS build
WORKDIR /app
# .npmrc carries `legacy-peer-deps=true`, required for `npm ci` to resolve peer deps.
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build \
    && npm prune --omit=dev

# 2) Runtime stage — slim image, just the built app + production deps
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# No apt packages are required for the core app: Node ships its own CA bundle (TLS) and
# ICU (timezones). If you need the ICMP "ping" monitor type, add this line (server needs
# network access to the Debian mirrors):
#   RUN apt-get update && apt-get install -y --no-install-recommends iputils-ping && rm -rf /var/lib/apt/lists/*

# Copy the whole prepared app (node_modules already pruned to prod, dist built).
# Native modules were compiled on bookworm; bookworm-slim shares the same glibc.
COPY --from=build /app /app

EXPOSE 3001
VOLUME /app/data

# Fresh DB is created + all migrations (incl. Soca) run automatically on first start.
CMD ["node", "server/server.js", "--port=3001", "--data-dir=/app/data"]
