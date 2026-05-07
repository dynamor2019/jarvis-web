import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function PATCH(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  try {
    const bearer = request.headers.get('authorization')?.replace('Bearer ', '') || ''
    const payload = bearer ? verifyToken(bearer) : null
    if (!payload?.userId) return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })

    const body = await request.json()
    const { code } = await context.params
    const raw = decodeURIComponent(code || '')
    const variants = Array.from(new Set([raw, raw.toUpperCase(), raw.toLowerCase()])).filter(Boolean)
    const found = await prisma.referralCode.findFirst({ where: { OR: variants.map(v => ({ code: v })) } })
    if (!found) return NextResponse.json({ success: false, error: '推荐码不存在' }, { status: 404 })

    const editor = await prisma.user.findUnique({ where: { id: payload.userId } })
    const isOwner = found.creatorId === payload.userId
    const isAdmin = editor?.role === 'admin'
    if (!isOwner && !isAdmin) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })

    const cols = await prisma.$queryRawUnsafe<any[]>("PRAGMA table_info('ReferralCode')")
    const names = Array.isArray(cols) ? cols.map((r: any) => r.name) : []
    const data: any = {}
    if (Object.prototype.hasOwnProperty.call(body, 'source') && typeof body.source === 'string') {
      const val = body.source.trim()
      if (names.includes('source')) data.source = val.length ? val : null
    }
    if (Object.prototype.hasOwnProperty.call(body, 'note') && typeof body.note === 'string') {
      const val = body.note.trim()
      if (names.includes('note')) data.note = val.length ? val : null
    }
    if (!Object.keys(data).length) {
      const missing = (!names.includes('source') || !names.includes('note'))
      const err = missing ? '数据库未迁移：缺少字段source/note' : '缺少更新内容'
      const code = missing ? 422 : 400
      return NextResponse.json({ success: false, error: err }, { status: code })
    }
    const updated = await prisma.referralCode.update({ where: { code: found.code }, data })
    return NextResponse.json({ success: true, code: updated })
  } catch (e: any) {
    console.error('[referral.code.patch] error', e)
    const msg = e?.message || '服务器错误'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  try {
    const bearer = request.headers.get('authorization')?.replace('Bearer ', '') || ''
    const payload = bearer ? verifyToken(bearer) : null
    if (!payload?.userId) return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })

    const { code } = await context.params
    const raw = decodeURIComponent(code || '')
    const variants = Array.from(new Set([raw, raw.toUpperCase(), raw.toLowerCase()])).filter(Boolean)
    const found = await prisma.referralCode.findFirst({ where: { OR: variants.map(v => ({ code: v })) } })
    if (!found) return NextResponse.json({ success: false, error: '推荐码不存在' }, { status: 404 })

    const editor = await prisma.user.findUnique({ where: { id: payload.userId } })
    const isOwner = found.creatorId === payload.userId
    const isAdmin = editor?.role === 'admin'
    if (!isOwner && !isAdmin) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })

    await prisma.referralCode.delete({ where: { code: found.code } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[referral.code.delete] error', e)
    const msg = e?.message || '服务器错误'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  try {
    const bearer = request.headers.get('authorization')?.replace('Bearer ', '') || ''
    const payload = bearer ? verifyToken(bearer) : null
    if (!payload?.userId) return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
    const { code } = await context.params
    const raw = decodeURIComponent(code || '')
    const variants = Array.from(new Set([raw, raw.toUpperCase(), raw.toLowerCase()])).filter(Boolean)
    let found: any = null
    try {
      if ((prisma as any).referralCode && (prisma as any).referralCode.findFirst) {
        found = await prisma.referralCode.findFirst({ where: { OR: variants.map(v => ({ code: v })) } })
      }
    } catch {}
    if (!found) {
      const userByCode = await prisma.user.findFirst({ where: { OR: variants.map(v => ({ referralCode: v })) } })
      if (userByCode) {
        found = { code: userByCode.referralCode, creatorId: userByCode.id, uses: await prisma.user.count({ where: { referredBy: userByCode.id } }), maxUses: userByCode.role === 'admin' ? 999999 : 1, createdAt: userByCode.createdAt }
      }
    }
    if (!found) return NextResponse.json({ success: false, error: '推荐码不存在' }, { status: 404 })
    const editor = await prisma.user.findUnique({ where: { id: payload.userId } })
    const isOwner = found.creatorId === payload.userId
    const isAdmin = editor?.role === 'admin'
    if (!isOwner && !isAdmin) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })
    return NextResponse.json({ success: true, code: found })
  } catch (e: any) {
    console.error('[referral.code.get] error', e)
    const msg = e?.message || '服务器错误'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
