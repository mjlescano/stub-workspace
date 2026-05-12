import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BunParser } from '../../src/parsers/bun.js'

test('BunParser declares the bun.lock filename', () => {
  assert.equal(BunParser.filename, 'bun.lock')
})

test('BunParser.parse skips root and returns workspaces', () => {
  const text = `{
    "workspaces": {
      "": { "name": "root" },
      "packages/api": { "name": "@acme/api", "version": "1.0.0" },
      "packages/db":  { "name": "@acme/db",  "version": "0.1.0" },
    },
  }`
  const result = BunParser.parse(text)
  assert.deepEqual(result, [
    { path: 'packages/api', name: '@acme/api', version: '1.0.0' },
    { path: 'packages/db', name: '@acme/db', version: '0.1.0' },
  ])
})

test('BunParser.parse handles missing version', () => {
  const text = `{
    "workspaces": {
      "packages/foo": { "name": "foo" }
    }
  }`
  const result = BunParser.parse(text)
  assert.deepEqual(result, [{ path: 'packages/foo', name: 'foo' }])
})

test('BunParser.parse preserves dependency maps', () => {
  const text = `{
    "workspaces": {
      "packages/api": {
        "name": "@acme/api",
        "version": "1.0.0",
        "dependencies": { "lodash": "^4.17.21", "@acme/db": "workspace:*" },
        "devDependencies": { "vitest": "^1.0.0" },
        "peerDependencies": { "react": "^18.0.0" },
        "optionalDependencies": { "fsevents": "^2.3.0" },
        "peerDependenciesMeta": { "react": { "optional": true } },
      },
    },
  }`
  const result = BunParser.parse(text)
  assert.deepEqual(result, [
    {
      path: 'packages/api',
      name: '@acme/api',
      version: '1.0.0',
      dependencies: { lodash: '^4.17.21', '@acme/db': 'workspace:*' },
      devDependencies: { vitest: '^1.0.0' },
      peerDependencies: { react: '^18.0.0' },
      optionalDependencies: { fsevents: '^2.3.0' },
      peerDependenciesMeta: { react: { optional: true } },
    },
  ])
})

test('BunParser.parse returns empty when no workspaces', () => {
  assert.deepEqual(BunParser.parse('{}'), [])
})
