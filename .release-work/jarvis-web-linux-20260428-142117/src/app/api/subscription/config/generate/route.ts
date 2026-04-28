// [CodeGuard Feature Index]
// - Provider and model resolution -> line 22
// - Endpoint resolution from admin config -> line 93
// - Subscription config generation API -> line 114
// - Persist and return download config -> line 203
// [/CodeGuard Feature Index]

﻿/**
 * 璁㈤槄閰嶇疆鐢熸垚鏈嶅姟
 * 鐢ㄤ簬鐢熸垚鍔犲瘑鐨勯厤缃枃浠朵緵PC绔笅杞?
 */

import { prisma } from '@/lib/prisma';
import { generateUserApiKey } from '@/lib/apiKeyService';
import { createEncryptedConfig, generateDeviceFingerprint } from '@/lib/encryption';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import { env } from '@/lib/env';
import { getSystemConfig } from '@/lib/config';
import { randomUUID } from 'crypto';

function resolveProvider(modelType: string): string {
  const normalized = (modelType || '').toLowerCase();
  const providerPrefix = normalized.split(':')[0]?.trim();

  if (providerPrefix) {
    if (providerPrefix === 'moonshot') return 'kimi';
    if (providerPrefix === 'aliyun' || providerPrefix === 'qwen') return 'dashscope';
    if (providerPrefix === 'glm' || providerPrefix === 'chatglm') return 'zhipu';
    if (providerPrefix === 'gpt' || providerPrefix === 'gpt4') return 'openai';
    if (providerPrefix === 'siliconflow') return 'siliconflow';
    if (providerPrefix === 'openai') return 'openai';
    if (providerPrefix === 'deepseek') return 'deepseek';
    if (providerPrefix === 'dashscope') return 'dashscope';
    if (providerPrefix === 'kimi') return 'kimi';
    if (providerPrefix === 'doubao') return 'doubao';
    if (providerPrefix === 'zhipu') return 'zhipu';
    if (providerPrefix === 'gemini') return 'gemini';
    if (providerPrefix === 'claude' || providerPrefix === 'anthropic') return 'claude';
  }

  if (normalized.includes('deepseek')) return 'deepseek';
  if (normalized.includes('qwen') || normalized.includes('dashscope') || normalized.includes('aliyun')) return 'dashscope';
  if (normalized.includes('kimi') || normalized.includes('moonshot')) return 'kimi';
  if (normalized.includes('siliconflow')) return 'siliconflow';
  if (normalized.includes('doubao')) return 'doubao';
  if (normalized.includes('zhipu') || normalized.includes('glm')) return 'zhipu';
  if (normalized.includes('gemini')) return 'gemini';
  if (normalized.includes('claude') || normalized.includes('anthropic')) return 'claude';
  if (normalized.includes('gpt') || normalized.includes('openai')) return 'openai';
  return 'openai';
}

function parseModelSelection(modelType: string): { provider: string; model: string } {
  const raw = (modelType || '').trim();
  if (!raw) {
    return { provider: 'openai', model: '' };
  }
  const separatorIndex = raw.indexOf(':');
  if (separatorIndex <= 0) {
    return { provider: resolveProvider(raw), model: raw };
  }
  const provider = resolveProvider(raw.slice(0, separatorIndex));
  const model = raw.slice(separatorIndex + 1).trim();
  return { provider, model };
}

function resolveDefaultEndpoint(provider: string): string {
  switch (provider) {
    case 'deepseek':
      return 'https://api.deepseek.com/v1';
    case 'dashscope':
      return 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    case 'doubao':
      return 'https://ark.cn-beijing.volces.com/api/v3';
    case 'zhipu':
      return 'https://open.bigmodel.cn/api/paas/v4';
    case 'kimi':
      return 'https://api.moonshot.cn/v1';
    case 'openai':
      return 'https://api.openai.com/v1';
    case 'gemini':
      return 'https://generativelanguage.googleapis.com/v1beta/openai';
    case 'siliconflow':
      return 'https://api.siliconflow.cn/v1';
    case 'claude':
      return 'https://api.anthropic.com/v1';
    default:
      return '';
  }
}

