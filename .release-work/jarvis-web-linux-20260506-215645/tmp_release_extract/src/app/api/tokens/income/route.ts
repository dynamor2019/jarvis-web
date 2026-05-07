import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import * as fs from 'fs';
import * as path from 'path';

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

    // 获取用户的收入统计
    let adViewIncome = 0;
    let referralIncome = 0;

    try {
      // 从JSON文件读取收入统计
      const incomeFilePath = path.join(process.cwd(), 'data', 'income_stats.json');
      
      if (fs.existsSync(incomeFilePath)) {
        const incomeData = JSON.parse(fs.readFileSync(incomeFilePath, 'utf-8'));
        const userIncome = incomeData[payload.userId] || { adView: 0, referral: 0 };
        adViewIncome = userIncome.adView || 0;
        referralIncome = userIncome.referral || 0;
      }
    } catch (e) {
      
    }

    return NextResponse.json({
      success: true,
      income: {
        adView: adViewIncome,
        referral: referralIncome,
        total: adViewIncome + referralIncome
      }
    });
  } catch (error) {
    console.error('获取收入统计错误:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
