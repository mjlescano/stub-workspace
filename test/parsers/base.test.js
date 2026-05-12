import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BaseParser } from '../../src/parsers/base.js'

test('BaseParser.parse throws when called directly', () => {
  assert.throws(() => BaseParser.parse(''), /must be implemented by a subclass/)
})
