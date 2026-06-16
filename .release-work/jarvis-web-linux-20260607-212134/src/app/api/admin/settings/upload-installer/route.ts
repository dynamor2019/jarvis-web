import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const ALLOWED_EXTENSIONS = new Set(['.exe', '.msi', '.zip', '.7z', '.rar', '.dmg', '.pkg']);
const MAX_SIZE = 1024 * 1024 * 1024; // 1GB

function safeExt(filename: string): string {
  const ext = path.extname(filename || '').toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext) ? ext : '';
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ success: false, error: 'Token 无效' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true },
    });
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, error: '权限不足' }, { status: 403 });
    }

    const form = await request.formData();
    const file = form.get('installer');
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: '请上传安装包文件' }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: '文件大小不合法（最大 1GB）' }, { status: 400 });
    }

    const ext = safeExt(file.name);
    if (!ext) {
      return NextResponse.json({ success: false, error: '不支持的文件类型' }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'installers');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Keep only latest installer package: remove previous uploaded files.
    try {
      const oldFiles = await fs.readdir(uploadsDir);
      for (const oldFile of oldFiles) {
        const oldPath = path.join(uploadsDir, oldFile);
        try {
          const stat = await fs.stat(oldPath);
          if (stat.isFile()) {
            await fs.unlink(oldPath);
          }
        } catch {
          // ignore per-file delete errors
        }
      }
    } catch {
      // ignore cleanup errors and continue upload
    }

    const ts = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
    const finalName = `${ts}_${safeName || `jarvis_installer${ext}`}`;
    const finalPath = path.join(uploadsDir, finalName);

    const bytes = await file.arrayBuffer();
    await fs.writeFile(finalPath, Buffer.from(bytes));

    const urlPath = `/uploads/installers/${finalName}`;
    await prisma.systemConfig.upsert({
      where: { key: 'landing_download_url' },
      update: { value: urlPath },
      create: { key: 'landing_download_url', value: urlPath },
    });

    return NextResponse.json({ success: true, url: urlPath, name: finalName });
  } catch (error) {
    console.error('upload installer failed:', error);
    return NextResponse.json({ success: false, error: '上传失败' }, { status: 500 });
  }
}
