'use client';

import { useState } from 'react';

interface Client {
  clientId: string;
  lastIP: string;
  tokenBalance: number;
  lastSync: string;
  version: string;
  totalOperations: number;
  lastActive: string;
  lastSyncAgo: number;
}

interface DailyStat {
  date: string;
  activeClients: number;
  operations: number;
  newClients: number;
}

interface IPStat {
  ip: string;
  clientCount: number;
  firstSeen: string;
  lastSeen: string;
}

interface FunctionStat {
  function: string;
  count: number;
}

interface SyncStats {
  overview: {
    totalClients: number;
    totalOperations: number;
    activeToday: number;
    operationsToday: number;
  };
  clients: Client[];
  dailyStats: DailyStat[];
  ipStats: IPStat[];
  functionStats: FunctionStat[];
  lastUpdated: string;
}

export default function SyncAdminPage() {
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // 加载统计数据
  const loadStats = async () => {
    if (!adminKey) {
      alert('请输入管理员密钥');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/sync/stats?adminKey=${encodeURIComponent(adminKey)}`);
      
      if (response.status === 401) {
        alert('管理员密钥无效');
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      } else {
        alert(`加载失败：${result.message}`);
      }
    } catch (error) {
      
      alert('加载失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 格式化时间
  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleString('zh-CN');
  };

  // 格式化天数
  const formatDaysAgo = (days: number) => {
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    return `${days}天前`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-6">统一同步管理后台</h1>
          
          {/* 管理员认证 */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold mb-4">管理员认证</h2>
            
            <div className="flex gap-4">
              <input
                type="password"
                placeholder="管理员密钥"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <button
                onClick={loadStats}
                disabled={loading}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? '加载中...' : '加载数据'}
              </button>
            </div>
          </div>

          {stats && (
            <>
              {/* 概览统计 */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-6 text-white">
                <h2 className="text-2xl font-bold mb-4">系统概览</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{stats.overview.totalClients}</div>
                    <div className="text-sm opacity-90">总客户端数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{stats.overview.totalOperations.toLocaleString()}</div>
                    <div className="text-sm opacity-90">总操作数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{stats.overview.activeToday}</div>
                    <div className="text-sm opacity-90">今日活跃</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{stats.overview.operationsToday.toLocaleString()}</div>
                    <div className="text-sm opacity-90">今日操作</div>
                  </div>
                </div>
                <div className="text-xs opacity-75 mt-4">
                  最后更新: {formatTime(stats.lastUpdated)}
                </div>
              </div>

              {/* 标签页导航 */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                  {[
                    { id: 'clients', name: '客户端列表' },
                    { id: 'functions', name: '功能使用统计' },
                    { id: 'daily', name: '每日统计' },
                    { id: 'ips', name: 'IP统计' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>

              {/* 客户端列表 */}
              {activeTab === 'clients' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">客户端列表 ({stats.clients.length})</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客户端ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP地址</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token余额</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总操作数</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">版本</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最后同步</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stats.clients.map((client) => (
                          <tr key={client.clientId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {client.clientId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {client.lastIP}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {client.tokenBalance.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {client.totalOperations.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {client.version}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {client.lastSyncAgo !== null ? formatDaysAgo(client.lastSyncAgo) : '从未同步'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 功能使用统计 */}
              {activeTab === 'functions' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">功能使用统计 (Top 20)</h3>
                  <div className="grid gap-4">
                    {stats.functionStats.map((func, index) => (
                      <div key={func.function} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                            {index + 1}
                          </span>
                          <span className="font-medium">{func.function}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-blue-600 mr-2">{func.count.toLocaleString()}</span>
                          <span className="text-sm text-gray-500">次使用</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 每日统计 */}
              {activeTab === 'daily' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">每日统计 (最近30天)</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">活跃客户端</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作数</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">新客户端</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stats.dailyStats.map((day) => (
                          <tr key={day.date} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {day.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {day.activeClients}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {day.operations.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {day.newClients}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* IP统计 */}
              {activeTab === 'ips' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">IP统计 (Top 50)</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP地址</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客户端数量</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">首次出现</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最后出现</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stats.ipStats.map((ip) => (
                          <tr key={ip.ip} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {ip.ip}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {ip.clientCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatTime(ip.firstSeen)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatTime(ip.lastSeen)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}