#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { generateWorkspaceStubs } from '../src/index.js'

const HELP = `generate-workspace-stubs [options]

Options:
  --cwd <path>       Working directory (default: process.cwd())
  --lockfile <path>  Explicit lockfile path (auto-detected if omitted)
  --dry-run          Print paths without writing files
  --silent           Suppress output
  -h, --help         Show this help
`

const { values } = parseArgs({
  options: {
    cwd: { type: 'string' },
    lockfile: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    silent: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
})

if (values.help) {
  process.stdout.write(HELP)
  process.exit(0)
}

try {
  generateWorkspaceStubs({
    cwd: values.cwd,
    lockfile: values.lockfile,
    dryRun: values['dry-run'],
    silent: values.silent,
  })
} catch (err) {
  process.stderr.write(`${err.message}\n`)
  process.exit(1)
}
