import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateWorkspaceStubs } from '../../src/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const exampleDir = resolve(__dirname, '../../examples/bun')

function withDockerLayer(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'stub-int-bun-'))
  try {
    cpSync(join(exampleDir, 'package.json'), join(dir, 'package.json'))
    cpSync(join(exampleDir, 'bun.lock'), join(dir, 'bun.lock'))
    return fn(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

test('bun example: generates a stub for every workspace', () => {
  withDockerLayer((dir) => {
    const written = generateWorkspaceStubs({ cwd: dir, silent: true })
    assert.equal(written.length, 3)
    assert.deepEqual(written.map((p) => p.replace(dir + '/', '')).sort(), [
      'packages/api/package.json',
      'packages/db/package.json',
      'packages/utils/package.json',
    ])
  })
})

test('bun example: stubs preserve workspace:* specifiers', () => {
  withDockerLayer((dir) => {
    generateWorkspaceStubs({ cwd: dir, silent: true })

    const api = JSON.parse(
      readFileSync(join(dir, 'packages/api/package.json'), 'utf8'),
    )
    assert.deepEqual(api, {
      name: '@example/api',
      version: '1.0.0',
      dependencies: {
        '@example/db': 'workspace:*',
        '@example/utils': 'workspace:*',
      },
      devDependencies: { prettier: '^3.3.0' },
    })

    const db = JSON.parse(
      readFileSync(join(dir, 'packages/db/package.json'), 'utf8'),
    )
    assert.deepEqual(db, {
      name: '@example/db',
      version: '1.0.0',
      dependencies: {
        '@example/utils': 'workspace:*',
        nanoid: '^5.0.0',
      },
    })

    const utils = JSON.parse(
      readFileSync(join(dir, 'packages/utils/package.json'), 'utf8'),
    )
    assert.deepEqual(utils, {
      name: '@example/utils',
      version: '1.0.0',
      dependencies: { 'is-plain-object': '^5.0.0' },
    })
  })
})

test(
  'bun example: bun install --frozen-lockfile succeeds against the stubs',
  { timeout: 120000 },
  () => {
    withDockerLayer((dir) => {
      generateWorkspaceStubs({ cwd: dir, silent: true })
      execFileSync('bun', ['install', '--frozen-lockfile'], {
        cwd: dir,
        stdio: 'pipe',
      })
      // Bun's isolated install symlinks each dep into the consumer's own
      // node_modules — verifying these links proves both external resolution
      // and workspace linking worked.
      const expected = [
        'packages/utils/node_modules/is-plain-object',
        'packages/db/node_modules/nanoid',
        'packages/db/node_modules/@example/utils',
        'packages/api/node_modules/@example/db',
        'packages/api/node_modules/@example/utils',
        'packages/api/node_modules/prettier',
      ]
      for (const p of expected) {
        assert.ok(
          existsSync(join(dir, p)),
          `expected ${p} to exist after bun install`,
        )
      }
    })
  },
)
