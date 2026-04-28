import { NextResponse } from 'next/server';

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.jarvisai.com.cn';

const content = `# 小贾AI（JarvisAI）

小贾AI是面向中文办公场景的智能文档助手，重点能力包括：
- 中文写作与润色
- Word 文档成稿与格式统一
- 多模型接入与按需切换
- Skill 安装/启用机制（写作风格与行业模板增强）

## Public Pages
- Home: ${siteUrl}/
- Features: ${siteUrl}/features
- Docs: ${siteUrl}/docs
- Store: ${siteUrl}/store
- Support: ${siteUrl}/support
- Feedback: ${siteUrl}/feedback

## Product Scope
- 当前重点：Word 场景
- 后续规划：Excel / PowerPoint 扩展

## Crawl Notes
- 可抓取公开页面用于信息理解与摘要
- 登录、后台与私有API路径不提供公开索引
`;

export function GET() {
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
