// [CodeGuard Feature Index]
// - AlipaySdkConstructor -> line 16
// - POST -> line 18
// [/CodeGuard Feature Index]

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPaymentConfig } from '@/lib/config';
import { env } from '@/lib/env';
import * as AlipaySdk from 'alipay-sdk';
import { readFileSync } from 'fs';
import { createSign, randomBytes, X509Certificate } from 'crypto';
import path from 'path';

// Safely handle AlipaySdk import for various environments (CJS/ESM interop)
const AlipaySdkConstructor = (AlipaySdk as any).default || AlipaySdk;

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
      if (config.alipay.appId && config.alipay.privateKey) {
        try {
          
          
          // Ensure private key is formatted correctly if needed, but SDK usually handles standard PEM
          // Cast nulls to undefined for optional fields to satisfy SDK types
          const alipaySdk = new AlipaySdkConstructor({
            appId: config.alipay.appId,
            privateKey: config.alipay.privateKey,
            alipayPublicKey: config.alipay.publicKey || undefined,
            gateway: 'https://openapi.alipay.com/gateway.do',
            timeout: 5000, // Add timeout to prevent hanging
          });

          // 调用支付宝统一下单接口 (alipay.trade.precreate)
          
          
          // Using a timeout wrapper for the SDK call to prevent hanging requests
          const sdkCall = alipaySdk.exec('alipay.trade.precreate', {
            bizContent: {
              out_trade_no: order.orderNo,
              total_amount: order.amount.toString(),
              subject: order.productName,
            },
            notify_url: `${baseUrl}/api/payment/webhook/alipay`,
          });
          
          // 10s timeout for the SDK call
          const result: any = await Promise.race([
            sdkCall,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Alipay SDK timeout')), 10000))
          ]);

          

          if (result && typeof result === 'object' && result.code === '10000') {
             // code 10000 is success for Alipay responses
             if (result.qr_code) {
               qrText = result.qr_code;
             } else {
               
               // Fallback or error? Usually alipay.trade.precreate returns qr_code on success.
               // Sometimes it might be in a nested object depending on SDK version normalization
               // But typically 'qr_code' is at top level of the result object returned by alipay-sdk
               // If sdk normalizes response, it returns the content of the response node.
             }
          } else if (result && result.qr_code) {
             // Some SDK versions might return the direct response object
             qrText = result.qr_code;
          } else {
             console.error('Alipay SDK error response:', result);
             const subMsg = result?.sub_msg || result?.msg || 'Unknown Alipay error';
             throw new Error(`Alipay error: ${subMsg}`);
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
        
        qrText = `alipay://pay?orderNo=${order.orderNo}&amount=${order.amount}`;
      }
      
    } else if (resolvedPaymentMethod === 'wechat') {
      if (config.wechat.appId && config.wechat.mchId && config.wechat.apiKeyV3 && config.wechat.certPath && config.wechat.keyPath) {
        try {
          const certPath = path.isAbsolute(config.wechat.certPath) ? config.wechat.certPath : path.resolve(process.cwd(), config.wechat.certPath);
          const keyPath = path.isAbsolute(config.wechat.keyPath) ? config.wechat.keyPath : path.resolve(process.cwd(), config.wechat.keyPath);
          const certPem = readFileSync(certPath, 'utf8');
          const keyPem = readFileSync(keyPath, 'utf8');
          const serial = new X509Certificate(certPem).serialNumber.replace(/:/g, '').toUpperCase();
          const total = Math.max(1, Math.round(Number(order.amount) * 100));
          const payload = {
            mchid: config.wechat.mchId,
            appid: config.wechat.appId,
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
