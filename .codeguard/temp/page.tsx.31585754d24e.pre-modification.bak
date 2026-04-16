// [CodeGuard Feature Index]
// - LoginContent -> line 29
// - handleSkipWait -> line 81
// - hash -> line 206
// - checkWechatStatus -> line 226
// - handleWechatLogin -> line 259
// - checkAlipayStatus -> line 296
// - checkReferralCode -> line 379
// - handleSubmit -> line 414
// [/CodeGuard Feature Index]

"use client";

import { useState, useEffect, Suspense, useRef } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
    return (
        <Suspense fallback={<div />}> 
            <LoginContent />
        </Suspense>
    );
}

function LoginContent() {
    const router = useRouter();
    const intl = useIntl();
    const searchParams = useSearchParams();
    const brand_title = 'JarvisAI';
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showWechat, setShowWechat] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [wechatAuthUrl, setWechatAuthUrl] = useState('');
    const [qrLoading, setQrLoading] = useState(false);
    const [ticket, setTicket] = useState('');
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const wechatLoginContainerRef = useRef<HTMLDivElement | null>(null);
    
    // Alipay login state
    const [showAlipay, setShowAlipay] = useState(false);
    const [alipayQrCode, setAlipayQrCode] = useState('');
    const [alipayTicket, setAlipayTicket] = useState('');
    const alipayPollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        name: '',
        referralCode: '',
        code: '',
    });
    const [referralStatus, setReferralStatus] = useState<'idle'|'checking'|'valid'|'invalid'>('idle');
    const [referralMeta, setReferralMeta] = useState<{ uses: number; maxUses: number }|null>(null);
    const [referralError, setReferralError] = useState<string>('');
    const [sendingCode, setSendingCode] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [isWordPlugin, setIsWordPlugin] = useState(false);
    const [hasToken, setHasToken] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    
    // Login success redirect state
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [redirectCountdown, setRedirectCountdown] = useState(0);

    // Handle post-login countdown redirect
    useEffect(() => {
        if (loginSuccess && redirectCountdown > 0) {
            const timer = setTimeout(() => {
                setRedirectCountdown(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (loginSuccess && redirectCountdown === 0) {
            router.replace('/dashboard');
        }
    }, [loginSuccess, redirectCountdown, router]);

    const handleSkipWait = () => {
        router.replace('/dashboard');
    };

    const redirectToDashboard = () => {
        router.replace('/dashboard');
        setTimeout(() => {
            if (typeof window !== 'undefined' && window.location.pathname.startsWith('/login')) {
                window.location.assign('/dashboard');
            }
        }, 800);
    };

    useEffect(() => {
        const wv = searchParams.get('wv') === '1';
        setIsWordPlugin(wv);
        
        // Word plugin mode toggle
        if (wv) {
            const needRegister = searchParams.get('register');
            if (needRegister === '1') {
                setIsLogin(false);
                try { (window as any).chrome?.webview?.postMessage({ type: 'resize', mode: 'register' }); } catch {}
            } else {
                setIsLogin(true);
                try { (window as any).chrome?.webview?.postMessage({ type: 'resize', mode: 'login' }); } catch {}
            }
        }
    }, [searchParams]);

    // Check login token in localStorage
    useEffect(() => {
        if (localStorage.getItem('token')) {
            setHasToken(true);
        }
    }, []);

    // Sync token to Word plugin host
    useEffect(() => {
        if (hasToken && isWordPlugin) {
            try {
                const t = localStorage.getItem('token');
                if (t) {
                    (window as any).chrome?.webview?.postMessage({ type: 'token', token: t });
                    window.location.hash = 'logged_in_' + Date.now();
                }
            } catch {}
        }
    }, [hasToken, isWordPlugin]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleSendCode = async () => {
        if (!formData.email) {
            setError(intl.formatMessage({ id: 'login.error.email_required', defaultMessage: 'Email is required' }));
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
            setError(intl.formatMessage({ id: 'login.error.email_invalid', defaultMessage: 'Invalid email format' }));
            return;
        }
        
        setSendingCode(true);
        setError('');
        
        try {
            const res = await fetch('/api/auth/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email }),
            });
            const data = await res.json();
            
            if (res.ok) {
                setCountdown(60);
                if (data.debugCode) {
                    alert(intl.formatMessage({ id: 'login.msg.code_debug', defaultMessage: 'Debug verification code: {code}' }, { code: data.debugCode }));
                } else {
                    alert(intl.formatMessage({ id: 'login.msg.code_sent', defaultMessage: 'Verification code has been sent to your email' }));
                }
            } else {
                setError(data.error || intl.formatMessage({ id: 'login.msg.send_fail', defaultMessage: 'Failed to send verification code' }));
            }
        } catch (err) {
            setError(intl.formatMessage({ id: 'login.error.send_code_net', defaultMessage: 'Unable to send verification code. Please try again later.' }));
        } finally {
            setSendingCode(false);
        }
    };

    // 闂傚倸鍊搁崐鎼佸磹閹间礁纾归柣鎴ｅГ閸ゅ嫰鏌涢锝嗙５闁逞屽墾缁犳挸鐣锋總绋课ㄩ柨鏃囧Г閻濇牠姊绘笟鈧褔鏁嶈箛娑樼妞ゆ帊绶￠崬鍫曟⒒閸屾瑨鍏岀紒顕呭灠椤繑绻濆顒傚幈闂佸壊鍋侀崕閬嶅几娓氣偓閺屾盯濡烽鐓庮潽闂佺粯鎸婚悷鈺侇潖婵犳艾纾兼慨妯煎帶濞堣泛顪冮妶蹇氼吅濠碘€虫川濡叉劙骞掑Δ濠冩櫇闂侀潧绻嗛幊锝堫樄闁哄矉绱曟禒锕傚礈瑜庨崚娑橆渻閵堝啫鐏繛鑼枛瀵偊骞囬弶鍨€垮┑鐐叉閻熝呯矚閸ф鈷掗柛灞剧懆閸忓本銇勯鐐靛ⅵ妞ゃ垺鐗犲畷鍗炩槈濡⒈鍞归梻浣规偠閸庢粎浠﹂懞銉悪闂傚倷鑳堕幊鎾诲床閺屻儲鍎斿┑鍌氭啞閸嬵亪鏌嶈閸撶喎顫忓ú顏勪紶闁告洦鍓欑粣娑㈡⒑缁嬫鍎戦柛鐘崇墵閵?
    // Handle callback params from social login
    useEffect(() => {
        const token = searchParams.get('token');
        const wechatSuccess = searchParams.get('wechat');
        const errorParam = searchParams.get('error');
        const needRegister = searchParams.get('register');

        if (token && wechatSuccess === 'success') {
            localStorage.setItem('token', token);
            redirectToDashboard();
        }

        if (errorParam) {
            setError(intl.formatMessage({ id: 'login.error.wechat_fail', defaultMessage: 'WeChat login failed. Please try again.' }));
        }
        if (needRegister === '1') {
            setIsLogin(false);
        }
        
        try {
            const hash = (typeof window !== 'undefined') ? window.location.hash : '';
            const match = /^#.*import_token=([^&]+)/.exec(hash || '');
            const importToken = match && match[1] ? decodeURIComponent(match[1]) : '';
            if (importToken && importToken.length > 20) {
                localStorage.setItem('token', importToken);
                (async ()=>{
                    try {
                        const r = await fetch('/api/tokens/balance', { headers: { 'Authorization': `Bearer ${importToken}` } });
                        const j = await r.json();
                        if (j?.success) {
                            localStorage.setItem('user', JSON.stringify({ id: j.userId, username: j.username, email: j.email }));
                            router.replace('/dashboard');
                        }
                    } catch {}
                })();
            }
        } catch {}
    }, [searchParams, router]);

    // Poll wechat login status
    const checkWechatStatus = async (ticketId: string) => {
        try {
            const response = await fetch(`/api/auth/wechat/status?ticket=${ticketId}`);
            const data = await response.json();
            
            if (data.status === 'success' && data.token) {
                // Stop polling when ticket expires
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
                
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setShowWechat(false);
                redirectToDashboard();
            } else if (data.status === 'expired') {
                // Stop polling when ticket expires
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
                setError(intl.formatMessage({ id: 'login.error.qr_expired', defaultMessage: 'QR code expired. Please refresh and try again.' }));
                setShowWechat(false);
            }
        } catch (err: unknown) {
            
        }
    };

    const handleWechatLogin = async () => {
        setQrLoading(true);
        setError('');
        
        // Stop polling when ticket expires
                if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }

        try {
            const referralRaw = (formData.referralCode || '').trim();
            const referralQuery = (!isLogin && referralRaw)
                ? `?referralCode=${encodeURIComponent(referralRaw)}`
                : '';
            const response = await fetch(`/api/auth/wechat/qrcode${referralQuery}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || intl.formatMessage({ id: 'login.error.qr_fail', defaultMessage: 'Failed to get QR code. Please try again.' }));
            }
            
            setQrCode(data.qrCode);
            setWechatAuthUrl(data.dev ? '' : (data.authUrl || ''));
            setTicket(data.ticket || '');
            setShowWechat(true);
            
            // Start polling login status
            const interval = setInterval(() => {
                checkWechatStatus(data.ticket);
            }, 2000); // 濠?缂傚倸鍊搁崐鎼佸磹閹间礁纾归柟闂寸绾剧懓顪冪€ｎ亝鎹ｉ柣顓炴閵嗘帒顫濋敐鍛闂佽姤蓱缁诲牓寮婚悢灏佹灁闁割煈鍠楅悘宥夋⒑閸濆嫭顥炵紒顔肩У缁岃鲸绻濋崶顬囨煕濞戝崬鏋涢柛鏃€鐟︾换婵嬪閿濆懐鍘梺鍛婃⒐濞叉牠顢欒箛鎾斀閻庯綆鍋嗛崢鍛婄節閵忥絾纭炬い鎴濇嚇閹﹢鏌嗗鍡欏幍闂佸吋浜介崕鑼矆鐎ｎ偅鍙忓┑鐘插暞閵囨繃淇婇銏犳殭闁宠棄顦板蹇涘Ω閹扳晛鈧繂顫忛搹鍦煓闁告牑鍓濋弫鎯ь渻閵堝啫濡奸柨鏇ㄤ邯婵″瓨绗熼埀顒€顕ｉ鈧崺鈧い鎺嗗亾妞ゎ厼娲╃粻娑樷槈濡壕鏅濋幉姝岀疀濞戣鲸鏅?            
            pollingIntervalRef.current = interval;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : intl.formatMessage({ id: 'login.error.qr_fail', defaultMessage: 'Operation failed. Please try again.' });
            setError(message);
        } finally {
            setQrLoading(false);
        }
    };

    // Poll alipay login status
    const checkAlipayStatus = async (ticketId: string) => {
        try {
            const response = await fetch(`/api/auth/alipay/status?ticket=${ticketId}`);
            const data = await response.json();
            
            if (data.status === 'success' && data.token) {
                // Stop polling when ticket expires
                if (alipayPollingIntervalRef.current) {
                    clearInterval(alipayPollingIntervalRef.current);
                    alipayPollingIntervalRef.current = null;
                }
                
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setShowAlipay(false);
                redirectToDashboard();
            } else if (data.status === 'expired') {
                // Stop polling when ticket expires
                if (alipayPollingIntervalRef.current) {
                    clearInterval(alipayPollingIntervalRef.current);
                    alipayPollingIntervalRef.current = null;
                }
                setError(intl.formatMessage({ id: 'login.error.qr_expired', defaultMessage: 'Operation failed. Please try again.' }));
                setShowAlipay(false);
            }
        } catch (err: unknown) {
            
        }
    };

    // Start alipay login
    const handleAlipayLogin = async () => {
        setQrLoading(true);
        setError('');
        
        // Stop polling when ticket expires
                if (alipayPollingIntervalRef.current) {
            clearInterval(alipayPollingIntervalRef.current);
            alipayPollingIntervalRef.current = null;
        }

        try {
            const response = await fetch('/api/auth/alipay/qrcode');
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || intl.formatMessage({ id: 'login.error.alipay_qr_fail', defaultMessage: 'Operation failed. Please try again.' }));
            }
            
            setAlipayQrCode(data.qrCode);
            setAlipayTicket(data.ticket || '');
            setShowAlipay(true);
            
            // Start polling login status
            const interval = setInterval(() => {
                checkAlipayStatus(data.ticket);
            }, 2000); // 濠?缂傚倸鍊搁崐鎼佸磹閹间礁纾归柟闂寸绾剧懓顪冪€ｎ亝鎹ｉ柣顓炴閵嗘帒顫濋敐鍛闂佽姤蓱缁诲牓寮婚悢灏佹灁闁割煈鍠楅悘宥夋⒑閸濆嫭顥炵紒顔肩У缁岃鲸绻濋崶顬囨煕濞戝崬鏋涢柛鏃€鐟︾换婵嬪閿濆懐鍘梺鍛婃⒐濞叉牠顢欒箛鎾斀閻庯綆鍋嗛崢鍛婄節閵忥絾纭炬い鎴濇嚇閹﹢鏌嗗鍡欏幍闂佸吋浜介崕鑼矆鐎ｎ偅鍙忓┑鐘插暞閵囨繃淇婇銏犳殭闁宠棄顦板蹇涘Ω閹扳晛鈧繂顫忛搹鍦煓闁告牑鍓濋弫鎯ь渻閵堝啫濡奸柨鏇ㄤ邯婵″瓨绗熼埀顒€顕ｉ鈧崺鈧い鎺嗗亾妞ゎ厼娲╃粻娑樷槈濡壕鏅濋幉姝岀疀濞戣鲸鏅?            
            alipayPollingIntervalRef.current = interval;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : intl.formatMessage({ id: 'login.error.alipay_qr_fail', defaultMessage: 'Operation failed. Please try again.' });
            setError(message);
        } finally {
            setQrLoading(false);
        }
    };

    // Cleanup polling timers
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
            if (alipayPollingIntervalRef.current) {
                clearInterval(alipayPollingIntervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!showWechat || !wechatAuthUrl || !wechatLoginContainerRef.current) {
            return;
        }

        const authUrl = new URL(wechatAuthUrl);
        const appId = authUrl.searchParams.get('appid');
        const redirectUri = authUrl.searchParams.get('redirect_uri');
        const scope = authUrl.searchParams.get('scope') || 'snsapi_login';
        const stateValue = authUrl.searchParams.get('state') || '';

        if (!appId || !redirectUri) {
            return;
        }

        const container = wechatLoginContainerRef.current;
        const renderWidget = () => {
            container.innerHTML = '';
            new (window as any).WxLogin({
                id: container.id,
                appid: appId,
                scope,
                redirect_uri: decodeURIComponent(redirectUri),
                state: stateValue,
                style: 'black',
                href: '',
            });
        };

        if ((window as any).WxLogin) {
            renderWidget();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js';
        script.async = true;

        const handleLoad = () => renderWidget();
        script.addEventListener('load', handleLoad, { once: true });
        document.body.appendChild(script);

        return () => {
            script.removeEventListener('load', handleLoad);
            script.remove();
        };
    }, [showWechat, wechatAuthUrl]);

    // Debounced referral code check
    useEffect(() => {
        const checkReferralCode = async () => {
            if (!formData.referralCode) {
                setReferralStatus('idle');
                setReferralMeta(null);
                return;
            }

            setReferralStatus('checking');
            setReferralError('');
            
            try {
                const response = await fetch(`/api/auth/referral/${encodeURIComponent(formData.referralCode)}`);
                const data = await response.json();
                
                if (response.ok) {
                    setReferralStatus('valid');
                    setReferralMeta(data);
                } else {
                    setReferralStatus('invalid');
                    setReferralError(data.error || intl.formatMessage({ id: 'login.error.referral_invalid', defaultMessage: 'Operation failed. Please try again.' }));
                }
            } catch (err) {
                setReferralStatus('invalid');
                setReferralError(intl.formatMessage({ id: 'login.error.network', defaultMessage: 'Operation failed. Please try again.' }));
            }
        };

        const timer = setTimeout(() => {
            checkReferralCode();
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.referralCode]);

    // Submit login/register form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const payload = isLogin 
                ? { email: formData.email, password: formData.password }
                : { 
                    email: formData.email,
                    username: formData.username,
                    password: formData.password,
                    name: formData.name,
                    referralCode: formData.referralCode,
                    code: formData.code
                };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                if (isWordPlugin) {
                    try { (window as any).chrome?.webview?.postMessage({ type: 'token', token: data.token }); } catch {}
                    
                    if (!isLogin) {
                        setShowSuccessModal(true);
                    } else {
                        setHasToken(true);
                    }
                } else {
                    redirectToDashboard();
                }
            } else {
                setError(data.error || (isLogin
                    ? intl.formatMessage({ id: 'login.error.login_fail', defaultMessage: 'Operation failed. Please try again.' })
                    : intl.formatMessage({ id: 'login.error.register_fail', defaultMessage: 'Operation failed. Please try again.' })));
            }
        } catch (err: unknown) {
            const message = err instanceof Error
                ? err.message
                : (isLogin
                    ? intl.formatMessage({ id: 'login.error.login_fail', defaultMessage: 'Operation failed. Please try again.' })
                    : intl.formatMessage({ id: 'login.error.register_fail', defaultMessage: 'Operation failed. Please try again.' }));
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    if (false && hasToken && isWordPlugin) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-2">
                <div className="text-center w-full max-w-sm">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">
                        <FormattedMessage id="word_login.success.title" defaultMessage="Word Login Successful" />
                    </h2>
                    <p className="text-gray-500 text-xs mb-3">
                        <FormattedMessage id="word_login.success.desc" defaultMessage="You can continue to use Jarvis AI in Word now." />
                    </p>
                    <div className="flex items-center justify-center gap-2">
                        <button 
                            onClick={() => {
                                localStorage.removeItem('token');
                                localStorage.removeItem('user');
                                setHasToken(false);
                            }}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                        >
                            <FormattedMessage id="word_login.btn.switch" defaultMessage="Operation failed. Please try again." />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loginSuccess && !isWordPlugin) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center p-2">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        <FormattedMessage id="login.success.title" defaultMessage="Operation failed. Please try again." />
                    </h2>
                    <p className="text-gray-600 mb-6">
                        <FormattedMessage 
                            id="login.success.redirect" 
                            defaultMessage="{seconds}s to redirect"
                            values={{ seconds: redirectCountdown }} 
                        />
                    </p>
                    <button
                        onClick={handleSkipWait}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <FormattedMessage id="login.success.skip" defaultMessage="Operation failed. Please try again." />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center p-3">
            <div className={`bg-white rounded-[2rem] shadow-2xl w-full overflow-hidden ${isWordPlugin ? 'p-3 max-w-sm' : isLogin ? 'max-w-[352px] px-6 pt-6 pb-5' : 'max-w-[352px] min-h-[620px] aspect-[9/16] px-6 pt-6 pb-5 flex flex-col'}`}>
                <div className={`text-center ${isWordPlugin ? 'mb-2' : isLogin ? 'mb-5' : 'min-h-[92px] flex flex-col items-center justify-center mb-0'}`}>
                    <div className="flex justify-center mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#EC4899] flex items-center justify-center text-white shadow-md">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M23.769 14.359c-1.097 5.495-5.952 9.641-11.768 9.641-6.623 0-12-5.377-12-12s5.377-12 12-12c2.68 0 5.656 1.047 7.598 2.774-2.604-.958-5.138-.87-6.553-.626-3.951.757-6.731 3.32-7.972 6.232-2.447 5.743 1.359 10.347 5.599 10.343 2.746 0 5.152-1.853 6.583-4.202 1.099-1.802 2.308-2.388 3.187-2.357 1.259.044 2.089.566 3.326 2.195zm.231-2.541c-.981-.94-2.085-1.612-3.535-1.662-1.903-.065-3.726 1.37-4.916 3.323-1.007 1.652-2.444 2.795-3.941 3.136-3.359.765-6.683-2.785-4.694-7.451 3.461-8.121 13.861-4.826 14.826-3.618.798.999 2.219 3.515 2.26 6.272z"/>
                            </svg>
                        </div>
                    </div>
                    <h1 className={`${isWordPlugin ? 'text-xl' : 'text-3xl'} font-bold text-gray-900 mb-1`}>{brand_title}</h1>
                    <FormattedMessage id="login.title.login" defaultMessage="Operation failed. Please try again." />
                </div>

                <div className={isWordPlugin ? '' : isLogin ? 'pt-1' : 'flex flex-1 flex-col justify-start pt-2 pb-1'}>
                {error && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className={isLogin ? 'flex flex-col gap-3 pt-0' : 'space-y-3'}>
                    <div className={isLogin ? 'pt-0' : ''}>
                        {isLogin && (
                            <label className="mb-1 block text-center text-sm font-semibold text-gray-800">
                                <FormattedMessage id="login.label.email_username" defaultMessage="Operation failed. Please try again." />
                            </label>
                        )}
                        <input
                            type="text"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className={isLogin
                                ? 'w-full px-4 py-1.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent'
                                : 'w-full px-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent'}
                            aria-label={intl.formatMessage({ id: 'login.label.email_username', defaultMessage: 'Operation failed. Please try again.' })}
                            placeholder={intl.formatMessage({ id: 'login.placeholder.email_username', defaultMessage: 'Operation failed. Please try again.' })}
                        />
                    </div>

                    {!isLogin && (
                        <>
                            <div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.trim() })}
                                        className="flex-1 px-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
                                        aria-label={intl.formatMessage({ id: 'register.code.label', defaultMessage: 'Operation failed. Please try again.' })}
                                        placeholder={intl.formatMessage({ id: 'login.placeholder.input_code', defaultMessage: 'Operation failed. Please try again.' })}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSendCode}
                                        disabled={sendingCode || countdown > 0}
                                        className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[100px]"
                                    >
                                        <FormattedMessage id="login.btn.send_code" defaultMessage="Operation failed. Please try again." />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <input
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full px-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
                                    aria-label={intl.formatMessage({ id: 'login.label.username', defaultMessage: 'Operation failed. Please try again.' })}
                                    placeholder={intl.formatMessage({ id: 'login.placeholder.username', defaultMessage: 'Operation failed. Please try again.' })}
                                />
                            </div>
                            <div>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
                                    aria-label={intl.formatMessage({ id: 'login.label.nickname', defaultMessage: 'Operation failed. Please try again.' })}
                                    placeholder={intl.formatMessage({ id: 'login.placeholder.nickname', defaultMessage: 'Operation failed. Please try again.' })}
                                />
                            </div>
                            <div>
                                <input
                                    type="text"
                                    value={formData.referralCode}
                                    onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.trim() })}
                                    className="w-full px-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
                                    aria-label={intl.formatMessage({ id: 'register.referral.label', defaultMessage: 'Operation failed. Please try again.' })}
                                    placeholder={intl.formatMessage({ id: 'login.placeholder.referral', defaultMessage: 'Operation failed. Please try again.' })}
                                />
                                {referralStatus === 'idle' && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        <FormattedMessage id="register.referral.reward_hint" defaultMessage="Operation failed. Please try again." />
                                    </p>
                                )}
                                {referralStatus === 'checking' && (
                                    <FormattedMessage id="login.status.checking" defaultMessage="Operation failed. Please try again." />
                                )}
                                {referralStatus === 'valid' && referralMeta && (
                                    <p className="mt-1 text-xs text-green-600">
                                        <FormattedMessage id="login.status.valid" defaultMessage="Operation failed. Please try again." />
                                    </p>
                                )}
                                {referralStatus === 'invalid' && (
                                    <p className="mt-1 text-xs text-red-600">{referralError}</p>
                                )}
                            </div>
                        </>
                    )}

                    <div>
                        {isLogin && (
                            <label className="mb-1 block text-center text-sm font-semibold text-gray-800">
                                <FormattedMessage id="login.label.password" defaultMessage="Operation failed. Please try again." />
                            </label>
                        )}
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className={isLogin
                                ? 'w-full px-4 py-1.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent'
                                : 'w-full px-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent'}
                            aria-label={intl.formatMessage({ id: 'login.label.password', defaultMessage: 'Password' })}
                            placeholder={intl.formatMessage({ id: 'login.placeholder.password', defaultMessage: 'Enter your password' })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || (isLogin ? false : referralStatus === 'checking')}
                        className={isLogin
                            ? 'w-full bg-[#4F46E5] text-white py-2 rounded-lg text-base font-semibold hover:bg-[#4338ca] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                            : 'w-full bg-[#4F46E5] text-white py-2 rounded-lg text-base font-semibold hover:bg-[#4338ca] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <FormattedMessage id="store.processing" defaultMessage="Operation failed. Please try again." />
                            </span>
                        ) : (
                            <FormattedMessage id="login.btn.submit_login" defaultMessage="Operation failed. Please try again." />
                        )}
                    </button>
                </form>

                {(
                    <div className={isLogin ? 'mt-4' : 'mt-4'}>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <FormattedMessage id="login.text.or_use" defaultMessage="Operation failed. Please try again." />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-3">
                            <button
                                type="button"
                                onClick={handleWechatLogin}
                                disabled={qrLoading}
                                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
                                </svg>
                                <FormattedMessage id="login.btn.wechat" defaultMessage="Operation failed. Please try again." />
                            </button>
                            
                            <button
                                type="button"
                                onClick={handleAlipayLogin}
                                disabled={qrLoading}
                                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.277 3.001H5.723A2.727 2.727 0 0 0 3 5.728v12.544A2.727 2.727 0 0 0 5.723 21h12.554A2.727 2.727 0 0 0 21 18.272V5.728a2.727 2.727 0 0 0-2.723-2.727zm-1.674 10.893c-1.115.522-2.364.806-3.603.806-2.825 0-5.318-1.55-6.463-3.904h13.917c.031-.264.047-.531.047-.801 0-3.876-3.124-7-7-7s-7 3.124-7 7c0 3.876 3.124 7 7 7 1.91 0 3.741-.77 5.102-2.101z"/>
                                </svg>
                                <FormattedMessage id="login.btn.alipay" defaultMessage="Operation failed. Please try again." />
                            </button>
                        </div>
                    </div>
                )}
                </div>

                <div className={`${isWordPlugin ? 'mt-4' : isLogin ? 'mt-4 pt-1' : 'mt-auto pt-2'} text-center`}>
                    <button
                        onClick={() => {
                            const newIsLogin = !isLogin;
                            setIsLogin(newIsLogin);
                            setError('');
                            setReferralStatus('idle');
                            setReferralError('');

                            if (isWordPlugin) {
                                try { (window as any).chrome?.webview?.postMessage({ type: 'resize', mode: newIsLogin ? 'login' : 'register' }); } catch {}
                                
                                const params = new URLSearchParams(searchParams.toString());
                                if (!newIsLogin) {
                                    params.set('register', '1');
                                } else {
                                    params.delete('register');
                                }
                                const newUrl = `${window.location.pathname}?${params.toString()}`;
                                window.history.replaceState(null, '', newUrl);
                                window.dispatchEvent(new Event('jarvis-url-change'));
                            }
                        }}
                        className="text-[#4F46E5] hover:text-[#4338ca] text-sm"
                    >
                        <FormattedMessage id="login.link.no_account" defaultMessage="Operation failed. Please try again." />
                    </button>
                </div>
            </div>

            {/* 濠电姷鏁告慨鐑藉极閸涘﹥鍙忛柣鎴ｆ閺嬩線鏌熼梻瀵割槮缁惧墽绮换娑㈠箣閺冣偓閸ゅ秹鏌涢妷顔煎⒒闁轰礁娲弻鏇＄疀閺囩倫銉︺亜閿旇娅嶉柟顔筋殜瀹曟寰勬繝浣割棜闂傚倷绀侀幉鈥趁洪敃鍌氱；濠㈣埖鍔曢弰銉╂煟閹邦剦鍤熺紒鐘荤畺閹鎮藉▓璺ㄥ姼閻庢稒绻傞—鍐Χ閸℃浠撮梺纭呮珪閸旀宕氶幒鎾剁瘈婵﹩鍘藉▍婊勭節閵忥絾纭炬い鎴濇喘瀹曘垽鎮介崨濞炬嫽婵炴挻鑹惧ú銈咁嚕鐠恒劎纾奸柣妯哄暱閻忥箓鏌￠崨顓犲煟妞ゃ垺鐟﹂幈銊╁箛椤忓棛娉垮┑锛勫亼閸婃牠宕濋幋锕€纾归柡鍥╁仦濮ｅ嫰姊婚崒娆戠獢闁逞屽墰閸嬫盯鎳熼娑欐珷妞ゆ牗绋忔禍婊堟煛閸愶絽浜鹃梺缁橆殘婵挳鎮鹃柨瀣嚤闁哄鍨甸崬銊╂偡濠婂嫮绠為柟铏崌瀹曠螖娴ｅ弶瀚兼俊鐐€栧濠氬磻閹惧墎纾煎璺烘湰閺嗩剛鈧?(Word闂傚倸鍊搁崐鎼佸磹閹间礁纾归柣鎴ｅГ閸ゅ嫰鏌涢幘鑼槮闁搞劍绻冮妵鍕冀閵娧呯厐闂佹悶鍔嶇换鍫ュ蓟閿濆憘鐔封枎閹勵唲闂備焦鎮堕崝宀勫磹閹间焦绠掗梻浣侯焾缁绘宕戦幇鏉挎辈婵せ鍋撻柡? */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl p-4 w-full max-w-sm text-center">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                            <FormattedMessage id="word_login.modal.register_success" defaultMessage="Operation failed. Please try again." />
                        </h3>
                        <p className="text-gray-600 mb-4 text-xs">
                            <FormattedMessage id="word_login.modal.register_desc" defaultMessage="Operation failed. Please try again." />
                        </p>
                        <button
                            onClick={() => {
                                setShowSuccessModal(false);
                                setHasToken(true);
                            }}
                            className="w-full bg-[#4F46E5] text-white py-2 rounded-md text-xs font-medium hover:bg-[#4338CA] transition-colors"
                        >
                            <FormattedMessage id="word_login.btn.start" defaultMessage="Operation failed. Please try again." />
                        </button>
                    </div>
                </div>
            )}

            {/* 闂傚倸鍊搁崐鎼佸磹閹间礁纾圭€瑰嫭鍣磋ぐ鎺戠倞妞ゆ巻鍋撴潻婵嬫⒑闁偛鑻晶鎾煛鐏炲墽銆掗柍褜鍓ㄧ紞鍡涘磻閸涱垯鐒婂ù鐓庣摠閻撳繘鏌涢妷鎴濆枤娴煎啴鎮楀▓鍨灆缂侇喗鐟︽穱濠傤潰瀹€濠冃梻渚€娼荤紞鍡涘闯閿濆钃熼柨婵嗩槸椤懘鏌嶆潪鎷屽厡濞寸媭鍙冨娲倻閳哄倹鐝﹂梺鎼炲妼閻栧ジ鎮伴鈧畷姗€濡告惔銏☆棃鐎规洘锕㈤崺鈩冩媴閸︻厸鍋撻銏♀拻濞达絽鎲￠崯鐐寸箾鐠囇呯暤鐎规洏鍨洪妶锝夊礃閳轰椒鎮ｉ梻浣虹帛閹稿摜鑺遍崼鏇炵哗濞寸姴顑嗛悡鐔兼煙闁箑澧紒鐙欏洦鐓曢柨婵嗘搐閸樻挳鏌＄仦鍓р姇闁诡垱妫冩慨鈧柍銉ュ暱閺€顓炩攽閻樻鏆滅紒杈ㄦ礋瀵偅绻濆鍗炵ウ闂佹悶鍎洪崜娆戠棯瑜旈弻娑⑩€﹂幋婵囩亪缂備椒绶￠崰妤冩崲濠靛棌鏋旈柛顭戝枟閻忓秴顪冮妶搴″箹闁绘锕︾划瀣吋婢舵ɑ鏅㈤梺閫炲苯澧撮柍銉︾墬缁绘繈宕惰椤︻厽绻涙潏鍓хК婵炲拑缍侀弫宥呪攽鐎ｎ偀鎷虹紓浣割儐鐎笛冿耿娴煎瓨鐓熼柣鏃€绻傚▔姘跺炊椤掍焦娅嗘繝娈垮枟閸旀帞鑺辨繝姘拺闁告繂瀚崒銊╂煕閺傝儻瀚版い鏇秮椤㈡岸鍩€椤掑嫬钃熼柣鏃傗拡閺佸﹪鏌涘┑鍡楊仼濠殿喖楠搁—鍐Χ鎼粹€崇闂佸憡姊归崹鐢告偩瀹勯偊娼ㄩ柍褜鍓熼悰顕€宕卞鍏夹俊鐐€栭幐绋款焽閳ユ剚娼栫紓浣诡焽閻熷綊鏌嶈閸撴瑩鈥﹂崶顒佸殥闁靛牆鍊告禍楣冩⒒閸喓銆掗柣鎺戞憸閳ь剝顫夊ú蹇涘垂娴犲宓侀柛鈩冨嚬濡查箖姊?*/}
            {showAlipay && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => {
                    setShowAlipay(false);
                    if (alipayPollingIntervalRef.current) {
                        clearInterval(alipayPollingIntervalRef.current);
                        alipayPollingIntervalRef.current = null;
                    }
                }}>
                    <div className="bg-white rounded-xl p-8 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center">
                            <FormattedMessage id="login.title.alipay_scan" defaultMessage="Operation failed. Please try again." />
                            {alipayQrCode ? (
                                <>
                                    <div className="relative inline-block">
                                        <Image src={alipayQrCode} alt={intl.formatMessage({ id: 'login.alt.alipay_qr', defaultMessage: 'Operation failed. Please try again.' })} width={280} height={280} className="w-72 h-72 mx-auto rounded-lg border border-gray-200" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
                                                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M18.277 3.001H5.723A2.727 2.727 0 0 0 3 5.728v12.544A2.727 2.727 0 0 0 5.723 21h12.554A2.727 2.727 0 0 0 21 18.272V5.728a2.727 2.727 0 0 0-2.723-2.727zm-1.674 10.893c-1.115.522-2.364.806-3.603.806-2.825 0-5.318-1.55-6.463-3.904h13.917c.031-.264.047-.531.047-.801 0-3.876-3.124-7-7-7s-7 3.124-7 7c0 3.876 3.124 7 7 7 1.91 0 3.741-.77 5.102-2.101z"/>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <FormattedMessage id="login.msg.alipay_scan_guide" defaultMessage="Operation failed. Please try again." />
                                    <FormattedMessage id="login.msg.qr_validity" defaultMessage="Operation failed. Please try again." />
                                    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
                                        <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <FormattedMessage id="login.msg.waiting_scan" defaultMessage="Operation failed. Please try again." />
                                    </div>
                                </>
                            ) : (
                                <div className="py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                    <FormattedMessage id="login.msg.loading" defaultMessage="Operation failed. Please try again." />
                                </div>
                            )}
                            {!isLogin && (
                                <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                                    <FormattedMessage id="register.referral.reward_hint" defaultMessage="Operation failed. Please try again." />
                                </p>
                            )}
                            <button
                                onClick={() => {
                                    setShowAlipay(false);
                                    if (alipayPollingIntervalRef.current) {
                                        clearInterval(alipayPollingIntervalRef.current);
                                        alipayPollingIntervalRef.current = null;
                                    }
                                }}
                                className="mt-6 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <FormattedMessage id="common.close" defaultMessage="Operation failed. Please try again." />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 闂傚倸鍊搁崐宄懊归崶顒夋晪鐟滃秹婀侀梺缁樺灱濡嫰寮告担绯曟斀闁绘ê鐤囨竟妯肩棯閹规劦鍤欓柍瑙勫灴閹晠宕ｆ径瀣€风紓鍌欑劍閸旀牠銆冩繝鍥ц摕闁跨喓濮撮悙濠囨煃鏉炴壆鍔嶉柣蹇庣窔濮婂搫鐣烽崶銊ユ畬缂備礁顦伴幐鎶藉春閻愬搫绠ｉ柨鏃囨娴滃綊姊洪崨濠勬噧妞わ富鍨惰棟闁冲搫鎳忛埛鎴犵磼鐎ｎ亝鍋ユい搴㈩殜閺岋綁顢橀悙娴嬪亾閸ф宓侀柛鎰靛幑娴滃綊鏌熼悜妯虹仼闁稿﹦鍋涢—鍐Χ閸涱垳顔囬柣搴㈠嚬閸犳牞顣鹃梺闈涚箞閸ㄨ崵澹曢挊澹濆綊鏁愰崨顓ф濠碘€冲级閹倿寮婚敐鍫㈢杸闁哄啫鍊婚悿鍕攽閻橆偄浜炬繛杈剧悼绾爼寮ㄦ禒瀣厽婵☆垱顑欓崵瀣偓瑙勬偠閸庣敻寮诲☉銏″亜閻犲搫鎼粊顕€姊虹拠鈥虫灍閽冭鲸绻涢悡搴ｇ濠碘剝鐡曢ˇ瀛樸亜閺冣偓濞茬喎顫忓ú顏勭閹艰揪绲块悾鍨繆閵堝洤啸妞ゎ厼鐗撻崺銏狀吋閸滀礁鎮戞繝銏ｆ硾椤戝洭宕㈤棃娑辨富闁靛牆妫涙晶顒佹叏濡濡介柣妤€閰ｅ缁樻媴閻戞ê娈岄梺鎼炲灪閻擄繝鐛繝鍐╁劅妞ゎ厽甯炵粙蹇涙⒑闂堟稒绂嬫繝鈶╁亾濠电偛鐭堟禍顏堝蓟閿曗偓铻ｅ〒姘煎灡瀛濋梻浣告贡椤牏鈧凹鍠氬Σ?*/}
            {showWechat && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => {
                    setShowWechat(false);
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }
                }}>
                    <div className="bg-white rounded-xl p-8 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center">
                            <FormattedMessage id="login.title.wechat_scan" defaultMessage="Operation failed. Please try again." />
                            {wechatAuthUrl ? (
                                <>
                                    <div
                                        id="wechat-login-widget"
                                        ref={wechatLoginContainerRef}
                                        className="mx-auto mb-4 min-h-[240px] flex items-center justify-center"
                                    />
                                    <FormattedMessage id="login.msg.wechat_scan_guide" defaultMessage="Operation failed. Please try again." />
                                    <FormattedMessage id="login.msg.qr_validity" defaultMessage="Operation failed. Please try again." />
                                    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
                                        <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
                                        <FormattedMessage id="login.msg.waiting_scan" defaultMessage="Operation failed. Please try again." />
                                    </div>
                                </>
                            ) : qrCode ? (
                                <>
                                    <div className="relative inline-block">
                                        <Image src={qrCode} alt={intl.formatMessage({ id: 'login.alt.wechat_qr', defaultMessage: 'Operation failed. Please try again.' })} width={280} height={280} className="w-72 h-72 mx-auto rounded-lg border border-gray-200" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
                                                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <FormattedMessage id="login.msg.wechat_scan_guide" defaultMessage="Operation failed. Please try again." />
                                    <FormattedMessage id="login.msg.qr_validity" defaultMessage="Operation failed. Please try again." />
                                    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
                                        <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
                                        <FormattedMessage id="login.msg.waiting_scan" defaultMessage="Operation failed. Please try again." />
                                    </div>
                                </>
                            ) : (
                                <div className="py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4F46E5] mx-auto"></div>
                                    <FormattedMessage id="login.msg.loading" defaultMessage="Operation failed. Please try again." />
                                </div>
                            )}
                            <button
                                onClick={() => {
                                    setShowWechat(false);
                                    if (pollingIntervalRef.current) {
                                        clearInterval(pollingIntervalRef.current);
                                        pollingIntervalRef.current = null;
                                    }
                                }}
                                className="mt-6 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <FormattedMessage id="common.close" defaultMessage="Operation failed. Please try again." />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
