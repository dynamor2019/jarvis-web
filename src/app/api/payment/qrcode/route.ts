// [CodeGuard Feature Index]
// - AlipaySdkConstructor -> line 16
// - POST -> line 18
// [/CodeGuard Feature Index]

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPaymentConfig } from '@/lib/config';
import { env } from '@/lib/env';
import * as AlipaySdk from 'alipay-sdk';
import { existsSync, readFileSync } from 'fs';
import { createSign, randomBytes, X509Certificate } from 'crypto';
import path from 'path';

// Safely handle AlipaySdk import for various environments (CJS/ESM interop)
function resolveAlipaySdkConstructor(sdkModule: any) {
  const ctor =
    sdkModule?.default?.default ||
    sdkModule?.default ||
    sdkModule?.AlipaySdk ||
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
      // 检查配置是否存在
      const hasConfiguredCertPaths = Boolean(
        config.alipay.appCertPath?.trim() &&
        config.alipay.alipayCertPath?.trim() &&
        config.alipay.alipayRootCertPath?.trim()
      );
      const appCertPath = hasConfiguredCertPaths
        ? resolveExistingPath(config.alipay.appCertPath, [
            'appCertPublicKey_2021006128602915.crt',
          ])
        : undefined;
      const alipayPublicCertPath = hasConfiguredCertPaths
        ? resolveExistingPath(config.alipay.alipayCertPath, [
            'alipayCertPublicKey_RSA2.crt',
          ])
        : undefined;
      const alipayRootCertPath = hasConfiguredCertPaths
        ? resolveExistingPath(config.alipay.alipayRootCertPath, [
            'alipayRootCert.crt',
          ])
        : undefined;
      const hasCertMode = hasConfiguredCertPaths && !!appCertPath && !!alipayPublicCertPath && !!alipayRootCertPath;
      if (config.alipay.appId && (config.alipay.privateKey || hasCertMode)) {
        try {
          
          
          // Ensure private key is formatted correctly if needed, but SDK usually handles standard PEM
          // Cast nulls to undefined for optional fields to satisfy SDK types
          const appId = String(config.alipay.appId).trim();
          const privateKey = normalizePem(config.alipay.privateKey);
          const alipayPublicKey = normalizePem(config.alipay.publicKey);
          const sdkOptions: Record<string, any> = {
            appId,
            gateway: 'https://openapi.alipay.com/gateway.do',
            timeout: 5000,
          };
          if (hasCertMode) {
            sdkOptions.privateKey = privateKey;
            sdkOptions.appCertPath = appCertPath;
            sdkOptions.alipayPublicCertPath = alipayPublicCertPath;
            sdkOptions.alipayRootCertPath = alipayRootCertPath;
          } else {
            if (!privateKey) {
              throw new Error('alipay_private_key_missing');
            }
            sdkOptions.privateKey = privateKey;
            sdkOptions.alipayPublicKey = alipayPublicKey;
          }
          const alipaySdk = new AlipaySdkConstructor(sdkOptions);

          // 网站支付优先：直接调用 PC 网页支付接口 (alipay.trade.page.pay)
          const amountNumber = Number(order.amount);
          if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
            throw new Error(`invalid_order_amount:${order.amount}`);
          }
          const totalAmount = amountNumber.toFixed(2);
          const subject = buildAlipaySubject(order.productName);
          const pagePayParams: Record<string, any> = {
            bizContent: {
              outTradeNo: order.orderNo,
              totalAmount,
              subject,
              productCode: 'FAST_INSTANT_TRADE_PAY',
            },
          };
          if (isPublicNotifyBaseUrl(baseUrl)) {
            pagePayParams.notify_url = `${baseUrl}/api/payment/webhook/alipay`;
            pagePayParams.return_url = `${baseUrl}/payment?orderNo=${encodeURIComponent(order.orderNo)}&paid=1`;
          }
          const pagePayResult: any = await alipaySdk.exec(
            'alipay.trade.page.pay',
            pagePayParams,
            { method: 'GET' }
          );
          if (typeof pagePayResult === 'string' && /^https?:\/\//i.test(pagePayResult)) {
            qrText = pagePayResult;
          } else {
            const raw = (() => {
              try {
                return JSON.stringify(pagePayResult).slice(0, 260);
              } catch {
                return 'raw_unserializable';
              }
            })();
            throw new Error(`Alipay page pay failed raw=${raw}`);
          }

          if (!qrText) {
             throw new Error('Failed to retrieve QR code from Alipay response');
          }

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
      const wechatPayAppId = config.wechat.payAppId || config.wechat.appId;
      if (wechatPayAppId && config.wechat.mchId && config.wechat.apiKeyV3 && config.wechat.certPath && config.wechat.keyPath) {
        try {
          const certPath = path.isAbsolute(config.wechat.certPath) ? config.wechat.certPath : path.resolve(process.cwd(), config.wechat.certPath);
          const keyPath = path.isAbsolute(config.wechat.keyPath) ? config.wechat.keyPath : path.resolve(process.cwd(), config.wechat.keyPath);
          const certPem = readFileSync(certPath, 'utf8');
          const keyPem = readFileSync(keyPath, 'utf8');
          const serial = new X509Certificate(certPem).serialNumber.replace(/:/g, '').toUpperCase();
          const total = Math.max(1, Math.round(Number(order.amount) * 100));
          const payload = {
            mchid: config.wechat.mchId,
            appid: wechatPayAppId,
            out_trade_no: order.orderNo,
            description: order.productName,
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
          const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${config.wechat.mchId}",serial_no="${serial}",nonce_str="${nonce}",timestamp="${timestamp}",signature="${signature}"`;
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
            { success: false, error: `????????: ${wechatError.message || '????'}` },
            { status: 500 }
          );
        }
      } else {
        qrText = `wxpay://pay?orderNo=${order.orderNo}&amount=${order.amount}`;
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
