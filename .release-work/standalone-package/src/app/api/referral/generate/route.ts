import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// 生成推荐码（普通用户最多6个；管理员不限数量且每个码可无限使用）
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: '未授权' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token无效' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

  const isAdmin = user.role === 'admin';

  let existingCodes: Array<{ code: string; uses: number; maxUses: number; createdAt: any; source?: string | null; note?: string | null }> = []
  try {
    existingCodes = await prisma.referralCode.findMany({
      where: { creatorId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  } catch {
    if ((user as any).referralCode) {
      existingCodes = [{
        code: (user as any).referralCode,
        uses: 0,
        maxUses: isAdmin ? 999999 : 1,
        createdAt: (user as any).createdAt || new Date().toISOString(),
        source: null,
        note: null,
      }]
    }
  }

    if (!isAdmin && existingCodes.length >= 6) {
      return NextResponse.json({ success: true, codes: existingCodes });
    }

    const body = await request.json().catch(() => ({} as any))
    const customCode = typeof body?.code === 'string' ? String(body.code).trim() : ''
    const customSource = typeof body?.source === 'string' ? String(body.source).trim() : undefined
    const customNote = typeof body?.note === 'string' ? String(body.note).trim() : undefined

  if (isAdmin && customCode) {
    try {
      const cols = await prisma.$queryRawUnsafe<any[]>("PRAGMA table_info('ReferralCode')")
      const names = Array.isArray(cols) ? cols.map((r: any) => r.name) : []
      const data: any = { code: customCode, creatorId: user.id, maxUses: 999999 }
      if (names.includes('source')) data.source = (customSource && customSource.length) ? customSource : null
      if (names.includes('note')) data.note = (customNote && customNote.length) ? customNote : null
      const created = await prisma.referralCode.create({ data, select: { code: true } })
      const codes = [{ code: created.code, uses: 0, maxUses: 999999, createdAt: new Date().toISOString(), source: customSource, note: customNote }, ...existingCodes]
      return NextResponse.json({ success: true, codes })
    } catch (e: any) {
      const msg = e?.code || e?.message || ''
      if (typeof msg === 'string' && (msg.includes('P2002') || msg.includes('P2021') || msg.includes('table') && msg.includes('does not exist'))) {
        const codes = [...existingCodes]
        if (!codes.find(c => c.code === customCode)) {
          codes.unshift({ code: customCode, uses: 0, maxUses: 999999, createdAt: new Date().toISOString(), source: customSource, note: customNote })
        }
        try {
          await prisma.user.update({ where: { id: user.id }, data: { referralCode: customCode } })
        } catch {}
        return NextResponse.json({ success: true, codes })
      }
      throw e
    }
  }

    const now = new Date();
    const tsReadable = [
      now.getFullYear().toString(),
      (now.getMonth() + 1).toString().padStart(2, '0'),
      now.getDate().toString().padStart(2, '0'),
      now.getHours().toString().padStart(2, '0'),
      now.getMinutes().toString().padStart(2, '0'),
      now.getSeconds().toString().padStart(2, '0'),
    ].join(''); // YYYYMMDDHHmmss
  let created = null as null | { code: string };
  let attempt = 0;
  while (attempt < 10 && !created) {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `${user.username || 'user'}-${rand}-${tsReadable}`;
    try {
      if ((prisma as any).referralCode && (prisma as any).referralCode.create) {
        created = await prisma.referralCode.create({
          data: {
            code,
            creatorId: user.id,
            maxUses: isAdmin ? 999999 : 1,
          },
          select: { code: true },
        });
      } else {
        // Prisma Client 未包含 ReferralCode 模型时的兜底（老环境）
        created = { code }
        try {
          await prisma.user.update({ where: { id: user.id }, data: { referralCode: code } })
        } catch {}
        break
      }
    } catch (e: any) {
      const msg = e?.code || e?.message || '';
      if (typeof msg === 'string' && msg.includes('P2002')) {
        attempt++;
        continue; // 唯一约束冲突，重试生成新码
      }
      if (typeof msg === 'string' && (msg.includes('P2021') || msg.includes('table') && msg.includes('does not exist'))) {
        created = { code }
        try {
          await prisma.user.update({ where: { id: user.id }, data: { referralCode: code } })
        } catch {}
        break
      }
      throw e; // 其他错误直接抛出
    }
  }
  if (!created) {
    return NextResponse.json({ success: false, error: '生成推荐码失败，请稍后重试' }, { status: 500 });
  }

    const codes = [{ code: created.code, uses: 0, maxUses: isAdmin ? 999999 : 1, createdAt: new Date().toISOString(), source: customSource, note: customNote }, ...existingCodes];
    return NextResponse.json({ success: true, codes });
  } catch (error) {
    console.error('生成推荐码错误:', error);
    const message = error instanceof Error ? error.message : '生成推荐码失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
