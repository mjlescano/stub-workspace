import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { parseBunLock, parseNpmLock } from './parsers.js'

/** @typedef {import('./parsers.js').Workspace} Workspace */

const PARSERS = {
  'bun.lock': parseBunLock,
  'package-lock.json': parseNpmLock,
}

/**
 * Lockfile basenames checked in order by {@link detectLockfile}.
 *
 * @type {readonly string[]}
 */
export const DETECT_ORDER = ['bun.lock', 'package-lock.json']

/**
 * Find the first supported lockfile in `cwd`.
 *
 * @param {string} cwd - Directory to search.
 * @returns {string | null} The lockfile basename, or `null` when none is found.
 */
export function detectLockfile(cwd) {
  for (const name of DETECT_ORDER) {
    if (existsSync(join(cwd, name))) return name
  }
  return null
}

/**
 * Read all workspaces declared in a lockfile.
 *
 * @param {object} [options]
 * @param {string} [options.cwd] - Working directory. Defaults to `process.cwd()`.
 * @param {string} [options.lockfile] - Explicit lockfile path; auto-detected when omitted.
 * @returns {Workspace[]}
 * @throws {Error} When no lockfile is found, or the given path has an unsupported basename.
 */
export function readWorkspaces({ cwd = process.cwd(), lockfile } = {}) {
  const resolvedCwd = resolve(cwd)
  let lockfilePath
  if (lockfile) {
    lockfilePath = resolve(resolvedCwd, lockfile)
  } else {
    const detected = detectLockfile(resolvedCwd)
    if (!detected) {
      throw new Error(
        `No lockfile found in ${resolvedCwd}. Looked for: ${DETECT_ORDER.join(', ')}`,
      )
    }
    lockfilePath = resolve(resolvedCwd, detected)
  }
  const parser = PARSERS[basename(lockfilePath)]
  if (!parser) {
    throw new Error(`Unsupported lockfile: ${basename(lockfilePath)}`)
  }
  const text = readFileSync(lockfilePath, 'utf8')
  return parser(text)
}

/**
 * Generate stub `package.json` files for every workspace in the lockfile.
 * Each stub contains only `name` (and `version` when known) — enough to satisfy
 * the package manager's workspace resolution during a cached Docker install.
 *
 * @param {object} [options]
 * @param {string} [options.cwd] - Working directory. Defaults to `process.cwd()`.
 * @param {string} [options.lockfile] - Explicit lockfile path; auto-detected when omitted.
 * @param {boolean} [options.dryRun] - Print paths without writing files.
 * @param {boolean} [options.silent] - Suppress stdout output.
 * @returns {string[]} Absolute paths of the stub files that were (or would be) written.
 */
export function generateWorkspaceStubs(options = {}) {
  const { cwd = process.cwd(), dryRun = false, silent = false } = options
  const workspaces = readWorkspaces(options)
  const resolvedCwd = resolve(cwd)
  const written = []
  for (const ws of workspaces) {
    const dir = resolve(resolvedCwd, ws.path)
    const file = join(dir, 'package.json')
    const stub = { name: ws.name }
    if (ws.version) stub.version = ws.version
    if (!dryRun) {
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, JSON.stringify(stub, null, 2) + '\n')
    }
    written.push(file)
    if (!silent) {
      process.stdout.write(`${dryRun ? 'would write' : 'wrote'} ${file}\n`)
    }
  }
  return written
}
