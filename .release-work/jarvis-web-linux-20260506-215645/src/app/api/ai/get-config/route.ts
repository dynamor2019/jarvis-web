// [CodeGuard Feature Index]
// - GET /api/ai/get-config main flow -> line 17
// [/CodeGuard Feature Index]

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { generateUserApiKey } from '@/lib/apiKeyService';
import { prisma } from '@/lib/prisma';
import { getSystemConfig } from '@/lib/config';

type KnownProvider =
  | 'openai'
  | 'claude'
  | 'siliconflow'
  | 'doubao'
  | 'deepseek'
  | 'dashscope'
  | 'zhipu'
  | 'kimi';

type ProviderConfig = {
  provider: string;
  model: string;
  apiKey: string | null;
  endpoint?: string;
};

type CustomModelConfig = {
  provider: string;
  model: string;
  apiKey: string;
  endpoint?: string;
};

const KNOWN_PROVIDER_ORDER: KnownProvider[] = [
  'doubao',
  'deepseek',
  'dashscope',
  'kimi',
  'zhipu',
  'openai',
  'claude',
  'siliconflow',
];

function normalizeProvider(value?: string | null): string {
  const raw = (value ?? '').trim().toLowerCase();
  if (!raw) return '';

  const head = raw.includes(':') ? raw.split(':')[0] : raw;

  if (head === 'qwen' || head === 'dashscope' || head === 'aliyun') return 'dashscope';
  if (head === 'moonshot' || head === 'kimi') return 'kimi';
  if (head === 'chatglm' || head === 'glm' || head === 'zhipu') return 'zhipu';
  if (head === 'gpt4' || head === 'gpt' || head === 'openai') return 'openai';
  if (head === 'claude' || head === 'anthropic') return 'claude';
  if (head === 'gemini') return 'siliconflow';
  if (head.includes('doubao')) return 'doubao';
  if (head.includes('deepseek')) return 'deepseek';
  if (head.includes('siliconflow')) return 'siliconflow';
  if (head.includes('qwen') || head.includes('dashscope') || head.includes('aliyun')) return 'dashscope';
  if (head.includes('moonshot') || head.includes('kimi')) return 'kimi';
  if (head.includes('zhipu') || head.includes('glm')) return 'zhipu';
  if (head.includes('gpt') || head.includes('openai')) return 'openai';
  if (head.includes('claude') || head.includes('anthropic')) return 'claude';
  if (head.includes('gemini')) return 'siliconflow';

  return head;
}

function resolveEnvApiKey(provider: KnownProvider): string | null {
  switch (provider) {
    case 'openai':
      return process.env.PLATFORM_OPENAI_KEY || process.env.OPENAI_API_KEY || null;
    case 'claude':
      return process.env.PLATFORM_CLAUDE_KEY || process.env.ANTHROPIC_API_KEY || null;
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
    default:
      return null;
  }
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
    case 'claude':
      return 'https://api.anthropic.com/v1';
    case 'siliconflow':
      return 'https://api.siliconflow.cn/v1';
    default:
      return '';
  }
}

async function loadKnownProviderConfigs(): Promise<Record<KnownProvider, ProviderConfig>> {
  const entries = await Promise.all(
    KNOWN_PROVIDER_ORDER.map(async provider => {
      const [model, apiKey] = await Promise.all([
        getSystemConfig(`platform_${provider}_model`),
        getSystemConfig(`platform_${provider}_key`),
      ]);

      return [
        provider,
        {
          provider,
          model: (model ?? '').trim(),
          apiKey: (apiKey ?? '').trim() || resolveEnvApiKey(provider),
          endpoint: resolveDefaultEndpoint(provider),
        },
      ] as const;
    })
  );

  return Object.fromEntries(entries) as Record<KnownProvider, ProviderConfig>;
}

async function loadCustomModels(): Promise<CustomModelConfig[]> {
  const raw = (await getSystemConfig('platform_custom_models')) ?? '';
  if (!raw.trim()) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(item => ({
        provider: String(item?.provider ?? '').trim(),
        model: String(item?.model ?? '').trim(),
        apiKey: String(item?.apiKey ?? '').trim(),
        endpoint: String(item?.endpoint ?? '').trim(),
      }))
      .filter(item => item.provider && item.model && item.apiKey);
  } catch {
    return [];
  }
}

function resolveCustomProviderConfig(
  provider: string,
  customModels: CustomModelConfig[]
): ProviderConfig | null {
  const match = customModels.find(item => normalizeProvider(item.provider) === provider);
  if (!match) return null;

  return {
    provider,
    model: match.model,
    apiKey: match.apiKey,
    endpoint: match.endpoint || resolveDefaultEndpoint(provider),
  };
}

function pickFirstConfiguredProvider(
  knownConfigs: Record<KnownProvider, ProviderConfig>,
  customModels: CustomModelConfig[]
): string {
  for (const provider of KNOWN_PROVIDER_ORDER) {
    const config = knownConfigs[provider];
    if (config?.model && config?.apiKey) {
      return provider;
    }
  }

  const customProvider = customModels
    .map(item => normalizeProvider(item.provider))
    .find(Boolean);

  return customProvider || '';
}

