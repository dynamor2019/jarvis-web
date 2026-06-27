import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import * as fs from 'fs';
import * as path from 'path';

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
    const { amount, reason = 'ad_reward' } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: '金额无效' },
        { status: 400 }
      );
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

    // 更新用户Token余额
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        trafficTokenBalance: (user.trafficTokenBalance || 0) + amount,
        tokenBalance: (user.trafficTokenBalance || 0) + amount + (user.subscriptionTokenBalance || 0)
      }
    });

    // 记录Token收入来源
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

      // 确定收入类型
      let incomeType = 'other';
      if (reason === 'ad_reward') {
        incomeType = 'adView';
      } else if (reason === 'referral_reward') {
        incomeType = 'referral';
      }

      // 更新用户的收入
      if (!incomeStats[payload.userId]) {
        incomeStats[payload.userId] = { adView: 0, referral: 0 };
      }
      
      if (incomeType === 'adView') {
        incomeStats[payload.userId].adView = (incomeStats[payload.userId].adView || 0) + amount;
      } else if (incomeType === 'referral') {
        incomeStats[payload.userId].referral = (incomeStats[payload.userId].referral || 0) + amount;
      }

      // 保存
      fs.writeFileSync(incomeFilePath, JSON.stringify(incomeStats, null, 2));
    } catch (e) {
      
    }

    return NextResponse.json({
      success: true,
      message: `成功添加 ${amount} 个Token`,
      newBalance: updatedUser.tokenBalance,
      trafficBalance: updatedUser.trafficTokenBalance,
      subscriptionBalance: updatedUser.subscriptionTokenBalance
    });
  } catch (error) {
    console.error('添加Token错误:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
