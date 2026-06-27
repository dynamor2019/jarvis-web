import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { getSystemConfig } from '@/lib/config';

type ModelEntry = {
  id: string;
  name: string;
  value: string;
  provider: string;
  tier: 'free' | 'pro';
};

type CustomModelConfig = {
  provider: string;
  model: string;
};

const FREE_MODELS: ModelEntry[] = [
  {
    id: 'free_qwen3_8b',
    name: 'Qwen3-8B',
    value: 'Qwen/Qwen3-8B',
    provider: 'siliconflow',
    tier: 'free',
  },
  {
    id: 'free_glm_z1_9b_0414',
    name: 'GLM-Z1-9B-0414',
    value: 'THUDM/GLM-Z1-9B-0414',
    provider: 'siliconflow',
    tier: 'free',
  },
];

const CONFIGURED_PROVIDER_ORDER = [
  'openai',
  'claude',
  'siliconflow',
  'doubao',
  'deepseek',
  'dashscope',
  'zhipu',
  'kimi',
] as const;

function normalizeProvider(value?: string | null): string {
  const raw = (value ?? '').trim().toLowerCase();
  if (!raw) return '';
  if (raw === 'claude' || raw === 'anthropic') return 'claude';
  if (raw === 'gemini') return 'siliconflow';
  if (raw === 'qwen' || raw === 'dashscope' || raw === 'aliyun') return 'dashscope';
  if (raw === 'moonshot' || raw === 'kimi') return 'kimi';
  if (raw === 'chatglm' || raw === 'glm' || raw === 'zhipu') return 'zhipu';
  if (raw === 'gpt4' || raw === 'gpt' || raw === 'openai') return 'openai';
  if (raw.includes('claude') || raw.includes('anthropic')) return 'claude';
  if (raw.includes('gemini')) return 'siliconflow';
  if (raw.includes('qwen') || raw.includes('dashscope') || raw.includes('aliyun')) return 'dashscope';
  if (raw.includes('moonshot') || raw.includes('kimi')) return 'kimi';
  if (raw.includes('zhipu') || raw.includes('glm')) return 'zhipu';
  if (raw.includes('gpt') || raw.includes('openai')) return 'openai';
  return raw;
}

function buildModelId(provider: string, model: string): string {
  return `${provider}_${model}`.replace(/[^a-zA-Z0-9_]+/g, '_').toLowerCase();
}

async function loadConfiguredModels(): Promise<ModelEntry[]> {
  const providerModels = await Promise.all(
    CONFIGURED_PROVIDER_ORDER.map(async provider => ({
      provider,
      model: ((await getSystemConfig(`platform_${provider}_model`)) ?? '').trim(),
    }))
  );

  const rawCustomModels = (await getSystemConfig('platform_custom_models')) ?? '';
  let customModels: CustomModelConfig[] = [];
  if (rawCustomModels.trim()) {
    try {
      const parsed = JSON.parse(rawCustomModels);
      if (Array.isArray(parsed)) {
        customModels = parsed
          .map(item => ({
            provider: String(item?.provider ?? '').trim(),
            model: String(item?.model ?? '').trim(),
          }))
          .filter(item => item.provider && item.model);
      }
    } catch {
      customModels = [];
    }
  }

  const configured = providerModels
    .filter(item => item.model)
    .map<ModelEntry>(item => ({
      id: buildModelId(item.provider, item.model),
      name: item.model,
      value: item.model,
      provider: item.provider,
      tier: 'pro',
    }));

  const custom = customModels.map<ModelEntry>(item => {
    const provider = normalizeProvider(item.provider) || item.provider.trim().toLowerCase();
    return {
      id: buildModelId(provider, item.model),
      name: item.model,
      value: item.model,
      provider,
      tier: 'pro',
    };
  });

  const merged = [...configured, ...custom];
  const deduped = new Map<string, ModelEntry>();
  for (const model of merged) {
    const key = `${model.provider}:${model.value}`.toLowerCase();
    if (!deduped.has(key)) {
      deduped.set(key, model);
    }
  }

  return Array.from(deduped.values());
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    let userId = null;
    let tier = 'free';
    let allowCustom = false;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      if (decoded?.userId) {
        userId = decoded.userId;
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            licenseType: true,
            licenses: {
              where: { status: 'active' },
              select: {
                licenseType: true,
                expiresAt: true,
              },
              orderBy: { expiresAt: 'desc' },
              take: 1,
            },
          },
        });
        if (user) {
          const activeLicense = user.licenses?.[0];
          const effectiveLicenseType =
            activeLicense && (!activeLicense.expiresAt || new Date(activeLicense.expiresAt) > new Date())
              ? activeLicense.licenseType
              : user.licenseType;

          if (
            effectiveLicenseType === 'lifetime' ||
            effectiveLicenseType === 'lifetime_personal' ||
            effectiveLicenseType === 'lifetime_pro'
          ) {
            tier = 'premium'; // Buyout / Full
            allowCustom = true;
          } else if (effectiveLicenseType === 'subscription' || effectiveLicenseType === 'monthly') {
            tier = 'pro';
          }
        }
      }
    }

    // Expose all configured models to every user regardless of auth/tier
    const configuredModels = await loadConfiguredModels();
    const models = [...FREE_MODELS, ...configuredModels];
    // Allow custom models in the store for all users
    allowCustom = true;
    tier = 'pro';

    return NextResponse.json({ models, tier, allowCustom });

  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}
