// [CodeGuard Feature Index]
// - handleLogout -> line 123
// [/CodeGuard Feature Index]

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormattedMessage, useIntl } from 'react-intl';

interface User {
    id: string;
    email: string;
    username: string;
    name: string | null;
    role: string;
    balance: number;
    totalSpent: number;
    isActive: boolean;
    createdAt: string;
    _count: {
        transactions: number;
        usageRecords: number;
    };
}

interface Stats {
    totalUsers: number;
    activeUsers: number;
    totalTransactions: number;
    totalRevenue: number;
    totalUsage: number;
    totalFeatureClicks: number;
}

interface FeatureRank {
    feature: string;
    total: number;
}

export default function AdminPage() {
    const router = useRouter();
    const intl = useIntl();
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [featureRanking, setFeatureRanking] = useState<FeatureRank[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [mounted, setMounted] = useState(false);

    const fetchStats = useCallback(async (token: string) => {
        try {
            const response = await fetch('/api/admin/stats', {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.status === 403) {
                // Silently handle insufficient permissions or redirect
                // alert('权限不足，需要管理员权限'); 
                router.push('/dashboard');
                return;
            }

            if (!response.ok) {
                // throw new Error('Failed to fetch stats');
                
                return;
            }

            const data = await response.json();
            setStats(data.stats);
            setFeatureRanking(Array.isArray(data.featureRanking) ? data.featureRanking : []);
        } catch (error) {
            
        }
    }, [router]);

    const fetchUsers = useCallback(async (token: string) => {
        try {
            const response = await fetch(
                `/api/admin/users?page=${page}&search=${search}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                }
            );

            if (!response.ok) {
                 // throw new Error('Failed to fetch users');
                 
                 return;
            }

            const data = await response.json();
            setUsers(data.users);
            setTotalPages(data.pagination.totalPages);
        } catch (error) {
            
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        fetchStats(token);
        fetchUsers(token);
    }, [mounted, page, search, fetchStats, fetchUsers]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    if (!mounted || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl"><FormattedMessage id="admin.loading" defaultMessage="加载中..." /></div>
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
                            <FormattedMessage id="admin.title" defaultMessage="管理员" /><span className="gradient-text"><FormattedMessage id="admin.title.suffix" defaultMessage="后台" /></span>
                        </h1>
                        <p className="text-gray-600"><FormattedMessage id="admin.subtitle" defaultMessage="系统管理和用户监控" /></p>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/dashboard" prefetch={false} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <FormattedMessage id="admin.user_center" defaultMessage="用户中心" />
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <FormattedMessage id="admin.logout" defaultMessage="退出登录" />
                        </button>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Link href="/admin/features" prefetch={false} className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all text-left">
                        <div className="text-3xl mb-2">📝</div>
                        <div className="text-xl font-bold mb-1"><FormattedMessage id="admin.menu.market" defaultMessage="需求市场管理" /></div>
                        <div className="text-sm opacity-90"><FormattedMessage id="admin.menu.market_desc" defaultMessage="管理用户提交的功能需求" /></div>
                    </Link>
                    <Link href="/admin/users" prefetch={false} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all text-left">
                        <div className="text-3xl mb-2">👥</div>
                        <div className="text-xl font-bold mb-1"><FormattedMessage id="admin.menu.users" defaultMessage="用户管理" /></div>
                        <div className="text-sm opacity-90"><FormattedMessage id="admin.menu.users_desc" defaultMessage="查看和管理所有用户" /></div>
                    </Link>
                    <Link href="/admin/broadcast" prefetch={false} className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all text-left">
                        <div className="text-3xl mb-2">📢</div>
                        <div className="text-xl font-bold mb-1"><FormattedMessage id="admin.menu.broadcast" defaultMessage="广播管理" /></div>
                        <div className="text-sm opacity-90"><FormattedMessage id="admin.menu.broadcast_desc" defaultMessage="管理桌面广告和通知" /></div>
                    </Link>
                    <Link href="/admin/transactions" prefetch={false} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all text-left">
                        <div className="text-3xl mb-2">💰</div>
                        <div className="text-xl font-bold mb-1"><FormattedMessage id="admin.menu.transactions" defaultMessage="交易记录" /></div>
                        <div className="text-sm opacity-90"><FormattedMessage id="admin.menu.transactions_desc" defaultMessage="查看所有交易和收入" /></div>
                    </Link>
                    <Link href="/admin/tickets" prefetch={false} className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all text-left">
                        <div className="text-3xl mb-2">🎫</div>
                        <div className="text-xl font-bold mb-1">工单管理</div>
                        <div className="text-sm opacity-90">查看并处理用户提交的工单</div>
                    </Link>
                    <Link href="/admin/settings" prefetch={false} className="bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all text-left">
                        <div className="text-3xl mb-2">⚙️</div>
                        <div className="text-xl font-bold mb-1"><FormattedMessage id="admin.menu.settings" defaultMessage="系统设置" /></div>
                    <div className="text-sm opacity-90"><FormattedMessage id="admin.menu.settings_desc" defaultMessage="配置模型Key、支付和系统参数" /></div>
                </Link>
                <Link href="/admin/skills" prefetch={false} className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all text-left">
                    <div className="text-3xl mb-2">✨</div>
                    <div className="text-xl font-bold mb-1">Skill内容</div>
                    <div className="text-sm opacity-90">维护天赋点亮卡片的名称、地址和简介</div>
                </Link>
                </div>

                {/* Stats Grid */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
                        <div className="bg-white rounded-xl p-6 shadow-lg">
                            <div className="text-gray-600 text-sm mb-2"><FormattedMessage id="admin.stats.total_users" defaultMessage="总用户数" /></div>
                            <div className="text-4xl font-bold text-[#4F46E5]">{stats.totalUsers}</div>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-lg">
                            <div className="text-gray-600 text-sm mb-2"><FormattedMessage id="admin.stats.active_users" defaultMessage="活跃用户" /></div>
                            <div className="text-4xl font-bold text-[#EC4899]">{stats.activeUsers}</div>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-lg">
                            <div className="text-gray-600 text-sm mb-2"><FormattedMessage id="admin.stats.total_transactions" defaultMessage="总交易数" /></div>
                            <div className="text-4xl font-bold text-[#06B6D4]">{stats.totalTransactions}</div>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-lg">
                            <div className="text-gray-600 text-sm mb-2"><FormattedMessage id="admin.stats.total_revenue" defaultMessage="总收入" /></div>
                            <div className="text-4xl font-bold text-green-600">¥{stats.totalRevenue.toFixed(2)}</div>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-lg">
                            <div className="text-gray-600 text-sm mb-2"><FormattedMessage id="admin.stats.usage_count" defaultMessage="使用次数" /></div>
                            <div className="text-4xl font-bold text-orange-600">{stats.totalUsage}</div>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-lg">
                            <div className="text-gray-600 text-sm mb-2">功能点击总数</div>
                            <div className="text-4xl font-bold text-indigo-600">{stats.totalFeatureClicks || 0}</div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">功能使用排行榜</h2>
                        <div className="text-sm text-gray-500">Top 10</div>
                    </div>
                    {featureRanking.length === 0 ? (
                        <div className="text-sm text-gray-500">暂无同步数据</div>
                    ) : (
                        <div className="space-y-3">
                            {featureRanking.map((item, index) => (
                                <div key={`${item.feature}_${index}`} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-indigo-50 px-2 text-xs font-semibold text-indigo-700">
                                            #{index + 1}
                                        </span>
                                        <span className="text-sm font-medium text-gray-800">{item.feature}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">{item.total}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold"><FormattedMessage id="admin.users.title" defaultMessage="用户列表" /></h2>
                            <input
                                type="text"
                                placeholder={intl.formatMessage({ id: 'admin.users.search_placeholder', defaultMessage: '搜索用户...' })}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"><FormattedMessage id="admin.table.user" defaultMessage="用户" /></th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"><FormattedMessage id="admin.table.role" defaultMessage="角色" /></th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"><FormattedMessage id="admin.table.balance" defaultMessage="余额" /></th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"><FormattedMessage id="admin.table.spent" defaultMessage="消费" /></th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"><FormattedMessage id="admin.table.transactions" defaultMessage="交易" /></th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"><FormattedMessage id="admin.table.usage" defaultMessage="使用" /></th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"><FormattedMessage id="admin.table.status" defaultMessage="状态" /></th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"><FormattedMessage id="admin.table.registered" defaultMessage="注册时间" /></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-gray-900">{user.name || user.username}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                user.role === 'admin' 
                                                    ? 'bg-purple-100 text-purple-800' 
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {user.role === 'admin' ? <FormattedMessage id="admin.role.admin" defaultMessage="管理员" /> : <FormattedMessage id="admin.role.user" defaultMessage="用户" />}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            ¥{user.balance.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            ¥{user.totalSpent.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {user._count.transactions}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {user._count.usageRecords}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                user.isActive 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {user.isActive ? <FormattedMessage id="admin.status.normal" defaultMessage="正常" /> : <FormattedMessage id="admin.status.disabled" defaultMessage="禁用" />}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                            <FormattedMessage id="admin.pagination.info" defaultMessage="第 {page} 页，共 {totalPages} 页" values={{ page, totalPages }} />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FormattedMessage id="admin.pagination.prev" defaultMessage="上一页" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FormattedMessage id="admin.pagination.next" defaultMessage="下一页" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
