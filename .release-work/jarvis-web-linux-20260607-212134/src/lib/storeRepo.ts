import { prisma } from '@/lib/prisma'

type TokenMeta = { userId: string; pluginId: string; expires: number; consumed: boolean }
type LicenseMeta = { pluginId: string; expires: number }

const memTokens: Map<string, TokenMeta> = (globalThis as any).memTokens || new Map()
;(globalThis as any).memTokens = memTokens
const memLicenses: Map<string, Array<LicenseMeta>> = (globalThis as any).memLicenses || new Map()
;(globalThis as any).memLicenses = memLicenses

async function saveToken(token: string, meta: TokenMeta) {
  memTokens.set(token, meta)
  try {
    const repo = (prisma as any).storeToken
    if (!repo) return
    await repo.upsert({ where: { token }, update: { userId: meta.userId, pluginId: meta.pluginId, expires: new Date(meta.expires), consumed: meta.consumed }, create: { token, userId: meta.userId, pluginId: meta.pluginId, expires: new Date(meta.expires), consumed: meta.consumed } })
  } catch {}
}

async function getToken(token: string): Promise<TokenMeta | null> {
  const m = memTokens.get(token)
  if (m) return m
  try {
    const repo = (prisma as any).storeToken
    if (!repo) return null
    const row = await repo.findUnique({ where: { token } })
    if (!row) return null
    return { userId: row.userId, pluginId: row.pluginId, expires: new Date(row.expires).getTime(), consumed: row.consumed }
  } catch {
    return null
  }
}

async function consumeToken(token: string): Promise<TokenMeta | null> {
  const meta = await getToken(token)
  if (!meta) return null
  meta.consumed = true
  memTokens.set(token, meta)
  try {
    const repo = (prisma as any).storeToken
    if (repo) await repo.update({ where: { token }, data: { consumed: true } })
  } catch {}
  return meta
}

async function saveLicense(userId: string, pluginId: string, expires: number) {
  const list = memLicenses.get(userId) || []
  const existed = list.find(x => x.pluginId === pluginId)
  if (existed) existed.expires = Math.max(existed.expires, expires)
  else list.push({ pluginId, expires })
  memLicenses.set(userId, list)
  try {
    const repo = (prisma as any).storeLicense
    if (!repo) return
    await repo.upsert({ where: { user_plugin: { userId, pluginId } }, update: { expires: new Date(expires) }, create: { userId, pluginId, expires: new Date(expires) } })
  } catch {}
}

async function listLicenses(userId: string): Promise<Array<LicenseMeta>> {
  const list = memLicenses.get(userId)
  if (list && list.length) return list
  try {
    const repo = (prisma as any).storeLicense
    if (!repo) return []
    const rows = await repo.findMany({ where: { userId } })
    return rows.map((r: any) => ({ pluginId: r.pluginId, expires: new Date(r.expires).getTime() }))
  } catch {
    return []
  }
}

export const StoreRepo = { saveToken, getToken, consumeToken, saveLicense, listLicenses }
