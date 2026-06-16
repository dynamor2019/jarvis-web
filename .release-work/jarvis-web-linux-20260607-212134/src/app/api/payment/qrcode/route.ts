// [CodeGuard Feature Index]
// - resolveAlipaySdkConstructor -> line 22
// - isPublicNotifyBaseUrl -> line 35
// - buildAlipaySubject -> line 55
// - normalized -> line 56
// - detectAlipayKeyType -> line 68
// - resolveExistingPath -> line 81
// - POST -> line 112
// - wechatPayAppId -> line 258
// [/CodeGuard Feature Index]

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPaymentConfig } from '@/lib/config';
import { env } from '@/lib/env';
import * as AlipaySdk from 'alipay-sdk';
import { existsSync, readFileSync } from 'fs';
import { createPrivateKey, createSign, randomBytes, X509Certificate } from 'crypto';
import path from 'path';

// Safely handle AlipaySdk import for various environments (CJS/ESM interop)
function resolveAlipaySdkConstructor(sdkModule: any) {
  const ctor =
    sdkModule?.AlipaySdk ||
    sdkModule?.default?.AlipaySdk ||
    sdkModule?.default?.default ||
    sdkModule?.default ||
    sdkModule;
  if (typeof ctor !== 'function') {
    throw new Error('invalid_alipay_sdk_constructor');
  }
  return ctor;
}
const AlipaySdkConstructor = resolveAlipaySdkConstructor(AlipaySdk as any);

