import crypto from 'crypto'

export function releaseFiles(pluginId: string, version: string) {
  return [
    { path: 'README.txt', content: `Jarvis plugin ${pluginId} version ${version}` },
    { path: 'plugin.json', content: JSON.stringify({ id: pluginId, version }) },
    { path: 'CHANGELOG.md', content: `# ${pluginId} ${version}\n- Feature updates.` }
  ]
}

function sha(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex')
}

export function diffFiles(fromFiles: Array<{ path: string; content: string }>, toFiles: Array<{ path: string; content: string }>) {
  const fromMap = new Map(fromFiles.map(f => [f.path, f.content]))
  const toMap = new Map(toFiles.map(f => [f.path, f.content]))
  const changes: Array<{ type: 'add'|'modify'|'delete'; path: string; content?: string; hash?: string }> = []
  const paths = new Set<string>([...fromMap.keys(), ...toMap.keys()])
  for (const p of paths) {
    const a = fromMap.get(p)
    const b = toMap.get(p)
    if (a == null && b != null) changes.push({ type: 'add', path: p, content: b, hash: sha(b) })
    else if (a != null && b == null) changes.push({ type: 'delete', path: p })
    else if (a != b) changes.push({ type: 'modify', path: p, content: b, hash: sha(b!) })
  }
  return changes
}

export function buildRollback(toFiles: Array<{ path: string; content: string }>, fromFiles: Array<{ path: string; content: string }>) {
  const toMap = new Map(toFiles.map(f => [f.path, f.content]))
  const fromMap = new Map(fromFiles.map(f => [f.path, f.content]))
  const changes: Array<{ type: 'add'|'modify'|'delete'; path: string; content?: string; hash?: string }> = []
  const paths = new Set<string>([...toMap.keys(), ...fromMap.keys()])
  for (const p of paths) {
    const a = toMap.get(p)
    const b = fromMap.get(p)
    if (a == null && b != null) changes.push({ type: 'add', path: p, content: b, hash: sha(b) })
    else if (a != null && b == null) changes.push({ type: 'delete', path: p })
    else if (a !== b) changes.push({ type: 'modify', path: p, content: b, hash: sha(b!) })
  }
  return changes
}
