import { NextResponse } from 'next/server'
import { upsertPlugin } from '@/lib/pluginCatalog'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = body?.plugin_id || ''
    const name = body?.name || id
    const version = body?.version || '1.0.0'
    const price = Number(body?.price ?? 0)
    const b64 = body?.pkg_base64 || ''
    if (!id || !b64) return NextResponse.json({ success: false, error: 'missing_params' }, { status: 400 })
    const buf = Buffer.from(b64, 'base64')
    const obj = JSON.parse(buf.toString('utf8'))
    const manifest = obj.manifest
    const payload = obj.payload
    const publisherKeyId = obj.publisher_key_id || ''
    const devAlgo = obj.dev_algo || ''
    const devSignature = obj.dev_signature || ''
    if (!publisherKeyId || !devAlgo || !devSignature) return NextResponse.json({ success: false, error: 'missing_signature' }, { status: 400 })
    if (manifest?.id !== id) return NextResponse.json({ success: false, error: 'id_mismatch' }, { status: 400 })
    const keysJson = process.env.JARVIS_PUBLISHER_KEYS || '{}'
    let keys: Record<string, string> = {}
    try { keys = JSON.parse(keysJson) } catch { keys = {} }
    const pem = keys[publisherKeyId]
    if (!pem) return NextResponse.json({ success: false, error: 'unknown_publisher_key' }, { status: 400 })
    const signatureBody = Buffer.from(JSON.stringify({ manifest, payload }), 'utf8')
    const verify = crypto.createVerify('RSA-SHA256')
    verify.update(signatureBody)
    verify.end()
    const ok = verify.verify(pem, Buffer.from(devSignature, 'base64'))
    if (!ok) return NextResponse.json({ success: false, error: 'invalid_signature' }, { status: 400 })
    upsertPlugin({ id, name, version, price, manifest, payload, publisher_key_id: publisherKeyId, dev_algo: devAlgo, dev_signature: devSignature })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'bad_request' }, { status: 400 })
  }
}
