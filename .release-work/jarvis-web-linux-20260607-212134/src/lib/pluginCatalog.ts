type StoredPlugin = {
  id: string
  name: string
  version: string
  price: number
  manifest: any
  payload: any
  publisher_key_id?: string
  dev_algo?: string
  dev_signature?: string
}

const catalog: Map<string, StoredPlugin> = (globalThis as any).pluginCatalog || new Map()
;(globalThis as any).pluginCatalog = catalog

export function upsertPlugin(p: StoredPlugin) {
  catalog.set(p.id, p)
}

export function getPlugin(id: string) {
  return catalog.get(id) || null
}

export function listPlugins(): StoredPlugin[] {
  return Array.from(catalog.values())
}
