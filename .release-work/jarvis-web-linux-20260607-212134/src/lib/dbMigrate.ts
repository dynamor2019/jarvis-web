import { prisma } from '@/lib/prisma'

export async function ensureStoreTables() {
  const stmts = [
    // StoreToken
    `CREATE TABLE IF NOT EXISTS StoreToken (
      token TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      pluginId TEXT NOT NULL,
      expires DATETIME NOT NULL,
      consumed INTEGER NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT (datetime('now'))
    );`,
    `CREATE INDEX IF NOT EXISTS idx_storetoken_user ON StoreToken(userId);`,
    `CREATE INDEX IF NOT EXISTS idx_storetoken_plugin ON StoreToken(pluginId);`,
    `CREATE INDEX IF NOT EXISTS idx_storetoken_expires ON StoreToken(expires);`,
    // StoreLicense
    `CREATE TABLE IF NOT EXISTS StoreLicense (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      pluginId TEXT NOT NULL,
      expires DATETIME NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT (datetime('now'))
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS uniq_storelicense_user_plugin ON StoreLicense(userId, pluginId);`,
    `CREATE INDEX IF NOT EXISTS idx_storelicense_expires ON StoreLicense(expires);`,
    // InstallLog
    `CREATE TABLE IF NOT EXISTS InstallLog (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      pluginId TEXT NOT NULL,
      status TEXT NOT NULL,
      reason TEXT,
      ts DATETIME NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS idx_installlog_user ON InstallLog(userId);`,
    `CREATE INDEX IF NOT EXISTS idx_installlog_plugin ON InstallLog(pluginId);`,
    `CREATE INDEX IF NOT EXISTS idx_installlog_ts ON InstallLog(ts);`
  ]
  for (const sql of stmts) {
    try { await prisma.$executeRawUnsafe(sql) } catch {}
  }
  return { ok: true }
}
