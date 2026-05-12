const TRAILING_COMMA = /,(\s*[}\]])/g

export function parseBunLock(text) {
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

export function parseNpmLock(text) {
  const data = JSON.parse(text)
  const packages = data.packages ?? {}
  const result = []
  for (const [path, info] of Object.entries(packages)) {
    if (path === '') continue
    if (path.startsWith('node_modules/')) continue
    if (!info?.name) continue
    result.push({ path, name: info.name, version: info.version })
  }
  return result
}
