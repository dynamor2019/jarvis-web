/**
 * Subscription config file download endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { verifyToken } from '@/lib/auth';
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';

type DownloadAccessPayload = {
  type?: string;
  configRecordId?: string;
  userId?: string;
};

function isLocalRequest(request: NextRequest): boolean {
  const host = request.headers.get('host') || '';
  return host.startsWith('127.0.0.1') || host.startsWith('localhost');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
  try {
    const { configId } = await params;
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      if (decoded?.userId) userId = decoded.userId;
    }

    if (!userId) {
      const access = request.nextUrl.searchParams.get('access');
      if (access) {
        try {
          const payload = jwt.verify(access, env.JWT_SECRET) as DownloadAccessPayload;
          if (
            payload?.type === 'subscription_config_download' &&
            payload?.configRecordId === configId &&
            typeof payload?.userId === 'string'
          ) {
            userId = payload.userId;
          }
        } catch {
          userId = null;
        }
      }
    }

    let configRecord = null as Awaited<ReturnType<typeof prisma.subscriptionConfig.findFirst>>;
    if (userId) {
      configRecord = await prisma.subscriptionConfig.findFirst({
        where: { id: configId, userId },
      });
    } else if (process.env.NODE_ENV === 'development' && isLocalRequest(request)) {
      // Local desktop WebView compatibility.
      configRecord = await prisma.subscriptionConfig.findUnique({
        where: { id: configId },
      });
    } else {
      return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 });
    }

    if (!configRecord) {
      return NextResponse.json({ success: false, error: '配置不存在或无权限' }, { status: 404 });
    }

    if (configRecord.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: '配置已过期' }, { status: 410 });
    }

    const stored = JSON.parse(configRecord.encryptedData || '{}');
    const provider = String(stored.provider ?? '').trim();
    const model = String(stored.model ?? stored.modelName ?? '').trim();
    const modelType =
      String(stored.modelType ?? '').trim() ||
      (provider && model ? `${provider}:${model}` : provider || model || '');

    const configFile = {
      configId: configRecord.configId,
      deviceFingerprint: configRecord.deviceFingerprint,
      encryptedData: String(stored.encryptedData ?? ''),
      iv: String(stored.iv ?? ''),
      signature: String(stored.signature ?? ''),
      timestamp: stored.timestamp ?? '',
      apiKey: String(stored.apiKey ?? ''),
      provider,
      model,
      modelType,
      endpoint: String(stored.endpoint ?? ''),
      downloadTime: new Date().toISOString(),
      expiresAt: configRecord.expiresAt.toISOString(),
    };

    return NextResponse.json(configFile, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="subscription_config.json"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('Download config failed:', error);
    return NextResponse.json({ success: false, error: '下载配置失败' }, { status: 500 });
  }
}
