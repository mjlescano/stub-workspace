import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateWorkspaceStubs } from '../../src/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const exampleDir = resolve(__dirname, '../../examples/npm')

function withDockerLayer(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'stub-int-npm-'))
  try {
    cpSync(join(exampleDir, 'package.json'), join(dir, 'package.json'))
    cpSync(
      join(exampleDir, 'package-lock.json'),
      join(dir, 'package-lock.json'),
    )
    return fn(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

test('npm example: generates a stub for every workspace', () => {
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

test('npm example: stubs preserve dependency declarations', () => {
  withDockerLayer((dir) => {
    generateWorkspaceStubs({ cwd: dir, silent: true })

    const api = JSON.parse(
      readFileSync(join(dir, 'packages/api/package.json'), 'utf8'),
    )
    assert.deepEqual(api, {
      name: '@example/api',
      version: '1.0.0',
      dependencies: {
        '@example/db': '*',
        '@example/utils': '*',
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
        '@example/utils': '*',
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
  'npm example: npm ci succeeds against the stubs',
  { timeout: 120000 },
  () => {
    withDockerLayer((dir) => {
      generateWorkspaceStubs({ cwd: dir, silent: true })
      execFileSync('npm', ['ci'], {
        cwd: dir,
        stdio: 'pipe',
      })
      for (const pkg of [
        '@example/api',
        '@example/db',
        '@example/utils',
        'nanoid',
        'is-plain-object',
        'prettier',
      ]) {
        assert.ok(
          existsSync(join(dir, 'node_modules', pkg)),
          `expected node_modules/${pkg} to exist after install`,
        )
      }
    })
  },
)
