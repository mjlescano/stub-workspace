import { isPlainObject } from 'is-plain-object'

export function describe(value) {
  return isPlainObject(value) ? 'object' : typeof value
}
