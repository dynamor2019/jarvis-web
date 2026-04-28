'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type AdminTicket = {
  id: string;
  title: string;
  category: string;
  content: string;
  status: string;
  adminReply: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    email: string;
    name: string | null;
  };
};

const STATUS_OPTIONS = [
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' },
];

const CATEGORY_LABEL: Record<string, string> = {
  payment: '支付问题',
  subscription: '订阅问题',
  account: '账号问题',
  other: '其他问题',
};

export default function AdminTicketsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});

  const fetchTickets = useCallback(async (token: string) => {
    const query = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
    const response = await fetch(`/api/admin/tickets${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) {
      localStorage.removeItem('token');
      router.push('/login');
      return;
    }
    if (response.status === 403) {
      router.push('/dashboard');
      return;
    }
    if (!response.ok) throw new Error('加载工单失败');
    const data = await response.json();
    setTickets(Array.isArray(data.tickets) ? data.tickets : []);
  }, [router, statusFilter]);

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

  const handleUpdate = async (ticketId: string, status: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const reply = (replyMap[ticketId] || '').trim();
    const response = await fetch('/api/admin/tickets', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ticketId, status, reply }),
    });
    const data = await response.json();
    if (!response.ok) {
      alert(data.error || '更新失败');
      return;
    }
    setReplyMap((prev) => ({ ...prev, [ticketId]: '' }));
    await fetchTickets(token);
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
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">工单管理</h1>
            <p className="text-gray-600 mt-1">处理用户提交的客服工单</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="all">全部状态</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Link href="/admin" prefetch={false} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors">
              返回管理后台
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          {tickets.length === 0 ? (
            <div className="text-gray-500">暂无工单</div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">{ticket.title}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        用户：{ticket.user.name || ticket.user.username} ({ticket.user.email})
                      </div>
                      <div className="text-sm text-gray-500">
                        分类：{CATEGORY_LABEL[ticket.category] || ticket.category} | 创建：{new Date(ticket.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <span className="text-sm px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                      {STATUS_OPTIONS.find((s) => s.value === ticket.status)?.label || ticket.status}
                    </span>
                  </div>

                  <div className="text-gray-800 whitespace-pre-wrap">{ticket.content}</div>
                  {ticket.adminReply && (
                    <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                      <div className="text-sm font-medium text-emerald-700">已回复内容</div>
                      <div className="text-sm text-emerald-800 mt-1 whitespace-pre-wrap">{ticket.adminReply}</div>
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <select
                      defaultValue={ticket.status}
                      id={`status-${ticket.id}`}
                      className="rounded-lg border border-gray-300 px-3 py-2"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={replyMap[ticket.id] || ''}
                      onChange={(e) => setReplyMap((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                      className="md:col-span-2 rounded-lg border border-gray-300 px-3 py-2 h-20 resize-none"
                      placeholder="可填写管理员回复（可选）"
                      maxLength={2000}
                    />
                    <button
                      onClick={() => {
                        const select = document.getElementById(`status-${ticket.id}`) as HTMLSelectElement | null;
                        const status = select?.value || ticket.status;
                        handleUpdate(ticket.id, status);
                      }}
                      className="rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2"
                    >
                      保存
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

