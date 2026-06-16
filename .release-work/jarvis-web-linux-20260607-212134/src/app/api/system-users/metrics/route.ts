import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type DocStruct = {
  base?: { age?: number; province?: { code?: string } };
  industry?: { code?: string };
  professional?: { major?: { code?: string } };
};

interface SystemUserDocRow {
  provinceCode: string | null;
  industryCode: string | null;
  majorCode: string | null;
  age: number | null;
  createdAt: Date;
  doc?: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceType = searchParams.get('source') || undefined; // 'system_generated' | 'real_user' | 'combined'

    const where: Record<string, unknown> = {};
    // Note: sourceType is not currently in the schema, you may need to add it or remove this logic
    // if (sourceType && sourceType !== 'combined') where.sourceType = sourceType;

    // 读取文档，支持从 JSON 字段回退解析
    const rows = await prisma.systemUserDoc.findMany({
      where,
      select: {
        provinceCode: true,
        industryCode: true,
        majorCode: true,
        age: true,
        createTime: true, // 使用正确的字段名
        doc: true,
      },
      orderBy: { createTime: 'asc' },
    });

    const provinceMap: Record<string, number> = {};
    const industryMap: Record<string, number> = {};
    const majorMap: Record<string, number> = {};

    for (const r of rows) {
      const j: DocStruct = r.doc && typeof r.doc === 'string' ? JSON.parse(r.doc) : {};
      const prov = r.provinceCode || j.base?.province?.code || '';
      const ind = r.industryCode || j.industry?.code || '';
      const maj = r.majorCode || j.professional?.major?.code || '';
      // 仅统计省/行业/专业分布，年龄在后续分桶处理中计算

      if (prov) provinceMap[prov] = (provinceMap[prov] || 0) + 1;
      if (ind) industryMap[ind] = (industryMap[ind] || 0) + 1;
      if (maj) majorMap[maj] = (majorMap[maj] || 0) + 1;
    }

    const provinces: { code: string; count: number }[] = Object.keys(provinceMap).map((code) => ({ code, count: provinceMap[code] }));
    const industries: { code: string; count: number }[] = Object.keys(industryMap).map((code) => ({ code, count: industryMap[code] }));
    const majors: { code: string; count: number }[] = Object.keys(majorMap).map((code) => ({ code, count: majorMap[code] }));

    // 年龄分桶
    const docs: Array<{ age: number }> = rows.map((r) => {
      const jd = r.doc && typeof r.doc === 'string' ? JSON.parse(r.doc) : null;
      return { age: typeof r.age === 'number' ? r.age : (jd?.base?.age ?? 0) };
    });
    const buckets: Record<string, number> = {};
    const ranges = [
      [18, 24], [25, 29], [30, 34], [35, 39], [40, 44], [45, 49], [50, 54], [55, 60], [61, 65]
    ];
    for (const r of ranges) buckets[`${r[0]}-${r[1]}`] = 0;
    for (const d of docs) {
      const a: number = d.age || 0;
      const bucket = ranges.find(r => a >= r[0] && a <= r[1]);
      if (bucket) buckets[`${bucket[0]}-${bucket[1]}`]++;
    }

    // 增长趋势（最近30天）
    const since: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recent: Array<{ createTime: Date }> = rows.filter((r) => r.createTime >= since).map((r) => ({ createTime: r.createTime }));
    const trend: Record<string, number> = {};
    for (const r of recent) {
      const day = r.createTime.toISOString().slice(0, 10);
      trend[day] = (trend[day] || 0) + 1;
    }

    return NextResponse.json({
      province: provinces,
      industry: industries,
      major: majors,
      ageBuckets: buckets,
      trend,
    });
  } catch (error) {
    console.error('获取系统用户指标错误:', error);
    return NextResponse.json({ error: '获取指标失败' }, { status: 500 });
  }
}
