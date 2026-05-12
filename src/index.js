import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { parseBunLock, parseNpmLock } from './parsers.js'

const PARSERS = {
  'bun.lock': parseBunLock,
  'package-lock.json': parseNpmLock,
}

export const DETECT_ORDER = ['bun.lock', 'package-lock.json']

export function detectLockfile(cwd) {
  for (const name of DETECT_ORDER) {
    if (existsSync(join(cwd, name))) return name
  }
  return null
}

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
