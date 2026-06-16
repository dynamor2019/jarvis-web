'use client';

import { useState, useEffect } from 'react';

interface PromptItem {
  act: string;
  prompt: string;
  tags: string[];
}

interface SyncStats {
  existingCount: number;
  newCount: number;
  totalCount: number;
  addedCount: number;
}

interface SyncResult {
  success: boolean;
  message: string;
  timestamp: string;
  stats?: SyncStats;
  data?: PromptItem[];
  count?: number;
  lastUpdated?: string;
  skipped?: boolean;
}

export default function PromptsAdminPage() {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [adminKey, setAdminKey] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // 获取当前提示词数据
  const loadPrompts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/prompts/sync');
      const result = await response.json();
      
      if (result.success) {
        setPrompts(result.data || []);
        setSyncResult(result);
      }
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  // 手动触发同步
  const triggerSync = async (force = false) => {
    if (!adminKey) {
      alert('请输入管理员密钥');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/prompts/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force, start: 1, end: 278 }),
      });
      
      const result = await response.json();
      setSyncResult(result);
      
      if (result.success) {
        setPrompts(result.data || []);
        alert(`同步成功！新增 ${result.newCount} 个提示词，总计 ${result.count} 个`);
      } else {
        alert(`同步失败：${result.error}`);
      }
    } catch (error) {
      
      alert('同步失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 触发每周定时任务（测试用）
  const triggerWeeklySync = async () => {
    if (!adminKey) {
      alert('请输入管理员密钥');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/cron/weekly-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminKey }),
      });
      
      const result = await response.json();
      setSyncResult(result);
      
      if (result.success) {
        alert('每周同步任务执行成功！');
        await loadPrompts(); // 重新加载数据
      } else {
        alert(`每周同步失败：${result.error}`);
      }
    } catch (error) {
      
      alert('每周同步失败，请检查配置');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts();
  }, []);

  // 过滤提示词
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = !searchTerm || 
      prompt.act.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.prompt.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || 
      prompt.tags.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  // 获取所有分类
  const allCategories = Array.from(new Set(prompts.flatMap(p => p.tags))).sort();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-6">提示词管理后台</h1>
          
          {/* 管理员操作区 */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold mb-4">管理员操作</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="password"
                placeholder="管理员密钥"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => triggerSync(false)}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? '同步中...' : '检查更新'}
              </button>
              
              <button
                onClick={() => triggerSync(true)}
                disabled={loading}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
              >
                {loading ? '同步中...' : '强制同步'}
              </button>
              
              <button
                onClick={triggerWeeklySync}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? '执行中...' : '测试每周同步'}
              </button>
              
              <button
                onClick={loadPrompts}
                disabled={loading}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
              >
                刷新数据
              </button>
            </div>
          </div>

          {/* 同步结果显示 */}
          {syncResult && (
            <div className={`rounded-lg p-4 mb-6 ${syncResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <h3 className="font-semibold mb-2">
                {syncResult.success ? '✅ 同步成功' : '❌ 同步失败'}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{syncResult.message}</p>
              <p className="text-xs text-gray-500">时间: {syncResult.timestamp}</p>
              
              {syncResult.stats && (
                <div className="mt-2 text-sm">
                  <p>现有: {syncResult.stats.existingCount} | 新增: {syncResult.stats.newCount} | 总计: {syncResult.stats.totalCount}</p>
                </div>
              )}
              
              {syncResult.skipped && (
                <p className="text-sm text-yellow-600 mt-2">⏭️ 跳过更新（距离上次更新不足7天）</p>
              )}
            </div>
          )}

          {/* 搜索和过滤 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              placeholder="搜索提示词..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有分类</option>
              {allCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* 统计信息 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{prompts.length}</div>
                <div className="text-sm text-gray-600">总提示词</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{filteredPrompts.length}</div>
                <div className="text-sm text-gray-600">筛选结果</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{allCategories.length}</div>
                <div className="text-sm text-gray-600">分类数量</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {syncResult?.lastUpdated ? new Date(syncResult.lastUpdated).toLocaleDateString() : '-'}
                </div>
                <div className="text-sm text-gray-600">最后更新</div>
              </div>
            </div>
          </div>

          {/* 提示词列表 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">提示词列表 ({filteredPrompts.length})</h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-600">加载中...</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredPrompts.map((prompt, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-lg">{prompt.act}</h4>
                      <div className="flex flex-wrap gap-1">
                        {prompt.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{prompt.prompt}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}