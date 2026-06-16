import { NextRequest, NextResponse } from 'next/server';
import { getPaymentConfig } from '@/lib/config';

declare global {
  var alipayTickets: Record<string, any> | undefined;
}

// 闁衡偓椤栨瑧甯涢悗瑙勭箘濞呫儴銇愰弴鐐寸閻?
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authCode = searchParams.get('auth_code');
    const state = searchParams.get('state'); // ticket
    
    if (!authCode || !state) {
      return NextResponse.redirect(
        new URL('/login?error=missing_params', request.url)
      );
    }
    
    // 婵☆偀鍋撻柡宀婃icket
    const tickets = globalThis.alipayTickets || {};
    const ticketData = tickets[state];
    
    if (!ticketData) {
      return NextResponse.redirect(
        new URL('/login?error=invalid_ticket', request.url)
      );
    }
    
    // 闁兼儳鍢茶ぐ鍥绩椤栨瑧甯涢悗瑙勭箞閸樸倗绱?
    const config = await getPaymentConfig();
    
    const hasCertMode =
      !!config.alipay.appCertPath &&
      !!config.alipay.alipayCertPath &&
      !!config.alipay.alipayRootCertPath;
    const hasKeyMode = !!config.alipay.privateKey;
    if (!config.alipay.appId || (!hasCertMode && !hasKeyMode)) {
      console.error('alipay login config missing: appId or cert/key config');
      return NextResponse.redirect(
        new URL('/login?error=alipay_config_missing', request.url)
      );
    }

    // Alipay SDK init (prefer cert mode, fallback to key mode)
    const alipaySdkModule = await import('alipay-sdk');
    const AlipaySdkConstructor = (alipaySdkModule as any).default || (alipaySdkModule as any);
    const sdkOptions: Record<string, any> = {
      appId: config.alipay.appId,
      gateway: 'https://openapi.alipay.com/gateway.do',
      timeout: 5000,
    };
    if (hasCertMode) {
      sdkOptions.privateKey = config.alipay.privateKey || undefined;
      sdkOptions.appCertPath = config.alipay.appCertPath;
      sdkOptions.alipayPublicCertPath = config.alipay.alipayCertPath;
      sdkOptions.alipayRootCertPath = config.alipay.alipayRootCertPath;
    } else {
      sdkOptions.privateKey = config.alipay.privateKey;
      sdkOptions.alipayPublicKey = config.alipay.publicKey || undefined;
    }
    const alipaySdk = new AlipaySdkConstructor(sdkOptions);

    // 1. 濞达綀娉曢弫?auth_code 闁瑰箍鍨硅ぐ?access_token
    // 闁哄倸娲﹂妴? https://opendocs.alipay.com/open/02xtlb
    const tokenResultRaw = await alipaySdk.exec('alipay.system.oauth.token', {
      grant_type: 'authorization_code',
      code: authCode,
    });

    const tokenResult = typeof tokenResultRaw === 'string' ? JSON.parse(tokenResultRaw) : tokenResultRaw;
    const tokenPayload = tokenResult?.alipay_system_oauth_token_response || tokenResult;
    const accessToken = tokenPayload?.access_token;
    if (!accessToken) {
      throw new Error('闁兼儳鍢茶ぐ?access_token 濠㈡儼绮剧憴? ' + JSON.stringify(tokenResult));
    }

    // 2. 濞达綀娉曢弫?access_token 闁兼儳鍢茶ぐ鍥偨閵婏箑鐓曞ǎ鍥ｅ墲娴?
    // 闁哄倸娲﹂妴? https://opendocs.alipay.com/open/02xtlc
    const userInfoResultRaw = await alipaySdk.exec('alipay.user.info.share', {
      auth_token: accessToken,
    });
    const userInfoResult = typeof userInfoResultRaw === 'string' ? JSON.parse(userInfoResultRaw) : userInfoResultRaw;
    const userPayload = userInfoResult?.alipay_user_info_share_response || userInfoResult;
    const userId = userPayload?.user_id;
    if (!userId) {
      throw new Error('閼煎懘鍨惧Ο搴濈畽閵夊倿妾查幊濞垮剬鐟欙絺鍋?user_id 韫囨瑦鍩夐棁鑼皸閹搭喛濮﹂悮顐ｆ倕婵? ' + JSON.stringify(userInfoResult));
    }

    // 闁哄洤鐡ㄩ弻濡昳cket闁绘鍩栭埀?
    tickets[state] = {
      ...ticketData,
      status: 'success',
      userInfo: {
        email: `alipay_${userId}@jarvis.com`, // 闁哄瀚伴埀顒傚Т閺侇喗绋夐埀顒勬焽椤旂虎鍞?
        username: `ali_${String(userId).substr(-8)}`,
        name: userPayload?.nick_name || 'Alipay User',
        avatar: userPayload?.avatar || '',
        alipayUserId: userId,
      },
      scannedAt: Date.now(),
    };
    
    // 闂佹彃绉撮悾楣冨触閹存繂鐓傞柣褑顕х紞宥嗐亜閻㈠憡妗ㄩ柨娑樿嫰婢х姷绮╅娆戠獥閺夌儐鍠涢妤呮偐閼哥鍋?
    return NextResponse.redirect(
      new URL('/login?alipay=scanning', request.url)
    );
    
  } catch (error: unknown) {
    console.error('闁衡偓椤栨瑧甯涢悗瑙勭箘濞呫儴銇愰弴鐐寸閻犲鍟妵鎴犳嫻?', error);
    const message = error instanceof Error ? error.message : 'alipay_callback_failed';
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}