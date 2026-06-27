'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useIntl, FormattedMessage } from 'react-intl';

interface FeatureRequest {
  id: string;
  type: 'community' | 'premium';
  title: string;
  description: string;
  category: string;
  status: string;
  upvotes: number;
  bounty: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
  _count: {
    votes: number;
    comments: number;
  };
}

export default function AdminFeaturesPage() {
  const router = useRouter();
  const intl = useIntl();

  const statusOptions = [
    { value: 'pending', label: intl.formatMessage({ id: 'admin.features.status.pending' }), color: 'bg-gray-500' },
    { value: 'in_progress', label: intl.formatMessage({ id: 'admin.features.status.in_progress' }), color: 'bg-blue-500' },
    { value: 'completed', label: intl.formatMessage({ id: 'admin.features.status.completed' }), color: 'bg-green-500' },
    { value: 'rejected', label: intl.formatMessage({ id: 'admin.features.status.rejected' }), color: 'bg-red-500' },
  ];

  const typeLabels: Record<string, string> = {
    community: intl.formatMessage({ id: 'admin.features.type.community' }),
    premium: intl.formatMessage({ id: 'admin.features.type.premium' }),
  };

  const categoryLabels: Record<string, string> = {
    ai: intl.formatMessage({ id: 'admin.features.category.ai' }),
    format: intl.formatMessage({ id: 'admin.features.category.format' }),
    theme: intl.formatMessage({ id: 'admin.features.category.theme' }),
    plugin: intl.formatMessage({ id: 'admin.features.category.plugin' }),
    other: intl.formatMessage({ id: 'admin.features.category.other' }),
  };

  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<FeatureRequest | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [mounted, setMounted] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filterType !== 'all') params.append('type', filterType);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const response = await fetch(`/api/admin/features?${params}`);
      const data = await response.json();
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    loadRequests();
  }, [loadRequests, mounted]);

  const handleUpdateStatus = async () => {
    if (!selectedRequest || !newStatus) return;

    try {
      const response = await fetch('/api/admin/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          status: newStatus,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(intl.formatMessage({ id: 'admin.features.alert.update_success' }));
        setShowStatusModal(false);
        setSelectedRequest(null);
        loadRequests();
      } else {
        alert(data.error || intl.formatMessage({ id: 'admin.features.alert.update_failed' }));
      }
    } catch (error) {
      
      alert(intl.formatMessage({ id: 'admin.features.alert.update_failed' }));
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm(intl.formatMessage({ id: 'admin.features.alert.delete_confirm' }))) return;

    try {
      const response = await fetch(`/api/admin/features?id=${requestId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        alert(intl.formatMessage({ id: 'admin.features.alert.delete_success' }));
        loadRequests();
      } else {
        alert(data.error || intl.formatMessage({ id: 'admin.features.alert.update_failed' }));
      }
    } catch (error) {
      
      alert(intl.formatMessage({ id: 'admin.features.alert.update_failed' }));
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl"><FormattedMessage id="admin.loading" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900"><FormattedMessage id="admin.features.title" defaultMessage="需求市场管理" /></h1>
              <p className="text-gray-600 mt-1"><FormattedMessage id="admin.features.subtitle" defaultMessage="管理用户提交的功能需求" /></p>
            </div>
            <Link href="/admin" prefetch={false} className="px-4 py-2 text-gray-600 hover:text-gray-900">
              <FormattedMessage id="admin.back_to_dashboard" defaultMessage="← 返回管理后台" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-3xl font-bold text-gray-900">{requests.length}</div>
            <div className="text-sm text-gray-600 mt-1"><FormattedMessage id="admin.features.stats.total" defaultMessage="总需求数" /></div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-3xl font-bold text-gray-500">
              {requests.filter((r) => r.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600 mt-1"><FormattedMessage id="admin.features.status.pending" defaultMessage="待处理" /></div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-3xl font-bold text-blue-500">
              {requests.filter((r) => r.status === 'in_progress').length}
            </div>
            <div className="text-sm text-gray-600 mt-1"><FormattedMessage id="admin.features.status.in_progress" defaultMessage="开发中" /></div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-3xl font-bold text-green-500">
              {requests.filter((r) => r.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600 mt-1"><FormattedMessage id="admin.features.status.completed" defaultMessage="已完成" /></div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="admin.features.filter.type" defaultMessage="类型" /></label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{intl.formatMessage({ id: 'admin.features.filter.all', defaultMessage: '全部' })}</option>
              <option value="community">{intl.formatMessage({ id: 'admin.features.type.community', defaultMessage: '众望所归' })}</option>
              <option value="premium">{intl.formatMessage({ id: 'admin.features.type.premium', defaultMessage: '高级定制' })}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="admin.features.filter.status" defaultMessage="状态" /></label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{intl.formatMessage({ id: 'admin.features.filter.all', defaultMessage: '全部' })}</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="ml-auto flex items-end">
            <button
              onClick={loadRequests}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FormattedMessage id="admin.features.btn.refresh" defaultMessage="刷新" />
            </button>
          </div>
        </div>

        {/* Request List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600"><FormattedMessage id="admin.loading" defaultMessage="加载中..." /></p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <FormattedMessage id="admin.features.table.title" defaultMessage="标题" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <FormattedMessage id="admin.features.filter.type" defaultMessage="类型" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <FormattedMessage id="admin.features.table.category" defaultMessage="分类" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <FormattedMessage id="admin.features.table.user" defaultMessage="用户" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <FormattedMessage id="admin.features.filter.status" defaultMessage="状态" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <FormattedMessage id="admin.features.table.data" defaultMessage="数据" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <FormattedMessage id="admin.features.table.actions" defaultMessage="操作" />
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{request.title}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">
                        {request.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          request.type === 'premium'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {typeLabels[request.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {categoryLabels[request.category]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.user.username}</div>
                      <div className="text-xs text-gray-500">{request.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full text-white ${
                          statusOptions.find((s) => s.value === request.status)?.color
                        }`}
                      >
                        {statusOptions.find((s) => s.value === request.status)?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>👍 {request.upvotes}</div>
                      <div>💬 {request._count.comments}</div>
                      {request.type === 'premium' && <div>💰 ¥{request.bounty}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setNewStatus(request.status);
                          setShowStatusModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <FormattedMessage id="admin.features.btn.edit" defaultMessage="编辑" />
                      </button>
                      <button
                        onClick={() => handleDelete(request.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FormattedMessage id="admin.features.btn.delete" defaultMessage="删除" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4"><FormattedMessage id="admin.features.modal.update_status" defaultMessage="更新需求状态" /></h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2"><FormattedMessage id="admin.features.modal.request_title" defaultMessage="需求标题" />：</p>
              <p className="font-medium">{selectedRequest.title}</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="admin.features.modal.new_status" defaultMessage="新状态" /></label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedRequest(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <FormattedMessage id="admin.features.btn.cancel" defaultMessage="取消" />
              </button>
              <button
                onClick={handleUpdateStatus}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FormattedMessage id="admin.features.btn.confirm_update" defaultMessage="确认更新" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