function resolveEnvApiKey(provider: string): string | null {
  switch (provider) {
    case 'openai':
      return process.env.PLATFORM_OPENAI_KEY || process.env.OPENAI_API_KEY || null;
    case 'siliconflow':
      return process.env.PLATFORM_SILICONFLOW_KEY || process.env.SILICONFLOW_API_KEY || null;
    case 'doubao':
      return process.env.PLATFORM_DOUBAO_KEY || process.env.DOUBAO_API_KEY || null;
    case 'deepseek':
      return process.env.PLATFORM_DEEPSEEK_KEY || process.env.DEEPSEEK_API_KEY || null;
    case 'dashscope':
      return process.env.PLATFORM_DASHSCOPE_KEY || null;
    case 'zhipu':
      return process.env.PLATFORM_ZHIPU_KEY || null;
    case 'kimi':
      return process.env.PLATFORM_KIMI_KEY || null;
    case 'gemini':
      return process.env.PLATFORM_GEMINI_KEY || null;
    case 'claude':
      return process.env.PLATFORM_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY || null;
    default:
      return null;
  }
}

type CustomModelConfig = {
  provider: string;
  model: string;
  apiKey: string;
  endpoint?: string;
};

async function findCustomModelConfig(provider: string, model: string): Promise<CustomModelConfig | null> {
  const rawCustomModels = (await getSystemConfig('platform_custom_models')) ?? '';
  if (!rawCustomModels.trim()) return null;

  try {
    const parsed = JSON.parse(rawCustomModels);
    if (!Array.isArray(parsed)) return null;
    const providerMatched = parsed.filter(item => {
      const p = String(item?.provider ?? '').trim().toLowerCase();
      return resolveProvider(p) === provider;
    });
    if (!providerMatched.length) return null;

    const targetModel = (model ?? '').trim();
    const matched =
      providerMatched.find(item => String(item?.model ?? '').trim() === targetModel) ||
      providerMatched[0];

    if (!matched) return null;
    const apiKey = String(matched?.apiKey ?? '').trim();
    if (!apiKey) return null;
    return {
      provider,
      model: String(matched?.model ?? '').trim(),
      apiKey,
      endpoint: String(matched?.endpoint ?? '').trim(),
    };
  } catch {
    return null;
  }
}

async function resolveConfiguredApiKey(provider: string, model: string): Promise<string | null> {
  const custom = await findCustomModelConfig(provider, model);
  if (custom?.apiKey) return custom.apiKey;

  const dbKey = ((await getSystemConfig(`platform_${provider}_key`)) ?? '').trim();
  if (dbKey) return dbKey;

  return resolveEnvApiKey(provider);
}

async function resolveEndpoint(provider: string, model: string): Promise<string> {
  const custom = await findCustomModelConfig(provider, model);
  if (custom?.endpoint) return custom.endpoint;
  return resolveDefaultEndpoint(provider);
}

async function resolveConfiguredModel(provider: string, fallbackModel: string): Promise<string> {
  const dbModel = ((await getSystemConfig(`platform_${provider}_model`)) ?? '').trim();
  if (dbModel) return dbModel;

  const custom = await findCustomModelConfig(provider, fallbackModel);
  if (custom?.model) return custom.model;

  return (fallbackModel ?? '').trim();
}

