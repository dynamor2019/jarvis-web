// [CodeGuard Feature Index]
// - use client -> line 12
// - const [totalPages, setTotalPages] = useState(1 -> line 41
// - fetchTransactions(token, page, search -> line 84
// - type="text -> line 115
// - <FormattedMessage id="admin.transactions.table.amount" defaul... -> line 152
// - transaction.paymentMethod === 'wechat' ? <FormattedMessage id... -> line 191
// - className="ml-3 relative inline-flex items-center px-4 py-2 b... -> line 235
// - </main> -> line 289
// [/CodeGuard Feature Index]

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormattedMessage, useIntl } from 'react-intl';

interface Transaction {
    id: string;
    type: string;
    amount: number;
    balance: number;
    description: string;
    createdAt: string;
    paymentMethod?: string;
    status: string;
    user: {
        username: string;
        email: string;
        name: string | null;
    }
}

type SortField = 'user' | 'time' | 'type' | 'description' | 'amount' | 'balance' | 'status';
type SortDirection = 'asc' | 'desc';

function getTimeValue(value: string) {
    return new Date(value).getTime() || 0;
}

export default function AdminTransactionsPage() {
    const router = useRouter();
    const intl = useIntl();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [limit] = useState(20);
    const [sortField, setSortField] = useState<SortField>('time');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection((direction) => direction === 'desc' ? 'asc' : 'desc');
            return;
        }
        setSortField(field);
        setSortDirection(field === 'time' ? 'desc' : 'asc');
    };

    const renderSortLabel = (field: SortField, label: string) => (
        <button
            type="button"
            onClick={() => handleSort(field)}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-900"
            title={`点击按${label}排序`}
        >
            {label}
            <span className="text-[10px]">{sortField === field ? (sortDirection === 'desc' ? '↓' : '↑') : '↕'}</span>
        </button>
    );

    const sortedTransactions = useMemo(() => {
        return [...transactions].sort((a, b) => {
            let result = 0;
            if (sortField === 'time') result = getTimeValue(a.createdAt) - getTimeValue(b.createdAt);
            if (sortField === 'amount') result = a.amount - b.amount;
            if (sortField === 'balance') result = a.balance - b.balance;
            if (sortField === 'user') result = a.user.username.localeCompare(b.user.username, 'zh-CN');
            if (sortField === 'type') result = a.type.localeCompare(b.type, 'zh-CN');
            if (sortField === 'description') result = a.description.localeCompare(b.description, 'zh-CN');
            if (sortField === 'status') result = a.status.localeCompare(b.status, 'zh-CN');
            return sortDirection === 'desc' ? -result : result;
        });
    }, [transactions, sortField, sortDirection]);

    const fetchTransactions = useCallback(async (token: string, pageNum: number, searchQuery: string) => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: pageNum.toString(),
                limit: limit.toString(),
            });
            if (searchQuery) queryParams.append('search', searchQuery);

            const response = await fetch(`/api/admin/transactions?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            
            if (response.status === 401 || response.status === 403) {
                router.push('/login');
                return;
            }
            
            if (!response.ok) throw new Error('Failed to fetch transactions');
            
            const data = await response.json();
            setTransactions(data.transactions);
            setTotalPages(data.pagination.totalPages);
        } catch (error) {
            
        } finally {
            setLoading(false);
        }
    }, [limit, router]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        
        // Debounce search
        const timer = setTimeout(() => {
            fetchTransactions(token, page, search);
        }, 500);

        return () => clearTimeout(timer);
    }, [page, search, router, fetchTransactions]);

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-bold text-gray-900">
                                <FormattedMessage id="admin.transactions.title" defaultMessage="系统交易记录" />
                            </h1>
                        </div>
                        <Link
                            href="/admin"
                            className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                        >
                            <FormattedMessage id="admin.back" defaultMessage="← 返回管理后台" />
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between">
                        <div className="relative max-w-xs w-full">
                            <input
                                type="text"
                                placeholder={intl.formatMessage({ id: 'admin.transactions.search_placeholder', defaultMessage: '搜索用户名、邮箱...' })}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <div className="absolute left-3 top-2.5 text-gray-400">🔍</div>
                        </div>
                    </div>

                    {loading && transactions.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <FormattedMessage id="admin.transactions.loading" defaultMessage="加载中..." />
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <FormattedMessage id="admin.transactions.empty" defaultMessage="暂无交易记录" />
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left">
                                                {renderSortLabel('user', '用户')}
                                            </th>
                                            <th className="px-6 py-3 text-left">
                                                {renderSortLabel('time', '时间')}
                                            </th>
                                            <th className="px-6 py-3 text-left">
                                                {renderSortLabel('type', '类型')}
                                            </th>
                                            <th className="px-6 py-3 text-left">
                                                {renderSortLabel('description', '描述')}
                                            </th>
                                            <th className="px-6 py-3 text-right">
                                                {renderSortLabel('amount', '金额')}
                                            </th>
                                            <th className="px-6 py-3 text-right">
                                                {renderSortLabel('balance', '余额')}
                                            </th>
                                            <th className="px-6 py-3 text-right">
                                                {renderSortLabel('status', '状态')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {sortedTransactions.map((transaction) => (
                                            <tr key={transaction.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{transaction.user.username}</div>
                                                    <div className="text-sm text-gray-500">{transaction.user.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(transaction.createdAt).toLocaleString('zh-CN')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        transaction.type === 'recharge' 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : transaction.type === 'consume'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {transaction.type === 'recharge' ? <FormattedMessage id="admin.transactions.type.recharge" defaultMessage="充值" /> : 
                                                         transaction.type === 'consume' ? <FormattedMessage id="admin.transactions.type.consume" defaultMessage="消费" /> : 
                                                         transaction.type === 'refund' ? <FormattedMessage id="admin.transactions.type.refund" defaultMessage="退款" /> : 
                                                         transaction.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {transaction.description}
                                                    {transaction.paymentMethod && (
                                                        <span className="ml-2 text-xs text-gray-400">
                                                            ({transaction.paymentMethod === 'alipay' ? <FormattedMessage id="admin.transactions.method.alipay" defaultMessage="支付宝" /> : 
                                                              transaction.paymentMethod === 'wechat' ? <FormattedMessage id="admin.transactions.method.wechat" defaultMessage="微信" /> : 
                                                              transaction.paymentMethod})
                                                        </span>
                                                    )}
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                                                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                    ¥{transaction.balance.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className={`text-sm ${
                                                        transaction.status === 'completed' ? 'text-green-600' :
                                                        transaction.status === 'pending' ? 'text-yellow-600' :
                                                        'text-red-600'
                                                    }`}>
                                                        {transaction.status === 'completed' ? <FormattedMessage id="admin.transactions.status.success" defaultMessage="成功" /> :
                                                         transaction.status === 'pending' ? <FormattedMessage id="admin.transactions.status.pending" defaultMessage="处理中" /> : 
                                                         <FormattedMessage id="admin.transactions.status.failed" defaultMessage="失败" />}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            <FormattedMessage id="admin.transactions.pagination.prev" defaultMessage="上一页" />
                                        </button>
                                        <button
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            <FormattedMessage id="admin.transactions.pagination.next" defaultMessage="下一页" />
                                        </button>
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                <FormattedMessage 
                                                    id="admin.transactions.pagination.info" 
                                                    defaultMessage="第 {page} 页，共 {totalPages} 页" 
                                                    values={{ page, totalPages }}
                                                />
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                <button
                                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                                    disabled={page === 1}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                                >
                                                    <span className="sr-only">Previous</span>
                                                    ←
                                                </button>
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                                    <button
                                                        key={p}
                                                        onClick={() => setPage(p)}
                                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                            page === p
                                                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={page === totalPages}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                                >
                                                    <span className="sr-only">Next</span>
                                                    →
                                                </button>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
