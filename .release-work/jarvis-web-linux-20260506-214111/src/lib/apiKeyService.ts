// [CodeGuard Feature Index]
// - Generate user API key with expiry and hashing -> line 30
// [/CodeGuard Feature Index]

/**
 * API密钥管理服务
 * 用于生成、验证和管理用户的API密钥
 */

import { prisma } from '@/lib/prisma';
import { generateApiKey, generateSecureRandom, hash } from '@/lib/encryption';
import crypto from 'crypto';

export interface ApiKeyData {
  id: string;
  key: string;
  userId: string;
  modelType: string;
  isActive: boolean;
  expiresAt: Date;
  deviceFingerprint?: string;
  usageCount: number;
  lastUsedAt?: Date;
  createdAt: Date;
}

function resolveProviderFromModelType(modelType: string): string {
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

  if (normalized.includes('gpt') || normalized.includes('openai')) return 'openai';
  if (normalized.includes('siliconflow')) return 'siliconflow';
  if (normalized.includes('deepseek')) return 'deepseek';
  if (normalized.includes('qwen') || normalized.includes('dashscope') || normalized.includes('aliyun')) return 'dashscope';
  if (normalized.includes('kimi') || normalized.includes('moonshot')) return 'kimi';
  if (normalized.includes('doubao')) return 'doubao';
  if (normalized.includes('zhipu') || normalized.includes('glm')) return 'zhipu';
  if (normalized.includes('gemini')) return 'gemini';
  if (normalized.includes('claude') || normalized.includes('anthropic')) return 'claude';

  return 'openai';
}

/**
 * 生成新的API密钥
 */
export async function generateUserApiKey(userId: string, modelType: string, deviceFingerprint?: string): Promise<ApiKeyData> {
  const apiKey = generateApiKey();
  const keyHash = hash(apiKey);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天后过期
  const provider = resolveProviderFromModelType(modelType);
  const apiKeyRecord = await prisma.apiKey.create({
    data: {
      key: keyHash,
      userId,
      provider,
      modelType,
      deviceFingerprint,
      expiresAt,
      isActive: true,
      usageCount: 0,
    }
  });
  
  return {
    id: apiKeyRecord.id,
    key: apiKey, // 返回原始密钥给用户
    userId: apiKeyRecord.userId,
    modelType: apiKeyRecord.modelType,
    isActive: apiKeyRecord.isActive,
    expiresAt: apiKeyRecord.expiresAt,
    deviceFingerprint: apiKeyRecord.deviceFingerprint || undefined,
    usageCount: apiKeyRecord.usageCount,
    lastUsedAt: apiKeyRecord.lastUsedAt || undefined,
    createdAt: apiKeyRecord.createdAt,
  };
}

/**
 * 验证API密钥
 */
export async function validateApiKey(apiKey: string, deviceFingerprint?: string): Promise<ApiKeyData | null> {
  const keyHash = hash(apiKey);
  
  const apiKeyRecord = await prisma.apiKey.findFirst({
    where: {
      key: keyHash,
      isActive: true,
      expiresAt: {
        gt: new Date(), // 未过期
      },
    }
  });
  
  if (!apiKeyRecord) {
    return null;
  }
  
  // 验证设备指纹（如果存在）
  if (apiKeyRecord.deviceFingerprint && deviceFingerprint) {
    if (apiKeyRecord.deviceFingerprint !== deviceFingerprint) {
      return null;
    }
  }
  
  // 更新使用统计
  await prisma.apiKey.update({
    where: { id: apiKeyRecord.id },
    data: {
      usageCount: apiKeyRecord.usageCount + 1,
      lastUsedAt: new Date(),
    }
  });
  
  return {
    id: apiKeyRecord.id,
    key: apiKey, // 返回原始密钥
    userId: apiKeyRecord.userId,
    modelType: apiKeyRecord.modelType,
    isActive: apiKeyRecord.isActive,
    expiresAt: apiKeyRecord.expiresAt,
    deviceFingerprint: apiKeyRecord.deviceFingerprint || undefined,
    usageCount: apiKeyRecord.usageCount + 1,
    lastUsedAt: new Date(),
    createdAt: apiKeyRecord.createdAt,
  };
}

