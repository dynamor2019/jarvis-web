// [CodeGuard Feature Index]
// - Admin settings add custom model button and dynamic model list persistence -> line 224
// [/CodeGuard Feature Index]

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useIntl, FormattedMessage } from 'react-intl';
import Link from 'next/link';

interface CustomModelEntry {
    id: string;
    provider: string;
    apiKey: string;
    model: string;
    endpoint?: string;
}

export default function AdminSettingsPage() {
    const intl = useIntl();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('payment'); // payment, general, models
    
    // 表单状态
    const [settings, setSettings] = useState({
        // 支付宝
        alipay_app_id: '',
        alipay_private_key: '',
        alipay_public_key: '',
        // 微信支付
        wechat_app_id: '',
        wechat_mch_id: '',
        wechat_api_key: '',
        // 广告设置 (预留)
        ad_rotation_interval: '30',
        landing_download_url: 'https://share.weiyun.com/5LObuK4n',
        smtp_host: '',
        smtp_port: '587',
        smtp_secure: 'false',
        smtp_user: '',
        smtp_pass: '',
        smtp_from: '',
        smtp_from_name: 'JarvisAI',
        // 模型 API Key 配置 (Platform Keys)
        platform_openai_key: '',
        platform_siliconflow_key: '',
        platform_doubao_key: '',
        platform_deepseek_key: '',
        platform_dashscope_key: '',
        platform_zhipu_key: '',
        platform_kimi_key: '',
        platform_anthropic_key: '',
        platform_gemini_key: '',
        platform_grok_key: '',
        // 模型类型配置 (Platform Models)
        platform_openai_model: '',
        platform_siliconflow_model: '',
        platform_doubao_model: '',
        platform_deepseek_model: '',
        platform_dashscope_model: '',
        platform_zhipu_model: '',
        platform_kimi_model: '',
        platform_anthropic_model: '',
        platform_gemini_model: '',
        platform_grok_model: '',
        platform_custom_models: '',
    });
    const [customModels, setCustomModels] = useState<CustomModelEntry[]>([]);
    const [newCustomModel, setNewCustomModel] = useState({
        provider: '',
        apiKey: '',
        model: '',
        endpoint: '',
    });

    const fetchSettings = useCallback(async (token: string) => {
        try {
            const response = await fetch('/api/admin/settings', {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.status === 401 || response.status === 403) {
                router.push('/login');
                return;
            }

            const data = await response.json();
            if (data.settings) {
                let parsedCustomModels: CustomModelEntry[] = [];
                const rawCustomModels = data.settings.platform_custom_models;
                if (typeof rawCustomModels === 'string' && rawCustomModels.trim()) {
                    try {
                        const parsed = JSON.parse(rawCustomModels);
                        if (Array.isArray(parsed)) {
                            parsedCustomModels = parsed
                                .map((item: any, index: number) => ({
                                    id: String(item?.id || `custom_${Date.now()}_${index}`),
                                    provider: String(item?.provider || ''),
                                    apiKey: String(item?.apiKey || ''),
                                    model: String(item?.model || ''),
                                    endpoint: String(item?.endpoint || ''),
                                }))
                                .filter((item: CustomModelEntry) => item.provider || item.model);
                        }
                    } catch {
                        parsedCustomModels = [];
                    }
                }

                setSettings(prev => ({
                    ...prev,
                    ...data.settings
                }));
                setCustomModels(parsedCustomModels);
            }
        } catch (error) {
            
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchSettings(token);
    }, [router, fetchSettings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const token = localStorage.getItem('token');
        const payloadSettings = {
            ...settings,
            platform_custom_models: JSON.stringify(customModels),
        };
        
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ settings: payloadSettings }),
            });

            if (response.ok) {
                alert('设置已保存');
            } else {
                alert('保存失败');
            }
        } catch (error) {
            
            alert('保存出错');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateCustomModel = (id: string, field: keyof Omit<CustomModelEntry, 'id'>, value: string) => {
        setCustomModels(prev =>
            prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
        );
    };

    const handleRemoveCustomModel = (id: string) => {
        setCustomModels(prev => prev.filter(item => item.id !== id));
    };

    const handleAddCustomModel = () => {
        if (!newCustomModel.provider.trim() || !newCustomModel.model.trim()) {
            alert('Provider 和 Model Name 为必填');
            return;
        }

        const nextItem: CustomModelEntry = {
            id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `custom_${Date.now()}`,
            provider: newCustomModel.provider.trim(),
            apiKey: newCustomModel.apiKey.trim(),
            model: newCustomModel.model.trim(),
            endpoint: newCustomModel.endpoint.trim(),
        };

        setCustomModels(prev => [...prev, nextItem]);
        setNewCustomModel({
            provider: '',
            apiKey: '',
            model: '',
            endpoint: '',
        });
    };

    if (loading) {
        return <div className="p-8 text-center">加载中...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">系统设置</h1>
                        <p className="text-gray-600">配置支付接口和其他系统参数</p>
                    </div>
                    <Link href="/admin" className="text-blue-600 hover:underline">
                        返回仪表盘
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b">
                        <button
                            className={`px-6 py-4 font-medium ${activeTab === 'payment' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('payment')}
                        >
                            支付配置
                        </button>
                        <button
                            className={`px-6 py-4 font-medium ${activeTab === 'models' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('models')}
                        >
                            模型配置
                        </button>
                        <button
                            className={`px-6 py-4 font-medium ${activeTab === 'general' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('general')}
                        >
                            通用设置
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6">
                        {activeTab === 'payment' && (
                            <div className="space-y-8">
                                {/* Alipay Section */}
                                <div>
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <span className="text-blue-500">🔵</span> 支付宝 (Alipay)
                                    </h3>
                                    <div className="grid gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">App ID</label>
                                            <input
                                                type="text"
                                                name="alipay_app_id"
                                                value={settings.alipay_app_id}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="例如: 20210001xxxxxx"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">应用私钥 (Private Key)</label>
                                            <textarea
                                                name="alipay_private_key"
                                                value={settings.alipay_private_key}
                                                onChange={handleChange}
                                                rows={3}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                                placeholder="MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQ..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">支付宝公钥 (Alipay Public Key)</label>
                                            <textarea
                                                name="alipay_public_key"
                                                value={settings.alipay_public_key}
                                                onChange={handleChange}
                                                rows={3}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                                placeholder="MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQE..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <span className="text-green-500">🟢</span> 微信支付 (WeChat Pay)
                                    </h3>
                                    <div className="grid gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">App ID</label>
                                            <input
                                                type="text"
                                                name="wechat_app_id"
                                                value={settings.wechat_app_id}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                                placeholder="wx8888888888888888"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">商户号 (Mch ID)</label>
                                            <input
                                                type="text"
                                                name="wechat_mch_id"
                                                value={settings.wechat_mch_id}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                                placeholder="1900000109"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                <FormattedMessage id="admin.settings.payment.wechat.api_key" defaultMessage="API Key (v3)" />
                                            </label>
                                            <input
                                                type="password"
                                                name="wechat_api_key"
                                                value={settings.wechat_api_key}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                                placeholder={intl.formatMessage({ id: 'admin.settings.placeholder.wechat_api_key', defaultMessage: '32位API密钥' })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'models' && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <span className="text-purple-500">🧠</span> 模型 API Key & Model 配置
                                    </h3>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        {/* OpenAI */}
                                        <div className="p-4 border rounded-lg bg-gray-50">
                                            <h4 className="font-bold text-gray-800 mb-3">OpenAI</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                                    <input
                                                        type="password"
                                                        name="platform_openai_key"
                                                        value={settings.platform_openai_key}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                                        placeholder="sk-..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                                                    <input
                                                        type="text"
                                                        name="platform_openai_model"
                                                        value={settings.platform_openai_model}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                                        placeholder="gpt-4o"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* SiliconFlow */}
                                        <div className="p-4 border rounded-lg bg-gray-50">
                                            <h4 className="font-bold text-gray-800 mb-3">SiliconFlow (硅基流动)</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                                    <input
                                                        type="password"
                                                        name="platform_siliconflow_key"
                                                        value={settings.platform_siliconflow_key}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                                        placeholder="sk-..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                                                    <input
                                                        type="text"
                                                        name="platform_siliconflow_model"
                                                        value={settings.platform_siliconflow_model}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                                        placeholder="deepseek-ai/DeepSeek-V3"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* DeepSeek */}
                                        <div className="p-4 border rounded-lg bg-gray-50">
                                            <h4 className="font-bold text-gray-800 mb-3">DeepSeek (官方)</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                                    <input
                                                        type="password"
                                                        name="platform_deepseek_key"
                                                        value={settings.platform_deepseek_key}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                                        placeholder="sk-..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                                                    <input
                                                        type="text"
                                                        name="platform_deepseek_model"
                                                        value={settings.platform_deepseek_model}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                                        placeholder="deepseek-chat"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Doubao */}
                                        <div className="p-4 border rounded-lg bg-gray-50">
                                            <h4 className="font-bold text-gray-800 mb-3">Doubao (豆包)</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                                    <input
                                                        type="password"
                                                        name="platform_doubao_key"
                                                        value={settings.platform_doubao_key}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                                        placeholder="sk-..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Model / Endpoint ID</label>
                                                    <input
                                                        type="text"
                                                        name="platform_doubao_model"
                                                        value={settings.platform_doubao_model}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                                        placeholder="doubao-seed-1-6-251015"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* DashScope */}
                                        <div className="p-4 border rounded-lg bg-gray-50">
                                            <h4 className="font-bold text-gray-800 mb-3">DashScope (通义千问)</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                                    <input
                                                        type="password"
                                                        name="platform_dashscope_key"
                                                        value={settings.platform_dashscope_key}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                                        placeholder="sk-..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                                                    <input
                                                        type="text"
                                                        name="platform_dashscope_model"
                                                        value={settings.platform_dashscope_model}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                                        placeholder="qwen3-max"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Zhipu */}
                                        <div className="p-4 border rounded-lg bg-gray-50">
                                            <h4 className="font-bold text-gray-800 mb-3">Zhipu (智谱清言)</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                                    <input
                                                        type="password"
                                                        name="platform_zhipu_key"
                                                        value={settings.platform_zhipu_key}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                                        placeholder="sk-..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                                                    <input
                                                        type="text"
                                                        name="platform_zhipu_model"
                                                        value={settings.platform_zhipu_model}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                                        placeholder="glm-4.7"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Kimi */}
                                        <div className="p-4 border rounded-lg bg-gray-50">
                                            <h4 className="font-bold text-gray-800 mb-3">Kimi (Moonshot)</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                                    <input
                                                        type="password"
                                                        name="platform_kimi_key"
                                                        value={settings.platform_kimi_key}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                                        placeholder="sk-..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                                                    <input
                                                        type="text"
                                                        name="platform_kimi_model"
                                                        value={settings.platform_kimi_model}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                                        placeholder="kimi-k2.5"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {[['Anthropic (Claude)', 'platform_anthropic_key', 'platform_anthropic_model', 'sk-ant-...', 'claude-*'], ['Gemini (Google)', 'platform_gemini_key', 'platform_gemini_model', 'AIza...', 'gemini-*'], ['Grok (xAI)', 'platform_grok_key', 'platform_grok_model', 'xai-...', 'grok-*']].map(([label, keyName, modelName, keyPlaceholder, modelPlaceholder]) => (
                                            <div key={keyName} className="p-4 border rounded-lg bg-gray-50">
                                                <h4 className="font-bold text-gray-800 mb-3">{label}</h4>
                                                <div className="space-y-3">
                                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">API Key</label><input type="password" name={keyName} value={String(settings[keyName as keyof typeof settings] || '')} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder={keyPlaceholder} /></div>
                                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label><input type="text" name={modelName} value={String(settings[modelName as keyof typeof settings] || '')} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder={modelPlaceholder} /></div>
                                                </div>
                                            </div>
                                        ))}

                                    </div>
                                </div>

                                <div className="border-t pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gray-900">自定义模型</h3>
                                        <button
                                            type="button"
                                            onClick={handleAddCustomModel}
                                            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                                        >
                                            增加新模型
                                        </button>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-4 mb-4">
                                        <input
                                            type="text"
                                            value={newCustomModel.provider}
                                            onChange={(e) => setNewCustomModel(prev => ({ ...prev, provider: e.target.value }))}
                                            placeholder="Provider"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <input
                                            type="password"
                                            value={newCustomModel.apiKey}
                                            onChange={(e) => setNewCustomModel(prev => ({ ...prev, apiKey: e.target.value }))}
                                            placeholder="API Key"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <input
                                            type="text"
                                            value={newCustomModel.model}
                                            onChange={(e) => setNewCustomModel(prev => ({ ...prev, model: e.target.value }))}
                                            placeholder="Model Name"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <input
                                            type="text"
                                            value={newCustomModel.endpoint}
                                            onChange={(e) => setNewCustomModel(prev => ({ ...prev, endpoint: e.target.value }))}
                                            placeholder="Endpoint(可选)"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        {customModels.map((item) => (
                                            <div key={item.id} className="grid gap-3 md:grid-cols-4 p-4 border rounded-lg bg-gray-50">
                                                <input
                                                    type="text"
                                                    value={item.provider}
                                                    onChange={(e) => handleUpdateCustomModel(item.id, 'provider', e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <input
                                                    type="password"
                                                    value={item.apiKey}
                                                    onChange={(e) => handleUpdateCustomModel(item.id, 'apiKey', e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <input
                                                    type="text"
                                                    value={item.model}
                                                    onChange={(e) => handleUpdateCustomModel(item.id, 'model', e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={item.endpoint || ''}
                                                        onChange={(e) => handleUpdateCustomModel(item.id, 'endpoint', e.target.value)}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                        placeholder="Endpoint(可选)"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveCustomModel(item.id)}
                                                        className="px-3 py-2 text-sm text-red-600 hover:text-red-800"
                                                    >
                                                        删除
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {customModels.length === 0 && (
                                            <div className="text-sm text-gray-500">暂无自定义模型</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold mb-4">
                                        <FormattedMessage id="admin.settings.ads.title" defaultMessage="广告设置" />
                                    </h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <FormattedMessage id="admin.settings.ads.rotation_interval" defaultMessage="轮播间隔 (秒)" />
                                        </label>
                                        <input
                                            type="number"
                                            name="ad_rotation_interval"
                                            value={settings.ad_rotation_interval}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            官网下载链接（开始使用/立即下载共用）
                                        </label>
                                        <input
                                            type="url"
                                            name="landing_download_url"
                                            value={settings.landing_download_url}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="https://example.com/Jarvis-Setup-1.0.1.exe"
                                        />
                                    </div>
                                    <div className="mt-6 border-t pt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                                        <input
                                            type="text"
                                            name="smtp_host"
                                            value={settings.smtp_host}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="smtp.qq.com"
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
                                                <input
                                                    type="number"
                                                    name="smtp_port"
                                                    value={settings.smtp_port}
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Secure</label>
                                                <input
                                                    type="text"
                                                    name="smtp_secure"
                                                    value={settings.smtp_secure}
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="true or false"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">SMTP User</label>
                                                <input
                                                    type="text"
                                                    name="smtp_user"
                                                    value={settings.smtp_user}
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="your_mail@example.com"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Pass</label>
                                                <input
                                                    type="password"
                                                    name="smtp_pass"
                                                    value={settings.smtp_pass}
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="mail app password"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
                                                <input
                                                    type="text"
                                                    name="smtp_from"
                                                    value={settings.smtp_from}
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="noreply@example.com"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                                                <input
                                                    type="text"
                                                    name="smtp_from_name"
                                                    value={settings.smtp_from_name}
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="JarvisAI"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 pt-6 border-t flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {saving ? <FormattedMessage id="admin.settings.btn.saving" defaultMessage="保存中..." /> : <FormattedMessage id="admin.settings.btn.save" defaultMessage="保存设置" />}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
