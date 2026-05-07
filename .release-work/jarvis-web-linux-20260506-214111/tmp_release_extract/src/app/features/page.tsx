// [CodeGuard Feature Index]
// - Features stats cards and request CTA -> line 166
// - Request list and status badge rendering -> line 246
// - Premium modal and form submission -> line 416
// [/CodeGuard Feature Index]

'use client';

import { useState, useEffect, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import ProMonolineIcon from '@/components/ProMonolineIcon';
// 移除 framer-motion，使用基础样式过渡

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
    avatar?: string;
  };
  _count: {
    votes: number;
    comments: number;
  };
}

interface FeatureComment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
}

const categories = [
  { value: 'all', id: 'features.filter.all' },
  { value: 'ai', id: 'features.filter.ai' },
  { value: 'format', id: 'features.filter.format' },
  { value: 'theme', id: 'features.filter.theme' },
  { value: 'plugin', id: 'features.filter.plugin' },
  { value: 'other', id: 'features.filter.other' },
];

const statusMap: Record<string, { id: string; color: string }> = {
  pending: { id: 'features.status.pending', color: 'bg-gray-500' },
  in_progress: { id: 'features.status.in_progress', color: 'bg-blue-500' },
  completed: { id: 'features.status.completed', color: 'bg-green-500' },
  rejected: { id: 'features.status.rejected', color: 'bg-red-500' },
};

