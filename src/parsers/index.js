import { BunParser } from './bun.js'
import { NpmParser } from './npm.js'

export { BaseParser } from './base.js'
export { BunParser, NpmParser }

/**
 * All registered parser classes, in detection priority order. The first parser
 * whose `filename` exists in the working directory wins.
 *
 * @type {Array<typeof import('./base.js').BaseParser>}
 */
export const parsers = [NpmParser, BunParser]