function isPublicNotifyBaseUrl(rawBaseUrl: string): boolean {
  try {
    const url = new URL(rawBaseUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host === '0.0.0.0' || host === '127.0.0.1' || host === '::1') {
      return false;
    }
    if (/^127\./.test(host)) return false;
    if (/^10\./.test(host)) return false;
    if (/^192\.168\./.test(host)) return false;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

function buildAlipaySubject(productName: string | null | undefined): string {
  const normalized = (productName || 'Jarvis套餐')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return 'Jarvis套餐';
  return normalized.length > 120 ? normalized.slice(0, 120) : normalized;
}

function normalizePem(pem: string | null | undefined): string | undefined {
  if (!pem) return undefined;
  return pem.replace(/\\n/g, '\n').trim();
}

function detectAlipayKeyType(privateKey: string): 'PKCS1' | 'PKCS8' {
  const firstLine = privateKey.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || '';
  if (firstLine.includes('BEGIN PRIVATE KEY')) return 'PKCS8';
  if (firstLine.includes('BEGIN RSA PRIVATE KEY')) return 'PKCS1';
  const rawKey = privateKey.replace(/\s+/g, '');
  try {
    createPrivateKey(`-----BEGIN PRIVATE KEY-----\n${rawKey}\n-----END PRIVATE KEY-----`);
    return 'PKCS8';
  } catch {
    return 'PKCS1';
  }
}

function resolveExistingPath(
  configuredPath: string | null | undefined,
  fallbackFiles: string[]
): string | undefined {
  const candidates: string[] = [];
  if (configuredPath && configuredPath.trim()) {
    const raw = configuredPath.trim();
    candidates.push(raw);
    if (!path.isAbsolute(raw)) {
      candidates.push(path.resolve(process.cwd(), raw));
      candidates.push(path.resolve(process.cwd(), '..', '..', raw));
      candidates.push(path.resolve(process.cwd(), '..', '..', '..', raw));
      candidates.push(path.resolve(process.cwd(), '..', '..', '..', '..', raw));
      candidates.push(path.resolve(process.cwd(), '..', '..', '..', '..', '..', raw));
    }
  }
  for (const fallback of fallbackFiles) {
    candidates.push(path.resolve(process.cwd(), fallback));
    candidates.push(path.resolve(process.cwd(), '..', '..', fallback));
    candidates.push(path.resolve(process.cwd(), '..', '..', '..', fallback));
    candidates.push(path.resolve(process.cwd(), '..', '..', '..', '..', fallback));
    candidates.push(path.resolve(process.cwd(), '..', '..', '..', '..', '..', fallback));
  }
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ success: false, error: '无效的请求数据' }, { status: 400 });
    }

    const { orderId, orderNo, paymentMethod, channel } = body;
    const resolvedPaymentMethod = paymentMethod || channel;

    if ((!orderId && !orderNo) || !resolvedPaymentMethod) {
      return NextResponse.json(
        { success: false, error: '参数不完整' },
        { status: 400 }
      );
    }

    // 查找订单
    const order = await prisma.order.findUnique({
      where: orderId ? { id: orderId } : { orderNo },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: '订单不存在' },
        { status: 404 }
      );
    }

    if (order.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: '订单状态异常' },
        { status: 400 }
      );
    }

    // 获取支付配置
    const config = await getPaymentConfig();
    const baseUrl = env.NEXT_PUBLIC_BASE_URL;

    // 生成支付二维码
    let qrCodeUrl = '';
    let qrText = '';
    
    if (resolvedPaymentMethod === 'alipay') {
      // Prefer certificate mode when packaged cert files are available.
      const appCertPath = config.alipay.appCertPath
        ? resolveExistingPath(config.alipay.appCertPath, [])
        : undefined;
      const alipayPublicCertPath = config.alipay.alipayCertPath
        ? resolveExistingPath(config.alipay.alipayCertPath, [])
        : undefined;
      const alipayRootCertPath = config.alipay.alipayRootCertPath
        ? resolveExistingPath(config.alipay.alipayRootCertPath, [])
        : undefined;
      const hasCertMode = !!appCertPath && !!alipayPublicCertPath && !!alipayRootCertPath;
      if (config.alipay.appId && config.alipay.privateKey && (config.alipay.publicKey || hasCertMode)) {
        try {
          
          
          // Ensure private key is formatted correctly if needed, but SDK usually handles standard PEM
          // Cast nulls to undefined for optional fields to satisfy SDK types
          const appId = String(config.alipay.appId).trim();
          const privateKey = normalizePem(config.alipay.privateKey);
          const alipayPublicKey = normalizePem(config.alipay.publicKey);
          const sdkOptions: Record<string, any> = {
            appId,
            gateway: 'https://openapi.alipay.com/gateway.do',
            signType: 'RSA2',
            timeout: 5000,
          };
          if (!privateKey) {
            throw new Error('alipay_private_key_missing');
          }
          sdkOptions.keyType = detectAlipayKeyType(privateKey);
          if (hasCertMode) {
            console.log(`[AlipayRoute] sdk_mode=cert key_type=${sdkOptions.keyType}`);
            sdkOptions.privateKey = privateKey;
            sdkOptions.appCertPath = appCertPath;
            sdkOptions.alipayPublicCertPath = alipayPublicCertPath;
            sdkOptions.alipayRootCertPath = alipayRootCertPath;
          } else if (alipayPublicKey) {
            console.log(`[AlipayRoute] sdk_mode=public_key key_type=${sdkOptions.keyType}`);
            sdkOptions.privateKey = privateKey;
            sdkOptions.alipayPublicKey = alipayPublicKey;
          } else {
            throw new Error('alipay_public_key_or_cert_missing');
          }
          const alipaySdk = new AlipaySdkConstructor(sdkOptions);

          // 电脑网站支付：返回支付宝官方收银台链接。
          const amountNumber = Number(order.amount);
          if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
            throw new Error(`invalid_order_amount:${order.amount}`);
          }
          const totalAmount = amountNumber.toFixed(2);
          const subject = buildAlipaySubject(order.productName);
          const pagePayParams: Record<string, any> = {
            bizContent: {
              outTradeNo: order.orderNo,
              productCode: 'FAST_INSTANT_TRADE_PAY',
              totalAmount,
              subject,
            },
          };
          if (isPublicNotifyBaseUrl(baseUrl)) {
            pagePayParams.notifyUrl = `${baseUrl}/api/payment/webhook/alipay`;
            pagePayParams.returnUrl = `${baseUrl}/api/payment/return/alipay`;
          }
          const paymentUrl = alipaySdk.pageExecute(
            'alipay.trade.page.pay',
            'GET',
            pagePayParams
          );
          if (!paymentUrl) {
             throw new Error('Failed to generate Alipay page pay URL');
          }
          qrText = paymentUrl;
          qrCodeUrl = paymentUrl;

        } catch (alipayError: any) {
          console.error('Alipay integration error:', alipayError);
          return NextResponse.json(
             { success: false, error: `支付宝下单失败: ${alipayError.message || '未知错误'}` },
             { status: 500 }
          );
        }
      } else {
        // 无配置，使用模拟/占位符
        
        return NextResponse.json(
          { success: false, error: 'alipay_not_configured' },
          { status: 400 }
        );
      }
      
    } else if (resolvedPaymentMethod === 'wechat') {
      const wechatPayAppId = (config.wechat.payAppId || config.wechat.appId || '').trim();
      const wechatCertPath = config.wechat.certPath?.trim() || '';
      const wechatKeyPath = config.wechat.keyPath?.trim() || '';
      const missingWechatConfig: string[] = [];
      if (!wechatPayAppId) missingWechatConfig.push('wechat_pay_app_id/wechat_app_id');
      if (!config.wechat.mchId?.trim()) missingWechatConfig.push('wechat_mch_id');
      if (!config.wechat.apiKeyV3?.trim()) missingWechatConfig.push('wechat_api_key_v3');
      if (!wechatCertPath) missingWechatConfig.push('wechat_pay_cert_path');
      if (!wechatKeyPath) missingWechatConfig.push('wechat_pay_key_path');
      if (missingWechatConfig.length > 0) {
        return NextResponse.json(
          { success: false, error: `wechat_not_configured:${missingWechatConfig.join(',')}` },
          { status: 400 }
        );
      }
      try {
          if (!isPublicNotifyBaseUrl(baseUrl)) {
            throw new Error('wechat_notify_url_must_be_public');
          }
          const certPath = path.isAbsolute(wechatCertPath) ? wechatCertPath : path.resolve(process.cwd(), wechatCertPath);
          const keyPath = path.isAbsolute(wechatKeyPath) ? wechatKeyPath : path.resolve(process.cwd(), wechatKeyPath);
          if (!existsSync(certPath)) {
            throw new Error(`wechat_cert_not_found:${certPath}`);
          }
          if (!existsSync(keyPath)) {
            throw new Error(`wechat_key_not_found:${keyPath}`);
          }
          const certPem = readFileSync(certPath, 'utf8');
          const keyPem = readFileSync(keyPath, 'utf8');
          const serial = new X509Certificate(certPem).serialNumber.replace(/:/g, '').toUpperCase();
          const total = Math.max(1, Math.round(Number(order.amount) * 100));
          const payload = {
            mchid: config.wechat.mchId!.trim(),
            appid: wechatPayAppId,
            out_trade_no: order.orderNo,
            description: buildAlipaySubject(order.productName),
            notify_url: `${baseUrl}/api/payment/webhook/wechat`,
            amount: { total, currency: 'CNY' },
          };
          const nonce = randomBytes(16).toString('hex');
          const timestamp = Math.floor(Date.now() / 1000).toString();
          const urlPath = '/v3/pay/transactions/native';
          const bodyStr = JSON.stringify(payload);
          const signer = createSign('RSA-SHA256');
          signer.update(`POST
${urlPath}
${timestamp}
${nonce}
${bodyStr}
`);
          const signature = signer.sign(keyPem, 'base64');
          const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${config.wechat.mchId!.trim()}",serial_no="${serial}",nonce_str="${nonce}",timestamp="${timestamp}",signature="${signature}"`;
          const response = await fetch(`https://api.mch.weixin.qq.com${urlPath}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': authorization,
            },
            body: bodyStr,
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok || !result?.code_url) {
            const msg = result?.message || result?.code || 'WeChat Pay error';
            throw new Error(msg);
          }
          qrText = result.code_url;
        } catch (wechatError: any) {
          console.error('WeChat Pay integration error:', wechatError);
          return NextResponse.json(
            { success: false, error: `微信下单失败: ${wechatError.message || '未知错误'}` },
            { status: 500 }
          );
        }
    }

    if (!qrText && !qrCodeUrl) {
      return NextResponse.json(
        { success: false, error: 'unsupported_payment_method' },
        { status: 400 }
      );
    }

    if (!qrCodeUrl) {
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrText)}`;
    }

    return NextResponse.json({
      success: true,
      qrCodeUrl,
      qr_text: qrText || qrCodeUrl,
      orderId: order.id,
      orderNo: order.orderNo,
      amount: order.amount,
      paymentMethod: resolvedPaymentMethod,
      order: {
        id: order.id,
        orderNo: order.orderNo,
        productName: order.productName,
        amount: order.amount,
        status: order.status,
        createdAt: order.createdAt,
        paymentMethod: resolvedPaymentMethod,
        email: order.user?.email || null,
      }
    });

  } catch (error) {
    console.error('生成支付二维码错误:', error);
    return NextResponse.json(
      { success: false, error: '生成支付二维码失败' },
      { status: 500 }
    );
  }
}
