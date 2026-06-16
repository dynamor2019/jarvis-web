import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const bearer = request.headers.get('authorization')?.replace('Bearer ', '') || ''
    if (!bearer) return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
    const payload = verifyToken(bearer)
    if (!payload?.userId) return NextResponse.json({ success: false, error: 'Token 无效' }, { status: 401 })

    const { code } = await request.json()
    if (!code || typeof code !== 'string') return NextResponse.json({ success: false, error: '缺少推荐码' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 })
    if (user.referredBy) return NextResponse.json({ success: false, error: '已绑定推荐关系' }, { status: 400 })
    if ((user as any).id === (user as any).referredBy) return NextResponse.json({ success: false, error: '非法推荐' }, { status: 400 })

    let referrerId: string | null = null
    let matchedCode: any = null
    const raw = (code || '').trim()
    const variants = Array.from(new Set([raw, raw.toUpperCase(), raw.toLowerCase()])).filter(Boolean)
    let found: any = null
    try {
      found = await prisma.referralCode.findFirst({ where: { OR: variants.map(v => ({ code: v })) } })
    } catch {}
    if (found) {
      matchedCode = found
      const canUse = found.uses < found.maxUses
      if (!canUse) return NextResponse.json({ success: false, error: '推荐码已被使用' }, { status: 400 })
      referrerId = found.creatorId
    } else {
      const refUser = await prisma.user.findFirst({ where: { OR: variants.map(v => ({ referralCode: v })) } })
      if (refUser) {
        referrerId = refUser.id
      } else {
        const parts = raw.split('-')
        if (parts.length >= 3) {
          const prefix = parts[0]
          const byName = await prisma.user.findFirst({ where: { OR: [prefix, prefix.toUpperCase(), prefix.toLowerCase()].map(v => ({ username: v })) } })
          const adminUser = !byName ? await prisma.user.findFirst({ where: { role: 'admin' } }) : null
          const target = byName || (prefix.toUpperCase() === 'ADMIN' ? adminUser : null)
          if (target) referrerId = target.id
        }
        if (!referrerId) return NextResponse.json({ success: false, error: '推荐码不存在' }, { status: 404 })
      }
    }

    if (!referrerId || referrerId === user.id) return NextResponse.json({ success: false, error: '非法推荐码' }, { status: 400 })

    const bonus = 10000
    const [referrer, me] = await Promise.all([
      prisma.user.findUnique({ where: { id: referrerId } }),
      prisma.user.findUnique({ where: { id: user.id } }),
    ])
    const meNewTraffic = ((me?.trafficTokenBalance || 0) + bonus)
    const refNewTraffic = ((referrer?.trafficTokenBalance || 0) + bonus)
    const meNew = meNewTraffic + (me?.subscriptionTokenBalance || 0)
    const refNew = refNewTraffic + (referrer?.subscriptionTokenBalance || 0)

    const newMaxUses = (referrer?.role === 'admin') ? 999999 : 1
    let hasReferralTable = true
    try {
      const cols = await prisma.$queryRawUnsafe<any[]>("PRAGMA table_info('ReferralCode')")
      hasReferralTable = Array.isArray(cols) && cols.length > 0
    } catch {
      hasReferralTable = false
    }
    const ops: any[] = [
      prisma.user.update({
        where: { id: user.id },
        data: { referredBy: referrerId, source: 'referral', trafficTokenBalance: meNewTraffic, tokenBalance: meNew }
      }),
      prisma.user.update({
        where: { id: referrerId },
        data: { trafficTokenBalance: refNewTraffic, tokenBalance: refNew }
      }),
      prisma.transaction.create({ data: { userId: user.id, type: 'referral_reward', amount: 0, tokens: bonus, balance: 0, tokenBalance: meNew, description: `使用推荐码绑定，获得 ${bonus} Token奖励` } }),
      prisma.transaction.create({ data: { userId: referrerId!, type: 'referral_reward', amount: 0, tokens: bonus, balance: 0, tokenBalance: refNew, description: `好友使用你的推荐码绑定，获得 ${bonus} Token奖励` } }),
    ]
    if (hasReferralTable) {
      ops.splice(2, 0,
        matchedCode
          ? prisma.referralCode.update({ where: { code: matchedCode.code }, data: { uses: { increment: 1 }, usedAt: new Date(), usedById: matchedCode.maxUses === 1 ? user.id : null } })
          : prisma.referralCode.create({ data: { code: raw, creatorId: referrerId!, uses: 1, maxUses: newMaxUses } })
      )
    }
    await prisma.$transaction(ops)

    return NextResponse.json({ success: true, tokenBalance: meNew })
  } catch (e) {
    console.error('绑定推荐码错误:', e)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}
