import { BaseParser } from './base.js'

/**
 * Parses `package-lock.json` (npm v7+). Only workspace paths are returned;
 * the root entry (key `""`) and any `node_modules/*` entries are skipped.
 */
export class NpmParser extends BaseParser {
  static filename = 'package-lock.json'

  static parse(text) {
    const data = JSON.parse(text)
    const packages = data.packages ?? {}
    const result = []
    for (const [path, info] of Object.entries(packages)) {
      if (path === '') continue
      if (path.startsWith('node_modules/')) continue
      if (!info?.name) continue
      result.push({ path, ...BaseParser.extractFields(info) })
    }
    return result
  }
}
