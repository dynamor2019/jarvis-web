import { prisma } from '@/lib/prisma'

const memLogs: Array<{ userId: string; pluginId: string; status: string; reason?: string; ts: number }> = (globalThis as any).memInstallLogs || []
;(globalThis as any).memInstallLogs = memLogs

export async function writeInstallLog(userId: string, pluginId: string, status: string, reason: string | undefined, ts: number) {
  memLogs.push({ userId, pluginId, status, reason, ts })
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO InstallLog (id, userId, pluginId, status, reason, ts) VALUES (?, ?, ?, ?, ?, ?)`,
      cryptoRandomId(), userId, pluginId, status, reason || null, new Date(ts).toISOString()
    )
  } catch {}
}

export async function queryInstallCounts(windowMs: number) {
  const sinceIso = new Date(Date.now() - windowMs).toISOString()
  try {
    const rows: Array<{ c: number }> = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as c FROM InstallLog WHERE ts >= ?`, sinceIso)
    const dbCount = rows?.[0]?.c || 0
    const memCount = memLogs.filter(l => l.ts >= Date.now() - windowMs && l.status === 'installed').length
    return { total: Math.max(dbCount, memCount) }
  } catch {
    const memCount = memLogs.filter(l => l.ts >= Date.now() - windowMs && l.status === 'installed').length
    return { total: memCount }
  }
}

export async function queryInstallLogs(params: { userId?: string; pluginId?: string; fromTs?: number; toTs?: number; limit?: number; offset?: number }) {
  const { userId, pluginId, fromTs, toTs, limit = 50, offset = 0 } = params
  try {
    const where: string[] = []
    const args: any[] = []
    if (userId) { where.push('userId = ?'); args.push(userId) }
    if (pluginId) { where.push('pluginId = ?'); args.push(pluginId) }
    if (fromTs) { where.push('ts >= ?'); args.push(new Date(fromTs).toISOString()) }
    if (toTs) { where.push('ts <= ?'); args.push(new Date(toTs).toISOString()) }
    const sql = `SELECT userId, pluginId, status, reason, ts FROM InstallLog${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY ts DESC LIMIT ? OFFSET ?`
    args.push(limit)
    args.push(offset)
    const rows: Array<any> = await prisma.$queryRawUnsafe(sql, ...args)
    return rows.map(r => ({ userId: r.userId, pluginId: r.pluginId, status: r.status, reason: r.reason || undefined, ts: new Date(r.ts).getTime() }))
  } catch {
    const list = memLogs.filter(l => {
      if (userId && l.userId !== userId) return false
      if (pluginId && l.pluginId !== pluginId) return false
      if (fromTs && l.ts < fromTs) return false
      if (toTs && l.ts > toTs) return false
      return true
    }).sort((a,b)=>b.ts-a.ts).slice(offset, offset + limit)
    return list
  }
}

export async function aggregateInstallLogs(params: { groupBy: 'user'|'plugin'; fromTs?: number; toTs?: number }) {
  const { groupBy, fromTs, toTs } = params
  try {
    const where: string[] = []
    const args: any[] = []
    if (fromTs) { where.push('ts >= ?'); args.push(new Date(fromTs).toISOString()) }
    if (toTs) { where.push('ts <= ?'); args.push(new Date(toTs).toISOString()) }
    const col = groupBy === 'user' ? 'userId' : 'pluginId'
    const sql = `SELECT ${col} as g, COUNT(*) as c FROM InstallLog${where.length ? ' WHERE ' + where.join(' AND ') : ''} GROUP BY ${col} ORDER BY c DESC`
    const rows: Array<any> = await prisma.$queryRawUnsafe(sql, ...args)
    return rows.map(r => ({ key: r.g, count: Number(r.c) }))
  } catch {
    const list = memLogs.filter(l => {
      if (fromTs && l.ts < fromTs) return false
      if (toTs && l.ts > toTs) return false
      return true
    })
    const map = new Map<string, number>()
    for (const l of list) {
      const k = groupBy === 'user' ? l.userId : l.pluginId
      map.set(k, (map.get(k) || 0) + 1)
    }
    return Array.from(map.entries()).map(([key, count]) => ({ key, count })).sort((a,b)=>b.count-a.count)
  }
}

function cryptoRandomId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
