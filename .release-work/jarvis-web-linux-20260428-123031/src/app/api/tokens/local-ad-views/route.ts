import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: '未授权' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Token无效' },
        { status: 401 }
      );
    }

    // 适配 Linux/Windows 多环境路径逻辑
    // 优先查找项目根目录或 data 目录下的文件
    const possiblePaths = [
      path.join(process.cwd(), 'ad_views.json'),
      path.join(process.cwd(), 'data', 'ad_views.json'),
      path.join(process.cwd(), 'prisma', 'ad_views.json'),
      // Windows 开发环境回退
      process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Jarvis', 'ad_views.json') : '',
      // Linux/Mac 用户目录回退
      path.join(os.homedir(), '.jarvis', 'ad_views.json')
    ].filter(Boolean);

    let adViews: any[] = [];
    let foundPath = '';

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        foundPath = p;
        try {
          const content = fs.readFileSync(p, 'utf-8');
          adViews = JSON.parse(content);
          
          break;
        } catch (e) {
          
        }
      }
    }

    if (!foundPath) {
      // 
    }

    return NextResponse.json({
      success: true,
      adViews,
      count: adViews.length
    });
  } catch (error) {
    console.error('获取本地ad_views错误:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
