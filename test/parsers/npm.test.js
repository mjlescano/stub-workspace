import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NpmParser } from '../../src/parsers/npm.js'

test('NpmParser declares the package-lock.json filename', () => {
  assert.equal(NpmParser.filename, 'package-lock.json')
})

test('NpmParser.parse skips root and node_modules entries', () => {
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
  const result = NpmParser.parse(text)
  assert.deepEqual(result, [
    { path: 'packages/api', name: '@acme/api', version: '1.0.0' },
    { path: 'packages/db', name: '@acme/db', version: '0.1.0' },
  ])
})

test('NpmParser.parse returns empty when no packages', () => {
  assert.deepEqual(NpmParser.parse('{}'), [])
})

test('NpmParser.parse preserves dependency maps', () => {
  const text = JSON.stringify({
    name: 'root',
    lockfileVersion: 3,
    packages: {
      '': { name: 'root', workspaces: ['packages/*'] },
      'packages/api': {
        name: '@acme/api',
        version: '1.0.0',
        dependencies: { lodash: '^4.17.21', '@acme/db': '*' },
        devDependencies: { vitest: '^1.0.0' },
      },
    },
  })
  const result = NpmParser.parse(text)
  assert.deepEqual(result, [
    {
      path: 'packages/api',
      name: '@acme/api',
      version: '1.0.0',
      dependencies: { lodash: '^4.17.21', '@acme/db': '*' },
      devDependencies: { vitest: '^1.0.0' },
    },
  ])
})
