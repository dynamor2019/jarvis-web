// Policy: Do not modify directly. Explain reason before edits. Last confirm reason: force prisma datasource url to resolved absolute sqlite path for pm2 runtime

import { existsSync } from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

function normalizeFileUrl(filePath: string): string {
  return `file:${filePath.replace(/\\/g, '/')}`
}

function resolvePrismaDatasourceUrl(): string | undefined {
  const rawUrl = process.env.DATABASE_URL?.trim()
  if (!rawUrl) {
    const fallback = '/www/wwwroot/jarvis-web/prisma/jarvis.db'
    return normalizeFileUrl(fallback)
  }

  if (!rawUrl.startsWith('file:')) {
    return rawUrl
  }

  const rawPath = rawUrl.slice('file:'.length)
  const candidates = path.isAbsolute(rawPath)
    ? [rawPath]
    : [
        path.resolve(process.cwd(), rawPath),
        path.resolve(process.cwd(), 'prisma/jarvis.db'),
        path.resolve(process.cwd(), '../prisma/jarvis.db'),
        path.resolve(process.cwd(), '../../prisma/jarvis.db'),
        '/www/wwwroot/jarvis-web/prisma/jarvis.db',
      ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return normalizeFileUrl(candidate)
    }
  }

  return normalizeFileUrl(candidates[0])
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const datasourceUrl = resolvePrismaDatasourceUrl()

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: datasourceUrl
      ? {
          db: {
            url: datasourceUrl,
          },
        }
      : undefined,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
