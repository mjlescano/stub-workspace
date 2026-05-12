## Handover: `generate-workspace-stubs` npm library

### Problem

When building Docker images for Bun or Node.js monorepos, a standard caching
optimization is to copy only lockfiles and `package.json` files in an early
layer, run `install`, then copy source files in a later layer. This isolates
the expensive install step behind a cache that only busts when dependencies
change.

In a monorepo, this requires copying every workspace's `package.json`
individually. Today that means manually listing them in the Dockerfile:

```dockerfile
COPY package.json bun.lock ./
COPY packages/foo/package.json packages/foo/package.json
COPY packages/bar/package.json packages/bar/package.json
# ... one line per workspace
RUN bun install
```

Adding or removing a workspace means updating every Dockerfile by hand.
Forgetting one breaks the build.

### Goal

A zero-dependency CLI tool that reads the lockfile, infers all workspace paths
and their `name`/`version`, creates the directory tree, and writes minimal stub
`package.json` files — so the Dockerfile reduces to:

```dockerfile
COPY package.json bun.lock ./
COPY bin/generate-workspace-stubs bin/generate-workspace-stubs
RUN bun bin/generate-workspace-stubs
RUN bun install
```

### Scope

**In scope:**

- `bun.lock` (JSONC — has trailing commas, needs stripping before `JSON.parse`)
- `package-lock.json` (npm workspaces)

**Out of scope for v1:**

- `pnpm-lock.yaml` (pnpm workspaces)
- `yarn.lock` (Berry format is complex)

### How each lockfile encodes workspaces

**`bun.lock`** — JSON with trailing commas. Top-level `workspaces` object maps
directory path → `{ name, version, ... }`. Root workspace has key `""`.

```jsonc
{
  "workspaces": {
    "": { "name": "root" },
    "packages/api": { "name": "@acme/api", "version": "1.0.0" },
    "packages/db": { "name": "@acme/db", "version": "0.1.0" },
  },
}
```

**`package-lock.json` (npm v7+)** — standard JSON. `packages` object;
workspace entries have `"resolved": "packages/foo"` and no `version` key at
the top level. Cross-reference with root `package.json`'s `workspaces` glob
to find workspace paths.

### Stub format

Each stub is the minimum `package.json` that satisfies the package manager's
workspace resolution:

```json
{ "name": "@acme/api", "version": "1.0.0" }
```

### CLI design

```
generate-workspace-stubs [options]

Options:
  --cwd <path>       Working directory (default: process.cwd())
  --lockfile <path>  Explicit lockfile path (auto-detected if omitted)
  --dry-run          Print paths without writing files
  --silent           Suppress output
```

Auto-detection order: `bun.lock` → `package-lock.json`.

### Implementation notes

- Strip trailing commas from `bun.lock` before `JSON.parse`:
  `text.replace(/,(\s*[}\]])/g, '$1')`
- `mkdirSync(path, { recursive: true })` before writing each stub
- Skip the root workspace entry (empty string key in bun.lock)
- Exit with code 1 and a clear message if no lockfile is found

### Publishing

- Package name suggestion: `generate-workspace-stubs` or `monorepo-stub`
- Ship as plain ESM JavaScript with a `bin` entry — no build step
- Should be usable via `npx generate-workspace-stubs` without a prior install
- Pin to zero production dependencies
