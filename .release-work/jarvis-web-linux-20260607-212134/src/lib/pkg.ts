import crypto from 'crypto'

import { env } from './env';

export type JarvisManifest = {
  id: string
  name: string
  version: string
  createdBy: string
  publisher?: string
  publisher_key_id?: string
  permissions?: string[]
  menus?: Array<{ id: string; title: string; command: string; params?: Record<string,string> }>
}

export type JarvisPayload = {
  files: Array<{ path: string; content?: string }>
}

function hmac(input: Buffer | string, secret: string) {
  return crypto.createHmac('sha256', secret).update(input).digest('base64url')
}
function rsaSign(input: Buffer) {
  const pem = env.PKG_RSA_PRIVATE_PEM
  if (!pem) return null
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(input)
  sign.end()
  return sign.sign(pem).toString('base64')
}

function buildLicense(manifest: JarvisManifest, userId: string, expires: number, secret: string) {
  const base = `${manifest.id}|${userId}|${expires}`
  const sig = hmac(base, secret)
  return `${base}|${sig}`
}

export function buildJarvisPkg(manifest: JarvisManifest, payload: JarvisPayload, userId: string, expires: number) {
  const secret = env.PKG_SIGN_SECRET
  const pkg = { manifest, payload }
  const body = Buffer.from(JSON.stringify(pkg), 'utf8')
  const rsa = rsaSign(body)
  const h = hmac(body, secret)
  const license = buildLicense(manifest, userId, expires, secret)
  const wrapped: any = {
    algo: rsa ? 'RSA-SHA256' : 'HMAC-SHA256',
    signature: rsa || h,
    license,
    license_algo: rsa ? 'RSA-SHA256' : 'HMAC-SHA256',
    license_signature: rsa ? (() => {
      const base = `${manifest.id}|${userId}|${expires}`
      const s = rsaSign(Buffer.from(base, 'utf8'))
      return s || hmac(base, secret)
    })() : undefined,
    license_expires_at: expires,
    manifest,
    payload,
    public_key_id: env.PKG_RSA_PUBLIC_PEM_ID || undefined
  }
  return Buffer.from(JSON.stringify(wrapped), 'utf8')
}

export function verifyJarvisPkg(data: Buffer) {
  try {
    const secret = env.PKG_SIGN_SECRET
    const obj = JSON.parse(data.toString('utf8')) as any
    const inner = { manifest: obj.manifest, payload: obj.payload }
    const innerBuf = Buffer.from(JSON.stringify(inner), 'utf8')
    if (obj.algo === 'RSA-SHA256') {
      const pub = env.PKG_RSA_PUBLIC_PEM
      if (!pub) return { valid: false }
      const verify = crypto.createVerify('RSA-SHA256')
      verify.update(innerBuf)
      verify.end()
      const ok = verify.verify(pub, Buffer.from(obj.signature, 'base64'))
      return { valid: ok, manifest: obj.manifest, license: obj.license, license_expires_at: obj.license_expires_at }
    } else {
      const sig = hmac(innerBuf, secret)
      const valid = sig === obj.signature && obj.algo === 'HMAC-SHA256'
      return { valid, manifest: obj.manifest, license: obj.license, license_expires_at: obj.license_expires_at }
    }
  } catch {
    return { valid: false }
  }
}
