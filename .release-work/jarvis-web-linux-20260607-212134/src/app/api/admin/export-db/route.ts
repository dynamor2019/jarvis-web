import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

type SqliteTable = {
  name: string;
};

function json_replacer(_key: string, value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

async function get_admin_id(request: NextRequest): Promise<string | null> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true },
  });

  if (!user || user.role !== 'admin') {
    return null;
  }

  return user.id;
}

export async function GET(request: NextRequest) {
  try {
    const admin_id = await get_admin_id(request);
    if (!admin_id) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const tables = (await prisma.$queryRawUnsafe(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `)) as SqliteTable[];

    const data: Record<string, unknown[]> = {};
    for (const table of tables) {
      data[table.name] = await prisma.$queryRawUnsafe(`SELECT * FROM "${table.name}"`);
    }

    const exported_at = new Date().toISOString();
    const file_name = `jarvis-db-export-${exported_at.replace(/[:.]/g, '-')}.json`;

    const payload = {
      success: true,
      exportedAt: exported_at,
      exportedBy: admin_id,
      tableCount: tables.length,
      tables: data,
    };

    return new NextResponse(JSON.stringify(payload, json_replacer, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${file_name}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('admin export-db failed:', error);
    return NextResponse.json({ success: false, error: 'EXPORT_FAILED' }, { status: 500 });
  }
}
