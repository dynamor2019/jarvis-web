import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { adViews } = body;

    if (!Array.isArray(adViews) || adViews.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        message: '没有需要同步的数据'
      });
    }

    // 查询用户
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    // 计算总 Token 数
    const totalTokens = adViews.reduce((sum: number, view: any) => sum + (view.amount || 0), 0);

    // 更新用户 Token 余额
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        trafficTokenBalance: (user.trafficTokenBalance || 0) + totalTokens,
        tokenBalance: (user.trafficTokenBalance || 0) + totalTokens + (user.subscriptionTokenBalance || 0)
      }
    });

    // 记录收入统计
    try {
      const incomeFilePath = path.join(process.cwd(), 'data', 'income_stats.json');
      const dataDir = path.dirname(incomeFilePath);
      
      // 确保目录存在
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // 读取现有数据
      let incomeStats: Record<string, any> = {};
      if (fs.existsSync(incomeFilePath)) {
        try {
          incomeStats = JSON.parse(fs.readFileSync(incomeFilePath, 'utf-8'));
        } catch {}
      }

      // 获取当前的广告观看收入
      const currentAdViewIncome = incomeStats[payload.userId]?.adView || 0;
      const newAdViewIncome = currentAdViewIncome + totalTokens;

      // 更新用户的广告观看收入
      if (!incomeStats[payload.userId]) {
        incomeStats[payload.userId] = { adView: 0, referral: 0 };
      }
      incomeStats[payload.userId].adView = newAdViewIncome;

      // 保存
      fs.writeFileSync(incomeFilePath, JSON.stringify(incomeStats, null, 2));
      
      
    } catch (e) {
      
    }

    // 删除本地ad_views.json文件（同步完成后清理）
    try {
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

      let deletedCount = 0;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          try {
            fs.unlinkSync(p);
            
            deletedCount++;
          } catch (e) {
            
          }
        }
      }
      
      if (deletedCount === 0) {
        
      }
    } catch (e) {
      
    }

    return NextResponse.json({
      success: true,
      synced: adViews.length,
      totalTokens,
      newBalance: updatedUser.tokenBalance,
      trafficBalance: updatedUser.trafficTokenBalance,
      subscriptionBalance: updatedUser.subscriptionTokenBalance,
      message: `成功同步 ${adViews.length} 条广告观看记录，获得 ${totalTokens} 个Token`
    });
  } catch (error) {
    console.error('同步广告观看数据错误:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
