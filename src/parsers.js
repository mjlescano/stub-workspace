/**
 * A workspace entry extracted from a lockfile.
 *
 * @typedef {object} Workspace
 * @property {string} path - Workspace directory path, relative to the repo root.
 * @property {string} name - The workspace's `package.json` `name` field.
 * @property {string} [version] - The workspace's `version`, when the lockfile records it.
 */

const TRAILING_COMMA = /,(\s*[}\]])/g

/**
 * Parse a `bun.lock` file. Strips trailing commas before `JSON.parse` because
 * Bun writes JSONC, not strict JSON. The root workspace (key `""`) is skipped.
 *
 * @param {string} text - Raw lockfile contents.
 * @returns {Workspace[]}
 */
export function parseBunLock(text) {
  const stripped = text.replace(TRAILING_COMMA, '$1')
  const data = JSON.parse(stripped)
  const workspaces = data.workspaces ?? {}
  const result = []
  for (const [path, info] of Object.entries(workspaces)) {
    if (path === '') continue
    if (!info?.name) continue
    result.push({ path, name: info.name, version: info.version })
  }
  return result
}

/**
 * Parse a `package-lock.json` (npm v7+). Only workspace paths are returned;
 * the root entry (key `""`) and any `node_modules/*` entries are skipped.
 *
 * @param {string} text - Raw lockfile contents.
 * @returns {Workspace[]}
 */
export function parseNpmLock(text) {
  const data = JSON.parse(text)
  const packages = data.packages ?? {}
  const result = []
  for (const [path, info] of Object.entries(packages)) {
    if (path === '') continue
    if (path.startsWith('node_modules/')) continue
    if (!info?.name) continue
    result.push({ path, name: info.name, version: info.version })
  }
  return result
}
