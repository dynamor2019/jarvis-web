import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;

        if (!code) {
            return NextResponse.json({ error: '请提供推荐码' }, { status: 400 });
        }

        const raw = (code || '').trim();
        
        const variants = Array.from(new Set([raw, raw.toUpperCase(), raw.toLowerCase()])).filter(Boolean);

        // 1. 尝试查询 ReferralCode 表
        
        const referralCode = await prisma.referralCode.findFirst({
            where: { OR: variants.map(v => ({ code: v })) },
            include: {
                creator: {
                    select: {
                        username: true,
                        name: true,
                    }
                }
            }
        });
        

        if (referralCode) {
            if (referralCode.maxUses > 0 && referralCode.uses >= referralCode.maxUses) {
                return NextResponse.json({ error: '推荐码已达到最大使用次数' }, { status: 400 });
            }
            return NextResponse.json({
                code: referralCode.code,
                creator: referralCode.creator.name || referralCode.creator.username,
                uses: referralCode.uses,
                maxUses: referralCode.maxUses,
                note: referralCode.note
            });
        }

        // 2. 尝试查询 User 表 (referralCode 字段)
        const referrerByUserCode = await prisma.user.findFirst({
            where: { OR: variants.map(v => ({ referralCode: v })) },
            select: { username: true, name: true }
        });

        if (referrerByUserCode) {
            return NextResponse.json({
                code: raw,
                creator: referrerByUserCode.name || referrerByUserCode.username,
                uses: 0,
                maxUses: 0,
                note: 'User Referral Code'
            });
        }

        // 3. 尝试解析 admin-xxx 格式或直接查询用户名
        const parts = raw.split('-');
        if (parts.length >= 3) {
            const prefix = parts[0];
            
            const byName = await prisma.user.findFirst({
                where: { OR: [prefix, prefix.toUpperCase(), prefix.toLowerCase()].map(v => ({ username: v })) },
                select: { username: true, name: true }
            });
            
            
            // 如果找不到特定用户，且前缀是 ADMIN，则查找任意管理员
            let target = byName;
            if (!target && prefix.toUpperCase() === 'ADMIN') {
                
                target = await prisma.user.findFirst({
                    where: { role: 'admin' },
                    select: { username: true, name: true }
                });
                
            }

            if (target) {
                return NextResponse.json({
                    code: raw,
                    creator: target.name || target.username,
                    uses: 0,
                    maxUses: 0,
                    note: 'System Generated Code'
                });
            }
        }

        return NextResponse.json({ error: '推荐码无效' }, { status: 404 });

    } catch (error) {
        console.error('验证推荐码失败:', error);
        return NextResponse.json({ error: '验证推荐码失败' }, { status: 500 });
    }
}
