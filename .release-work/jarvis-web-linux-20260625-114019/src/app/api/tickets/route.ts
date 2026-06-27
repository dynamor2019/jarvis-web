import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

const ALLOWED_CATEGORIES = ['payment', 'subscription', 'account', 'other'];

function getToken(request: NextRequest): string | null {
  return request.headers.get('authorization')?.replace('Bearer ', '') || null;
}

export async function GET(request: NextRequest) {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token 无效' }, { status: 401 });
    }

    const tickets = await prisma.$queryRaw<Array<{
      id: string;
      userId: string;
      title: string;
      category: string;
      content: string;
      status: string;
      adminReply: string | null;
      repliedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }>>(Prisma.sql`
      SELECT id, userId, title, category, content, status, adminReply, repliedAt, createdAt, updatedAt
      FROM "SupportTicket"
      WHERE userId = ${payload.userId}
      ORDER BY createdAt DESC
    `);

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('获取工单失败:', error);
    return NextResponse.json({ error: '获取工单失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token 无效' }, { status: 401 });
    }

    const body = await request.json();
    const title = String(body?.title || '').trim();
    const content = String(body?.content || '').trim();
    const categoryRaw = String(body?.category || 'other').trim();
    const category = ALLOWED_CATEGORIES.includes(categoryRaw) ? categoryRaw : 'other';

    if (!title || !content) {
      return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 });
    }

    const id = randomUUID();
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO "SupportTicket" (id, userId, title, category, content, status, createdAt, updatedAt)
      VALUES (${id}, ${payload.userId}, ${title}, ${category}, ${content}, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const rows = await prisma.$queryRaw<Array<{
      id: string;
      title: string;
      category: string;
      content: string;
      status: string;
      createdAt: Date;
    }>>(Prisma.sql`
      SELECT id, title, category, content, status, createdAt
      FROM "SupportTicket"
      WHERE id = ${id}
      LIMIT 1
    `);
    const ticket = rows[0];

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error('创建工单失败:', error);
    return NextResponse.json({ error: '创建工单失败' }, { status: 500 });
  }
}
