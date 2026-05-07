import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const raw = (url.searchParams.get('code') || '').trim()
    if (!raw) return NextResponse.json({ success: false, valid: false, error: 'empty_code' })
    const variants = Array.from(new Set([raw, raw.toUpperCase(), raw.toLowerCase()])).filter(Boolean)
    
    let found: any = null
    try {
      found = await prisma.referralCode.findFirst({ where: { OR: variants.map(v => ({ code: v })) } })
    } catch {}
    if (found) {
      const canUse = found.uses < found.maxUses
      
      return NextResponse.json({ success: true, valid: canUse, meta: { uses: found.uses, maxUses: found.maxUses }, code: found.code, error: canUse ? undefined : 'exhausted' })
    }
    const userMatch = await prisma.user.findFirst({ where: { OR: variants.map(v => ({ referralCode: v })) } })
    if (userMatch) {
      
      return NextResponse.json({ success: true, valid: true, code: raw })
    }
    const parts = raw.split('-')
    if (parts.length >= 3) {
      const prefix = parts[0]
      const userByName = await prisma.user.findFirst({ where: { OR: [prefix, prefix.toUpperCase(), prefix.toLowerCase()].map(v => ({ username: v })) } })
      const adminUser = !userByName ? await prisma.user.findFirst({ where: { role: 'admin' } }) : null
      const refUser = userByName || (prefix.toUpperCase() === 'ADMIN' ? adminUser : null)
      if (refUser) {
        
        return NextResponse.json({ success: true, valid: true, code: raw })
      }
    }
    
    return NextResponse.json({ success: true, valid: false, error: 'not_found' })
  } catch (e) {
    console.error('[referral.validate] error', e)
    return NextResponse.json({ success: false, valid: false, error: 'server_error' }, { status: 500 })
  }
}
