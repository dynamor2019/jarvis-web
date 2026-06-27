import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const CONFIG_PATH = join(process.cwd(), 'src', 'data', 'skills-config.json');

type SkillItem = {
  id?: string;
  name: string;
  nameEn?: string;
  url: string;
  description: string;
  descriptionEn?: string;
};

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { ok: false, status: 401, error: 'missing authorization' };
  }

  const token = authHeader.replace('Bearer ', '');
  const decoded = verifyToken(token);
  if (!decoded) {
    return { ok: false, status: 401, error: 'invalid token' };
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { role: true }
  });

  if (!user || user.role !== 'admin') {
    return { ok: false, status: 403, error: 'admin only' };
  }

  return { ok: true, status: 200, userId: decoded.userId };
}

async function readSkillsConfig(): Promise<SkillItem[]> {
  try {
    const raw = await readFile(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeSkill(item: SkillItem, index: number): SkillItem {
  const name = String(item?.name || '').trim();
  const nameEn = String(item?.nameEn || '').trim();
  const url = String(item?.url || '').trim();
  const description = String(item?.description || '').trim();
  const descriptionEn = String(item?.descriptionEn || '').trim();
  const normalizedId = String(item?.id || name || `skill-${index + 1}`)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return {
    id: normalizedId || `skill-${index + 1}`,
    name,
    nameEn,
    url,
    description,
    descriptionEn
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const skills = await readSkillsConfig();
    return NextResponse.json({ success: true, skills });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const skills = Array.isArray(body?.skills) ? body.skills : null;
    if (!skills) {
      return NextResponse.json({ success: false, error: 'skills array is required' }, { status: 400 });
    }

    const normalized = skills
      .map((item: SkillItem, index: number) => normalizeSkill(item, index))
      .filter((item) => item.name && item.url && item.description);

    await writeFile(CONFIG_PATH, JSON.stringify(normalized, null, 2), 'utf-8');
    return NextResponse.json({ success: true, skills: normalized });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'internal error' }, { status: 500 });
  }
}
