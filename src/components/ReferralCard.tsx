'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ReferralStats {
  codes: Array<{ code: string; uses: number; maxUses: number; createdAt: string; source?: string|null; note?: string|null }>;
  stats: { totalReferrals: number; totalReward: number; rewardPerReferral: number };
  referredUsers: Array<{ id: string; username: string; email: string; createdAt: string }>;
}

export default function ReferralCard() {
  const router = useRouter();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [editing, setEditing] = useState<{ code: string; source: string; note: string }|null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/referral/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setErrorMsg('');
      } else {
        if (response.status === 401) {
          setErrorMsg('登录状态已过期，请重新登录');
          router.push('/login');
        } else {
          const j = await response.json().catch(() => ({} as any));
          setErrorMsg(j?.error || '加载推荐统计失败');
        }
      }
    } catch (error) {
      
      setErrorMsg('网络错误：无法加载推荐统计');
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/referral/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        await loadStats();
        setErrorMsg('');
      } else {
        if (response.status === 401) {
          setErrorMsg('登录状态已过期，请重新登录');
          router.push('/login');
        } else {
          const j = await response.json().catch(() => ({} as any));
          setErrorMsg(j?.error || '生成推荐码失败');
        }
      }
    } catch (error) {
      
      setErrorMsg('网络错误：生成推荐码失败');
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = (code: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }).catch(() => fallbackCopy(code));
      } else {
        fallbackCopy(code);
      }
    } catch (e) {
      fallbackCopy(code);
    }
  };

  const copyLink = (code: string) => {
    const link = `${window.location.origin}/login?ref=${code}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }).catch(() => fallbackCopy(link));
      } else {
        fallbackCopy(link);
      }
    } catch (e) {
      fallbackCopy(link);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      
    }
  };

  const startEdit = (c: { code: string; source?: string|null; note?: string|null }) => {
    setEditing({ code: c.code, source: c.source || '', note: c.note || '' });
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/referral/${encodeURIComponent(editing.code)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ source: editing.source, note: editing.note }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any));
        throw new Error(j?.error || '更新失败');
      }
      setEditing(null);
      await loadStats();
    } catch (e: any) {
      setErrorMsg(e?.message || '更新失败');
    }
  };

  const deleteCode = async (code: string) => {
    if (!window.confirm('确定删除该推荐码？')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/referral/${encodeURIComponent(code)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any));
        throw new Error(j?.error || '删除失败');
      }
      await loadStats();
    } catch (e: any) {
      setErrorMsg(e?.message || '删除失败');
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-lg border border-purple-100">
      {errorMsg && (
        <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {errorMsg}
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">🎁</span>
          推荐好友
        </h3>
        {stats?.codes && stats.codes.length > 0 && (
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
            已推荐 {stats.stats.totalReferrals} 人
          </span>
        )}
      </div>

      {!stats?.codes || stats.codes.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-600 mb-4">生成你的专属推荐码，邀请好友注册</p>
          <button
            onClick={generateCode}
            disabled={generating}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 font-medium"
          >
            {generating ? '生成中...' : '🎯 生成推荐码'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 推荐码列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stats.codes.map((c) => (
              <div key={c.code} className="bg-white rounded-lg p-4 border-2 border-dashed border-purple-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500">创建时间：{new Date(c.createdAt).toLocaleString('zh-CN')}</div>
                    <code className="block mt-1 text-lg font-bold text-purple-600 break-all">
                      {c.code}
                    </code>
                    <div className="mt-1 text-xs text-gray-600">已使用 {c.uses} / {c.maxUses === 999999 ? '∞' : c.maxUses}</div>
                    {(c.source || c.note) && (
                      <div className="mt-1 text-xs text-gray-600">
                        {(c.source) ? `来源：${c.source}` : ''} {c.note ? `备注：${c.note}` : ''}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <button
                      onClick={() => copyCode(c.code)}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs"
                    >
                      {copied ? '✓ 已复制' : '📋 复制'}
                    </button>
                    <button
                      onClick={() => copyLink(c.code)}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs"
                    >
                      复制链接
                    </button>
                    <button
                      onClick={() => startEdit(c)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => deleteCode(c.code)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {editing && (
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-800 mb-2">编辑备注（{editing.code}）</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={editing.source}
                  onChange={(e) => setEditing({ ...editing, source: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="来源，例如：小红书/抖音/公众号"
                />
                <input
                  type="text"
                  value={editing.note}
                  onChange={(e) => setEditing({ ...editing, note: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="备注，例如：活动名称或投放批次"
                />
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={saveEdit} className="px-4 py-2 bg-blue-600 text-white rounded">保存</button>
                <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-200 rounded">取消</button>
              </div>
            </div>
          )}

          {/* 生成更多（最多6个，管理员不限） */}
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-2">管理推荐码</div>
            <button
              onClick={generateCode}
              disabled={generating}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors text-sm"
            >
              {generating ? '生成中...' : '生成更多'}
            </button>
          </div>

          {/* 奖励说明 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.stats.totalReward.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 mt-1">已获得Token</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-pink-600">
                {stats.stats.rewardPerReferral.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 mt-1">每人奖励</div>
            </div>
          </div>

          {/* 推荐记录 */}
          {stats.referredUsers.length > 0 && (
            <details className="bg-white rounded-lg p-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                查看推荐记录 ({stats.referredUsers.length})
              </summary>
              <div className="mt-3 space-y-2">
                {stats.referredUsers.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between text-sm py-2 border-t">
                    <span className="text-gray-700">{user.username}</span>
                    <span className="text-gray-500 text-xs">
                      {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}

          <div className="text-xs text-gray-500 text-center pt-2">
            💡 好友通过你的推荐码注册，你和好友都将获得 {stats.stats.rewardPerReferral.toLocaleString()} Token
          </div>
        </div>
      )}
    </div>
  );
}