export default function FeaturesPage() {
  const intl = useIntl();
  const [activeTab, setActiveTab] = useState<'community' | 'premium'>('community');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('hot');
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, FeatureComment[]>>({});
  const [commentTextMap, setCommentTextMap] = useState<Record<string, string>>({});

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: activeTab,
        sortBy,
      });
      if (category !== 'all') params.append('category', category);

      const response = await fetch(`/api/features?${params}`);
      const data = await response.json();
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  }, [activeTab, category, sortBy]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleVote = useCallback(async (requestId: string) => {
    try {
      const userId = localStorage.getItem('userId') || 'demo-user-id';
      const response = await fetch(`/api/features/${requestId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (data.success) {
        loadRequests();
      }
    } catch (error) {
      
    }
  }, [loadRequests]);

  const loadComments = useCallback(async (requestId: string) => {
    try {
      const res = await fetch(`/api/features/${requestId}/comments`);
      const data = await res.json();
      if (data.success) {
        setCommentsMap(prev => ({ ...prev, [requestId]: data.comments as FeatureComment[] }));
      }
    } catch (error) {
      
    }
  }, []);

  const submitComment = useCallback(async (requestId: string) => {
    try {
      const content = commentTextMap[requestId]?.trim();
      if (!content) return;
      const userId = localStorage.getItem('userId') || 'demo-user-id';
      const res = await fetch(`/api/features/${requestId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, content }),
      });
      const data = await res.json();
      if (data.success) {
        setCommentTextMap(prev => ({ ...prev, [requestId]: '' }));
        await loadComments(requestId);
      }
    } catch (error) {
      
    }
  }, [commentTextMap, loadComments]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            <FormattedMessage id="features.title" defaultMessage="需求市场" />
          </h1>
          <p className="text-gray-600"><FormattedMessage id="features.market.subtitle" defaultMessage="让用户的声音推动产品进化" /></p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('community')}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'community'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="text-2xl mb-1">🎯</div>
            <div><FormattedMessage id="features.tab.community" defaultMessage="众望所归" /></div>
            <div className="text-sm opacity-80"><FormattedMessage id="features.tab.community.desc" defaultMessage="免费投票，点赞最高优先开发" /></div>
          </button>
          <button
            onClick={() => setActiveTab('premium')}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'premium'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="inline-flex mb-1 text-current">
              <ProMonolineIcon className="h-6 w-6" />
            </div>
            <div><FormattedMessage id="features.tab.premium" defaultMessage="高级定制" /></div>
            <div className="text-sm opacity-80"><FormattedMessage id="features.tab.premium.desc" defaultMessage="付费悬赏，金额最高优先开发" /></div>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  category === cat.value
                    ? 'bg-purple-100 text-purple-700 font-semibold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FormattedMessage id={cat.id} />
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="hot">🔥 {intl.formatMessage({ id: 'features.sort.hot', defaultMessage: '最热' })}</option>
              <option value="new">🆕 {intl.formatMessage({ id: 'features.sort.new', defaultMessage: '最新' })}</option>
              {activeTab === 'premium' && <option value="bounty">💰 {intl.formatMessage({ id: 'features.sort.bounty', defaultMessage: '悬赏最高' })}</option>}
            </select>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              <FormattedMessage id="features.action.create" defaultMessage="+ 发布需求" />
            </button>
          </div>
        </div>

        {/* Request List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600"><FormattedMessage id="common.loading" defaultMessage="加载中..." /></p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-600"><FormattedMessage id="features.msg.empty" defaultMessage="暂无需求，快来发布第一个吧！" /></p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex gap-4">
                  {/* Vote Button */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(request.id);
                      }}
                      className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 hover:from-purple-200 hover:to-blue-200 flex items-center justify-center transition-all"
                    >
                      <span className="text-2xl">👍</span>
                    </button>
                    <span className="mt-2 font-bold text-purple-600">{request.upvotes}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-800 hover:text-purple-600 transition-colors">
                        {request.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs text-white ${statusMap[request.status].color}`}>
                        <FormattedMessage id={statusMap[request.status].id} />
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-2">{request.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <span>👤</span>
                        {request.user.username}
                      </span>
                      <span className="flex items-center gap-1">
                        <span>💬</span>
                        {request._count.comments} <FormattedMessage id="features.meta.comments" defaultMessage="评论" />
                      </span>
                      <span className="flex items-center gap-1">
                        <span>📅</span>
                        {new Date(request.createdAt).toLocaleDateString(intl.locale === 'en' ? 'en-US' : 'zh-CN')}
                      </span>
                      {request.type === 'premium' && request.bounty > 0 && (
                        <span className="ml-auto flex items-center gap-1 text-orange-600 font-bold">
                          <span>💰</span>
                          ¥{request.bounty}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const target = openCommentsFor === request.id ? null : request.id;
                            setOpenCommentsFor(target);
                            if (target) loadComments(request.id);
                          }}
                          className="text-purple-600 hover:underline"
                        >
                          <FormattedMessage id="features.action.view_comments" values={{ count: request._count.comments }} />
                        </button>
                        <div className="text-xs text-gray-400">
                          👍 {request._count.votes}
                        </div>
                      </div>

                      {openCommentsFor === request.id && (
                        <div className="mt-3 space-y-3">
                          <div className="space-y-2">
                            {(commentsMap[request.id] || []).map((c) => (
                              <div key={c.id} className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                  <span>👤</span>
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm text-gray-700">
                                    <span className="font-semibold">{c.user.username}</span>
                                    <span className="ml-2 text-gray-400">{new Date(c.createdAt).toLocaleString(intl.locale === 'en' ? 'en-US' : 'zh-CN')}</span>
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    {c.content}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {commentsMap[request.id] && commentsMap[request.id].length === 0 && (
                              <div className="text-sm text-gray-400"><FormattedMessage id="features.msg.no_comments" defaultMessage="暂无评论" /></div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              value={commentTextMap[request.id] || ''}
                              onChange={(e) => setCommentTextMap(prev => ({ ...prev, [request.id]: e.target.value }))}
                              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                              placeholder={intl.formatMessage({ id: 'features.placeholder.comment', defaultMessage: '写下你的看法...' })}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                submitComment(request.id);
                              }}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                            >
                              <FormattedMessage id="features.action.post" defaultMessage="发表" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateRequestModal
          type={activeTab}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadRequests();
          }}
        />
      )}
    </div>
  );
}

// Create Request Modal Component
function CreateRequestModal({
  type,
  onClose,
  onSuccess,
}: {
  type: 'community' | 'premium';
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'ai',
    bounty: 100,
  });
  const [submitting, setSubmitting] = useState(false);
  const intl = useIntl();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert(intl.formatMessage({ id: 'features.msg.login_required', defaultMessage: '请先登录' }));
        return;
      }

      const response = await fetch('/api/features', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          ...formData,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(intl.formatMessage({ id: 'features.msg.publish_success', defaultMessage: '发布成功！' }));
        onSuccess();
      } else {
        alert(data.error || intl.formatMessage({ id: 'features.msg.publish_fail', defaultMessage: '发布失败' }));
      }
    } catch (error) {
      
      alert(intl.formatMessage({ id: 'features.msg.publish_fail', defaultMessage: '发布失败' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold mb-6">
          {type === 'community' ? 
            <FormattedMessage id="features.modal.title.community" defaultMessage="🎯 发布众望所归" /> : 
            <span className="inline-flex items-center gap-2">
              <ProMonolineIcon className="h-6 w-6 text-amber-600" />
              <FormattedMessage id="features.modal.title.premium" defaultMessage="发布高级定制" />
            </span>}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2"><FormattedMessage id="features.label.title" defaultMessage="标题" /></label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder={intl.formatMessage({ id: 'features.placeholder.title', defaultMessage: '简洁明了地描述你的需求' })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2"><FormattedMessage id="features.label.desc" defaultMessage="详细描述" /></label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 h-32"
              placeholder={intl.formatMessage({ id: 'features.placeholder.desc', defaultMessage: '详细说明功能需求、使用场景、预期效果等' })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2"><FormattedMessage id="features.label.category" defaultMessage="分类" /></label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ai">{intl.formatMessage({ id: 'features.filter.ai', defaultMessage: 'AI功能' })}</option>
              <option value="format">{intl.formatMessage({ id: 'features.filter.format', defaultMessage: '格式工具' })}</option>
              <option value="theme">{intl.formatMessage({ id: 'features.filter.theme', defaultMessage: '主题样式' })}</option>
              <option value="plugin">{intl.formatMessage({ id: 'features.filter.plugin', defaultMessage: '插件扩展' })}</option>
              <option value="other">{intl.formatMessage({ id: 'features.filter.other', defaultMessage: '其他' })}</option>
            </select>
          </div>

          {type === 'premium' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2"><FormattedMessage id="features.label.bounty" defaultMessage="悬赏金额" /></label>
              <input
                type="number"
                value={formData.bounty}
                onChange={(e) => setFormData({ ...formData, bounty: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="100"
                step="10"
                required
              />
              <p className="mt-2 text-sm text-gray-500"><FormattedMessage id="features.hint.bounty" defaultMessage="最低100元，金额越高优先级越高" /></p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
            >
              <FormattedMessage id="features.action.cancel" defaultMessage="取消" />
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {submitting ? <FormattedMessage id="features.action.publishing" defaultMessage="发布中..." /> : <FormattedMessage id="features.action.publish" defaultMessage="发布" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
