# Demonstrates Docker layer caching with `generate-workspace-stubs` for a
# Bun monorepo.
#
# Build context: this directory.
# Usage: docker build -t example-bun .
#
# `bunx generate-workspace-stubs` fetches the published CLI. If the
# package isn't published yet, copy the tool's `bin/` + `src/` into the
# image instead and run it via `node`.

FROM oven/bun:1 AS deps
WORKDIR /app

# Layer 1 — only invalidates when the lockfile or root package.json
# changes. The stubs are derived from the lockfile, so the install layer
# is cached even when workspace source code changes.
COPY package.json bun.lock ./
RUN bunx -y generate-workspace-stubs
RUN bun install --frozen-lockfile

FROM oven/bun:1 AS app
WORKDIR /app

# Reuse the cached install layer; copying the real source now overwrites
# the stub package.json files with the actual ones.
COPY --from=deps /app/node_modules ./node_modules
COPY . .

CMD ["bun", "packages/api/index.js"]
