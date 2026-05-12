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
  assert.deepEqual(result, [
    { path: 'packages/foo', name: 'foo', version: undefined },
  ])
})

test('BunParser.parse returns empty when no workspaces', () => {
  assert.deepEqual(BunParser.parse('{}'), [])
})
