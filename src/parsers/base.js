/**
 * A workspace entry extracted from a lockfile. The non-`path` fields mirror
 * `package.json` and are written verbatim into the stub.
 *
 * @typedef {object} Workspace
 * @property {string} path - Workspace directory path, relative to the repo root.
 * @property {string} name - The workspace's `package.json` `name` field.
 * @property {string} [version] - The workspace's `version`, when the lockfile records it.
 * @property {Record<string, string>} [dependencies]
 * @property {Record<string, string>} [devDependencies]
 * @property {Record<string, string>} [peerDependencies]
 * @property {Record<string, string>} [optionalDependencies]
 * @property {Record<string, { optional?: boolean }>} [peerDependenciesMeta]
 */

const STUB_FIELDS = [
  'name',
  'version',
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
  'peerDependenciesMeta',
]

/**
 * Abstract base class for lockfile parsers. Subclasses must declare a static
 * `filename` and a static `parse(text)`.
 */
export class BaseParser {
  /**
   * Lockfile basename this parser handles (e.g. `'package-lock.json'`).
   *
   * @type {string}
   */
  static filename = ''

  /**
   * Pick stub-relevant fields from a raw lockfile entry, preserving the
   * conventional `package.json` order so JSON output is stable.
   *
   * @param {Record<string, unknown>} info - Raw entry from the lockfile.
   * @returns {Partial<Workspace>}
   */
  static extractFields(info) {
    const result = {}
    for (const field of STUB_FIELDS) {
      if (info?.[field] != null) result[field] = info[field]
    }
    return result
  }

  /**
   * Parse raw lockfile contents into workspace entries.
   *
   * @param {string} text - Raw lockfile contents.
   * @returns {Workspace[]}
   */
  static parse(text) {
    throw new Error(`${this.name}.parse() must be implemented by a subclass`)
  }
}
