import { createRecord } from '@example/db'
import { describe } from '@example/utils'

export function ingest(value) {
  return { record: createRecord(value), summary: describe(value) }
}
