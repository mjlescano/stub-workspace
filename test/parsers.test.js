import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseBunLock, parseNpmLock } from '../src/parsers.js'

test('parseBunLock skips root and returns workspaces', () => {
  const text = `{
    "workspaces": {
      "": { "name": "root" },
      "packages/api": { "name": "@acme/api", "version": "1.0.0" },
      "packages/db":  { "name": "@acme/db",  "version": "0.1.0" },
    },
  }`
  const result = parseBunLock(text)
  assert.deepEqual(result, [
    { path: 'packages/api', name: '@acme/api', version: '1.0.0' },
    { path: 'packages/db', name: '@acme/db', version: '0.1.0' },
  ])
})

test('parseBunLock handles missing version', () => {
  const text = `{
    "workspaces": {
      "packages/foo": { "name": "foo" }
    }
  }`
  const result = parseBunLock(text)
  assert.deepEqual(result, [
    { path: 'packages/foo', name: 'foo', version: undefined },
  ])
})

test('parseBunLock returns empty when no workspaces', () => {
  assert.deepEqual(parseBunLock('{}'), [])
})

test('parseNpmLock skips root and node_modules entries', () => {
  const text = JSON.stringify({
    name: 'root',
    lockfileVersion: 3,
    packages: {
      '': { name: 'root', workspaces: ['packages/*'] },
      'packages/api': { name: '@acme/api', version: '1.0.0' },
      'packages/db': { name: '@acme/db', version: '0.1.0' },
      'node_modules/@acme/api': { resolved: 'packages/api', link: true },
      'node_modules/some-dep': { version: '1.2.3', name: 'some-dep' },
    },
  })
  const result = parseNpmLock(text)
  assert.deepEqual(result, [
    { path: 'packages/api', name: '@acme/api', version: '1.0.0' },
    { path: 'packages/db', name: '@acme/db', version: '0.1.0' },
  ])
})

test('parseNpmLock returns empty when no packages', () => {
  assert.deepEqual(parseNpmLock('{}'), [])
})
