// [CodeGuard Feature Index]
// - handleSubmit -> line 77
// [/CodeGuard Feature Index]

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Ticket = {
  id: string;
  title: string;
  category: string;
  content: string;
  status: string;
  adminReply: string | null;
  createdAt: string;
  updatedAt: string;
  replies?: Array<{
    id: string;
    role: string;
    content: string;
    createdAt: string;
  }>;
};

const CATEGORY_OPTIONS = [
  { value: 'payment', label: '支付问题' },
  { value: 'subscription', label: '订阅问题' },
  { value: 'account', label: '账号问题' },
  { value: 'other', label: '其他问题' },
];

const STATUS_LABEL: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
};

export default function SupportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [form, setForm] = useState({
    title: '',
    category: 'other',
    content: '',
  });

  const fetchTickets = useCallback(async (token: string) => {
    const response = await fetch('/api/tickets', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) {
      localStorage.removeItem('token');
      router.push('/login');
      return;
    }
    if (!response.ok) throw new Error('加载工单失败');
    const data = await response.json();
    setTickets(Array.isArray(data.tickets) ? data.tickets : []);
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchTickets(token)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fetchTickets, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    if (!form.title.trim() || !form.content.trim()) {
      alert('请填写标题和问题描述');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '提交失败');
      }
      setForm({ title: '', category: 'other', content: '' });
      await fetchTickets(token);
      alert('工单已提交');
    } catch (error: any) {
      alert(error?.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">联系管理员</h1>
            <p className="text-gray-600 mt-1">提交问题后，管理员会在这里回复你</p>
          </div>
          <Link href="/dashboard" prefetch={false} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors">
            返回用户中心
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">新建工单</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm text-gray-700 mb-1">标题</label>
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="例如：订阅后无法生效"
                maxLength={80}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">问题分类</label>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">详细描述</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="请尽量描述复现步骤和报错信息"
                maxLength={2000}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? '提交中...' : '提交工单'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">我的工单</h2>
          {tickets.length === 0 ? (
            <div className="text-gray-500">暂无工单</div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="text-lg font-semibold text-gray-900">{ticket.title}</div>
                    <span className="text-sm px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                      {STATUS_LABEL[ticket.status] || ticket.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    分类：{CATEGORY_OPTIONS.find((c) => c.value === ticket.category)?.label || ticket.category} | 创建时间：
                    {new Date(ticket.createdAt).toLocaleString()}
                  </div>
                  <div className="text-gray-800 whitespace-pre-wrap">{ticket.content}</div>
                  {ticket.adminReply && (
                    <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                      <div className="text-sm font-medium text-emerald-700">管理员回复</div>
                      <div className="text-sm text-emerald-800 mt-1 whitespace-pre-wrap">{ticket.adminReply}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
