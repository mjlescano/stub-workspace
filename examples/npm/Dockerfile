# Demonstrates Docker layer caching with `generate-workspace-stubs` for an
# npm workspaces monorepo.
#
# Build context: this directory.
# Usage: docker build -t example-npm .
#
# `npx -y generate-workspace-stubs` fetches the published CLI. If the
# package isn't published yet, copy the tool's `bin/` + `src/` into the
# image instead and run it via `node`.

FROM node:22-alpine AS deps
WORKDIR /app

# Layer 1 — only invalidates when the lockfile or root package.json
# changes. The stubs are derived from the lockfile, so the install layer
# is cached even when workspace source code changes.
COPY package.json package-lock.json ./
RUN npx -y generate-workspace-stubs
RUN npm ci

FROM node:22-alpine AS app
WORKDIR /app

# Reuse the cached install layer; copying the real source now overwrites
# the stub package.json files with the actual ones.
COPY --from=deps /app/node_modules ./node_modules
COPY . .

CMD ["node", "packages/api/index.js"]
