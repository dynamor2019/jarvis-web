import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

const ALLOWED_STATUS = ['pending', 'processing', 'resolved'];

function getToken(request: NextRequest): string | null {
  return request.headers.get('authorization')?.replace('Bearer ', '') || null;
}

async function requireAdmin(request: NextRequest) {
  const token = getToken(request);
  if (!token) {
    return { error: NextResponse.json({ error: '未授权' }, { status: 401 }) };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { error: NextResponse.json({ error: 'Token 无效' }, { status: 401 }) };
  }

  const admin = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true },
  });

  if (!admin || admin.role !== 'admin') {
    return { error: NextResponse.json({ error: '权限不足' }, { status: 403 }) };
  }

  return { adminId: admin.id };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

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
      username: string;
      email: string;
      name: string | null;
    }>>(status && ALLOWED_STATUS.includes(status)
      ? Prisma.sql`
          SELECT t.id, t.userId, t.title, t.category, t.content, t.status, t.adminReply, t.repliedAt, t.createdAt, t.updatedAt,
                 u.username, u.email, u.name
          FROM "SupportTicket" t
          JOIN "User" u ON u.id = t.userId
          WHERE t.status = ${status}
          ORDER BY t.createdAt DESC
        `
      : Prisma.sql`
          SELECT t.id, t.userId, t.title, t.category, t.content, t.status, t.adminReply, t.repliedAt, t.createdAt, t.updatedAt,
                 u.username, u.email, u.name
          FROM "SupportTicket" t
          JOIN "User" u ON u.id = t.userId
          ORDER BY t.createdAt DESC
        `
    );

    const normalized = tickets.map((item) => ({
      id: item.id,
      userId: item.userId,
      title: item.title,
      category: item.category,
      content: item.content,
      status: item.status,
      adminReply: item.adminReply,
      repliedAt: item.repliedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      user: {
        id: item.userId,
        username: item.username,
        email: item.email,
        name: item.name,
      },
    }));

    return NextResponse.json({ tickets: normalized });
  } catch (error) {
    console.error('管理员获取工单失败:', error);
    return NextResponse.json({ error: '获取工单失败' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const ticketId = String(body?.ticketId || '').trim();
    const statusRaw = String(body?.status || '').trim();
    const reply = String(body?.reply || '').trim();
    const status = ALLOWED_STATUS.includes(statusRaw) ? statusRaw : null;

    if (!ticketId) {
      return NextResponse.json({ error: '缺少工单ID' }, { status: 400 });
    }

    if (!status && !reply) {
      return NextResponse.json({ error: '至少更新状态或回复内容之一' }, { status: 400 });
    }

    const ticket = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id FROM "SupportTicket" WHERE id = ${ticketId} LIMIT 1
    `);

    if (!ticket[0]) {
      return NextResponse.json({ error: '工单不存在' }, { status: 404 });
    }

    if (status && reply) {
      await prisma.$executeRaw(Prisma.sql`
        UPDATE "SupportTicket"
        SET status = ${status}, adminReply = ${reply}, repliedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ${ticketId}
      `);
    } else if (status) {
      await prisma.$executeRaw(Prisma.sql`
        UPDATE "SupportTicket"
        SET status = ${status}, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ${ticketId}
      `);
    } else if (reply) {
      await prisma.$executeRaw(Prisma.sql`
        UPDATE "SupportTicket"
        SET adminReply = ${reply}, repliedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ${ticketId}
      `);
    }

    if (reply) {
      await prisma.$executeRaw(Prisma.sql`
        INSERT INTO "SupportTicketReply" (id, ticketId, authorId, role, content, createdAt)
        VALUES (${randomUUID()}, ${ticketId}, ${auth.adminId!}, 'admin', ${reply}, CURRENT_TIMESTAMP)
      `);
    }

    const rows = await prisma.$queryRaw<Array<{
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
      WHERE id = ${ticketId}
      LIMIT 1
    `);
    const updatedTicket = rows[0];

    return NextResponse.json({ success: true, ticket: updatedTicket });
  } catch (error) {
    console.error('管理员更新工单失败:', error);
    return NextResponse.json({ error: '更新工单失败' }, { status: 500 });
  }
}