/**
 * 获取用户的API密钥列表
 */
export async function getUserApiKeys(userId: string): Promise<ApiKeyData[]> {
  const apiKeys = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
  
  return apiKeys.map(key => ({
    id: key.id,
    key: '***' + key.key.slice(-8), // 只显示最后8位
    userId: key.userId,
    modelType: key.modelType,
    isActive: key.isActive,
    expiresAt: key.expiresAt,
    deviceFingerprint: key.deviceFingerprint || undefined,
    usageCount: key.usageCount,
    lastUsedAt: key.lastUsedAt || undefined,
    createdAt: key.createdAt,
  }));
}

/**
 * 吊销API密钥
 */
export async function revokeApiKey(apiKeyId: string, userId: string): Promise<boolean> {
  try {
    await prisma.apiKey.update({
      where: { 
        id: apiKeyId,
        userId // 确保只能吊销自己的密钥
      },
      data: { isActive: false }
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 清理过期的API密钥
 */
export async function cleanupExpiredApiKeys(): Promise<number> {
  const result = await prisma.apiKey.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    }
  });
  
  return result.count;
}

/**
 * 检查API密钥使用频率
 */
export async function checkApiKeyUsage(apiKeyId: string): Promise<{
  usageCount: number;
  hourlyUsage: number;
  dailyUsage: number;
  isAbnormal: boolean;
}> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const [hourlyUsage, dailyUsage] = await Promise.all([
    prisma.usageRecord.count({
      where: {
        apiKeyId,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    }),
    prisma.usageRecord.count({
      where: {
        apiKeyId,
        createdAt: {
          gte: oneDayAgo,
        },
      },
    }),
  ]);
  
  const apiKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyId },
    select: { usageCount: true }
  });
  
  const usageCount = apiKey?.usageCount || 0;
  
  // 判断是否为异常使用（每小时超过100次，每天超过1000次）
  const isAbnormal = hourlyUsage > 100 || dailyUsage > 1000;
  
  return {
    usageCount,
    hourlyUsage,
    dailyUsage,
    isAbnormal,
  };
}

/**
 * 自动封禁异常使用的API密钥
 */
export async function autoBanAbnormalApiKeys(): Promise<number> {
  const apiKeys = await prisma.apiKey.findMany({
    where: {
      isActive: true,
      expiresAt: {
        gt: new Date(),
      },
    },
  });
  
  let bannedCount = 0;
  
  for (const apiKey of apiKeys) {
    const usage = await checkApiKeyUsage(apiKey.id);
    if (usage.isAbnormal) {
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { isActive: false },
      });
      bannedCount++;
    }
  }
  
  return bannedCount;
}

/**
 * 记录API使用日志
 */
export async function logApiUsage(
  apiKeyId: string, 
  endpoint: string, 
  tokens: number, 
  responseTime: number,
  model: string = 'unknown',
  operation: string = 'api_call',
  cost: number = 0
): Promise<void> {
  const apiKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyId },
    select: { userId: true }
  });
  
  if (!apiKey) return;

  await prisma.usageRecord.create({
    data: {
      userId: apiKey.userId,
      apiKeyId,
      endpoint,
      tokens,
      responseTime,
      model,
      operation,
      cost
    }
  });
}

/**
 * 获取API密钥统计信息
 */
export async function getApiKeyStats(userId: string): Promise<{
  totalKeys: number;
  activeKeys: number;
  expiredKeys: number;
  totalUsage: number;
}> {
  const [totalKeys, activeKeys, expiredKeys, totalUsage] = await Promise.all([
    prisma.apiKey.count({ where: { userId } }),
    prisma.apiKey.count({ 
      where: { 
        userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      } 
    }),
    prisma.apiKey.count({ 
      where: { 
        userId,
        expiresAt: { lt: new Date() }
      } 
    }),
    prisma.apiKey.aggregate({
      where: { userId },
      _sum: { usageCount: true }
    }),
  ]);
  
  return {
    totalKeys: totalKeys,
    activeKeys: activeKeys,
    expiredKeys: expiredKeys,
    totalUsage: totalUsage._sum.usageCount || 0,
  };
}
