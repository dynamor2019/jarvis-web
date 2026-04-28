import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

async function readSkillsConfig() {
  try {
    const configPath = join(process.cwd(), 'src', 'data', 'skills-config.json');
    const raw = await readFile(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any, index: number) => ({
      id: String(item?.id || `skill-${index + 1}`),
      name: String(item?.name || ''),
      nameEn: String(item?.nameEn || ''),
      url: String(item?.url || ''),
      description: String(item?.description || ''),
      descriptionEn: String(item?.descriptionEn || '')
    }));
  } catch (error) {
    console.error('read skills-config.json failed:', error);
    return [];
  }
}

export async function GET() {
  try {
    const skills = await readSkillsConfig();
    return NextResponse.json({ success: true, skills });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'internal error' }, { status: 500 });
  }
}
