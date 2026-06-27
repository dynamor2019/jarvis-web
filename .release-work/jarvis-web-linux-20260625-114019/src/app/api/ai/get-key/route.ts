import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * GET /api/ai/get-key
 * 获取订阅用户的 AI API Key（向后兼容接口）
 * 建议使用 /api/ai/get-config 获取完整配置
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 验证用户身份
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = verifyToken(token);
    
    if (!payload?.userId) {
      return NextResponse.json(
        { success: false, error: 'invalid_token' },
        { status: 401 }
      );
    }

    // 2. 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        licenseType: true,
        licenses: {
          where: { status: 'active' },
          select: {
            licenseType: true,
            expiresAt: true,
          },
          orderBy: { expiresAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'user_not_found' },
        { status: 404 }
      );
    }

    // 3. 确定有效的授权类型
    let effectiveLicenseType = user.licenseType || 'trial';
    if (user.licenses && user.licenses.length > 0) {
      const activeLicense = user.licenses[0];
      if (!activeLicense.expiresAt || new Date(activeLicense.expiresAt) > new Date()) {
        effectiveLicenseType = activeLicense.licenseType;
      }
    }

    // 4. 检查是否为订阅用户
    const isSubscriptionUser = 
      effectiveLicenseType === 'subscription' || 
      effectiveLicenseType === 'lifetime' ||
      effectiveLicenseType === 'lifetime_personal' ||
      effectiveLicenseType === 'lifetime_pro' ||
      effectiveLicenseType === 'monthly';

    if (!isSubscriptionUser) {
      return NextResponse.json({
        success: false,
        error: 'not_subscription_user',
      });
    }

    // 5. 获取用户的 modelType
    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: {
        userId: payload.userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: { modelType: true },
    });

    const modelType = apiKeyRecord?.modelType || 'doubao';

    // 6. 根据 modelType 返回对应的 API Key
    let apiKey: string | null = null;
    
    if (modelType === 'deepseek') {
      apiKey = process.env.DEEPSEEK_API_KEY || null;
    } else if (modelType === 'doubao') {
      apiKey = process.env.DOUBAO_API_KEY || null;
    } else if (modelType === 'siliconflow') {
      apiKey = process.env.SILICONFLOW_API_KEY || process.env.PLATFORM_SILICONFLOW_KEY || null;
    } else if (modelType === 'openai') {
      apiKey = process.env.OPENAI_API_KEY || null;
    } else if (modelType === 'grok') {
      apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY || null;
    }

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'no_api_key_configured',
      });
    }

    // 7. 返回 API Key
    return NextResponse.json({
      success: true,
      apiKey,
      modelType,
    });

  } catch (error) {
    console.error('[AI Get Key] Error:', error);
    return NextResponse.json(
      { success: false, error: 'internal_error' },
      { status: 500 }
    );
  }
}
