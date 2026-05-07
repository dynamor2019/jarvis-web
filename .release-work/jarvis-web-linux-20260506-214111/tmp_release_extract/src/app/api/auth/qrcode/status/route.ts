import { NextRequest, NextResponse } from 'next/server';

// 导入qrCodeStore（需要从route.ts导出）
// 这里使用全局变量模拟，生产环境应使用Redis
const qrCodeStore = (global as any).qrCodeStore || new Map();
(global as any).qrCodeStore = qrCodeStore;

// 查询二维码状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { success: false, error: '缺少二维码' },
        { status: 400 }
      );
    }

    const qrData = qrCodeStore.get(code);

    if (!qrData) {
      return NextResponse.json({
        success: true,
        status: 'expired',
      });
    }

    // 检查是否过期（5分钟）
    if (Date.now() - qrData.createdAt > 5 * 60 * 1000) {
      qrData.status = 'expired';
      qrCodeStore.set(code, qrData);
    }

    const response: any = {
      success: true,
      status: qrData.status,
    };

    // 如果已确认，返回token
    if (qrData.status === 'confirmed' && qrData.token) {
      response.token = qrData.token;
      response.username = qrData.username;
      // 返回后删除
      qrCodeStore.delete(code);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('查询二维码状态错误:', error);
    return NextResponse.json(
      { success: false, error: '查询失败' },
      { status: 500 }
    );
  }
}
