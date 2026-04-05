// Policy: Do not modify directly. Explain reason before edits. Last confirm reason: Read only key and value from SystemConfig so invalid legacy updatedAt data no longer breaks admin settings loading an...

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// 获取系统设置
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = verifyToken(token);
    
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Token 无效' }, { status: 401 });
    }

    // 验证管理员权限
    const admin = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true, isActive: true } // 仅查询必要字段
    });

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const configs = await prisma.systemConfig.findMany({
      select: {
        key: true,
        value: true,
      },
    });
    
    // 转换为键值对对象
    const settings: Record<string, string> = {};
    configs.forEach((config: { key: string; value: string }) => {
      settings[config.key] = config.value;
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('获取设置失败:', error);
    return NextResponse.json(
      { error: '获取设置失败' },
      { status: 500 }
    );
  }
}

// 更新系统设置
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Token 无效' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    });

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: '无效的 JSON 数据' }, { status: 400 });
    }

    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: '无效的设置数据' }, { status: 400 });
    }

    // 批量更新或创建
    const updates = Object.entries(settings).map(([key, value]) => {
      // 确保 value 是字符串，处理 null/undefined
      const strValue = value === null || value === undefined ? '' : String(value);
      
      return prisma.systemConfig.upsert({
        where: { key },
        update: { value: strValue },
        create: { key, value: strValue },
      });
    });

    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新设置失败:', error);
    return NextResponse.json(
      { error: '更新设置失败' },
      { status: 500 }
    );
  }
}
