import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  detectLockfile,
  generateWorkspaceStubs,
  readWorkspaces,
} from '../src/index.js'

function withTempRepo(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'stub-test-'))
  try {
    return fn(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

test('detectLockfile prefers package-lock.json over bun.lock', () => {
  withTempRepo((dir) => {
    writeFileSync(join(dir, 'bun.lock'), '{ "workspaces": {} }')
    writeFileSync(join(dir, 'package-lock.json'), '{}')
    assert.equal(detectLockfile(dir), 'package-lock.json')
  })
})

test('detectLockfile falls back to bun.lock', () => {
  withTempRepo((dir) => {
    writeFileSync(join(dir, 'bun.lock'), '{ "workspaces": {} }')
    assert.equal(detectLockfile(dir), 'bun.lock')
  })
})

test('detectLockfile returns null when no lockfile present', () => {
  withTempRepo((dir) => {
    assert.equal(detectLockfile(dir), null)
  })
})

test('generateWorkspaceStubs writes stubs from bun.lock', () => {
  withTempRepo((dir) => {
    writeFileSync(
      join(dir, 'bun.lock'),
      `{
        "workspaces": {
          "": { "name": "root" },
          "packages/api": { "name": "@acme/api", "version": "1.0.0" },
          "packages/db": { "name": "@acme/db", "version": "0.1.0" },
        },
      }`,
    )
    const written = generateWorkspaceStubs({ cwd: dir, silent: true })
    assert.equal(written.length, 2)

    const apiStub = JSON.parse(
      readFileSync(join(dir, 'packages/api/package.json'), 'utf8'),
    )
    assert.deepEqual(apiStub, { name: '@acme/api', version: '1.0.0' })

    const dbStub = JSON.parse(
      readFileSync(join(dir, 'packages/db/package.json'), 'utf8'),
    )
    assert.deepEqual(dbStub, { name: '@acme/db', version: '0.1.0' })
  })
})

test('generateWorkspaceStubs writes stubs from package-lock.json', () => {
  withTempRepo((dir) => {
    writeFileSync(
      join(dir, 'package-lock.json'),
      JSON.stringify({
        name: 'root',
        lockfileVersion: 3,
        packages: {
          '': { name: 'root', workspaces: ['packages/*'] },
          'packages/api': { name: '@acme/api', version: '1.0.0' },
          'node_modules/@acme/api': { resolved: 'packages/api', link: true },
        },
      }),
    )
    generateWorkspaceStubs({ cwd: dir, silent: true })
    const stub = JSON.parse(
      readFileSync(join(dir, 'packages/api/package.json'), 'utf8'),
    )
    assert.deepEqual(stub, { name: '@acme/api', version: '1.0.0' })
  })
})

test('generateWorkspaceStubs creates intermediate directories', () => {
  withTempRepo((dir) => {
    writeFileSync(
      join(dir, 'bun.lock'),
      `{ "workspaces": { "apps/web/frontend": { "name": "frontend", "version": "0.0.1" } } }`,
    )
    generateWorkspaceStubs({ cwd: dir, silent: true })
    assert.ok(existsSync(join(dir, 'apps/web/frontend/package.json')))
  })
})

test('dryRun does not write files', () => {
  withTempRepo((dir) => {
    writeFileSync(
      join(dir, 'bun.lock'),
      `{ "workspaces": { "packages/api": { "name": "@acme/api", "version": "1.0.0" } } }`,
    )
    const written = generateWorkspaceStubs({
      cwd: dir,
      dryRun: true,
      silent: true,
    })
    assert.equal(written.length, 1)
    assert.equal(existsSync(join(dir, 'packages/api/package.json')), false)
  })
})

test('throws when no lockfile found', () => {
  withTempRepo((dir) => {
    assert.throws(
      () => generateWorkspaceStubs({ cwd: dir, silent: true }),
      /No lockfile found/,
    )
  })
})

test('explicit lockfile path is honored', () => {
  withTempRepo((dir) => {
    writeFileSync(
      join(dir, 'bun.lock'),
      `{ "workspaces": { "packages/api": { "name": "@acme/api", "version": "1.0.0" } } }`,
    )
    const result = readWorkspaces({ cwd: dir, lockfile: 'bun.lock' })
    assert.deepEqual(result, [
      { path: 'packages/api', name: '@acme/api', version: '1.0.0' },
    ])
  })
})

test('stub omits version when missing from lockfile', () => {
  withTempRepo((dir) => {
    writeFileSync(
      join(dir, 'bun.lock'),
      `{ "workspaces": { "packages/api": { "name": "@acme/api" } } }`,
    )
    generateWorkspaceStubs({ cwd: dir, silent: true })
    const stub = JSON.parse(
      readFileSync(join(dir, 'packages/api/package.json'), 'utf8'),
    )
    assert.deepEqual(stub, { name: '@acme/api' })
  })
})
