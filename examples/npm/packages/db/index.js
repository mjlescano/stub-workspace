import { nanoid } from 'nanoid'
import { describe } from '@example/utils'

export function createRecord(value) {
  return { id: nanoid(), kind: describe(value), value }
}