/**
 * GET /api/ai/get-config
 * 获取订阅用户的 AI 配置（provider, model, apiKey）
 * 用于 PC 端同步配置
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 验证用户身份
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'unauthorized', message: '未提供认证令牌' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = verifyToken(token);
    
    if (!payload?.userId) {
      return NextResponse.json(
        { success: false, error: 'invalid_token', message: '无效的认证令牌' },
        { status: 401 }
      );
    }

    // 2. 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        username: true,
        licenseType: true,
        subscriptionEnd: true,
        tokenBalance: true,
        trafficTokenBalance: true,
        subscriptionTokenBalance: true,
        licenses: {
          where: {
            status: 'active',
          },
          select: {
            licenseType: true,
            licenseKey: true,
            expiresAt: true,
          },
          orderBy: {
            expiresAt: 'desc',
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'user_not_found', message: '用户不存在' },
        { status: 404 }
      );
    }

    // 3. 确定有效的授权类型
    let effectiveLicenseType = user.licenseType || 'trial';
    let effectiveSubscriptionEnd = user.subscriptionEnd;
    let hasActiveSubscription = false;

    if (user.licenses && user.licenses.length > 0) {
      const activeLicense = user.licenses[0];
      if (!activeLicense.expiresAt || new Date(activeLicense.expiresAt) > new Date()) {
        effectiveLicenseType = activeLicense.licenseType;
        effectiveSubscriptionEnd = activeLicense.expiresAt;
        hasActiveSubscription = true;
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
        message: '仅订阅用户可以获取 AI 配置',
        licenseType: effectiveLicenseType,
      });
    }

    // 5. 解析目标订阅模型来源
    const requestedProviderRaw = request.nextUrl.searchParams.get('provider');
    const requestedProvider = normalizeProvider(requestedProviderRaw);

    const [latestPaidOrder, latestActiveApiKey, knownConfigs, customModels] = await Promise.all([
      prisma.order.findFirst({
        where: {
          userId: payload.userId,
          status: 'paid',
          orderType: {
            in: ['subscription', 'lifetime'],
          },
          modelType: {
            not: null,
          },
        },
        orderBy: [
          {
            paymentTime: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
        select: {
          modelType: true,
          orderType: true,
        },
      }),
      prisma.apiKey.findFirst({
        where: {
          userId: payload.userId,
          isActive: true,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          modelType: true,
        },
      }),
      loadKnownProviderConfigs(),
      loadCustomModels(),
    ]);

    const orderModelType = (latestPaidOrder?.modelType ?? '').trim();
    const keyModelType = (latestActiveApiKey?.modelType ?? '').trim();
    const resolvedProvider =
      requestedProvider ||
      normalizeProvider(orderModelType) ||
      normalizeProvider(keyModelType) ||
      pickFirstConfiguredProvider(knownConfigs, customModels);
    const modelType = (requestedProviderRaw ?? orderModelType ?? keyModelType ?? resolvedProvider).trim();

    if (!resolvedProvider) {
      return NextResponse.json({
        success: false,
        error: 'no_provider_resolved',
        message: '未能解析订阅模型对应的服务商配置',
        modelType,
      });
    }

    if (!requestedProvider && !latestActiveApiKey && modelType) {
      try {
        await generateUserApiKey(payload.userId, modelType);
      } catch (e) {
        console.error('[AI Config] Auto provision key failed:', e);
      }
    }

    const knownProviderConfig =
      resolvedProvider in knownConfigs
        ? knownConfigs[resolvedProvider as KnownProvider]
        : null;
    const customProviderConfig = resolveCustomProviderConfig(resolvedProvider, customModels);
    const providerConfig =
      knownProviderConfig && knownProviderConfig.model && knownProviderConfig.apiKey
        ? knownProviderConfig
        : customProviderConfig || knownProviderConfig;

    const provider = providerConfig?.provider || resolvedProvider;
    const model = providerConfig?.model || '';
    const apiKey = providerConfig?.apiKey || null;

    // 6. 如果服务器端未配置对应 provider/model/apiKey，返回明确错误
    if (!model || !apiKey) {
      return NextResponse.json({
        success: false,
        error: 'no_api_key_configured',
        message: `服务器未配置 ${provider} 的订阅模型或 API Key`,
        provider,
        model,
        modelType,
      });
    }

    const trafficBalance = user.trafficTokenBalance || 0;
    const subscriptionBalance = user.subscriptionTokenBalance || 0;
    const tokenBalance = trafficBalance + subscriptionBalance;

    // 8. 返回配置
    return NextResponse.json({
      success: true,
      provider,
      model,
      apiKey, // 返回服务器端的 API Key
      modelType,
      syncChannel: 'token',
      licenseType: effectiveLicenseType,
      subscriptionEnd: effectiveSubscriptionEnd,
      tokenBalance,
      trafficBalance,
      subscriptionBalance,
      hasActiveSubscription,
    });

  } catch (error) {
    console.error('[AI Config] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'internal_error', 
        message: error instanceof Error ? error.message : '服务器内部错误' 
      },
      { status: 500 }
    );
  }
}
