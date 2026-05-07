import { NextResponse } from 'next/server'
import crypto from 'crypto'

function parseLicense(license: string) {
  const parts = license.split('|')
  if (parts.length !== 4) return null
  const [pid, uid, expStr, sig] = parts
  const expires = Number(expStr)
  if (!pid || !uid || !expires || !sig) return null
  return { pluginId: pid, userId: uid, expires, sig }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const pluginId = body?.plugin_id || ''
    const license = body?.license || ''
    const licenseAlgo = body?.license_algo || ''
    const licenseSig = body?.license_signature || ''
    if (!pluginId || (!license && !licenseSig)) return NextResponse.json({ valid: false, reason: 'missing_params' }, { status: 400 })
    if (licenseSig && licenseAlgo === 'RSA-SHA256') {
      const base = body?.license_base || ''
      if (!base) return NextResponse.json({ valid: false, reason: 'missing_base' }, { status: 400 })
      const pub = process.env.PKG_RSA_PUBLIC_PEM || ''
      if (!pub) return NextResponse.json({ valid: false, reason: 'no_public_key' }, { status: 400 })
      const parts = base.split('|')
      if (parts.length !== 3) return NextResponse.json({ valid: false, reason: 'bad_base' }, { status: 400 })
      const [pid, uid, expStr] = parts
      const expires = Number(expStr)
      if (pid !== pluginId) return NextResponse.json({ valid: false, reason: 'plugin_mismatch' }, { status: 400 })
      const verify = crypto.createVerify('RSA-SHA256')
      verify.update(Buffer.from(base, 'utf8'))
      verify.end()
      const ok = verify.verify(pub, Buffer.from(licenseSig, 'base64'))
      const notExpired = Date.now() <= expires
      return NextResponse.json({ valid: ok && notExpired, reason: ok ? (notExpired ? undefined : 'expired') : 'signature_invalid' })
    } else {
      const parsed = parseLicense(license)
      if (!parsed) return NextResponse.json({ valid: false, reason: 'bad_license' }, { status: 400 })
      if (parsed.pluginId !== pluginId) return NextResponse.json({ valid: false, reason: 'plugin_mismatch' }, { status: 400 })
      const secret = process.env.PKG_SIGN_SECRET || 'dev-pkg-secret'
      const base = `${parsed.pluginId}|${parsed.userId}|${parsed.expires}`
      const sig = crypto.createHmac('sha256', secret).update(base).digest('base64url')
      const notExpired = Date.now() <= parsed.expires
      const ok = sig === parsed.sig && notExpired
      return NextResponse.json({ valid: ok, reason: ok ? undefined : (notExpired ? 'signature_invalid' : 'expired') })
    }
  } catch {
    return NextResponse.json({ valid: false, reason: 'bad_request' }, { status: 400 })
  }
}
