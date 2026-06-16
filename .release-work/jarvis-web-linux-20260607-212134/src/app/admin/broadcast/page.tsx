'use client';

import { useEffect, useState, useCallback } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useIntl, FormattedMessage } from 'react-intl';

interface Broadcast {
  id: string;
  title: string;
  content: string;
  type: 'promotion' | 'tutorial' | 'announcement' | 'service';
  priority: number;
  startTime: number;
  endTime: number;
  targetAudience: 'all' | 'free' | 'paid' | 'new';
  displayDuration: number;
  imageUrl?: string;
  actionUrl?: string;
  actionText?: string;
  createdAt: number;
  createdBy: string;
  isActive: boolean;
  displayCount?: number;
  lastDisplayTime?: number;
  sendRecords?: Array<{
    timestamp: number;
    time: string;
    count: number;
  }>;
}

export default function BroadcastManagePage() {
  const intl = useIntl();
  const router = useRouter();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBroadcast, setEditingBroadcast] = useState<Broadcast | null>(null);
  const [expandedBroadcastId, setExpandedBroadcastId] = useState<string | null>(null);

  const fetchBroadcasts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/broadcast', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.broadcasts)) {
        setBroadcasts(data.broadcasts);
      } else {
        
        setBroadcasts([]);
      }
    } catch (error) {
      
      setBroadcasts([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchBroadcasts();
    // 只在组件挂载时调用一次，不需要依赖fetchBroadcasts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(intl.formatMessage({ id: 'admin.broadcast.confirm.delete', defaultMessage: '确定要删除这个广播吗？' }))) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/broadcast?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setBroadcasts(broadcasts.filter(b => b.id !== id));
      }
    } catch (error) {
      
    }
  };

  const handleToggleActive = async (broadcast: Broadcast) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/broadcast', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: broadcast.id,
          isActive: !broadcast.isActive
        })
      });

      if (response.ok) {
        const data = await response.json();
        setBroadcasts(broadcasts.map(b => 
          b.id === broadcast.id ? data.broadcast : b
        ));
      }
    } catch (error) {
      
    }
  };

  const handleSuperSend = async (broadcast: Broadcast) => {
    if (!confirm(intl.formatMessage({ id: 'admin.broadcast.alert.super_send', defaultMessage: '确定要立即发送广播"{title}"吗？' }, { title: broadcast.title }))) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'super_send',
          broadcastId: broadcast.id,
          adminOverride: true
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        alert(intl.formatMessage({ id: 'admin.broadcast.alert.super_send_success', defaultMessage: '广播发送成功' }, { count: data.sentCount || 0, audience: getAudienceLabel(broadcast.targetAudience) }));
        fetchBroadcasts();
      } else {
        alert(intl.formatMessage({ id: 'admin.broadcast.alert.super_send_failed', defaultMessage: '发送失败' }, { error: data.message || data.error || 'Unknown error' }));
      }
    } catch (error) {
      
      alert(intl.formatMessage({ id: 'admin.broadcast.alert.network_error', defaultMessage: '发送失败，请检查网络连接' }));
    }
  };

  const getTypeLabel = (type: string) => {
    const types = {
      promotion: intl.formatMessage({ id: 'admin.broadcast.type.promotion', defaultMessage: '促销' }),
      tutorial: intl.formatMessage({ id: 'admin.broadcast.type.tutorial', defaultMessage: '教程' }),
      announcement: intl.formatMessage({ id: 'admin.broadcast.type.announcement', defaultMessage: '公告' }),
      service: intl.formatMessage({ id: 'admin.broadcast.type.service', defaultMessage: '服务' })
    };
    return types[type as keyof typeof types] || type;
  };

  const getAudienceLabel = (audience: string) => {
    const audiences = {
      all: intl.formatMessage({ id: 'admin.broadcast.audience.all', defaultMessage: '所有用户' }),
      free: intl.formatMessage({ id: 'admin.broadcast.audience.free', defaultMessage: '免费用户' }),
      paid: intl.formatMessage({ id: 'admin.broadcast.audience.paid', defaultMessage: '付费用户' }),
      new: intl.formatMessage({ id: 'admin.broadcast.audience.new', defaultMessage: '新用户' })
    };
    return audiences[audience as keyof typeof audiences] || audience;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl"><FormattedMessage id="admin.broadcast.loading" defaultMessage="加载中..." /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <FormattedMessage id="admin.broadcast.title" defaultMessage="全站广播" /><span className="gradient-text"><FormattedMessage id="admin.features.title_suffix" defaultMessage="管理" /></span>
            </h1>
            <p className="text-gray-600"><FormattedMessage id="admin.broadcast.subtitle" defaultMessage="管理桌面广告和通知推送" /></p>
          </div>
          <div className="flex gap-4">
            <Link href="/admin" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <FormattedMessage id="admin.broadcast.btn.back" defaultMessage="返回后台" />
            </Link>
            <button
              onClick={() => setShowCreateModal(true)}
              className="glow-button px-6 py-2 rounded-lg"
            >
              <FormattedMessage id="admin.broadcast.btn.new" defaultMessage="发布新消息" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-gray-600 text-sm mb-2"><FormattedMessage id="admin.broadcast.stats.total" defaultMessage="总广播数" /></div>
            <div className="text-4xl font-bold text-[#4F46E5]">{broadcasts.length}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-gray-600 text-sm mb-2"><FormattedMessage id="admin.broadcast.stats.active" defaultMessage="活跃广播" /></div>
            <div className="text-4xl font-bold text-green-600">
              {broadcasts.filter(b => b.isActive && b.startTime <= Date.now() && b.endTime > Date.now()).length}
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-gray-600 text-sm mb-2"><FormattedMessage id="admin.broadcast.stats.promotion" defaultMessage="促销广播" /></div>
            <div className="text-4xl font-bold text-[#EC4899]">
              {broadcasts.filter(b => b.type === 'promotion').length}
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-gray-600 text-sm mb-2"><FormattedMessage id="admin.broadcast.stats.tutorial" defaultMessage="教程广播" /></div>
            <div className="text-4xl font-bold text-orange-600">
              {broadcasts.filter(b => b.type === 'tutorial').length}
            </div>
          </div>
        </div>

        {/* Broadcasts List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold"><FormattedMessage id="admin.broadcast.title" defaultMessage="广播列表" /></h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"><FormattedMessage id="admin.broadcast.table.title" defaultMessage="标题" /></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"><FormattedMessage id="admin.broadcast.table.type" defaultMessage="类型" /></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"><FormattedMessage id="admin.broadcast.table.audience" defaultMessage="目标用户" /></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"><FormattedMessage id="admin.broadcast.field.priority" defaultMessage="优先级" /></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"><FormattedMessage id="admin.broadcast.field.duration" defaultMessage="时长" /></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"><FormattedMessage id="admin.broadcast.table.status" defaultMessage="状态" /></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"><FormattedMessage id="admin.broadcast.table.time" defaultMessage="有效期" /></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"><FormattedMessage id="admin.broadcast.table.action" defaultMessage="操作" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {broadcasts.map((broadcast) => {
                  const isCurrentlyActive = broadcast.isActive && 
                    broadcast.startTime <= Date.now() && 
                    broadcast.endTime > Date.now();
                  const isExpanded = expandedBroadcastId === broadcast.id;
                  
                  return (
                    <React.Fragment key={broadcast.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setExpandedBroadcastId(isExpanded ? null : broadcast.id)}
                              className="text-gray-400 hover:text-gray-600"
                              title={isExpanded ? intl.formatMessage({ id: 'admin.broadcast.btn.collapse', defaultMessage: '收起' }) : intl.formatMessage({ id: 'admin.broadcast.btn.expand', defaultMessage: '展开发送记录' })}
                            >
                              {isExpanded ? '▼' : '▶'}
                            </button>
                            <div>
                              <div className="font-medium text-gray-900">{broadcast.title}</div>
                              <div className="text-sm text-gray-500 max-w-xs truncate">
                                {broadcast.content}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            broadcast.type === 'promotion' ? 'bg-pink-100 text-pink-800' :
                            broadcast.type === 'tutorial' ? 'bg-blue-100 text-blue-800' :
                            broadcast.type === 'announcement' ? 'bg-purple-100 text-purple-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {getTypeLabel(broadcast.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {getAudienceLabel(broadcast.targetAudience)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {Array.from({ length: 5 }, (_, i) => (
                              <span
                                key={i}
                                className={`text-sm ${
                                  i < broadcast.priority ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {broadcast.displayDuration}s
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            isCurrentlyActive ? 'bg-green-100 text-green-800' :
                            broadcast.isActive ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {isCurrentlyActive ? <FormattedMessage id="admin.broadcast.status.playing" defaultMessage="正在播放" /> : 
                             broadcast.isActive ? <FormattedMessage id="admin.broadcast.status.enabled" defaultMessage="已启用" /> : <FormattedMessage id="admin.broadcast.status.disabled" defaultMessage="已禁用" />}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div>
                            <FormattedMessage id="admin.broadcast.field.start_time" defaultMessage="开始" />: {new Date(broadcast.startTime).toLocaleDateString('zh-CN')}
                          </div>
                          <div>
                            <FormattedMessage id="admin.broadcast.field.end_time" defaultMessage="结束" />: {new Date(broadcast.endTime).toLocaleDateString('zh-CN')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingBroadcast(broadcast)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <FormattedMessage id="admin.broadcast.action.edit" defaultMessage="编辑" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(broadcast)}
                              className={`text-sm ${
                                broadcast.isActive ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'
                              }`}
                            >
                              {broadcast.isActive ? <FormattedMessage id="admin.broadcast.btn.disable" defaultMessage="禁用" /> : <FormattedMessage id="admin.broadcast.btn.enable" defaultMessage="启用" />}
                            </button>
                            <button
                              onClick={() => handleSuperSend(broadcast)}
                              className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                              title={intl.formatMessage({ id: 'admin.broadcast.tooltip.super_send', defaultMessage: '管理员超级权限：立即发送广告（绕过整点限制）' })}
                            >
                              <FormattedMessage id="admin.broadcast.btn.super_send" defaultMessage="🚀 立即发送" />
                            </button>
                            <button
                              onClick={() => handleDelete(broadcast.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              <FormattedMessage id="admin.broadcast.action.delete" defaultMessage="删除" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* 发送记录展开行 */}
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="space-y-2">
                              <h4 className="font-medium text-gray-900 mb-3">
                                <FormattedMessage id="admin.broadcast.records.title" defaultMessage="发送记录" values={{ count: broadcast.displayCount || 0 }} />
                              </h4>
                              {broadcast.sendRecords && broadcast.sendRecords.length > 0 ? (
                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                  {broadcast.sendRecords.map((record, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm bg-white p-2 rounded border border-gray-200">
                                      <span className="text-gray-600">
                                        <span className="font-medium text-blue-600">{record.time}</span>
                                        <span className="text-gray-400 ml-2"><FormattedMessage id="admin.broadcast.records.send" defaultMessage="发送" /></span>
                                      </span>
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                        <FormattedMessage id="admin.broadcast.records.count" defaultMessage="第 {count} 次" values={{ count: record.count }} />
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center text-gray-500 text-sm py-4">
                                  <FormattedMessage id="admin.broadcast.records.empty" defaultMessage="暂无发送记录" />
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || editingBroadcast) && (
          <BroadcastModal
            broadcast={editingBroadcast}
            onClose={() => {
              setShowCreateModal(false);
              setEditingBroadcast(null);
            }}
            onSave={() => {
              fetchBroadcasts();
              setShowCreateModal(false);
              setEditingBroadcast(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function BroadcastModal({ 
  broadcast, 
  onClose, 
  onSave 
}: { 
  broadcast: Broadcast | null; 
  onClose: () => void; 
  onSave: () => void; 
}) {
  const intl = useIntl();
  const [formData, setFormData] = useState({
    title: broadcast?.title || '',
    content: broadcast?.content || '',
    type: broadcast?.type || 'announcement',
    priority: broadcast?.priority || 3,
    startTime: broadcast ? new Date(broadcast.startTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    endTime: broadcast ? new Date(broadcast.endTime).toISOString().slice(0, 16) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    targetAudience: broadcast?.targetAudience || 'all',
    displayDuration: broadcast?.displayDuration || 30,
    imageUrl: broadcast?.imageUrl || '',
    actionUrl: broadcast?.actionUrl || '',
    actionText: broadcast?.actionText || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = '/api/broadcast';
      const method = broadcast ? 'PUT' : 'POST';
      
      const body = {
        ...formData,
        startTime: new Date(formData.startTime).getTime(),
        endTime: new Date(formData.endTime).getTime(),
        ...(broadcast && { id: broadcast.id })
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        onSave();
      } else {
        alert(intl.formatMessage({ id: 'admin.broadcast.alert.save_failed', defaultMessage: '保存失败，请重试' }));
      }
    } catch (error) {
      
      alert(intl.formatMessage({ id: 'admin.broadcast.alert.save_failed', defaultMessage: '保存失败，请重试' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-[600px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {broadcast ? <FormattedMessage id="admin.broadcast.modal.edit_title" defaultMessage="编辑广播" /> : <FormattedMessage id="admin.broadcast.modal.create_title" defaultMessage="创建广播" />}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FormattedMessage id="admin.broadcast.field.title" defaultMessage="标题 *" />
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FormattedMessage id="admin.broadcast.field.content" defaultMessage="内容 *" />
            </label>
            <textarea
              required
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FormattedMessage id="admin.broadcast.field.type" defaultMessage="类型" />
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              >
                <option value="announcement">{intl.formatMessage({ id: 'admin.broadcast.type.announcement', defaultMessage: '公告' })}</option>
                <option value="promotion">{intl.formatMessage({ id: 'admin.broadcast.type.promotion', defaultMessage: '促销' })}</option>
                <option value="tutorial">{intl.formatMessage({ id: 'admin.broadcast.type.tutorial', defaultMessage: '教程' })}</option>
                <option value="service">{intl.formatMessage({ id: 'admin.broadcast.type.service', defaultMessage: '服务' })}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FormattedMessage id="admin.broadcast.field.audience" defaultMessage="目标用户" />
              </label>
              <select
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              >
                <option value="all">{intl.formatMessage({ id: 'admin.broadcast.audience.all', defaultMessage: '所有用户' })}</option>
                <option value="free">{intl.formatMessage({ id: 'admin.broadcast.audience.free', defaultMessage: '免费用户' })}</option>
                <option value="paid">{intl.formatMessage({ id: 'admin.broadcast.audience.paid', defaultMessage: '付费用户' })}</option>
                <option value="new">{intl.formatMessage({ id: 'admin.broadcast.audience.new', defaultMessage: '新用户' })}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FormattedMessage id="admin.broadcast.field.priority" defaultMessage="优先级 (1-5)" />
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FormattedMessage id="admin.broadcast.field.duration" defaultMessage="显示时长 (秒)" />
              </label>
              <input
                type="number"
                min="10"
                max="120"
                value={formData.displayDuration}
                onChange={(e) => setFormData({ ...formData, displayDuration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FormattedMessage id="admin.broadcast.field.start_time" defaultMessage="开始时间" />
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FormattedMessage id="admin.broadcast.field.end_time" defaultMessage="结束时间" />
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FormattedMessage id="admin.broadcast.field.image_url" defaultMessage="图片URL (可选)" />
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FormattedMessage id="admin.broadcast.field.action_url" defaultMessage="操作链接 (可选)" />
              </label>
              <input
                type="url"
                value={formData.actionUrl}
                onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FormattedMessage id="admin.broadcast.field.action_text" defaultMessage="操作按钮文字 (可选)" />
              </label>
              <input
                type="text"
                value={formData.actionText}
                onChange={(e) => setFormData({ ...formData, actionText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FormattedMessage id="admin.broadcast.btn.cancel" defaultMessage="取消" />
            </button>
            <button
              type="submit"
              className="flex-1 glow-button px-4 py-2 rounded-lg"
            >
              {broadcast ? <FormattedMessage id="admin.broadcast.btn.update" defaultMessage="更新" /> : <FormattedMessage id="admin.broadcast.btn.create" defaultMessage="创建" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}