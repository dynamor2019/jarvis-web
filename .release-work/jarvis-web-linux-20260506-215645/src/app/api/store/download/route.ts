import { NextResponse } from 'next/server'
import { StoreRepo } from '@/lib/storeRepo'
import { listPlugins, getPlugin } from '@/lib/pluginCatalog'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token') || ''
    const pluginId = url.searchParams.get('pluginId') || ''
    const version = url.searchParams.get('v') || ''

    if (pluginId) {
      let modulesPath = process.env.JARVIS_PLUGIN_DIR
      if (!modulesPath) {
        const deployPath = join(process.cwd(), 'plugins')
        try {
          await readFile(join(deployPath, `${pluginId}.jarv`))
          modulesPath = deployPath
        } catch {
          modulesPath = join(process.cwd(), '..', 'Jarvis', 'Modules')
        }
      }
      const filePath = join(modulesPath, `${pluginId}.jarv`)
      try {
        const content = await readFile(filePath, 'utf-8')
        const counters: Record<string, number> = (globalThis as any).storeCounters || { receipts: 0, downloads: 0, installs: 0 }
        counters.downloads = (counters.downloads || 0) + 1
        ;(globalThis as any).storeCounters = counters
        return new NextResponse(content, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
      } catch {
        return new NextResponse('not_found', { status: 404 })
      }
    }

    if (!token) return new NextResponse('missing_token', { status: 400 })
    const meta = await StoreRepo.getToken(token)
    if (!meta) return new NextResponse('invalid_token', { status: 400 })
    if (Date.now() > meta.expires) return new NextResponse('expired', { status: 400 })

    const catalogItem = getPlugin(meta.pluginId)
    if (!catalogItem) {
      return NextResponse.json({
        license: 'DEV-LICENSE',
        license_signature: '',
        license_expires_at: meta.expires,
        manifest: {
          id: meta.pluginId,
          name: meta.pluginId,
          version: version || '1.0.0',
          createdBy: meta.userId,
          menus: []
        },
        payload: { files: [] },
        algo: 'HMAC-SHA256',
        signature: ''
      })
    }

    const counters: Record<string, number> = (globalThis as any).storeCounters || { receipts: 0, downloads: 0, installs: 0 }
    counters.downloads = (counters.downloads || 0) + 1
    ;(globalThis as any).storeCounters = counters

    return NextResponse.json({
      license: 'DEV-LICENSE',
      license_signature: '',
      license_expires_at: meta.expires,
      algo: catalogItem.dev_algo || 'HMAC-SHA256',
      signature: catalogItem.dev_signature || '',
      publisher_key_id: catalogItem.publisher_key_id || '',
      manifest: catalogItem.manifest || {
        id: meta.pluginId,
        name: meta.pluginId,
        version: version || '1.0.0',
        createdBy: meta.userId,
        menus: []
      },
      payload: catalogItem.payload || { files: [] }
    })
  } catch {
    return new NextResponse('bad_request', { status: 400 })
  }
}

