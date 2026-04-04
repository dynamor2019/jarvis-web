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
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showWechat, setShowWechat] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [qrLoading, setQrLoading] = useState(false);
    const [ticket, setTicket] = useState('');
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    
    // 支付宝登录状态
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
    
    // 登录成功后的倒计时状态
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [redirectCountdown, setRedirectCountdown] = useState(0);

    // 处理登录成功倒计时跳转
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

    useEffect(() => {
        const wv = searchParams.get('wv') === '1';
        setIsWordPlugin(wv);
        
        // 如果是Word环境，通知调整大小
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

    // 检查是否已经登录（针对Word环境）
    useEffect(() => {
        if (localStorage.getItem('token')) {
            setHasToken(true);
        }
    }, []);

    // 监听Token状态变化，通知Word插件
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
            setError(intl.formatMessage({ id: 'login.error.email_required', defaultMessage: '请输入邮箱' }));
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
            setError(intl.formatMessage({ id: 'login.error.email_invalid', defaultMessage: '请输入有效的邮箱地址' }));
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
                    alert(intl.formatMessage({ id: 'login.msg.code_debug', defaultMessage: '验证码已发送! 测试验证码: {code}' }, { code: data.debugCode }));
                } else {
                    alert(intl.formatMessage({ id: 'login.msg.code_sent', defaultMessage: '验证码已发送! 请查收邮箱获取验证码' }));
                }
            } else {
                setError(data.error || intl.formatMessage({ id: 'login.msg.send_fail', defaultMessage: '发送失败' }));
            }
        } catch (err) {
            setError(intl.formatMessage({ id: 'login.error.send_code_net', defaultMessage: '网络错误，无法发送验证码' }));
        } finally {
            setSendingCode(false);
        }
    };

    // 倒计时逻辑

    // 检查是否从微信回调返回与注册模式
    useEffect(() => {
        const token = searchParams.get('token');
        const wechatSuccess = searchParams.get('wechat');
        const errorParam = searchParams.get('error');
        const needRegister = searchParams.get('register');

        if (token && wechatSuccess === 'success') {
            localStorage.setItem('token', token);
            // 登录成功，显示倒计时
            setLoginSuccess(true);
            setRedirectCountdown(30);
        }

        if (errorParam) {
            setError(intl.formatMessage({ id: 'login.error.wechat_fail', defaultMessage: '微信登录失败，请重试' }));
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

    // 轮询检查微信登录状态
    const checkWechatStatus = async (ticketId: string) => {
        try {
            const response = await fetch(`/api/auth/wechat/status?ticket=${ticketId}`);
            const data = await response.json();
            
            if (data.status === 'success' && data.token) {
                // 登录成功
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
                
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setShowWechat(false);
                // 登录成功，显示倒计时
                setLoginSuccess(true);
                setRedirectCountdown(30);
            } else if (data.status === 'expired') {
                // ticket过期
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
                setError(intl.formatMessage({ id: 'login.error.qr_expired', defaultMessage: '二维码已过期，请重新获取' }));
                setShowWechat(false);
            }
        } catch (err: unknown) {
            
        }
    };

    // 获取微信登录二维码
    const handleWechatLogin = async () => {
        setQrLoading(true);
        setError('');
        
        // 清除旧的轮询
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
                throw new Error(data.error || intl.formatMessage({ id: 'login.error.qr_fail', defaultMessage: '获取二维码失败' }));
            }
            
            setQrCode(data.qrCode);
            setTicket(data.ticket || '');
            setShowWechat(true);
            
            // 开始轮询检查状态
            const interval = setInterval(() => {
                checkWechatStatus(data.ticket);
            }, 2000); // 每2秒检查一次
            
            pollingIntervalRef.current = interval;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : intl.formatMessage({ id: 'login.error.qr_fail', defaultMessage: '获取微信二维码失败' });
            setError(message);
        } finally {
            setQrLoading(false);
        }
    };

    // 轮询检查支付宝登录状态
    const checkAlipayStatus = async (ticketId: string) => {
        try {
            const response = await fetch(`/api/auth/alipay/status?ticket=${ticketId}`);
            const data = await response.json();
            
            if (data.status === 'success' && data.token) {
                // 登录成功
                if (alipayPollingIntervalRef.current) {
                    clearInterval(alipayPollingIntervalRef.current);
                    alipayPollingIntervalRef.current = null;
                }
                
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setShowAlipay(false);
                // 登录成功，显示倒计时
                setLoginSuccess(true);
                setRedirectCountdown(30);
            } else if (data.status === 'expired') {
                // ticket过期
                if (alipayPollingIntervalRef.current) {
                    clearInterval(alipayPollingIntervalRef.current);
                    alipayPollingIntervalRef.current = null;
                }
                setError(intl.formatMessage({ id: 'login.error.qr_expired', defaultMessage: '二维码已过期，请重新获取' }));
                setShowAlipay(false);
            }
        } catch (err: unknown) {
            
        }
    };

    // 获取支付宝登录二维码
    const handleAlipayLogin = async () => {
        setQrLoading(true);
        setError('');
        
        // 清除旧的轮询
        if (alipayPollingIntervalRef.current) {
            clearInterval(alipayPollingIntervalRef.current);
            alipayPollingIntervalRef.current = null;
        }

        try {
            const response = await fetch('/api/auth/alipay/qrcode');
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || intl.formatMessage({ id: 'login.error.alipay_qr_fail', defaultMessage: '获取二维码失败' }));
            }
            
            setAlipayQrCode(data.qrCode);
            setAlipayTicket(data.ticket || '');
            setShowAlipay(true);
            
            // 开始轮询检查状态
            const interval = setInterval(() => {
                checkAlipayStatus(data.ticket);
            }, 2000); // 每2秒检查一次
            
            alipayPollingIntervalRef.current = interval;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : intl.formatMessage({ id: 'login.error.alipay_qr_fail', defaultMessage: '获取支付宝二维码失败' });
            setError(message);
        } finally {
            setQrLoading(false);
        }
    };

    // 清理轮询
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

    // 检查推荐码
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
                    setReferralError(data.error || intl.formatMessage({ id: 'login.error.referral_invalid', defaultMessage: '推荐码无效' }));
                }
            } catch (err) {
                setReferralStatus('invalid');
                setReferralError(intl.formatMessage({ id: 'login.error.network', defaultMessage: '网络错误' }));
            }
        };

        const timer = setTimeout(() => {
            checkReferralCode();
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.referralCode]);

    // 处理表单提交
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
                    // 登录成功，显示倒计时
                    setLoginSuccess(true);
                    setRedirectCountdown(30);
                }
            } else {
                setError(data.error || (isLogin ? intl.formatMessage({ id: 'login.error.login_fail', defaultMessage: '登录失败' }) : intl.formatMessage({ id: 'login.error.register_fail', defaultMessage: '注册失败' })));
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : (isLogin ? intl.formatMessage({ id: 'login.error.login_fail', defaultMessage: '登录失败' }) : intl.formatMessage({ id: 'login.error.register_fail', defaultMessage: '注册失败' }));
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    if (hasToken && isWordPlugin) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-2">
                <div className="text-center w-full max-w-sm">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">
                        <FormattedMessage id="word_login.success.title" defaultMessage="登录成功" />
                    </h2>
                    <p className="text-gray-500 text-xs mb-3">
                        <FormattedMessage id="word_login.success.desc" defaultMessage="您可以关闭此窗口并开始使用Jarvis" />
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
                            <FormattedMessage id="word_login.btn.switch" defaultMessage="更换账户" />
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
                        <FormattedMessage id="login.success.title" defaultMessage="登录成功" />
                    </h2>
                    <p className="text-gray-600 mb-6">
                        <FormattedMessage 
                            id="login.success.redirect" 
                            defaultMessage="{seconds}秒后自动跳转至控制台" 
                            values={{ seconds: redirectCountdown }} 
                        />
                    </p>
                    <button
                        onClick={handleSkipWait}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <FormattedMessage id="login.success.skip" defaultMessage="立即跳转" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center p-2">
            <div className={`bg-white rounded-2xl shadow-2xl ${isWordPlugin ? 'p-3 max-w-sm' : 'p-5 max-w-md'} w-full`}>
                <div className={`text-center ${isWordPlugin ? 'mb-2' : 'mb-4'}`}>
                    <div className="flex justify-center mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#EC4899] flex items-center justify-center text-white shadow-md">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M23.769 14.359c-1.097 5.495-5.952 9.641-11.768 9.641-6.623 0-12-5.377-12-12s5.377-12 12-12c2.68 0 5.656 1.047 7.598 2.774-2.604-.958-5.138-.87-6.553-.626-3.951.757-6.731 3.32-7.972 6.232-2.447 5.743 1.359 10.347 5.599 10.343 2.746 0 5.152-1.853 6.583-4.202 1.099-1.802 2.308-2.388 3.187-2.357 1.259.044 2.089.566 3.326 2.195zm.231-2.541c-.981-.94-2.085-1.612-3.535-1.662-1.903-.065-3.726 1.37-4.916 3.323-1.007 1.652-2.444 2.795-3.941 3.136-3.359.765-6.683-2.785-4.694-7.451 3.461-8.121 13.861-4.826 14.826-3.618.798.999 2.219 3.515 2.26 6.272z"/>
                            </svg>
                        </div>
                    </div>
                    <h1 className={`${isWordPlugin ? 'text-xl' : 'text-3xl'} font-bold text-gray-900 mb-1`}>Jarvis</h1>
                    <p className="text-gray-600 text-sm">{isLogin ? <FormattedMessage id="login.title.login" defaultMessage="登录您的账户" /> : <FormattedMessage id="login.title.register" defaultMessage="创建新账户" />}</p>
                </div>

                {error && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FormattedMessage id="login.label.email_username" defaultMessage="邮箱/用户名" />
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
                            placeholder={intl.formatMessage({ id: 'login.placeholder.email_username', defaultMessage: '邮箱或用户名' })}
                        />
                    </div>

                    {!isLogin && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <FormattedMessage id="register.code.label" defaultMessage="验证码" />
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.trim() })}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
                                        placeholder={intl.formatMessage({ id: 'login.placeholder.input_code', defaultMessage: '请输入验证码' })}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSendCode}
                                        disabled={sendingCode || countdown > 0}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[100px]"
                                    >
                                        {countdown > 0 ? `${countdown}s` : <FormattedMessage id="login.btn.send_code" defaultMessage="发送验证码" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <FormattedMessage id="login.label.username" defaultMessage="用户名" />
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
                                    placeholder={intl.formatMessage({ id: 'login.placeholder.username', defaultMessage: '用户名' })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <FormattedMessage id="login.label.nickname" defaultMessage="昵称（可选）" />
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
                                    placeholder={intl.formatMessage({ id: 'login.placeholder.nickname', defaultMessage: '显示名称' })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <FormattedMessage id="register.referral.label" defaultMessage="推荐码（可选）" />
                                </label>
                                <input
                                    type="text"
                                    value={formData.referralCode}
                                    onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.trim() })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
                                    placeholder={intl.formatMessage({ id: 'login.placeholder.referral', defaultMessage: '推荐码（可选）' })}
                                />
                                {referralStatus === 'idle' && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        <FormattedMessage id="register.referral.reward_hint" defaultMessage="推荐码注册双方可获5000tokens奖励" />
                                    </p>
                                )}
                                {referralStatus === 'checking' && (
                                    <p className="mt-1 text-xs text-blue-600"><FormattedMessage id="login.status.checking" defaultMessage="检查中..." /></p>
                                )}
                                {referralStatus === 'valid' && referralMeta && (
                                    <p className="mt-1 text-xs text-green-600">
                                        <FormattedMessage id="login.status.valid" defaultMessage="推荐码有效" /> ({referralMeta.uses}/{referralMeta.maxUses})
                                    </p>
                                )}
                                {referralStatus === 'invalid' && (
                                    <p className="mt-1 text-xs text-red-600">{referralError}</p>
                                )}
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FormattedMessage id="login.label.password" defaultMessage="密码" />
                        </label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
                            placeholder={intl.formatMessage({ id: 'login.label.password', defaultMessage: '密码' })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || (isLogin ? false : referralStatus === 'checking')}
                        className="w-full bg-[#4F46E5] text-white py-2 rounded-lg hover:bg-[#4338ca] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <FormattedMessage id="store.processing" defaultMessage="处理中..." />
                            </span>
                        ) : (
                            isLogin ? <FormattedMessage id="login.btn.submit_login" defaultMessage="登录" /> : <FormattedMessage id="login.btn.submit_register" defaultMessage="注册" />
                        )}
                    </button>
                </form>

                {!isWordPlugin && (
                    <div className="mt-4">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500"><FormattedMessage id="login.text.or_use" defaultMessage="或使用" /></span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <button
                                type="button"
                                onClick={handleWechatLogin}
                                disabled={qrLoading}
                                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
                                </svg>
                                <span className="text-sm"><FormattedMessage id="login.btn.wechat" defaultMessage="微信登录" /></span>
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
                                <span className="text-sm"><FormattedMessage id="login.btn.alipay" defaultMessage="支付宝登录" /></span>
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-4 text-center">
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
                        {isLogin ? <FormattedMessage id="login.link.no_account" defaultMessage="没有账户？去注册" /> : <FormattedMessage id="login.link.has_account" defaultMessage="已有账户？去登录" />}
                    </button>
                </div>
            </div>

            {/* 注册成功弹窗 (Word环境) */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl p-4 w-full max-w-sm text-center">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                            <FormattedMessage id="word_login.modal.register_success" defaultMessage="注册成功" />
                        </h3>
                        <p className="text-gray-600 mb-4 text-xs">
                            <FormattedMessage id="word_login.modal.register_desc" defaultMessage="请到网站完成注册信息获得token奖励" />
                        </p>
                        <button
                            onClick={() => {
                                setShowSuccessModal(false);
                                setHasToken(true);
                            }}
                            className="w-full bg-[#4F46E5] text-white py-2 rounded-md text-xs font-medium hover:bg-[#4338CA] transition-colors"
                        >
                            <FormattedMessage id="word_login.btn.start" defaultMessage="开始使用" />
                        </button>
                    </div>
                </div>
            )}

            {/* 支付宝登录二维码弹窗 */}
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
                            <h3 className="text-xl font-bold mb-4"><FormattedMessage id="login.title.alipay_scan" defaultMessage="支付宝扫码登录" /></h3>
                            {alipayQrCode ? (
                                <>
                                    <div className="relative inline-block">
                                        <Image src={alipayQrCode} alt={intl.formatMessage({ id: 'login.alt.alipay_qr', defaultMessage: '支付宝登录二维码' })} width={240} height={240} unoptimized className="mx-auto mb-4 rounded-lg" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
                                                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M18.277 3.001H5.723A2.727 2.727 0 0 0 3 5.728v12.544A2.727 2.727 0 0 0 5.723 21h12.554A2.727 2.727 0 0 0 21 18.272V5.728a2.727 2.727 0 0 0-2.723-2.727zm-1.674 10.893c-1.115.522-2.364.806-3.603.806-2.825 0-5.318-1.55-6.463-3.904h13.917c.031-.264.047-.531.047-.801 0-3.876-3.124-7-7-7s-7 3.124-7 7c0 3.876 3.124 7 7 7 1.91 0 3.741-.77 5.102-2.101z"/>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2"><FormattedMessage id="login.msg.alipay_scan_guide" defaultMessage="请使用支付宝扫描二维码登录" /></p>
                                    <p className="text-xs text-gray-500"><FormattedMessage id="login.msg.qr_validity" defaultMessage="二维码5分钟内有效" /></p>
                                    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
                                        <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span><FormattedMessage id="login.msg.waiting_scan" defaultMessage="等待扫码中..." /></span>
                                    </div>
                                </>
                            ) : (
                                <div className="py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="mt-4 text-gray-600"><FormattedMessage id="login.msg.loading" defaultMessage="加载中..." /></p>
                                </div>
                            )}
                            {!isLogin && (
                                <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                                    <FormattedMessage id="register.referral.reward_hint" defaultMessage="æŽ¨èç æ³¨å†ŒåŒæ–¹å„å¾— 5000 Token å¥–åŠ±" />
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
                                <FormattedMessage id="common.close" defaultMessage="关闭" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 微信登录二维码弹窗 */}
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
                            <h3 className="text-xl font-bold mb-4"><FormattedMessage id="login.title.wechat_scan" defaultMessage="微信扫码登录" /></h3>
                            {qrCode ? (
                                <>
                                    <div className="relative inline-block">
                                        <Image src={qrCode} alt={intl.formatMessage({ id: 'login.alt.wechat_qr', defaultMessage: '微信登录二维码' })} width={240} height={240} unoptimized className="mx-auto mb-4 rounded-lg" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
                                                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2"><FormattedMessage id="login.msg.wechat_scan_guide" defaultMessage="请使用微信扫描二维码登录" /></p>
                                    <p className="text-xs text-gray-500"><FormattedMessage id="login.msg.qr_validity" defaultMessage="二维码5分钟内有效" /></p>
                                    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
                                        <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span><FormattedMessage id="login.msg.waiting_scan" defaultMessage="等待扫码中..." /></span>
                                    </div>
                                </>
                            ) : (
                                <div className="py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4F46E5] mx-auto"></div>
                                    <p className="mt-4 text-gray-600"><FormattedMessage id="login.msg.loading" defaultMessage="加载中..." /></p>
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
                                <FormattedMessage id="common.close" defaultMessage="关闭" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
