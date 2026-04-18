import { prisma } from './prisma';

export interface PaymentConfig {
  alipay: {
    appId: string | null;
    privateKey: string | null;
    publicKey: string | null;
    appCertPath: string | null;
    alipayCertPath: string | null;
    alipayRootCertPath: string | null;
  };
  wechat: {
    appId: string | null;
    payAppId: string | null;
    mchId: string | null;
    apiKey: string | null;
    apiKeyV3: string | null;
    publicKeyId: string | null;
    certPath: string | null;
    keyPath: string | null;
  };
}

export async function getSystemConfig(key: string): Promise<string | null> {
  const config = await prisma.systemConfig.findUnique({
    where: { key },
    select: { value: true },
  });
  return config?.value || null;
}

export async function getPaymentConfig(): Promise<PaymentConfig> {
  const configs = await prisma.systemConfig.findMany({
    where: {
      key: {
        in: [
          'alipay_app_id',
          'alipay_private_key',
          'alipay_public_key',
          'alipay_app_cert_path',
          'alipay_public_cert_path',
          'alipay_root_cert_path',
          'wechat_app_id',
          'wechat_pay_app_id',
          'wechat_mch_id',
          'wechat_api_key',
          'wechat_api_key_v3',
          'wechat_public_key_id',
          'wechat_pay_cert_path',
          'wechat_pay_key_path'
        ]
      }
    }
  });

  const configMap: Record<string, string> = {};
  configs.forEach((c: { key: string; value: string }) => configMap[c.key] = c.value);

  return {
    alipay: {
      appId: configMap['alipay_app_id'] || process.env.ALIPAY_APP_ID || null,
      privateKey: configMap['alipay_private_key'] || process.env.ALIPAY_PRIVATE_KEY || null,
      publicKey: configMap['alipay_public_key'] || process.env.ALIPAY_PUBLIC_KEY || null,
      appCertPath: configMap['alipay_app_cert_path'] || process.env.ALIPAY_APP_CERT_PATH || null,
      alipayCertPath: configMap['alipay_public_cert_path'] || process.env.ALIPAY_PUBLIC_CERT_PATH || null,
      alipayRootCertPath: configMap['alipay_root_cert_path'] || process.env.ALIPAY_ROOT_CERT_PATH || null,
    },
    wechat: {
      appId: configMap['wechat_app_id'] || process.env.WECHAT_APP_ID || null,
      payAppId: configMap['wechat_pay_app_id'] || process.env.WECHAT_PAY_APP_ID || null,
      mchId: configMap['wechat_mch_id'] || process.env.WECHAT_MCH_ID || null,
      apiKey: configMap['wechat_api_key'] || process.env.WECHAT_API_KEY || null,
      apiKeyV3: configMap['wechat_api_key_v3'] || process.env.WECHAT_API_KEY_V3 || null,
      publicKeyId: configMap['wechat_public_key_id'] || process.env.WECHAT_PUBLIC_KEY_ID || null,
      certPath: configMap['wechat_pay_cert_path'] || process.env.WECHAT_PAY_CERT_PATH || null,
      keyPath: configMap['wechat_pay_key_path'] || process.env.WECHAT_PAY_KEY_PATH || null,
    }
  };
}
