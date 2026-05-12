/**
 * A workspace entry extracted from a lockfile.
 *
 * @typedef {object} Workspace
 * @property {string} path - Workspace directory path, relative to the repo root.
 * @property {string} name - The workspace's `package.json` `name` field.
 * @property {string} [version] - The workspace's `version`, when the lockfile records it.
 */

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
   * Parse raw lockfile contents into workspace entries.
   *
   * @param {string} text - Raw lockfile contents.
   * @returns {Workspace[]}
   */
  static parse(text) {
    throw new Error(`${this.name}.parse() must be implemented by a subclass`)
  }
}