export async function POST(request: NextRequest) {
  try {
    // 优先使用登录令牌；若桌面注入未提供 token，则降级为订单驱动校验
    const authHeader = request.headers.get('authorization');
    let decoded: { userId: string } | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      decoded = verifyToken(token);
    }

    const { orderId, deviceInfo } = await request.json();

    

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: '缂哄皯璁㈠崟ID' },
        { status: 400 }
      );
    }

    // 鏌ヨ璁㈠崟淇℃伅
    let order = null;
    try {
      // 灏濊瘯鎸塈D鏌ユ壘
      // 娉ㄦ剰锛氬鏋滄暟鎹簱瀛楁绫诲瀷涓篣UID涓旇緭鍏ラ潪UUID鏍煎紡锛屾煇浜汸risma閫傞厤鍣ㄥ彲鑳戒細鎶涘嚭寮傚父
      order = await prisma.order.findUnique({
        where: { id: orderId } 
      });
    } catch (e) {
      // 蹇界暐ID鏌ユ壘寮傚父锛岀户缁皾璇曟寜璁㈠崟鍙锋煡鎵?
    }

    // If not found by ID, try finding by orderNo
    let finalOrder = order;
    if (!finalOrder) {
         finalOrder = await prisma.order.findUnique({
            where: { orderNo: orderId }
         });
    }

    

    if (!finalOrder) {
      return NextResponse.json(
        { success: false, error: 'order_not_found_or_forbidden' },
        { status: 404 }
      );
    }

    if (finalOrder.status !== 'paid') {
      return NextResponse.json(
        { success: false, error: `order_not_paid: ${finalOrder.status}` },
        { status: 400 }
      );
    }

    const userId = decoded?.userId ?? finalOrder.userId;
    if (decoded?.userId && finalOrder.userId !== decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'order_not_found_or_forbidden' },
        { status: 404 }
      );
    }

    // 鐢熸垚璁惧鎸囩汗
    const userAgent = deviceInfo?.userAgent || request.headers.get('user-agent') || 'unknown';
    const timestamp = Date.now();
    const deviceFingerprint = generateDeviceFingerprint(userAgent, timestamp);

    // 鐢熸垚API瀵嗛挜
    const apiKeyData = await generateUserApiKey(
      userId,
      finalOrder.modelType || 'deepseek', // 浣跨敤璁㈠崟涓殑妯″瀷绫诲瀷
      deviceFingerprint
    );

    // 鍒涘缓鍔犲瘑閰嶇疆
    const { provider, model } = parseModelSelection(apiKeyData.modelType);
    const finalModel = await resolveConfiguredModel(provider, model);
    const configuredApiKey = await resolveConfiguredApiKey(provider, finalModel);
    if (!configuredApiKey) {
      return NextResponse.json(
        { success: false, error: `no_api_key_configured_for_provider: ${provider}` },
        { status: 400 }
      );
    }

    const finalModelType = finalModel ? `${provider}:${finalModel}` : provider;
    const configId = randomUUID();

    // 淇濆瓨閰嶇疆璁板綍鍒版暟鎹簱
    const endpoint = await resolveEndpoint(provider, finalModel);
    const encryptedBundle = createEncryptedConfig(
      configuredApiKey,
      finalModel,
      deviceFingerprint,
      timestamp
    );
    const configPayload = {
      // Compatibility mode: plaintext-first for stable PC flow; encrypted fields attached for gradual migration.
      apiKey: configuredApiKey,
      provider,
      model: finalModel,
      modelType: finalModelType,
      endpoint,
      encryptedData: encryptedBundle.encryptedData,
      iv: encryptedBundle.iv,
      signature: encryptedBundle.signature,
      timestamp,
      deviceFingerprint
    };

    const configRecord = await prisma.subscriptionConfig.create({
      data: {
        userId,
        orderId: finalOrder.id,
        apiKeyId: apiKeyData.id,
        configId,
        deviceFingerprint,
        encryptedData: JSON.stringify(configPayload),
        expiresAt: new Date(timestamp + 7 * 24 * 60 * 60 * 1000), // 7澶╁悗杩囨湡
      }
    });

    const downloadAccess = jwt.sign(
      {
        type: 'subscription_config_download',
        configRecordId: configRecord.id,
        userId,
      },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return NextResponse.json({
      success: true,
      config: {
        configId,
        encryptedData: encryptedBundle.encryptedData,
        iv: encryptedBundle.iv,
        signature: encryptedBundle.signature,
        timestamp,
        deviceFingerprint,
        provider,
        model: finalModel,
        modelType: finalModelType,
        endpoint,
        apiKey: configuredApiKey,
        downloadUrl: `/api/subscription/config/${configRecord.id}/download?access=${encodeURIComponent(downloadAccess)}`,
      },
      apiKey: {
        id: apiKeyData.id,
        key: configuredApiKey,
        provider,
        model: finalModel,
        modelType: finalModelType,
        endpoint,
        expiresAt: apiKeyData.expiresAt,
      }
    });

  } catch (error) {
    console.error('鐢熸垚璁㈤槄閰嶇疆閿欒:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '鐢熸垚閰嶇疆澶辫触' },
      { status: 500 }
    );
  }
}
