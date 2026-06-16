import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureStorePluginTable, requireAdmin } from '../upload/route';

export const runtime = 'nodejs';

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await requireAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: '需要管理员权限' }, { status: 403 });
    }

    const body = await request.json();
    const pluginId = cleanText(body?.pluginId);
    const name = cleanText(body?.name);
    const version = cleanText(body?.version);
    const description = cleanText(body?.description);
    const price = Number(body?.price);

    if (!pluginId || !name || !version || !description) {
      return NextResponse.json({ success: false, error: '请填写智能体名称、版本号和描述' }, { status: 400 });
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ success: false, error: '费用必须是大于等于 0 的数字' }, { status: 400 });
    }

    await ensureStorePluginTable();
    await prisma.$executeRaw`
      UPDATE "StorePlugin"
      SET "name" = ${name},
          "version" = ${version},
          "price" = ${price},
          "description" = ${description},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${pluginId}
    `;

    return NextResponse.json({
      success: true,
      plugin: { id: pluginId, name, version, price, description },
    });
  } catch (error) {
    console.error('update store plugin failed:', error);
    return NextResponse.json({ success: false, error: '保存失败' }, { status: 500 });
  }
}
