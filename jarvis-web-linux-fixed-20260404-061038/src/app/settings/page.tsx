// [CodeGuard Feature Index]
// - Profile/Security/API/Preferences tabs and forms -> line 74
// - Preferences language and timezone selectors -> line 489
// - Settings page data fetch and handleSave pipeline -> line 628
// [/CodeGuard Feature Index]

'use client';

import { useEffect, useState } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import { Bridge, onMessage } from '@/lib/storeBridge';

interface UserInfo {
  id: number;
  name: string;
  phone: string;
  password?: string;
  age?: string;
  gender?: string;
  profession?: string;
  industry?: string;
  education?: string;
  province?: string;
  city?: string;
  preferredLanguage?: string;
  timezone?: string;
  licenseType?: string;
  subscriptionEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ProfileFormData {
  name: string;
  phone: string;
  age: string;
  gender: string;
  profession: string;
  industry: string;
  education: string;
  province: string;
  city: string;
}

interface SecurityFormData {
  current: string;
  new: string;
  confirm: string;
}

interface PreferencesFormData {
  preferredLanguage: string;
  timezone: string;
}

interface ApiKeyConfig {
  model: string;
  apiKey: string;
  isVisible: boolean;
}

interface SavedConfig {
  model: string;
  apiKey: string;
}

interface Plugin {
  id: string;
  name: string;
  tags: string[];
}

interface LicenseItem {
  pluginId: string;
  expires: Date;
  version: string;
}

// 个人资料标签
function ProfileTab({ user, onSave, saving }: { user: UserInfo; onSave: (data: Partial<UserInfo>) => void; saving: boolean }) {
  const intl = useIntl();
  const [formData, setFormData] = useState<ProfileFormData>({
    name: user.name || '',
    phone: user.phone || '',
    age: user.age || '',
    gender: user.gender || '',
    profession: user.profession || '',
    industry: user.industry || '',
    education: user.education || '',
    province: user.province || '',
    city: user.city || '',
  });
  const [refCode, setRefCode] = useState('')
  const [refMsg, setRefMsg] = useState('')

  const applyReferral = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/referral/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: refCode })
      });

      const data = await response.json();
      if (data.success) {
        setRefMsg(intl.formatMessage({ id: 'settings.profile.referral_success', defaultMessage: '推荐码应用成功！' }));
        setTimeout(() => setRefMsg(''), 3000);
      } else {
        setRefMsg(data.error || intl.formatMessage({ id: 'settings.profile.referral_error', defaultMessage: '推荐码无效' }));
      }
    } catch (error) {
      setRefMsg(intl.formatMessage({ id: 'settings.profile.referral_network_error', defaultMessage: '网络错误，请重试' }));
    }
  };

  return (
    <div className="bg-white rounded-xl p-8 shadow-sm">
      <h2 className="text-2xl font-bold mb-6"><FormattedMessage id="settings.profile.title" defaultMessage="个人资料" /></h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="settings.profile.name" defaultMessage="姓名" /></label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="settings.profile.phone" defaultMessage="手机" /></label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="settings.profile.age" defaultMessage="年龄" /></label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="settings.profile.gender" defaultMessage="性别" /></label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
          >
            <option value="">{intl.formatMessage({ id: 'common.select', defaultMessage: '请选择' })}</option>
            <option value="male">{intl.formatMessage({ id: 'settings.profile.gender_male', defaultMessage: '男' })}</option>
            <option value="female">{intl.formatMessage({ id: 'settings.profile.gender_female', defaultMessage: '女' })}</option>
            <option value="other">{intl.formatMessage({ id: 'settings.profile.gender_other', defaultMessage: '其他' })}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="settings.profile.profession" defaultMessage="职业" /></label>
          <input
            type="text"
            value={formData.profession}
            onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="settings.profile.industry" defaultMessage="行业" /></label>
          <input
            type="text"
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="settings.profile.education" defaultMessage="学历" /></label>
          <select
            value={formData.education}
            onChange={(e) => setFormData({ ...formData, education: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
          >
            <option value="">{intl.formatMessage({ id: 'common.select', defaultMessage: '请选择' })}</option>
            <option value="high_school">{intl.formatMessage({ id: 'settings.profile.education_high_school', defaultMessage: '高中' })}</option>
            <option value="bachelor">{intl.formatMessage({ id: 'settings.profile.education_bachelor', defaultMessage: '本科' })}</option>
            <option value="master">{intl.formatMessage({ id: 'settings.profile.education_master', defaultMessage: '硕士' })}</option>
            <option value="phd">{intl.formatMessage({ id: 'settings.profile.education_phd', defaultMessage: '博士' })}</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="settings.profile.location" defaultMessage="地区" /></label>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder={intl.formatMessage({ id: 'settings.profile.province', defaultMessage: '省份' })}
              value={formData.province}
              onChange={(e) => setFormData({ ...formData, province: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
            />
            <input
              type="text"
              placeholder={intl.formatMessage({ id: 'settings.profile.city', defaultMessage: '城市' })}
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="settings.profile.referral_code" defaultMessage="推荐码" /></label>
          <div className="flex gap-2">
            <input
              type="text"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
              placeholder={intl.formatMessage({ id: 'settings.profile.referral_placeholder', defaultMessage: '输入推荐码' })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
            />
            <button
              onClick={applyReferral}
              className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#3730A3] transition-colors"
            >
              <FormattedMessage id="settings.profile.apply" defaultMessage="应用" />
            </button>
          </div>
          {refMsg && (
            <p className={`text-sm mt-1 ${refMsg.includes('成功') ? 'text-green-600' : 'text-red-600'}`}>
              {refMsg}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={() => onSave({
            name: formData.name,
            phone: formData.phone,
            age: formData.age,
            gender: formData.gender,
            profession: formData.profession,
            industry: formData.industry,
            education: formData.education,
            province: formData.province,
            city: formData.city,
          })}
          disabled={saving}
          className="px-6 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#3730A3] transition-colors disabled:opacity-50"
        >
          {saving ? <FormattedMessage id="common.saving" defaultMessage="保存中..." /> : <FormattedMessage id="common.save" defaultMessage="保存" />}
        </button>
      </div>
    </div>
  );
}

// 账户安全标签
function SecurityTab({ user, onSave, saving }: { user: UserInfo; onSave: (data: { password: string }) => void; saving: boolean }) {
  const intl = useIntl();
  const [passwords, setPasswords] = useState<SecurityFormData>({
    current: '',
    new: '',
    confirm: '',
  });

  const handleChangePassword = () => {
    if (passwords.new !== passwords.confirm) {
      alert(intl.formatMessage({ id: 'settings.security.error_password_mismatch', defaultMessage: '两次输入的密码不一致' }));
      return;
    }
    onSave({ password: passwords.new });
  };

  return (
    <div className="bg-white rounded-xl p-8 shadow-sm">
      <h2 className="text-2xl font-bold mb-6"><FormattedMessage id="settings.security.title" defaultMessage="账户安全" /></h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="settings.security.current_password" defaultMessage="当前密码" /></label>
          <input
            type="password"
            value={passwords.current}
            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="settings.security.new_password" defaultMessage="新密码" /></label>
          <input
            type="password"
            value={passwords.new}
            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="settings.security.confirm_password" defaultMessage="确认密码" /></label>
          <input
            type="password"
            value={passwords.confirm}
            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleChangePassword}
          disabled={saving}
          className="px-6 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#3730A3] transition-colors disabled:opacity-50"
        >
          {saving ? <FormattedMessage id="common.saving" defaultMessage="保存中..." /> : <FormattedMessage id="settings.security.change_password" defaultMessage="修改密码" />}
        </button>
      </div>
    </div>
  );
}

// API密钥标签
function ApiKeysTab({ user }: { user: UserInfo }) {
  const intl = useIntl();
  const [config, setConfig] = useState<ApiKeyConfig>({
    model: 'Qwen/Qwen2.5-7B-Instruct',
    apiKey: '',
    isVisible: false
  });
  const [savedConfig, setSavedConfig] = useState<SavedConfig | null>(null);
  const [msg, setMsg] = useState('');

  // 预定义模型列表
  const MODELS = [
    { id: 'Qwen/Qwen2.5-7B-Instruct', name: intl.formatMessage({ id: 'model.qwen.name', defaultMessage: 'Qwen 2.5 7B (SiliconFlow)' }), provider: 'siliconflow', desc: intl.formatMessage({ id: 'model.qwen.desc', defaultMessage: '通义千问开源版，速度快，性价比高，推荐用于一般任务' }) },
    { id: 'deepseek-ai/DeepSeek-V3', name: intl.formatMessage({ id: 'model.deepseek.name', defaultMessage: 'DeepSeek V3 (SiliconFlow)' }), provider: 'siliconflow', desc: intl.formatMessage({ id: 'model.deepseek.desc', defaultMessage: '深度求索最新模型，推理能力强，适合复杂任务' }) },
    { id: 'THUDM/glm-4-9b-chat', name: intl.formatMessage({ id: 'model.glm.name', defaultMessage: 'GLM-4 9B (SiliconFlow)' }), provider: 'siliconflow', desc: intl.formatMessage({ id: 'model.glm.desc', defaultMessage: '智谱GLM-4模型，中文理解优秀，适合中文创作' }) },
    { id: 'gpt-4o-mini', name: intl.formatMessage({ id: 'model.gpt4o.name', defaultMessage: 'GPT-4o Mini (OpenAI)' }), provider: 'openai', desc: intl.formatMessage({ id: 'model.gpt4o.desc', defaultMessage: 'OpenAI最新多模态模型，综合能力最强' }) },
    { id: 'claude-3-haiku-20240307', name: intl.formatMessage({ id: 'model.claude.name', defaultMessage: 'Claude 3 Haiku (Anthropic)' }), provider: 'anthropic', desc: intl.formatMessage({ id: 'model.claude.desc', defaultMessage: 'Anthropic Claude 3系列，安全性和逻辑性强' }) },
    { id: 'gemini-2.0-flash-exp', name: intl.formatMessage({ id: 'model.gemini.name', defaultMessage: 'Gemini 2.0 Flash (Google)' }), provider: 'gemini', desc: intl.formatMessage({ id: 'model.gemini.desc', defaultMessage: '谷歌Gemini 2.0，多模态能力强，支持多种格式' }) }
  ];

  const handleSaveKey = async () => {
    if (!config.apiKey.trim()) {
      setMsg(intl.formatMessage({ id: 'settings.apikey.error_empty', defaultMessage: '请输入API密钥' }));
      return;
    }
    try {
      const response = await fetch('/api/ai/get-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          model: config.model,
          apiKey: config.apiKey
        })
      });
      const data = await response.json();
      if (data.success) {
        setSavedConfig({ model: config.model, apiKey: config.apiKey });
        setMsg(intl.formatMessage({ id: 'settings.apikey.success', defaultMessage: 'API密钥保存成功' }));
      } else {
        setMsg(data.error || intl.formatMessage({ id: 'settings.apikey.error_save', defaultMessage: '保存失败' }));
      }
    } catch (error) {
      setMsg(intl.formatMessage({ id: 'settings.apikey.error_network', defaultMessage: '网络错误，请重试' }));
    }
  };

  useEffect(() => {
    // 加载已保存的配置
    fetch('/api/ai/get-key', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.config) {
          setSavedConfig(data.config);
          setConfig(prev => ({ ...prev, model: data.config.model }));
        }
      });
  }, []);

  return (
    <div className="bg-white rounded-xl p-8 shadow-sm">
      <h2 className="text-2xl font-bold mb-6"><FormattedMessage id="settings.apikey.title" defaultMessage="API密钥" /></h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="settings.apikey.model" defaultMessage="模型" /></label>
          <select
            value={config.model}
            onChange={(e) => setConfig({ ...config, model: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
          >
            {MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">{MODELS.find(m => m.id === config.model)?.desc}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="settings.apikey.key" defaultMessage="API密钥" /></label>
          <div className="flex gap-2">
            <input
              type={config.isVisible ? 'text' : 'password'}
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder={intl.formatMessage({ id: 'settings.apikey.placeholder', defaultMessage: '输入您的API密钥' })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setConfig({ ...config, isVisible: !config.isVisible })}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {config.isVisible ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        {savedConfig && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">
              <FormattedMessage id="settings.apikey.current_model" defaultMessage="当前模型: " />
              <span className="font-medium">{MODELS.find(m => m.id === savedConfig.model)?.name}</span>
            </p>
          </div>
        )}
      </div>

      {msg && (
        <div className={`mt-4 p-3 rounded-lg ${msg.includes('成功') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {msg}
        </div>
      )}

      <div className="flex justify-end mt-6">
        <button
          onClick={handleSaveKey}
          className="px-6 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#3730A3] transition-colors"
        >
          <FormattedMessage id="settings.apikey.save" defaultMessage="保存密钥" />
        </button>
      </div>
    </div>
  );
}

// 偏好设置标签
function PreferencesTab({ user, onSave, saving }: { user: UserInfo; onSave: (data: Partial<UserInfo>) => void; saving: boolean }) {
  const intl = useIntl();
  const [prefs, setPrefs] = useState<PreferencesFormData>({
    preferredLanguage: user.preferredLanguage || 'zh-CN',
    timezone: user.timezone || 'Asia/Shanghai',
  });

  return (
    <div className="bg-white rounded-xl p-8 shadow-sm">
      <h2 className="text-2xl font-bold mb-6"><FormattedMessage id="settings.preferences.title" defaultMessage="偏好设置" /></h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="settings.preferences.language" defaultMessage="语言" /></label>
          <select
            value={prefs.preferredLanguage}
            onChange={(e) => setPrefs({ ...prefs, preferredLanguage: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
          >
            <option value="zh-CN">{intl.formatMessage({ id: 'settings.preferences.language_zh', defaultMessage: '简体中文' })}</option>
            <option value="en-US">{intl.formatMessage({ id: 'settings.preferences.language_en', defaultMessage: 'English' })}</option>
            <option value="fr-FR">{intl.formatMessage({ id: 'settings.preferences.language_fr', defaultMessage: 'Français' })}</option>
            <option value="de-DE">{intl.formatMessage({ id: 'settings.preferences.language_de', defaultMessage: 'Deutsch' })}</option>
            <option value="es-ES">{intl.formatMessage({ id: 'settings.preferences.language_es', defaultMessage: 'Español' })}</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="settings.preferences.timezone" defaultMessage="时区" /></label>
          <select
            value={prefs.timezone}
            onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
          >
            <option value="Asia/Shanghai">{intl.formatMessage({ id: 'settings.preferences.timezone_shanghai', defaultMessage: '北京时间 (UTC+8)' })}</option>
            <option value="Asia/Tokyo">{intl.formatMessage({ id: 'settings.preferences.timezone_tokyo', defaultMessage: '东京时间 (UTC+9)' })}</option>
            <option value="America/New_York">{intl.formatMessage({ id: 'settings.preferences.timezone_newyork', defaultMessage: '纽约时间 (UTC-5/-4)' })}</option>
            <option value="Europe/London">{intl.formatMessage({ id: 'settings.preferences.timezone_london', defaultMessage: '伦敦时间 (UTC+0/+1)' })}</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={() => onSave({
            preferredLanguage: prefs.preferredLanguage,
            timezone: prefs.timezone,
          })}
          disabled={saving}
          className="px-6 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#3730A3] transition-colors disabled:opacity-50"
        >
          {saving ? <FormattedMessage id="common.saving" defaultMessage="保存中..." /> : <FormattedMessage id="common.save" defaultMessage="保存" />}
        </button>
      </div>
    </div>
  );
}

// 订阅管理标签
function SubscriptionTab({ user }: { user: UserInfo }) {
  return (
    <div className="bg-white rounded-xl p-8 shadow-sm">
      <h2 className="text-2xl font-bold mb-6"><FormattedMessage id="settings.sub.title" defaultMessage="订阅管理" /></h2>
      
      <div className="space-y-6">
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium"><FormattedMessage id="settings.sub.current_plan" defaultMessage="当前套餐" /></h3>
              <p className="text-gray-600">
                {user.licenseType === 'trial' ? <FormattedMessage id="settings.sub.plan_trial" defaultMessage="试用版" /> : 
                 user.licenseType === 'subscription' ? <FormattedMessage id="settings.sub.plan_subscription" defaultMessage="订阅版" /> : 
                 user.licenseType === 'lifetime' ? <FormattedMessage id="settings.sub.plan_lifetime" defaultMessage="终身版" /> : <FormattedMessage id="settings.sub.plan_free" defaultMessage="免费版" />}
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/store'}
              className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#3730A3] transition-colors"
            >
              <FormattedMessage id="settings.sub.upgrade" defaultMessage="升级套餐" />
            </button>
          </div>
          
          {user.subscriptionEnd && (
            <div className="text-sm text-gray-500">
              <FormattedMessage id="settings.sub.expires" defaultMessage="有效期至: " />
              {new Date(user.subscriptionEnd).toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4"><FormattedMessage id="settings.sub.benefits" defaultMessage="套餐权益" /></h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <FormattedMessage id="settings.sub.benefit_ai" defaultMessage="无限AI生成" />
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <FormattedMessage id="settings.sub.benefit_plugins" defaultMessage="插件市场访问" />
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <FormattedMessage id="settings.sub.benefit_sync" defaultMessage="云端同步" />
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <FormattedMessage id="settings.sub.benefit_support" defaultMessage="优先技术支持" />
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <FormattedMessage id="settings.sub.benefit_updates" defaultMessage="功能更新" />
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <FormattedMessage id="settings.sub.benefit_cancel_anytime" defaultMessage="随时取消" />
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const intl = useIntl();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updates: Partial<UserInfo>) => {
    if (!user) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      const data = await response.json();
      if (data.success) {
        setUser({ ...user, ...updates });
        if (typeof updates.preferredLanguage === 'string' && updates.preferredLanguage) {
          localStorage.setItem('preferredLanguage', updates.preferredLanguage);
          window.dispatchEvent(new Event('jarvis-languagechange'));
        }
        alert(intl.formatMessage({ id: 'settings.save_success', defaultMessage: '保存成功' }));
      }
    } catch (error) {
      console.error('保存用户信息失败:', error);
      alert(intl.formatMessage({ id: 'settings.save_error', defaultMessage: '保存失败' }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">{intl.formatMessage({ id: 'common.loading', defaultMessage: '加载中...' })}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">{intl.formatMessage({ id: 'common.error', defaultMessage: '加载失败' })}</div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', name: intl.formatMessage({ id: 'settings.tab.profile', defaultMessage: '个人资料' }) },
    { id: 'security', name: intl.formatMessage({ id: 'settings.tab.security', defaultMessage: '账户安全' }) },
    { id: 'apikeys', name: intl.formatMessage({ id: 'settings.tab.apikeys', defaultMessage: 'API密钥' }) },
    { id: 'preferences', name: intl.formatMessage({ id: 'settings.tab.preferences', defaultMessage: '偏好设置' }) },
    { id: 'subscription', name: intl.formatMessage({ id: 'settings.tab.subscription', defaultMessage: '订阅管理' }) },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          <FormattedMessage id="settings.title" defaultMessage="设置" />
        </h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 左侧导航 */}
          <div className="lg:w-64">
            <nav className="bg-white rounded-xl shadow-sm p-4">
              <ul className="space-y-2">
                {tabs.map(tab => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-[#4F46E5] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {tab.name}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* 右侧内容 */}
          <div className="flex-1">
            {activeTab === 'profile' && <ProfileTab user={user} onSave={handleSave} saving={saving} />}
            {activeTab === 'security' && <SecurityTab user={user} onSave={handleSave} saving={saving} />}
            {activeTab === 'apikeys' && <ApiKeysTab user={user} />}
            {activeTab === 'preferences' && <PreferencesTab user={user} onSave={handleSave} saving={saving} />}
            {activeTab === 'subscription' && <SubscriptionTab user={user} />}
          </div>
        </div>
      </div>
    </div>
  );
}
