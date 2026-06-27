import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

const ALLOWED_CATEGORIES = new Set(['ai', 'format', 'theme', 'plugin', 'other']);
const ALLOWED_STATUSES = new Set(['pending', 'in_progress', 'completed']);

function normalizeDownloadUrl(value: unknown) {
  const url = typeof value === 'string' ? value.trim() : '';
  if (!url) return '';
  if (url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return '';
}

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const payload = verifyToken(authHeader.substring(7));
  if (!payload?.userId) {
    return null;
  }

  const admin = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true },
  });

  return admin?.role === 'admin' ? admin : null;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '需要管理员权限' }, { status: 403 });
    }

    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const category = ALLOWED_CATEGORIES.has(body.category) ? body.category : 'plugin';
    const status = ALLOWED_STATUSES.has(body.status) ? body.status : 'completed';
    const downloadUrl = normalizeDownloadUrl(body.downloadUrl);

    if (!title || !description) {
      return NextResponse.json({ success: false, error: '缺少功能名称或功能说明' }, { status: 400 });
    }

    if (status === 'completed' && !downloadUrl) {
      return NextResponse.json({ success: false, error: '已完成的功能需要有效下载链接' }, { status: 400 });
    }

    const fullDescription = downloadUrl
      ? `${description}\n\n下载地址：${downloadUrl}`
      : description;

    const feature = await prisma.featureRequest.create({
      data: {
        userId: admin.id,
        type: 'community',
        title,
        description: fullDescription,
        category,
        status,
        priority: status === 'completed' ? 50 : 10,
        upvotes: 0,
        bounty: 0,
        isPaid: false,
      },
    });

    return NextResponse.json({ success: true, request: feature });
  } catch (error) {
    console.error('发布功能失败:', error);
    return NextResponse.json({ success: false, error: '发布功能失败' }, { status: 500 });
  }
}
