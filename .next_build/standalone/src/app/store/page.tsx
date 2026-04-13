// [CodeGuard Feature Index]
// - ModelsList -> line 37
// - handleUserInfo -> line 186
// - run -> line 332
// - uninstall -> line 424
// - SubscriptionPlans -> line 782
// - normalizeProviderForDisplay -> line 905
// - TokenPackages -> line 1183
// - FAQItem -> line 1479
// [/CodeGuard Feature Index]

// [CodeGuard Protection]
// Feature: store_subscription_model_ui
// Version: 18
// P26-03-31 08:51:44
// Policy: Do not modify directly. Explain reason before edits. Last confirm reason: set ChatGPT/Gemini display names and logos; fix foreign ordering and divider text


'use client';

import { useEffect, Suspense, useRef } from 'react';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Bridge, onMessage } from '@/lib/storeBridge';
import QRCode from 'qrcode';
import { useSearchParams } from 'next/navigation';


export default function StorePage() {
  return (
    <Suspense fallback={<div className="text-center p-4"><FormattedMessage id="admin.loading" defaultMessage="加载中..." /></div>}>
       <StoreContent />
    </Suspense>
  );
}

function ModelsList() {
  const intl = useIntl();
  const models = [
    {
      id: 'deepseek',
      name: intl.formatMessage({ id: 'store.model.deepseek.name', defaultMessage: 'DeepSeek' }),
      desc: intl.formatMessage({ id: 'store.model.deepseek.desc', defaultMessage: 'DeepSeek-V3/R1' }),
      color: 'bg-blue-600'
    },
    {
      id: 'kimi',
      name: intl.formatMessage({ id: 'store.model.kimi.name', defaultMessage: 'Kimi' }),
      desc: intl.formatMessage({ id: 'store.model.kimi.desc', defaultMessage: 'Moonshot' }),
      color: 'bg-purple-600'
    },
    {
      id: 'qwen',
      name: intl.formatMessage({ id: 'store.model.qwen.name', defaultMessage: 'Qwen' }),
      desc: intl.formatMessage({ id: 'store.model.qwen.desc', defaultMessage: 'Alibaba' }),
      color: 'bg-orange-500'
    },
    {
      id: 'doubao',
      name: intl.formatMessage({ id: 'store.model.doubao.name', defaultMessage: 'Doubao' }),
      desc: intl.formatMessage({ id: 'store.model.doubao.desc', defaultMessage: 'ByteDance' }),
      color: 'bg-green-500'
    },
    {
      id: 'zhipu',
      name: intl.formatMessage({ id: 'store.model.zhipu.name', defaultMessage: 'Zhipu' }),
      desc: intl.formatMessage({ id: 'store.model.zhipu.desc', defaultMessage: 'GLM-4' }),
      color: 'bg-cyan-600'
    },
    {
      id: 'siliconflow',
      name: intl.formatMessage({ id: 'store.model.siliconflow.name', defaultMessage: '硅基流动' }),
      desc: intl.formatMessage({ id: 'store.model.siliconflow.desc', defaultMessage: 'SiliconFlow' }),
      color: 'bg-blue-500'
    },
    {
      id: 'gemini',
      name: intl.formatMessage({ id: 'store.model.gemini.name', defaultMessage: 'Gemini' }),
      desc: intl.formatMessage({ id: 'store.model.gemini.desc', defaultMessage: 'Google' }),
      color: 'bg-indigo-500'
    },
    {
      id: 'gpt4',
      name: intl.formatMessage({ id: 'store.model.gpt4.name', defaultMessage: 'ChatGPT' }),
      desc: intl.formatMessage({ id: 'store.model.gpt4.desc', defaultMessage: 'OpenAI GPT-5.4' }),
      color: 'bg-gray-800'
    },
    {
      id: 'claude',
      name: intl.formatMessage({ id: 'store.model.claude.name', defaultMessage: 'Claude' }),
      desc: intl.formatMessage({ id: 'store.model.claude.desc', defaultMessage: 'Anthropic' }),
      color: 'bg-amber-700'
    }
  ];
  const domesticModels = models.filter(m => ['deepseek', 'kimi', 'qwen', 'doubao', 'zhipu', 'siliconflow'].includes(m.id));
  const foreignModelOrder = ['gpt4', 'claude', 'gemini'];
  const foreignModels = foreignModelOrder
    .map(id => models.find(m => m.id === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold mb-3"><FormattedMessage id="store.models.title" defaultMessage="Supported Models" /></h2>
        <p className="text-gray-600"><FormattedMessage id="store.models.desc" defaultMessage="Choose freely" /></p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {domesticModels.map(m => (
          <div key={m.id} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow group">
             <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl ${m.color} flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-110 transition-transform`}>
                  {m.name.substring(0, 1)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{m.name}</h3>
                  <div className="text-xs text-gray-400 font-mono mt-0.5">{m.id.toUpperCase()}</div>
                </div>
             </div>
             <p className="text-gray-600 text-sm leading-relaxed">{m.desc}</p>
          </div>
        ))}
        <div className="md:col-span-2 lg:col-span-3 flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-medium tracking-wide text-gray-500">国外模型数据来自中转站，无需魔法,小贾仅作数据链接</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        {foreignModels.map(m => (
          <div key={m.id} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow group">
             <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl ${m.color} flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-110 transition-transform`}>
                  {m.name.substring(0, 1)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{m.name}</h3>
                  <div className="text-xs text-gray-400 font-mono mt-0.5">{m.id.toUpperCase()}</div>
                </div>
             </div>
             <p className="text-gray-600 text-sm leading-relaxed">{m.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function StoreContent() {
  const searchParams = useSearchParams();
  const enableMock = searchParams.get('mock') === 'true';
  const tabParam = (searchParams.get('tab') || '').toLowerCase();
  const initialTab = tabParam === 'talent' ? 'talent' : 'subscription';
  return <Store enableMock={enableMock} initialTab={initialTab} />
}

export function Store({ enableMock = false, initialTab = 'subscription' }: { enableMock?: boolean; initialTab?: 'subscription' | 'talent' }) {
  const intl = useIntl();
  const [activeTab, setActiveTab] = useState<'plugins' | 'lifetime' | 'subscription' | 'tokens' | 'purchased' | 'models' | 'talent'>(initialTab);
  const [payOpen, setPayOpen] = useState(false);
  const [payInfo, setPayInfo] = useState<{ paymentId: string; title: string; amount: number; tokens?: number; pluginId?: string; modelType?: string; usageDurationLabel?: string; durationMonths?: number } | null>(null);
  const [isInWordPlugin, setIsInWordPlugin] = useState(false);
  const [channel, setChannel] = useState<'mock'|'wechat'|'alipay'>(enableMock ? 'mock' : 'wechat')
  const [skillCatalog, setSkillCatalog] = useState<Array<{ id?: string; name: string; nameEn?: string; url: string; description: string; descriptionEn?: string }>>([]);
  const [skillInstallState, setSkillInstallState] = useState<{ status: 'idle' | 'installing' | 'done' | 'failed'; progress: number; message: string }>({
    status: 'idle',
    progress: 0,
    message: ''
  });
  const [skillInstallingId, setSkillInstallingId] = useState<string>('');
  const [customSkillUrl, setCustomSkillUrl] = useState('');

  // 检测是否在 Word 插件的 WebView 中运行
  useEffect(() => {
    const checkEnvironment = () => {
      // @ts-ignore
      if (window.chrome?.webview || (window as any).jarvisBridge) setIsInWordPlugin(true);
      Bridge.ready(['purchase', 'download', 'postMessage']);
    };
    checkEnvironment();

    const off = onMessage((msg) => {
      if (msg.type === 'PLUGIN_ENV') {
        // 可根据插件环境信息做定制
      }
      if (msg.type === 'INSTALL_RESULT') {
        if (msg.payload?.status === 'installed') {
          alert(intl.formatMessage({ id: 'store.msg.install_success', defaultMessage: 'Installation successful' }));
        } else {
          alert(intl.formatMessage({ id: 'store.msg.install_fail', defaultMessage: 'Installation failed' }));
        }
      }
      if (msg.type === 'SKILL_INSTALL_PROGRESS') {
        const status = String(msg.payload?.status || 'installing');
        const progress = Number(msg.payload?.progress ?? 0);
        const message = String(msg.payload?.message || '');
        const normalizedStatus = status === 'done' || status === 'failed' ? status : 'installing';
        setSkillInstallState({
          status: normalizedStatus as 'installing' | 'done' | 'failed',
          progress: Math.max(0, Math.min(100, progress)),
          message
        });
      }
      if (msg.type === 'SKILL_INSTALL_RESULT') {
        const success = !!msg.payload?.success;
        const message = success ? '安装完成' : (msg.payload?.error || '安装失败');
        setSkillInstallState({
          status: success ? 'done' : 'failed',
          progress: 100,
          message
        });
        setSkillInstallingId('');
      }
      if (msg.type === 'SKILL_LIST_RESULT' && msg.payload?.success) {
        const list = Array.isArray(msg.payload?.skills) ? msg.payload.skills : [];
        if (list.length > 0) {
          const normalized = list.map((item: any) => ({
            id: item.id,
            name: item.name || item.id,
            nameEn: item.nameEn || item.name || item.id,
            url: item.sourceUrl || '',
            description: item.description || '已安装到本地',
            descriptionEn: item.descriptionEn || 'Installed locally'
          }));
          setSkillCatalog((prev) => {
            const merged = [...prev];
            normalized.forEach((item: any) => {
              if (!merged.some((x) => x.id === item.id || x.url === item.url)) {
                merged.push(item);
              }
            });
            return merged;
          });
        }
      }
    });
    Bridge.requestSkillList();
    return () => off();
  }, [intl]);

  // 监听来自客户端的用户信息注入
  useEffect(() => {
    const handleUserInfo = (userInfo: any) => {
      
      if (userInfo?.token) {
        const currentToken = localStorage.getItem('token');
        if (currentToken !== userInfo.token) {
          localStorage.setItem('token', userInfo.token);
        }
      }
    };

    // 1. 检查全局对象 (针对页面加载时已注入的情况)
    // @ts-ignore
    if (window.jarvisUser) {
      // @ts-ignore
      handleUserInfo(window.jarvisUser);
    }

    // 2. 注册回调函数 (针对页面加载后注入的情况)
    // @ts-ignore
    window.onJarvisUserInfo = handleUserInfo;

    // 3. 监听消息事件 (作为备选方案)
    const messageHandler = (event: MessageEvent) => {
      if (event.data?.type === 'USER_INFO_UPDATED') {
        handleUserInfo(event.data.payload);
      }
    };
    window.addEventListener('message', messageHandler);

    return () => {
      window.removeEventListener('message', messageHandler);
      // @ts-ignore
      delete window.onJarvisUserInfo;
    };
  }, []);

  useEffect(() => {
    if (initialTab === 'talent') {
      setActiveTab('talent');
    }
  }, [initialTab]);

  useEffect(() => {
    let alive = true;
    const loadSkills = async () => {
      try {
        const response = await fetch('/api/store/skills');
        const payload = await response.json();
        if (alive && payload?.success) {
          setSkillCatalog(Array.isArray(payload.skills) ? payload.skills : []);
        }
      } catch {}
    };
    loadSkills();
    return () => { alive = false; };
  }, []);

  const installSkillByUrl = (url: string, skillId?: string) => {
    const trimmed = (url || '').trim();
    if (!trimmed) {
      alert('请输入 Skill 地址');
      return;
    }
    setSkillInstallingId(skillId || trimmed);
    setSkillInstallState({
      status: 'installing',
      progress: 10,
      message: '准备安装...'
    });
    Bridge.requestSkillInstall(trimmed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <FormattedMessage id="store.title" defaultMessage="Jarvis Power" />
          </h1>
          <p className="text-gray-600 text-lg">
            <FormattedMessage id="store.subtitle" defaultMessage="Choose the right plan and start your AI writing journey" />
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm">
            <span className="text-gray-600"><FormattedMessage id="store.payment_channel" defaultMessage="Payment Channel" />:</span>
            {enableMock && <button onClick={() => setChannel('mock')} className={`px-3 py-1 rounded ${channel==='mock'?'bg-blue-600 text-white':'border border-gray-300'}`}><FormattedMessage id="store.payment.mock" defaultMessage="模拟支付" /></button>}
            <button onClick={() => setChannel('wechat')} className={`px-3 py-1 rounded ${channel==='wechat'?'bg-blue-600 text-white':'border border-gray-300'}`}><FormattedMessage id="store.payment.wechat" defaultMessage="WeChat" /></button>
            <button onClick={() => setChannel('alipay')} className={`px-3 py-1 rounded ${channel==='alipay'?'bg-blue-600 text-white':'border border-gray-300'}`}><FormattedMessage id="store.payment.alipay" defaultMessage="Alipay" /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            <button
              onClick={() => setActiveTab('subscription')}
              className={`px-6 py-2 rounded-md transition-all ${
                activeTab === 'subscription'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FormattedMessage id="store.tab.subscription" defaultMessage="Subscription Service" />
            </button>
            <button
              onClick={() => setActiveTab('tokens')}
              className={`px-6 py-2 rounded-md transition-all ${
                activeTab === 'tokens'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FormattedMessage id="store.tab.tokens" defaultMessage="Traffic Service" />
            </button>
            <button
              onClick={() => setActiveTab('lifetime')}
              className={`px-6 py-2 rounded-md transition-all ${
                activeTab === 'lifetime'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FormattedMessage id="store.tab.lifetime" defaultMessage="Lifetime" />
            </button>
            <button
              onClick={() => setActiveTab('plugins')}
              className={`px-6 py-2 rounded-md transition-all ${
                activeTab === 'plugins'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FormattedMessage id="store.tab.plugins" defaultMessage="Plugins" />
            </button>
            <button
              onClick={() => setActiveTab('talent')}
              className={`px-6 py-2 rounded-md transition-all ${
                activeTab === 'talent'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              天赋点亮
            </button>
            <button
              onClick={() => setActiveTab('purchased')}
              className={`px-6 py-2 rounded-md transition-all ${
                activeTab === 'purchased'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FormattedMessage id="store.tab.purchased" defaultMessage="Purchased" />
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'subscription' && <SubscriptionPlans onOpenPay={(p) => { setPayOpen(true); setPayInfo(p); }} channel={channel} />}
        {activeTab === 'lifetime' && <LifetimePlans onOpenPay={(p) => { setPayOpen(true); setPayInfo(p); }} channel={channel} />}
        {activeTab === 'tokens' && <TokenPackages onOpenPay={(p) => { setPayOpen(true); setPayInfo(p); }} channel={channel} />}
        {activeTab === 'plugins' && <PluginList channel={channel} onOpenPay={(p) => { setPayOpen(true); setPayInfo(p); }} />}
        {activeTab === 'talent' && (
          <TalentSkills
            skills={skillCatalog}
            customSkillUrl={customSkillUrl}
            onCustomSkillUrlChange={setCustomSkillUrl}
            installingId={skillInstallingId}
            installState={skillInstallState}
            onInstall={(url, id) => installSkillByUrl(url, id)}
          />
        )}
        {activeTab === 'purchased' && <PurchasedList />}

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8"><FormattedMessage id="store.faq.title" defaultMessage="FAQ" /></h2>
          <div className="space-y-4">
            <FAQItem questionId="store.faq.q1" answerId="store.faq.a1" />
            <FAQItem questionId="store.faq.q2" answerId="store.faq.a2" />
            <FAQItem questionId="store.faq.q3" answerId="store.faq.a3" />
          </div>
        </div>
      </div>
      {payOpen && payInfo && (
        <PaymentModal
          info={payInfo}
          channel={channel}
          isInWordPlugin={isInWordPlugin}
          onClose={() => { setPayOpen(false); setPayInfo(null); }}
        />
      )}
    </div>
  );
}

function PluginList({ channel, onOpenPay }: { channel: 'mock'|'wechat'|'alipay', onOpenPay: (p: { paymentId: string; title: string; amount: number; tokens?: number; pluginId?: string }) => void }) {
  const intl = useIntl();
  const [items, setItems] = useState<Array<{id:string;name:string;version:string;price:number;description:string}>>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    const run = async () => {
      try {
        const r = await fetch('/api/store/plugins')
        const d = await r.json()
        if (alive && d?.success) setItems(d.plugins || [])
      } catch {}
    }
    run()
    return () => { alive = false }
  }, [])

  const purchase = async (item: {id:string;name:string;price:number}) => {
    if (loadingId) return
    setLoadingId(item.id)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert(intl.formatMessage({ id: 'store.error.login_required', defaultMessage: 'Please login first' }))
        window.location.href = '/login'
        return
      }
      const orderRes = await fetch('/api/store/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ plugin_id: item.id, user_id: 'current', channel, meta: { orderType: 'plugin', amount: item.price } })
      })
      const orderData = await orderRes.json()
      if (!orderData?.success) { alert(intl.formatMessage({ id: 'store.error.create_order_fail', defaultMessage: 'Create order failed: ' }) + (orderData?.error || intl.formatMessage({ id: 'common.error.unknown', defaultMessage: 'Unknown error' }))); return }
      if (item.price === 0) {
        const bearer = localStorage.getItem('token')
        const r = await fetch('/api/store/receipt', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': bearer ? `Bearer ${bearer}` : '' }, body: JSON.stringify({ payment_id: orderData.payment_id, plugin_id: item.id }) })
        const j = await r.json()
        if (j?.success) { Bridge.paymentSuccess(orderData.payment_id, item.id, j.download_token, j.expires_at); Bridge.requestInstall(item.id, j.download_token) }
        else { alert(intl.formatMessage({ id: 'store.error.claim_fail', defaultMessage: 'Claim failed' })); }
      } else {
        onOpenPay({ paymentId: orderData.payment_id, title: item.name, amount: item.price, pluginId: item.id })
      }
    } catch (e) {
      
      alert(intl.formatMessage({ id: 'store.error.purchase_fail', defaultMessage: 'Purchase failed, please try again' }))
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {items.map((it) => (
        <div key={it.id} className="bg-white rounded-xl p-6 ring-1 ring-gray-200 shadow-lg flex flex-col">
          <div className="text-xl font-bold mb-1">{it.name}</div>
          <div className="text-sm text-gray-600 mb-3">v{it.version}</div>
          <div className="text-3xl font-bold text-blue-600 mb-4">{it.price>0?`¥${it.price}`:intl.formatMessage({ id: 'store.price.free', defaultMessage: 'Free' })}</div>
          <div className="text-gray-700 flex-grow">{it.description}</div>
          <button disabled={loadingId === it.id} onClick={() => purchase(it)} className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50">
            {loadingId === it.id ? intl.formatMessage({ id: 'store.btn.processing', defaultMessage: 'Processing...' }) : (it.price>0?intl.formatMessage({ id: 'store.btn.buy_and_install', defaultMessage: 'Buy & Install' }):intl.formatMessage({ id: 'store.btn.install', defaultMessage: 'Install' }))}
          </button>
        </div>
      ))}
    </div>
  )
}

function TalentSkills({
  skills,
  customSkillUrl,
  onCustomSkillUrlChange,
  installingId,
  installState,
  onInstall
}: {
  skills: Array<{ id?: string; name: string; nameEn?: string; url: string; description: string; descriptionEn?: string }>;
  customSkillUrl: string;
  onCustomSkillUrlChange: (value: string) => void;
  installingId: string;
  installState: { status: 'idle' | 'installing' | 'done' | 'failed'; progress: number; message: string };
  onInstall: (url: string, skillId?: string) => void;
}) {
  const intl = useIntl();
  const isZh = (intl.locale || '').toLowerCase().startsWith('zh');

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl p-5 ring-1 ring-gray-200">
        <div className="text-lg font-semibold mb-3">自定义 Skill 地址</div>
        <div className="flex gap-3">
          <input
            value={customSkillUrl}
            onChange={(e) => onCustomSkillUrlChange(e.target.value)}
            placeholder="粘贴 GitHub Skill 地址，例如：https://github.com/cjcjc111/new-khazix-skills"
            className="flex-1 border rounded-lg px-3 py-2"
          />
          <button
            onClick={() => onInstall(customSkillUrl)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            安装
          </button>
        </div>
      </div>

      {installState.status !== 'idle' && (
        <div className="bg-white rounded-xl p-5 ring-1 ring-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">安装进度</div>
            <div className="text-sm text-gray-500">{installState.progress}%</div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                installState.status === 'failed'
                  ? 'bg-red-500'
                  : installState.status === 'done'
                  ? 'bg-green-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${Math.max(3, installState.progress)}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-600">{installState.message || '安装中...'}</div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skills.map((item, index) => {
          const key = item.id || item.url || `skill-${index}`;
          const loading = installingId === key || installingId === item.url;
          return (
            <div key={key} className="bg-white rounded-xl p-6 ring-1 ring-gray-200 shadow-sm flex flex-col">
              <div className="text-xl font-bold mb-1">{isZh ? item.name : (item.nameEn || item.name)}</div>
              <div className="text-xs text-gray-400 mb-3 break-all">{item.url}</div>
              <div className="text-gray-700 text-sm flex-grow">{isZh ? item.description : (item.descriptionEn || item.description)}</div>
              <button
                onClick={() => onInstall(item.url, key)}
                disabled={loading}
                className="mt-5 w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-2.5 rounded-lg font-semibold disabled:opacity-50"
              >
                {loading ? '安装中...' : '安装到本地'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PurchasedList() {
  const intl = useIntl();
  const [items, setItems] = useState<Array<{pluginId:string;expires:number;version?:string}>>([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    let alive = true
    const run = async () => {
      try {
        const token = localStorage.getItem('token')
        const r = await fetch('/api/store/licenses', { headers: { 'Authorization': token ? `Bearer ${token}` : '' } })
        const d = await r.json()
        if (alive && d?.success) setItems((d.licenses||[]).map((x:any)=>({pluginId:x.pluginId,expires:x.expires,version:'1.0.0'})))
      } catch {}
    }
    run()
    return () => { alive = false }
  }, [])

  const reinstall = async (pluginId: string, version?: string) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const r = await fetch('/api/store/redownload', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, body: JSON.stringify({ plugin_id: pluginId }) })
      const j = await r.json()
      if (j?.success) {
        Bridge.requestInstall(pluginId, j.download_token, version)
      }
    } catch {} finally { setLoading(false) }
  }

  const uninstall = async (pluginId: string) => {
    Bridge.requestUninstall(pluginId)
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {items.map((it) => (
        <div key={it.pluginId} className="bg-white rounded-xl p-6 ring-1 ring-gray-200 shadow-lg flex flex-col">
          <div className="text-xl font-bold mb-1">{it.pluginId}</div>
          <div className="text-sm text-gray-600 mb-3"><FormattedMessage id="store.label.expires_at" defaultMessage="有效期至" /> {new Date(it.expires).toLocaleString()}</div>
          <div className="mt-4 flex gap-3">
            <button disabled={loading} onClick={() => reinstall(it.pluginId, it.version)} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50">
              <FormattedMessage id="store.btn.reinstall" defaultMessage="重新安装" />
            </button>
            <button onClick={() => uninstall(it.pluginId)} className="flex-1 border border-gray-300 rounded-lg py-2">
              <FormattedMessage id="store.btn.uninstall" defaultMessage="卸载" />
            </button>
          </div>
          <div className="mt-3 flex gap-3">
            <button disabled={loading} onClick={async () => {
              try {
                const r = await fetch('/api/store/update/check', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ plugin_id: it.pluginId, current_version: it.version || '1.0.0' }) })
                const j = await r.json()
                if (j?.success && j?.need_update) {
                  const latest = j.latest_version
                  const token = localStorage.getItem('token')
                  const rd = await fetch('/api/store/redownload', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, body: JSON.stringify({ plugin_id: it.pluginId }) })
                  const rj = await rd.json()
                  if (rj?.success) {
                    Bridge.requestUpdate(it.pluginId, it.version || '1.0.0', latest, rj.download_token)
                  }
                }
              } catch {}
            }} className="flex-1 border border-gray-300 rounded-lg py-2">
              <FormattedMessage id="store.btn.check_update" defaultMessage="检查更新" />
            </button>
            <span className="text-xs text-gray-500 self-center"><FormattedMessage id="store.label.current_version" defaultMessage="当前版本" /> {it.version || '1.0.0'}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function PaymentModal({ info, channel, isInWordPlugin, onClose }: { info: { paymentId: string; title: string; amount: number; tokens?: number; pluginId?: string; modelType?: string; usageDurationLabel?: string; durationMonths?: number }; channel: 'mock'|'wechat'|'alipay'; isInWordPlugin: boolean; onClose: () => void }) {
  const intl = useIntl();
  const [qr, setQr] = useState<string>('')
  const [status, setStatus] = useState<'pending'|'success'|'failed'>('pending')
  const [paymentMeta, setPaymentMeta] = useState<{
    orderNo?: string;
    amount?: number;
    createdAt?: string;
    paymentMethod?: string;
    email?: string | null;
  } | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [mockLoading, setMockLoading] = useState(false)
  const [configData, setConfigData] = useState<any>(null)
  const [isGeneratingConfig, setIsGeneratingConfig] = useState(false)
  const processedRef = useRef(false)

  useEffect(() => {
    let alive = true
    let t: NodeJS.Timeout

    const gen = async () => {
      try {
        const r = await fetch('/api/payment/qrcode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderNo: info.paymentId, channel }) })
        const j = await r.json()
        const text = j?.qr_text || j?.qrCodeUrl || `${window.location.origin}/pay?pid=${encodeURIComponent(info.paymentId)}`
        if (j?.success && j?.order) {
          setPaymentMeta({
            orderNo: j.order.orderNo || j.orderNo || info.paymentId,
            amount: typeof j.order.amount === 'number' ? j.order.amount : info.amount,
            createdAt: j.order.createdAt,
            paymentMethod: j.order.paymentMethod || j.paymentMethod || channel,
            email: j.order.email ?? null,
          })
        } else {
          setPaymentMeta({
            orderNo: j?.orderNo || info.paymentId,
            amount: typeof j?.amount === 'number' ? j.amount : info.amount,
            paymentMethod: j?.paymentMethod || channel,
          })
        }
        const d = await QRCode.toDataURL(text, { width: 256 })
        if (alive) setQr(d)
      } catch {}
    }
    const poll = async () => {
      if (processedRef.current) return
      try {
        const s = await fetch('/api/payment/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderNo: info.paymentId }) })
        const sj = await s.json()
        if (sj?.success && sj?.status === 'paid') {
          if (processedRef.current) return
          processedRef.current = true
          clearInterval(t)

          const bearer = localStorage.getItem('token')
          
          // 处理订阅购买（生成配置文件）
          if (info.modelType) {
            setIsGeneratingConfig(true)
            try {
              const deviceInfo = {
                userAgent: navigator.userAgent,
                screenResolution: `${window.screen.width}x${window.screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language,
              }
              
              const configRes = await fetch('/api/subscription/config/generate', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json', 
                  'Authorization': bearer ? `Bearer ${bearer}` : '' 
                },
                body: JSON.stringify({ 
                  orderId: info.paymentId,
                  deviceInfo
                })
              })
              
              const configResult = await configRes.json()
              if (configResult?.success) {
                setConfigData(configResult.config)
                setStatus('success')
                
                // 如果包含Token，刷新余额
                if (info.tokens && info.tokens > 0) {
                  try {
                    const br = await fetch('/api/tokens/balance', { headers: { 'Authorization': bearer ? `Bearer ${bearer}` : '' } })
                    const bj = await br.json()
                    if (bj?.success) {
                      const nextSubscriptionBalance = typeof bj.subscriptionBalance === 'number' ? bj.subscriptionBalance : null
                      setBalance(nextSubscriptionBalance)
                      try { window.dispatchEvent(new CustomEvent('jarvis-token-updated', { detail: bj })) } catch {}
                    }
                  } catch {}
                }

                // 触发下载
                const downloadUrl = configResult.config.downloadUrl
                if (downloadUrl) {
                  // 尝试通过 Bridge 自动同步到 PC 端
                  if ((window as any).jarvisBridge?.syncConfig) {
                    try {
                      const authToken = bearer || ''
                      const syncData = {
                        authToken,
                        loginToken: authToken,
                        apiKey: configResult?.apiKey?.key || '',
                        modelType: configResult?.apiKey?.modelType || info.modelType || 'deepseek',
                        provider: configResult?.apiKey?.provider || 'openai',
                        licenseType: 'subscription',
                        tokenBalance: 0,
                        trafficBalance: 0,
                        subscriptionBalance: 0,
                      };
                      if (bearer) {
                        try {
                          const balanceRes = await fetch('/api/tokens/balance', {
                            headers: { 'Authorization': `Bearer ${bearer}` }
                          })
                          const balanceJson = await balanceRes.json()
                          if (balanceJson?.success) {
                            if (typeof balanceJson.tokenBalance === 'number') syncData.tokenBalance = balanceJson.tokenBalance
                            if (typeof balanceJson.trafficBalance === 'number') syncData.trafficBalance = balanceJson.trafficBalance
                            if (typeof balanceJson.subscriptionBalance === 'number') syncData.subscriptionBalance = balanceJson.subscriptionBalance
                            if (typeof balanceJson.licenseType === 'string' && balanceJson.licenseType) syncData.licenseType = balanceJson.licenseType
                            if (typeof balanceJson.subscriptionBalance === 'number') setBalance(balanceJson.subscriptionBalance)
                            try { window.dispatchEvent(new CustomEvent('jarvis-token-updated', { detail: balanceJson })) } catch {}
                            try {
                              await fetch('/api/tokens/sync', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${bearer}`
                                },
                                body: JSON.stringify({
                                  tokenBalance: syncData.tokenBalance,
                                  trafficBalance: syncData.trafficBalance,
                                  subscriptionBalance: syncData.subscriptionBalance,
                                  licenseType: syncData.licenseType,
                                  source: 'store_subscription_payment'
                                })
                              })
                            } catch {}
                          }
                        } catch {}
                        if (!syncData.apiKey) {
                          try {
                            const cfgRes = await fetch('/api/ai/get-config', {
                              headers: { 'Authorization': `Bearer ${bearer}` }
                            })
                            const cfgJson = await cfgRes.json()
                            if (cfgJson?.success) {
                              if (typeof cfgJson.apiKey === 'string' && cfgJson.apiKey) syncData.apiKey = cfgJson.apiKey
                              if (typeof cfgJson.provider === 'string' && cfgJson.provider) syncData.provider = cfgJson.provider
                              if (typeof cfgJson.modelType === 'string' && cfgJson.modelType) syncData.modelType = cfgJson.modelType
                              if (typeof cfgJson.licenseType === 'string' && cfgJson.licenseType) syncData.licenseType = cfgJson.licenseType
                            }
                          } catch {}
                        }
                      }

                      if (syncData.apiKey) {
                        Bridge.paymentSuccess(
                          info.paymentId,
                          info.title,
                          configResult?.config?.configId || 'subscription_config',
                          Date.now() + 7 * 24 * 60 * 60 * 1000,
                          {
                            authToken: syncData.authToken,
                            loginToken: syncData.loginToken,
                            apiKey: syncData.apiKey,
                            provider: syncData.provider,
                            modelType: syncData.modelType,
                            licenseType: syncData.licenseType,
                            tokenBalance: syncData.tokenBalance,
                            trafficBalance: syncData.trafficBalance,
                            subscriptionBalance: syncData.subscriptionBalance,
                          }
                        );
                        (window as any).jarvisBridge.syncConfig(JSON.stringify(syncData));
                      } else {
                        Bridge.paymentSuccess(
                          info.paymentId,
                          info.title,
                          configResult?.config?.configId || 'subscription_config',
                          Date.now() + 7 * 24 * 60 * 60 * 1000
                        );
                        (window as any).jarvisBridge.syncConfig(JSON.stringify({
                          ...syncData,
                          config: configResult.config,
                        }));
                      }

                      // Download actions are intentionally disabled after payment.
                    } catch (e) {
                      console.error('Bridge sync failed', e);
                      const errorMessage = e instanceof Error ? e.message : String(e || 'unknown_error');
                      alert(`Desktop sync failed after payment: ${errorMessage}`);
                      // 降级到下载
                      // Do not auto-open download pages after payment.
                    }
                  } else {
                    // 延迟下载，让用户看到成功消息
                    // No bridge available: keep success state only, no browser download popup.
                  }
                }
              } else {
                console.error('Config generation failed:', configResult)
                alert(`生成配置文件失败: ${configResult?.error || '未知错误'}，请联系客服`)
              }
            } catch (configError) {
              console.error('Config generation error:', configError)
              alert(`生成配置文件失败: ${configError instanceof Error ? configError.message : '网络错误'}，请联系客服`)
            } finally {
              setIsGeneratingConfig(false)
            }
            return // 跳过后续逻辑
          }
          
          // 原有的Token充值逻辑
          if (info.tokens && info.tokens > 0) {
            // Token credit is handled by the backend (webhook/mock-pay)
            // We just need to refresh the balance and show success
            setStatus('success')
            try {
              const br = await fetch('/api/tokens/balance', { headers: { 'Authorization': bearer ? `Bearer ${bearer}` : '' } })
              const bj = await br.json()
              if (bj?.success) {
                const nextTrafficBalance = typeof bj.trafficBalance === 'number' ? bj.trafficBalance : null
                setBalance(nextTrafficBalance)
                try { window.dispatchEvent(new CustomEvent('jarvis-token-updated', { detail: bj })) } catch {}
              }
            } catch {}
          
            // 不立即关闭，展示新余额，用户可选择前往仪表盘
          } else {
            const r = await fetch('/api/store/receipt', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': bearer ? `Bearer ${bearer}` : '' }, body: JSON.stringify({ payment_id: info.paymentId, plugin_id: info.pluginId || info.title }) })
            const j = await r.json()
            if (j?.success) {
              setStatus('success')
              Bridge.paymentSuccess(info.paymentId, info.pluginId || info.title, j.download_token, j.expires_at)
              Bridge.requestInstall(info.pluginId || info.title, j.download_token)
            }
          }
        }
      } catch (e) {
        console.error('Payment status handling failed', e)
        const errorMessage = e instanceof Error ? e.message : String(e || 'unknown_error')
        alert(`Payment flow failed: ${errorMessage}`)
      }
    }
    gen()
    t = setInterval(poll, 2000)
    return () => { alive = false; clearInterval(t) }
  }, [info.paymentId])

  const isZh = (intl.locale || '').toLowerCase().startsWith('zh')

  const paymentMethodLabel =
    (paymentMeta?.paymentMethod || channel) === 'wechat'
      ? (isZh ? '微信支付' : 'WeChat')
      : (paymentMeta?.paymentMethod || channel) === 'alipay'
        ? (isZh ? '支付宝' : 'Alipay')
        : (isZh ? '模拟支付' : 'Mock')

  const fallbackCreatedAtFromOrderNo = (() => {
    const rawOrderNo = (paymentMeta?.orderNo || info.paymentId || '').trim()
    const match = rawOrderNo.match(/(\d{13})/)
    if (!match) return null
    const ms = Number(match[1])
    if (!Number.isFinite(ms)) return null
    const d = new Date(ms)
    if (Number.isNaN(d.getTime())) return null
    return d
  })()

  const createdAtLabel = paymentMeta?.createdAt
    ? new Date(paymentMeta.createdAt).toLocaleString(isZh ? 'zh-CN' : 'en-US', { hour12: false })
    : fallbackCreatedAtFromOrderNo
      ? fallbackCreatedAtFromOrderNo.toLocaleString(isZh ? 'zh-CN' : 'en-US', { hour12: false })
      : '-'

  const baseCreatedAt = paymentMeta?.createdAt
    ? new Date(paymentMeta.createdAt)
    : fallbackCreatedAtFromOrderNo

  const expiresAtDate = (() => {
    const months = info.durationMonths || 0
    if (!baseCreatedAt || !months || months <= 0) return null
    const d = new Date(baseCreatedAt)
    d.setMonth(d.getMonth() + months)
    return d
  })()

  const modelNameMap: Record<string, string> = {
    deepseek: 'DeepSeek',
    kimi: 'Kimi',
    qwen: '通义千问',
    doubao: '豆包',
    zhipu: '智谱',
    gemini: 'Gemini',
    gpt4: 'ChatGPT',
    siliconflow: '硅基流动',
    claude: 'Claude',
  }

  const selectedModelLabel = info.modelType
    ? (modelNameMap[info.modelType] || info.modelType)
    : '-'

  const expiresAtLabel = expiresAtDate
    ? expiresAtDate.toLocaleString(isZh ? 'zh-CN' : 'en-US', { hour12: false })
    : (
      (info.durationMonths === 0 || info.tokens || (info.usageDurationLabel || '').toLowerCase().includes('life'))
        ? (isZh ? '永久有效' : 'Never expires')
        : '-'
    )

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-[420px]">
        <div className="text-xl font-bold mb-1">{info.title}</div>
        <div className="text-gray-600 mb-4">¥{info.amount}</div>
        <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
          <div className="grid grid-cols-2 gap-y-2">
            <span className="text-gray-500">{isZh ? '订单号' : 'Order No'}</span>
            <span className="text-gray-900 text-right whitespace-nowrap overflow-hidden text-ellipsis max-w-[220px] justify-self-end">{paymentMeta?.orderNo || info.paymentId}</span>
            <span className="text-gray-500">{isZh ? '金额' : 'Amount'}</span>
            <span className="text-gray-900 text-right">¥{(paymentMeta?.amount ?? info.amount).toFixed(2)}</span>
            <span className="text-gray-500">{isZh ? '创建时间' : 'Created At'}</span>
            <span className="text-gray-900 text-right">{createdAtLabel}</span>
            <span className="text-gray-500">{isZh ? '支付方式' : 'Method'}</span>
            <span className="text-gray-900 text-right">{paymentMethodLabel}</span>
            <span className="text-gray-500">{isZh ? '所选模型' : 'Selected Model'}</span>
            <span className="text-gray-900 text-right">{selectedModelLabel}</span>
            <span className="text-gray-500">{isZh ? '到期时间' : 'Expires At'}</span>
            <span className="text-gray-900 text-right">{expiresAtLabel}</span>
          </div>
        </div>
        {qr && <img src={qr} alt="qr" className="w-64 h-64 mx-auto" />}
        <div className="text-center mt-4 text-sm text-gray-600"><FormattedMessage id="store.msg.scan_qr" defaultMessage="请使用支付工具扫描二维码或等待自动确认" /></div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2"><FormattedMessage id="common.close" defaultMessage="关闭" /></button>
          <a href={qr} download={`order-${info.paymentId}.png`} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg py-2 text-center"><FormattedMessage id="store.btn.save_qr" defaultMessage="保存二维码" /></a>
        </div>
        {channel === 'mock' && (
          <div className="mt-3">
            <button
              disabled={mockLoading}
              onClick={async () => {
                if (mockLoading) return;
                setMockLoading(true);
                try {
                  const r = await fetch('/api/payment/mock-pay', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderNo: info.paymentId, paymentMethod: 'mock' })
                  });
                  const d = await r.json();
                  if (!d.success) {
                    alert(intl.formatMessage({ id: 'store.error.mock_pay_fail', defaultMessage: '模拟支付失败: ' }) + (d.error || intl.formatMessage({ id: 'common.error.unknown', defaultMessage: '未知错误' })));
                  }
                  // 成功后，polling (轮询) 逻辑会自动检测到状态变化并更新 UI
                } catch (e) {
                  
                  alert(intl.formatMessage({ id: 'store.error.mock_pay_error', defaultMessage: '模拟支付出错' }));
                } finally {
                  setMockLoading(false);
                }
              }}
              className="w-full mt-2 border border-gray-300 rounded-lg py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mockLoading ? intl.formatMessage({ id: 'store.btn.processing', defaultMessage: '处理中…' }) : intl.formatMessage({ id: 'payment.mock_pay', defaultMessage: '模拟支付成功' })}
            </button>
          </div>
        )}
        {status === 'success' && !info.tokens && (
          <div className="mt-4 text-center">
            {info.modelType ? (
              <>
                <div className="text-green-600 mb-2">
                  <FormattedMessage id="store.msg.config_generated" defaultMessage="配置文件生成成功！" />
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  <FormattedMessage id="store.msg.config_downloading" defaultMessage="正在下载配置文件..." />
                </div>
                {isGeneratingConfig && (
                  <div className="text-sm text-blue-600">
                    <FormattedMessage id="store.msg.generating_config" defaultMessage="正在生成配置文件..." />
                  </div>
                )}
              </>
            ) : (
              <div className="text-green-600">
                <FormattedMessage id="store.msg.pay_success_install" defaultMessage="支付成功，已通知插件安装" />
              </div>
            )}
          </div>
        )}
        {status === 'success' && info.tokens && (
          <div className="mt-4 text-center">
            <div className="text-green-600"><FormattedMessage id="store.msg.pay_success_token" defaultMessage="支付成功，已为账户充值 Token" /></div>
            {balance !== null && <div className="mt-2 text-sm text-gray-700"><FormattedMessage id="store.label.current_balance" defaultMessage="当前余额：" />{balance.toLocaleString()} Token</div>}
            <div className="mt-3 flex gap-3">
              <a href="/dashboard" className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-center"><FormattedMessage id="store.btn.go_dashboard" defaultMessage="前往仪表盘" /></a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SubscriptionPlans({ onOpenPay, channel }: { onOpenPay: (p: { paymentId: string; title: string; amount: number; tokens?: number; modelType?: string }) => void, channel: 'mock'|'wechat'|'alipay' }) {
  const intl = useIntl();
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [modelError, setModelError] = useState<string>('');

  const defaultModels = [
    { id: 'deepseek', name: intl.formatMessage({ id: 'store.subscription.model_deepseek', defaultMessage: 'DeepSeek - 国产开源之光，推理能力强悍' }) },
    { id: 'kimi', name: intl.formatMessage({ id: 'store.subscription.model_kimi', defaultMessage: 'Kimi - 超长上下文处理，擅长长文分析' }) },
    { id: 'qwen', name: intl.formatMessage({ id: 'store.subscription.model_qwen', defaultMessage: '通义千问 - 阿里巴巴旗舰模型，中文理解精准' }) },
    { id: 'doubao', name: intl.formatMessage({ id: 'store.subscription.model_doubao', defaultMessage: '豆包 - 字节跳动出品，响应速度快，性价比高' }) },
    { id: 'zhipu', name: intl.formatMessage({ id: 'store.subscription.model_zhipu', defaultMessage: '智谱清言 - 源自清华系，新一代基座大模型' }) },
    { id: 'gemini', name: intl.formatMessage({ id: 'store.subscription.model_gemini', defaultMessage: 'Gemini - Google多模态大模型，免费额度充足' }) },
    { id: 'gpt4', name: intl.formatMessage({ id: 'store.subscription.model_gpt4', defaultMessage: 'ChatGPT - OpenAI GPT-5.4，通用与推理能力强' }) }
  ];
  const curatedDefaultModels = [
    ...defaultModels,
    { id: 'siliconflow', name: intl.formatMessage({ id: 'store.subscription.model_siliconflow', defaultMessage: '硅基流动 - 聚合多模型平台，模型覆盖全面' }) },
    { id: 'claude', name: intl.formatMessage({ id: 'store.subscription.model_claude', defaultMessage: 'Claude - Anthropic 的长文本与安全对话模型' }) },
  ];
  const [availableModels, setAvailableModels] = useState<Array<{ id: string; name: string; value: string; provider: string }>>([]);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(true);
  const providerNameMap: Record<string, string> = {
    siliconflow: '\u7845\u57fa\u6d41\u52a8',
    deepseek: 'DeepSeek',
    dashscope: '\u963f\u91cc\u4e91\u767e\u70bc',
    qwen: '\u901a\u4e49\u5343\u95ee',
    kimi: 'Kimi',
    moonshot: 'Kimi',
    doubao: '\u8c46\u5305',
    zhipu: '\u667a\u8c31',
    gemini: 'Gemini',
    openai: 'OpenAI',
    gpt4: 'ChatGPT',
    claude: 'Claude',
    anthropic: 'Claude',
  };
  const providerLogoMap: Record<string, string> = {
    openai: 'https://cdn.oaistatic.com/assets/favicon-l4nq08hd.svg',
    gpt4: 'https://cdn.oaistatic.com/assets/favicon-l4nq08hd.svg',
    gemini: 'https://cdn.simpleicons.org/googlegemini/1d4ed8',
    claude: 'https://cdn.simpleicons.org/anthropic/111827',
    anthropic: 'https://cdn.simpleicons.org/anthropic/111827',
    deepseek: '/deepseek-logo.ico',
    siliconflow: 'https://icon.horse/icon/siliconflow.cn',
    dashscope: 'https://icon.horse/icon/dashscope.aliyun.com',
    qwen: 'https://icon.horse/icon/qwenlm.ai',
    kimi: 'https://icon.horse/icon/kimi.moonshot.cn',
    moonshot: 'https://icon.horse/icon/kimi.moonshot.cn',
    doubao: 'https://cdn.jsdelivr.net/gh/lobehub/lobe-icons@master/packages/static-png/dark/volcengine-color.png',
    zhipu: 'https://icon.horse/icon/bigmodel.cn',
  };
  const modelIntroMap: Record<string, string> = {
    deepseek: '\u63a8\u7406\u80fd\u529b\u5f3a\uff0c\u4e2d\u6587\u8868\u8fbe\u4f18\u79c0',
    siliconflow: '\u591a\u6a21\u578b\u805a\u5408\uff0c\u6027\u4ef7\u6bd4\u9ad8',
    dashscope: '\u963f\u91cc\u4e91\u5e73\u53f0\uff0c\u751f\u6001\u5b8c\u6574\u7a33\u5b9a',
    qwen: '\u4e2d\u6587\u7406\u89e3\u4e0e\u5199\u4f5c\u80fd\u529b\u5747\u8861',
    kimi: '\u8d85\u957f\u4e0a\u4e0b\u6587\uff0c\u957f\u6587\u5904\u7406\u4f18\u52bf\u660e\u663e',
    moonshot: '\u8d85\u957f\u4e0a\u4e0b\u6587\uff0c\u957f\u6587\u5904\u7406\u4f18\u52bf\u660e\u663e',
    doubao: '\u54cd\u5e94\u901f\u5ea6\u5feb\uff0c\u65e5\u5e38\u4f7f\u7528\u4f53\u9a8c\u6d41\u7545',
    zhipu: '\u56fd\u4ea7 GLM \u7cfb\u5217\uff0c\u7efc\u5408\u80fd\u529b\u7a33\u5b9a',
    gemini: 'Google \u591a\u6a21\u6001\u80fd\u529b\u5f3a\uff0c\u9002\u5408\u901a\u7528\u573a\u666f',
    openai: '\u903b\u8f91\u4e0e\u751f\u6210\u80fd\u529b\u5f3a\uff0c\u901a\u7528\u6027\u9ad8',
    gpt4: 'OpenAI GPT-5.4\uff0c\u7efc\u5408\u80fd\u529b\u5f3a\uff0c\u901a\u7528\u6027\u9ad8',
    claude: '\u64c5\u957f\u957f\u6587\u5206\u6790\u4e0e\u5b89\u5168\u5bf9\u8bdd',
    anthropic: '\u64c5\u957f\u957f\u6587\u5206\u6790\u4e0e\u5b89\u5168\u5bf9\u8bdd',
  };
  const providerDisplayNameMap: Record<string, string> = {
    ...providerNameMap,
    siliconflow: '\u7845\u57fa\u6d41\u52a8',
    gemini: 'Gemini',
    gpt4: 'ChatGPT',
    openai: 'ChatGPT',
    claude: 'Claude',
    anthropic: 'Claude',
  };
  const providerDisplayLogoMap: Record<string, string> = {
    ...providerLogoMap,
    siliconflow: 'https://icon.horse/icon/siliconflow.cn',
    gemini: 'https://cdn.simpleicons.org/googlegemini/1d4ed8',
    gpt4: 'https://cdn.oaistatic.com/assets/favicon-l4nq08hd.svg',
    openai: 'https://cdn.oaistatic.com/assets/favicon-l4nq08hd.svg',
    claude: 'https://cdn.simpleicons.org/anthropic/111827',
    anthropic: 'https://cdn.simpleicons.org/anthropic/111827',
  };
  const providerDisplayIntroMap: Record<string, string> = {
    ...modelIntroMap,
    siliconflow: '\u591a\u6a21\u578b\u805a\u5408\uff0c\u6027\u4ef7\u6bd4\u9ad8',
    gemini: 'Google \u591a\u6a21\u6001\u80fd\u529b\u5f3a\uff0c\u9002\u5408\u901a\u7528\u573a\u666f',
    gpt4: 'OpenAI GPT-5.4\uff0c\u7efc\u5408\u80fd\u529b\u5f3a\uff0c\u901a\u7528\u6027\u9ad8',
    openai: 'OpenAI GPT-5.4\uff0c\u7efc\u5408\u80fd\u529b\u5f3a\uff0c\u901a\u7528\u6027\u9ad8',
    claude: '\u64c5\u957f\u957f\u6587\u5206\u6790\u4e0e\u5b89\u5168\u5bf9\u8bdd',
    anthropic: '\u64c5\u957f\u957f\u6587\u5206\u6790\u4e0e\u5b89\u5168\u5bf9\u8bdd',
  };
  const providerModelSummaryMap: Record<string, string> = {
    deepseek: 'DeepSeek - \u56fd\u4ea7\u5f00\u6e90\u4e4b\u5149\uff0c\u63a8\u7406\u80fd\u529b\u5f3a\u608d',
    doubao: '\u8c46\u5305 - \u5b57\u8282\u8df3\u52a8\u51fa\u54c1\uff0c\u54cd\u5e94\u901f\u5ea6\u5feb\uff0c\u6027\u4ef7\u6bd4\u9ad8',
    qwen: '\u901a\u4e49\u5343\u95ee - \u963f\u91cc\u5df4\u5df4\u65d7\u8230\u6a21\u578b\uff0c\u4e2d\u6587\u7406\u89e3\u7cbe\u51c6',
    kimi: 'Kimi - \u8d85\u957f\u4e0a\u4e0b\u6587\u5904\u7406\uff0c\u64c5\u957f\u957f\u6587\u5206\u6790',
    zhipu: '\u667a\u8c31\u6e05\u8a00 - \u6e90\u81ea\u6e05\u534e\u7cfb\u7edf\uff0c\u65b0\u4e00\u4ee3\u57fa\u5ea7\u5927\u6a21\u578b',
    siliconflow: '\u7845\u57fa\u6d41\u52a8 - \u805a\u5408\u591a\u6a21\u578b\u5e73\u53f0\uff0c\u6a21\u578b\u8986\u76d6\u5168\u9762',
    gpt4: 'ChatGPT - OpenAI GPT-5.4\uff0c\u7efc\u5408\u80fd\u529b\u5f3a\uff0c\u901a\u7528\u6027\u9ad8',
    openai: 'ChatGPT - OpenAI GPT-5.4\uff0c\u7efc\u5408\u80fd\u529b\u5f3a\uff0c\u901a\u7528\u6027\u9ad8',
    claude: 'Claude - Anthropic \u7684\u957f\u6587\u672c\u4e0e\u5b89\u5168\u5bf9\u8bdd\u6a21\u578b',
    anthropic: 'Claude - Anthropic \u7684\u957f\u6587\u672c\u4e0e\u5b89\u5168\u5bf9\u8bdd\u6a21\u578b',
    gemini: 'Gemini - Google \u591a\u6a21\u6001\u5927\u6a21\u578b\uff0c\u9002\u5408\u901a\u7528\u573a\u666f',
  };
  const getProviderRank = (provider: string): number => {
    const normalized = (provider || '').toLowerCase();
    if (normalized === 'deepseek') return 0;
    if (normalized === 'doubao') return 1;
    if (normalized === 'qwen' || normalized === 'dashscope') return 2;
    if (normalized === 'kimi' || normalized === 'moonshot') return 3;
    if (normalized === 'zhipu') return 4;
    if (normalized === 'siliconflow') return 5;
    if (normalized === 'openai' || normalized === 'gpt4') return 6;
    if (normalized === 'claude' || normalized === 'anthropic') return 7;
    if (normalized === 'gemini') return 8;
    return 99;
  };
  const isForeignProvider = (provider: string): boolean => {
    const normalized = (provider || '').toLowerCase();
    return ['openai', 'gpt4', 'gemini', 'claude', 'anthropic'].includes(normalized);
  };
  const normalizeProviderForDisplay = (provider: string): string => {
    const normalized = (provider || '').toLowerCase();
    if (normalized === 'dashscope') return 'qwen';
    if (normalized === 'moonshot') return 'kimi';
    if (normalized === 'openai') return 'gpt4';
    if (normalized === 'anthropic') return 'claude';
    return normalized;
  };
  const orderedModels = [...availableModels].sort((a, b) => {
    const rankDiff = getProviderRank(a.provider) - getProviderRank(b.provider);
    if (rankDiff !== 0) return rankDiff;
    return a.name.localeCompare(b.name);
  });
  const visibleProviders = new Set(['deepseek', 'doubao', 'qwen', 'kimi', 'zhipu', 'siliconflow', 'gpt4', 'claude', 'gemini']);
  const visibleOrderedModels = orderedModels.filter(model => visibleProviders.has(normalizeProviderForDisplay(model.provider)));
  const hasDomesticModel = visibleOrderedModels.some(model => !isForeignProvider(normalizeProviderForDisplay(model.provider)));
  const modelItems: Array<{ type: 'model'; model: { id: string; name: string; value: string; provider: string } } | { type: 'divider' }> = [];
  let dividerInserted = false;
  visibleOrderedModels.forEach((model) => {
    if (!dividerInserted && hasDomesticModel && isForeignProvider(normalizeProviderForDisplay(model.provider))) {
      modelItems.push({ type: 'divider' });
      dividerInserted = true;
    }
    modelItems.push({ type: 'model', model });
  });
  useEffect(() => {
    let canceled = false;
    const fallback = curatedDefaultModels.map(model => ({ id: model.id, name: model.name, value: model.id, provider: model.id }));

    const loadAvailableModels = async () => {
      setIsLoadingModels(true);
      try {
      const token = localStorage.getItem('token');
        const response = await fetch('/api/models/available', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (!response.ok) {
          throw new Error('failed_to_load_models');
        }

        const payload = await response.json();
        const normalized = (Array.isArray(payload?.models) ? payload.models : [])
          .map((item: any) => ({
            id: String(item?.id || ''),
            name: String(item?.name || item?.value || ''),
            value: String(item?.value || ''),
            provider: String(item?.provider || '').toLowerCase(),
            tier: String(item?.tier || '').toLowerCase(),
          }))
          .filter((item: { id: string; name: string; value: string; provider: string; tier: string }) => item.id && item.name && item.value && item.provider)
          .filter((item: { provider: string; tier: string }) => !(item.provider === 'siliconflow' && item.tier === 'free'))
          .map((item: { id: string; name: string; value: string; provider: string }) => ({
            id: item.id,
            name: item.name,
            value: item.value,
            provider: normalizeProviderForDisplay(item.provider),
          }));

        if (!canceled) {
          const merged = [...normalized, ...fallback];
          const deduped = new Map<string, { id: string; name: string; value: string; provider: string }>();
          for (const model of merged) {
            const key = model.provider.toLowerCase();
            if (!deduped.has(key)) {
              deduped.set(key, model);
            }
          }
          setAvailableModels(Array.from(deduped.values()));
        }
      } catch {
        if (!canceled) {
          setAvailableModels(fallback);
        }
      } finally {
        if (!canceled) {
          setIsLoadingModels(false);
        }
      }
    };

    loadAvailableModels();
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    if (availableModels.length === 0) {
      return;
    }
    const modelExists = availableModels.some(model => `${model.provider}:${model.value}` === selectedModel);
    if (!modelExists) {
      const firstModel = [...availableModels].sort((a, b) => getProviderRank(a.provider) - getProviderRank(b.provider))[0];
      setSelectedModel(`${firstModel.provider}:${firstModel.value}`);
    }
  }, [availableModels, selectedModel]);
  const plans = [
    {
      name: intl.formatMessage({ id: 'store.plan.monthly', defaultMessage: '月付套餐' }),
      price: 29,
      period: intl.formatMessage({ id: 'store.period.month', defaultMessage: '月' }),
      tokens: 100000,
      features: [
        intl.formatMessage({ id: 'store.feature.bonus_token', defaultMessage: '赠送{amount}万Token' }, { amount: '10' }),
        intl.formatMessage({ id: 'store.feature.multi_model', defaultMessage: '多模型可选（Gemini、豆包等）' }),
        intl.formatMessage({ id: 'store.feature.no_api_key', defaultMessage: '无需配置API Key' }),
        intl.formatMessage({ id: 'store.feature.pay_as_you_go', defaultMessage: '按量计费，透明清晰' }),
        intl.formatMessage({ id: 'store.feature.cancel_anytime', defaultMessage: '随时取消' })
      ]
    },
    {
      name: intl.formatMessage({ id: 'store.plan.quarterly', defaultMessage: '季付套餐' }),
      price: 79,
      period: intl.formatMessage({ id: 'store.period.quarter', defaultMessage: '季' }),
      tokens: 350000,
      badge: intl.formatMessage({ id: 'store.badge.save_10', defaultMessage: '省10元' }),
      features: [
        intl.formatMessage({ id: 'store.feature.bonus_token', defaultMessage: '赠送{amount}万Token' }, { amount: '35' }),
        intl.formatMessage({ id: 'store.feature.all_monthly', defaultMessage: '所有月付功能' }),
        intl.formatMessage({ id: 'store.feature.cheaper', defaultMessage: '更优惠的价格' }),
        intl.formatMessage({ id: 'store.feature.discount_95', defaultMessage: '相当于9.5折' })
      ]
    },
    {
      name: intl.formatMessage({ id: 'store.plan.yearly', defaultMessage: '年付套餐' }),
      price: 199,
      period: intl.formatMessage({ id: 'store.period.year', defaultMessage: '年' }),
      tokens: 2000000,
      badge: intl.formatMessage({ id: 'store.badge.best_value', defaultMessage: '最划算' }),
      popular: true,
      features: [
        intl.formatMessage({ id: 'store.feature.bonus_token', defaultMessage: '赠送{amount}万Token' }, { amount: '200' }),
        intl.formatMessage({ id: 'store.feature.all_monthly', defaultMessage: '所有月付功能' }),
        intl.formatMessage({ id: 'store.feature.discount_70', defaultMessage: '相当于7折优惠' }),
        intl.formatMessage({ id: 'store.feature.avg_price', defaultMessage: '平均每月仅¥16.6' })
      ]
    }
  ];

  return (
    <div className="space-y-16">
      <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900">
            <FormattedMessage id="store.subscription.select_model" defaultMessage="选择AI模型" />
          </h3>
          {isLoadingModels && (
            <p className="mb-3 text-sm text-gray-500">
              <FormattedMessage id="admin.loading" defaultMessage="Loading..." />
            </p>
          )}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modelItems.map((item, index) => {
              if (item.type === 'divider') {
                return (
                  <div key={`divider-${index}`} className="md:col-span-2 lg:col-span-3 flex items-center gap-3 py-1">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-xs font-medium tracking-wide text-gray-500">国外模型数据来自中转站，无需魔法,小贾仅作数据链接</span>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>
                );
              }
              const model = item.model;
              return (
              <label key={model.id} className="block p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="modelType"
                    value={`${model.provider}:${model.value}`}
                    checked={selectedModel === `${model.provider}:${model.value}`}
                    onChange={(e) => {
                      setSelectedModel(e.target.value);
                      setModelError('');
                    }}
                    className="self-center h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1 grid grid-cols-[1fr_auto] items-center gap-3">
                    <div>
                      <div className="text-sm font-bold text-blue-700 leading-6">{providerDisplayNameMap[model.provider] || model.provider}</div>
                      <div className="text-xs text-gray-500 mt-1">{`模型：${providerModelSummaryMap[model.provider] || providerDisplayIntroMap[model.provider] || model.provider}`}</div>
                      <div className="text-xs text-gray-500 mt-1">{providerDisplayIntroMap[model.provider] || '通用场景可用，按需选择即可'}</div>
                    </div>
                    <div className="flex items-center justify-center">
                      <img
                        src={providerDisplayLogoMap[model.provider] || `https://icon.horse/icon/${model.provider}.com`}
                        alt={`${providerDisplayNameMap[model.provider] || model.provider} logo`}
                        className="w-10 h-10 rounded-md shrink-0"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          if (!target.dataset.fallbackApplied) {
                            target.dataset.fallbackApplied = '1';
                            target.src = '/favicon.ico';
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </label>
              );
            })}
          </div>
          {modelError && (
            <p className="mt-2 text-sm text-red-600">
              <FormattedMessage id="store.subscription.model_required" defaultMessage="请选择一个AI模型" />
            </p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <PricingCard 
            key={plan.name} 
            {...plan} 
            type="subscription" 
            modelType={selectedModel}
            onOpenPay={(p) => {
              if (!selectedModel) {
                setModelError(intl.formatMessage({ id: 'store.subscription.model_required', defaultMessage: '请选择一个AI模型' }));
                return;
              }
              onOpenPay({ ...p, modelType: selectedModel });
            }} 
            channel={channel} 
          />
        ))}
      </div>


    </div>
  );
}

function LifetimePlans({ onOpenPay, channel }: { onOpenPay: (p: { paymentId: string; title: string; amount: number; tokens?: number }) => void, channel: 'mock'|'wechat'|'alipay' }) {
  const intl = useIntl();
  const plans = [
    {
      name: intl.formatMessage({ id: 'store.plan.personal', defaultMessage: '个人版' }),
      price: 199,
      period: intl.formatMessage({ id: 'store.period.lifetime', defaultMessage: '永久' }),
      features: [
        `✅ ${intl.formatMessage({ id: 'store.feature.lifetime_access', defaultMessage: '永久使用所有功能' })}`,
        `✅ ${intl.formatMessage({ id: 'store.feature.support_all_models', defaultMessage: '支持所有AI模型' })}`,
        `✅ ${intl.formatMessage({ id: 'store.feature.custom_api_key', defaultMessage: '自定义API Key' })}`,
        `✅ ${intl.formatMessage({ id: 'store.feature.no_limit', defaultMessage: '无使用限制' })}`,
        `✅ ${intl.formatMessage({ id: 'store.feature.lifetime_update', defaultMessage: '终身免费更新' })}`,
        `✅ ${intl.formatMessage({ id: 'store.feature.local_data', defaultMessage: '本地数据，隐私安全' })}`
      ]
    },
    {
      name: intl.formatMessage({ id: 'store.plan.pro', defaultMessage: '专业版' }),
      price: 499,
      period: intl.formatMessage({ id: 'store.period.lifetime', defaultMessage: '永久' }),
      popular: true,
      features: [
        `✅ ${intl.formatMessage({ id: 'store.feature.all_personal', defaultMessage: '个人版所有功能' })}`,
        `✅ ${intl.formatMessage({ id: 'store.feature.advanced_plugin', defaultMessage: '高级插件支持' })}`,
        `✅ ${intl.formatMessage({ id: 'store.feature.priority_support', defaultMessage: '优先技术支持' })}`,
        `✅ ${intl.formatMessage({ id: 'store.feature.commercial_use', defaultMessage: '商业使用授权' })}`,
        `✅ ${intl.formatMessage({ id: 'store.feature.custom_dev', defaultMessage: '定制开发服务' })}`,
        `✅ ${intl.formatMessage({ id: 'store.feature.multi_device', defaultMessage: '多设备授权（3台）' })}`
      ]
    }
  ];

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {plans.map((plan) => (
        <PricingCard key={plan.name} {...plan} type="lifetime" onOpenPay={onOpenPay} channel={channel} />
      ))}
    </div>
  );
}

function TokenPackages({ onOpenPay, channel }: { onOpenPay: (p: { paymentId: string; title: string; amount: number; tokens?: number }) => void, channel: 'mock'|'wechat'|'alipay' }) {
  const intl = useIntl();
  const packages = [
    { tokens: 100000, price: 9.9, bonus: 0, desc: intl.formatMessage({ id: 'store.pack.starter', defaultMessage: '新手体验' }) },
    { tokens: 500000, price: 39, bonus: 50000, desc: intl.formatMessage({ id: 'store.pack.basic', defaultMessage: '轻度使用' }) },
    { tokens: 1000000, price: 69, bonus: 150000, desc: intl.formatMessage({ id: 'store.pack.standard', defaultMessage: '中度使用' }), popular: true },
    { tokens: 5000000, price: 299, bonus: 1000000, desc: intl.formatMessage({ id: 'store.pack.pro', defaultMessage: '重度使用' }) }
  ];

  return (
    <div>
      <div className="grid md:grid-cols-4 gap-6">
        {packages.map((pkg) => (
          <TokenPackCard key={pkg.tokens} {...pkg} onOpenPay={onOpenPay} channel={channel} />
        ))}
      </div>

      {/* Token说明 */}
      <div className="mt-12 p-6 bg-blue-50 rounded-xl max-w-3xl mx-auto">
        <h3 className="font-semibold mb-4 text-lg"><FormattedMessage id="store.token.guide.title" defaultMessage="💡 Token 使用说明" /></h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p className="mb-2"><strong><FormattedMessage id="store.token.guide.conversion" defaultMessage="📊 Token换算" /></strong></p>
            <ul className="space-y-1 ml-4">
              <li><FormattedMessage id="store.token.guide.conv1" defaultMessage="• 1万Token ≈ 7500个汉字" /></li>
              <li><FormattedMessage id="store.token.guide.conv2" defaultMessage="• 写一篇3000字文章 ≈ 4000 Token" /></li>
              <li><FormattedMessage id="store.token.guide.conv3" defaultMessage="• 润色1000字 ≈ 1500 Token" /></li>
            </ul>
          </div>
          <div>
            <p className="mb-2"><strong><FormattedMessage id="store.token.guide.models" defaultMessage="🤖 模型消耗" /></strong></p>
            <ul className="space-y-1 ml-4">
              <li><FormattedMessage id="store.token.guide.model1" defaultMessage="• Gemini：最省（推荐）" /></li>
              <li><FormattedMessage id="store.token.guide.model2" defaultMessage="• 豆包：经济实惠" /></li>
              <li><FormattedMessage id="store.token.guide.model3" defaultMessage="• GPT-4：效果最好但较贵" /></li>
            </ul>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-600">
          <FormattedMessage id="store.token.guide.footer" defaultMessage="⏰ Token永久有效，不过期 | 📈 可随时查看余额和使用记录" />
        </p>
      </div>
    </div>
  );
}

type PricingCardProps = {
  name: string;
  price: number;
  period: string;
  tokens?: number;
  features: string[];
  badge?: string;
  popular?: boolean;
  type: 'subscription' | 'lifetime';
  modelType?: string;
  onOpenPay?: (p: { paymentId: string; title: string; amount: number; tokens?: number; modelType?: string; usageDurationLabel?: string; durationMonths?: number }) => void;
  channel?: 'mock'|'wechat'|'alipay';
};

function PricingCard({ name, price, period, tokens, features, badge, popular, type, modelType, onOpenPay, channel = 'mock' }: PricingCardProps) {
  const intl = useIntl();
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const periodText = String(period || '').toLowerCase()
      const durationMonths =
        periodText.includes('\u5b63') || periodText.includes('quarter')
          ? 3
          : periodText.includes('\u5e74') || periodText.includes('year')
            ? 12
            : periodText.includes('\u6708') || periodText.includes('month')
              ? 1
              : 0
      const token = localStorage.getItem('token');
      if (!token) {
        alert(intl.formatMessage({ id: 'store.error.login_required', defaultMessage: '请先登录' }));
        window.location.href = '/login';
        return;
      }
      
      // 创建订单
      const orderRes = await fetch('/api/store/pay', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plugin_id: name,
          user_id: 'current',
          channel,
          meta: { orderType: type, amount: price, tokens, duration: durationMonths, modelType }
        })
      });

      const orderData = await orderRes.json();
      
      if (!orderData.success) {
        alert(intl.formatMessage({ id: 'store.error.create_order_fail', defaultMessage: '创建订单失败: ' }) + orderData.error);
        return;
      }

      if (onOpenPay) onOpenPay({ paymentId: orderData.payment_id, title: name, amount: price, tokens, modelType, usageDurationLabel: period, durationMonths });
    } catch (error) {
      
      alert(intl.formatMessage({ id: 'store.error.purchase_fail', defaultMessage: '购买失败，请重试' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className={`relative bg-white rounded-2xl p-8 transition-all duration-300 cursor-pointer flex flex-col ${
        popular ? 'ring-2 ring-blue-600' : 'ring-1 ring-gray-200'
      } ${
        isHovered 
          ? 'shadow-2xl scale-105 -translate-y-2' 
          : 'shadow-lg hover:shadow-xl'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {badge && (
        <div className={`absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full text-sm font-semibold transition-all duration-300 ${
          isHovered ? 'translate-y-2' : ''
        }`}>
          {badge}
        </div>
      )}
      {popular && (
        <div className={`absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold transition-all duration-300 ${
          isHovered ? 'translate-y-2' : ''
        }`}>
          <FormattedMessage id="store.badge.popular" defaultMessage="🔥 最受欢迎" />
        </div>
      )}
      
      <div className="text-center mb-6">
        <h3 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
          isHovered ? 'text-blue-600' : 'text-gray-900'
        }`}>
          {name}
        </h3>
        <div className="flex items-baseline justify-center">
          <span className={`text-4xl font-bold transition-all duration-300 ${
            isHovered ? 'text-blue-600 scale-110' : 'text-blue-600'
          }`}>
            ¥{price}
          </span>
          <span className="text-gray-600 ml-2">/ {period}</span>
        </div>
        {tokens && (
          <p className="text-sm text-gray-600 mt-2">
            <FormattedMessage id="store.feature.bonus_token" defaultMessage="赠送{amount}万Token" values={{ amount: (tokens / 10000).toFixed(0) }} />
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-8 flex-grow">
        {features.map((feature: string, index: number) => (
          <li 
            key={index} 
            className={`flex items-start text-gray-700 transition-all duration-300 ${
              isHovered ? 'translate-x-1' : ''
            }`}
            style={{ transitionDelay: `${index * 50}ms` }}
          >
            <span className="mr-2">{feature.startsWith('✅') ? '' : '•'}</span>
            <span>{feature.replace('✅ ', '')}</span>
          </li>
        ))}
      </ul>

      <button 
        onClick={handlePurchase}
        disabled={loading}
        className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
          isHovered ? 'shadow-lg scale-105' : 'shadow-md'
        }`}
      >
        {loading ? <FormattedMessage id="store.btn.processing" defaultMessage="处理中..." /> : <FormattedMessage id="store.buy_now" defaultMessage="立即购买" />}
      </button>
    </div>
  );
}

type TokenPackCardProps = {
  tokens: number;
  price: number;
  bonus: number;
  desc: string;
  popular?: boolean;
  onOpenPay?: (p: { paymentId: string; title: string; amount: number; tokens?: number }) => void;
  channel?: 'mock'|'wechat'|'alipay';
};

function TokenPackCard({ tokens, price, bonus, desc, popular, onOpenPay, channel = 'mock' }: TokenPackCardProps) {
  const intl = useIntl();
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const totalTokens = tokens + bonus;
  
  const handlePurchase = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert(intl.formatMessage({ id: 'store.error.login_required', defaultMessage: '请先登录' }));
        window.location.href = '/login';
        return;
      }
      
      const orderRes = await fetch('/api/store/pay', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plugin_id: `${(totalTokens / 10000).toFixed(0)}万Token流量包`,
          user_id: 'current',
          channel,
          meta: { orderType: 'token_pack', amount: price, tokens: totalTokens }
        })
      });

      const orderData = await orderRes.json();
      
      if (!orderData.success) {
        alert(intl.formatMessage({ id: 'store.error.create_order_fail', defaultMessage: '创建订单失败: ' }) + orderData.error);
        return;
      }
      if (onOpenPay) onOpenPay({ paymentId: orderData.payment_id, title: `${(totalTokens / 10000).toFixed(0)}万Token流量包`, amount: price, tokens: totalTokens, usageDurationLabel: intl.formatMessage({ id: 'store.period.one_time', defaultMessage: '一次性' }), durationMonths: 0 });
    } catch (error) {
      
      alert(intl.formatMessage({ id: 'store.error.purchase_fail', defaultMessage: '购买失败，请重试' }));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div 
      className={`bg-white rounded-xl p-6 transition-all duration-300 cursor-pointer flex flex-col ${
        popular ? 'ring-2 ring-blue-600' : 'ring-1 ring-gray-200'
      } ${
        isHovered 
          ? 'shadow-2xl scale-105 -translate-y-2' 
          : 'shadow-lg'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {popular && (
        <div className={`text-center mb-2 transition-all duration-300 ${
          isHovered ? 'translate-y-2' : ''
        }`}>
        <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
            <FormattedMessage id="store.recommend" defaultMessage="推荐" />
        </span>
        </div>
      )}
      
      <div className="text-center mb-4">
        <div className={`text-3xl font-bold mb-1 transition-all duration-300 ${
          isHovered ? 'text-blue-600 scale-110' : 'text-blue-600'
        }`}>
          {(totalTokens / 10000).toFixed(0)}万
        </div>
        <div className="text-sm text-gray-600">{desc}</div>
        {bonus > 0 && (
          <div className={`text-xs text-orange-600 mt-1 transition-all duration-300 ${
            isHovered ? 'scale-110 font-bold' : ''
          }`}>
            <FormattedMessage id="store.pack.bonus" defaultMessage="+赠{amount}万" values={{ amount: (bonus / 10000).toFixed(0) }} />
          </div>
        )}
      </div>

      <div className="text-center mb-4 flex-grow">
        <span className={`text-2xl font-bold transition-all duration-300 ${
          isHovered ? 'text-blue-600 scale-110' : 'text-gray-900'
        }`}>
          ¥{price}
        </span>
      </div>

      <button 
        onClick={handlePurchase}
        disabled={loading}
        className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
          isHovered ? 'shadow-lg scale-105' : 'shadow-md'
        }`}
      >
        {loading ? <FormattedMessage id="store.btn.processing" defaultMessage="处理中..." /> : <FormattedMessage id="store.buy" defaultMessage="购买" />}
      </button>
    </div>
  );
}

function FAQItem({ questionId, answerId }: { questionId: string; answerId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
      >
        <span className="font-semibold"><FormattedMessage id={questionId} defaultMessage={questionId} /></span>
        <span className="text-gray-400">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-gray-50 text-gray-700">
          <FormattedMessage id={answerId} defaultMessage={answerId} />
        </div>
      )}
    </div>
  );
}
