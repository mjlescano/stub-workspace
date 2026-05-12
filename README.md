# stub-workspace

Generate minimal `package.json` stubs for every workspace in a monorepo
lockfile, so Docker can cache the dependency-install layer.

## Why

The standard Docker pattern for a Bun or Node monorepo is to copy the lockfile
and every `package.json` first, run `install`, and only then copy the
application source. That way the install layer is cached and only invalidates
when dependencies actually change:

```dockerfile
COPY package.json bun.lock ./
COPY packages/foo/package.json packages/foo/package.json
COPY packages/bar/package.json packages/bar/package.json
# ...one line for every workspace
RUN bun install --frozen-lockfile
```

Adding or renaming a workspace means editing every Dockerfile by hand. Forget
one and the build breaks — silently if the missing workspace happens to be a
transitive consumer.

`stub-workspace` reads the lockfile, infers every workspace path, and writes
minimal `package.json` stubs that contain just enough metadata (name, version,
dependency declarations) for the package manager to resolve the graph
identically:

```dockerfile
COPY package.json bun.lock ./
RUN bunx -y stub-workspace
RUN bun install --frozen-lockfile
```

The stub list is derived from the lockfile, so the Dockerfile never lies about
which workspaces exist.

## Usage

Zero install, via `npx` or `bunx`:

```bash
npx -y stub-workspace
bunx -y stub-workspace
```

The CLI auto-detects the lockfile in the current directory.

## Dockerfile examples

Runnable examples (with real lockfiles) live under
[`examples/bun`](./examples/bun) and [`examples/npm`](./examples/npm).

### Bun monorepo

```dockerfile
FROM oven/bun:1 AS deps
WORKDIR /app

# Layer 1 — only invalidates when the lockfile or root package.json changes.
COPY package.json bun.lock ./
RUN bunx -y stub-workspace
RUN bun install --frozen-lockfile

FROM oven/bun:1 AS app
WORKDIR /app

# Reuse the cached install layer; the real package.json files overwrite the
# stubs when source is copied in.
COPY --from=deps /app/node_modules ./node_modules
COPY . .

CMD ["bun", "packages/api/index.js"]
```

### npm workspaces monorepo

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npx -y stub-workspace
RUN npm ci

FROM node:22-alpine AS app
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

CMD ["node", "packages/api/index.js"]
```

## CLI options

```
stub-workspace [options]

  --cwd <path>       Working directory (default: process.cwd())
  --lockfile <path>  Explicit lockfile path (auto-detected if omitted)
  --dry-run          Print paths without writing files
  --silent           Suppress output
  -h, --help         Show this help
```

Auto-detection order: `package-lock.json` → `bun.lock`.

## Supported lockfiles

- `package-lock.json` (npm v7+)
- `bun.lock` (Bun's JSONC text lockfile)

`yarn.lock` and `pnpm-lock.yaml` aren't supported.

## Stub format

Each stub mirrors what the lockfile recorded for that workspace:

```json
{
  "name": "@example/api",
  "version": "1.0.0",
  "dependencies": {
    "@example/db": "workspace:*",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "vitest": "^1.0.0"
  }
}
```

Preserved fields: `name`, `version`, `dependencies`, `devDependencies`,
`peerDependencies`, `optionalDependencies`, `peerDependenciesMeta`. Workspace
specifiers like `workspace:*` are passed through verbatim so cross-workspace
links resolve against the sibling stubs.

## License

MIT
