import { BaseParser } from './base.js'

const TRAILING_COMMA = /,(\s*[}\]])/g

/**
 * Parses `bun.lock`. Strips trailing commas before `JSON.parse` because Bun
 * writes JSONC, not strict JSON. The root workspace (key `""`) is skipped.
 */
export class BunParser extends BaseParser {
  static filename = 'bun.lock'

  static parse(text) {
    const stripped = text.replace(TRAILING_COMMA, '$1')
    const data = JSON.parse(stripped)
    const workspaces = data.workspaces ?? {}
    const result = []
    for (const [path, info] of Object.entries(workspaces)) {
      if (path === '') continue
      if (!info?.name) continue
      result.push({ path, name: info.name, version: info.version })
    }
    return result
  }
}
