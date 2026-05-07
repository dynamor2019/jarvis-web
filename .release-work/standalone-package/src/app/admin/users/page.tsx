// [CodeGuard Feature Index]
// - Admin users hide trial mode checkbox while keeping data fields -> line 256
// [/CodeGuard Feature Index]

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useIntl, FormattedMessage } from 'react-intl';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';

interface User {
  id: string;
  email: string;
  username: string;
  name: string | null;
  role: string;
  balance: number;
  tokenBalance: number;
  trafficTokenBalance: number;
  subscriptionTokenBalance: number;
  licenseType: string;
  subscriptionEnd: string | null;
  totalSpent: number;
  isActive: boolean;
  userType: string;
  age: number | null;
  gender: string | null;
  profession: string | null;
  industry: string | null;
  education: string | null;
  province: string | null;
  city: string | null;
  phone: string | null;
  tags: string | null;
  source: string | null;
  loginCount: number;
  lastLoginAt: string | null;
  createdAt: string;
  _count: {
    transactions: number;
    usageRecords: number;
  };
}

const columnHelper = createColumnHelper<User>();

export default function UsersManagementPage() {
  const router = useRouter();
  const intl = useIntl();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [licenseFilter, setLicenseFilter] = useState<'all' | 'subscription' | 'buyout' | 'pro' | 'trial'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
  }, [mounted]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      if (response.status === 401 || response.status === 403) {
        router.push('/login');
        return;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data.users && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (error) {
      setLoadError(error instanceof Error && error.name === 'AbortError' ? '用户列表加载超时，请刷新重试' : '用户列表加载失败，请刷新重试');
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!mounted) return;
    loadUsers();
  }, [mounted, loadUsers]);

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, ...updates }),
      });

      const data = await response.json();
      if (data.success) {
        alert(intl.formatMessage({ id: 'admin.features.alert.update_success' }));
        setShowEditModal(false);
        setSelectedUser(null);
        loadUsers();
      } else {
        alert(data.error || intl.formatMessage({ id: 'admin.features.alert.update_failed' }));
      }
    } catch (error) {
      
      alert(intl.formatMessage({ id: 'admin.features.alert.update_failed' }));
    }
  };

  const handleQuickUserTypeChange = useCallback(async (userId: string, userType: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, userType }),
      });
      const data = await response.json();
      if (data.success) {
        setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, userType } : user)));
      } else {
        alert(data.error || '更新用户类型失败');
      }
    } catch {
      alert('更新用户类型失败');
    }
  }, []);

  const handleQuickLicenseTypeChange = useCallback(async (userId: string, licenseType: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, licenseType }),
      });
      const data = await response.json();
      if (data.success) {
        setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, licenseType } : user)));
      } else {
        alert(data.error || '更新用户模式失败');
      }
    } catch {
      alert('更新用户模式失败');
    }
  }, []);

  const handleDeleteUser = useCallback(async (userId: string) => {
    if (!confirm(intl.formatMessage({ id: 'admin.features.alert.delete_confirm' }))) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        alert(intl.formatMessage({ id: 'admin.features.alert.delete_success' }));
        loadUsers();
      } else {
        alert(data.error || intl.formatMessage({ id: 'admin.features.alert.update_failed' }));
      }
    } catch (error) {
      
      alert(intl.formatMessage({ id: 'admin.features.alert.update_failed' }));
    }
  }, [loadUsers, intl]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (statusFilter === 'active' && !user.isActive) return false;
      if (statusFilter === 'inactive' && user.isActive) return false;
      if (licenseFilter === 'all') return true;

      const current = (user.licenseType || 'trial').toLowerCase();
      if (licenseFilter === 'subscription') return current === 'subscription';
      if (licenseFilter === 'pro') return current === 'lifetime_pro';
      if (licenseFilter === 'buyout') {
        return current === 'lifetime' || current === 'lifetime_personal';
      }
      if (licenseFilter === 'trial') {
        return current === 'trial' || current === 'monthly' || current === '';
      }
      return true;
    });
  }, [users, statusFilter, licenseFilter]);

  const columns = useMemo<ColumnDef<User, any>[]>(
    () => [
      columnHelper.accessor('username', {
        header: intl.formatMessage({ id: 'admin.users.table.user_info' }),
        cell: (info) => (
          <div>
            <div className="font-medium text-gray-900">{info.getValue()}</div>
            <div className="text-sm text-gray-500">{info.row.original.email}</div>
            {info.row.original.phone && (
              <div className="text-xs text-gray-400">{info.row.original.phone}</div>
            )}
            <button
              onClick={() => {
                setSelectedUser(info.row.original);
                setShowEditModal(true);
              }}
              className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
            >
              编辑
            </button>
          </div>
        ),
      }),
      columnHelper.accessor('userType', {
        header: intl.formatMessage({ id: 'admin.users.table.type' }),
        cell: (info) => (
          <select
            value={info.getValue() || 'real'}
            onChange={(e) => handleQuickUserTypeChange(info.row.original.id, e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white"
          >
            <option value="real">真实用户</option>
            <option value="virtual">虚拟用户</option>
          </select>
        ),
      }),
      columnHelper.display({
        id: 'licenseModeControl',
        header: '用户模式',
        cell: (info) => {
          const value = (info.row.original.licenseType || 'trial').toLowerCase();
          const userId = info.row.original.id;
          const isTrial = value === 'trial' || value === 'monthly' || value === '';
          const isSubscription = value === 'subscription';
          const isBuyout = value === 'lifetime' || value === 'lifetime_personal';
          const isPro = value === 'lifetime_pro';
          return (
            <div className="flex flex-wrap gap-2 text-xs">
              <label className="inline-flex items-center gap-1 cursor-pointer" style={{ display: 'none' }}>
                <input type="checkbox" checked={isTrial} onChange={() => handleQuickLicenseTypeChange(userId, 'trial')} />
                <span>普通(流量)</span>
              </label>
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={isSubscription} onChange={() => handleQuickLicenseTypeChange(userId, 'subscription')} />
                <span>订阅</span>
              </label>
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={isBuyout} onChange={() => handleQuickLicenseTypeChange(userId, 'lifetime_personal')} />
                <span>买断</span>
              </label>
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={isPro} onChange={() => handleQuickLicenseTypeChange(userId, 'lifetime_pro')} />
                <span>PRO</span>
              </label>
            </div>
          );
        },
      }),
      columnHelper.accessor('createdAt', {
        header: intl.formatMessage({ id: 'admin.users.table.registered' }),
        cell: (info) => new Date(info.getValue()).toLocaleDateString('zh-CN'),
      }),
      columnHelper.accessor('profession', {
        header: intl.formatMessage({ id: 'admin.users.table.profession' }),
        cell: (info) => (
          <div>
            <div className="text-sm">{info.getValue() || '-'}</div>
            {info.row.original.industry && (
              <div className="text-xs text-gray-500">{info.row.original.industry}</div>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('industry', {
        header: '行业',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('city', {
        header: intl.formatMessage({ id: 'admin.users.table.region' }),
        cell: (info) => {
          const province = info.row.original.province;
          const city = info.getValue();
          if (!province && !city) return '-';
          return (
            <div className="text-sm">
              {province && province !== city ? `${province} ` : ''}
              {city || ''}
            </div>
          );
        },
      }),
      columnHelper.accessor('age', {
        header: intl.formatMessage({ id: 'admin.users.table.age' }),
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('role', {
        header: intl.formatMessage({ id: 'admin.users.table.role' }),
        cell: (info) => (
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              info.getValue() === 'admin'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {info.getValue() === 'admin' ? 
              <FormattedMessage id="admin.users.role.admin" defaultMessage="管理员" /> : 
              <FormattedMessage id="admin.users.role.user" defaultMessage="用户" />}
          </span>
        ),
      }),
      columnHelper.accessor('licenseType', {
        header: '用户模式',
        cell: (info) => {
          const value = (info.getValue() || '').toLowerCase();
          if (value === 'subscription') return '订阅';
          if (value === 'lifetime_pro') return '买断 Pro';
          if (value === 'lifetime_personal' || value === 'lifetime') return '买断';
          return '普通';
        },
      }),
      columnHelper.accessor('tokenBalance', {
        header: intl.formatMessage({ id: 'admin.users.table.token_balance' }),
        cell: (info) => {
          const row = info.row.original;
          const trafficBalance = row.trafficTokenBalance || 0;
          const subscriptionBalance = row.subscriptionTokenBalance || 0;
          const isSubscription = row.licenseType === 'subscription';
          return (
            <div className="text-sm leading-5">
              <div className="font-semibold text-gray-900">{(trafficBalance + subscriptionBalance).toLocaleString()}</div>
              <div className="flex items-center gap-1 text-green-700">
                <span>*</span>
                <span>流量 {trafficBalance.toLocaleString()}</span>
              </div>
              <div className={`flex items-center gap-1 ${isSubscription ? 'text-green-700' : 'text-gray-500'}`}>
                <span>*</span>
                <span>订阅 {subscriptionBalance.toLocaleString()}</span>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('totalSpent', {
        header: intl.formatMessage({ id: 'admin.users.table.total_spent' }),
        cell: (info) => `¥${info.getValue().toFixed(2)}`,
      }),
      columnHelper.accessor('_count.transactions', {
        header: intl.formatMessage({ id: 'admin.users.table.transactions' }),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('loginCount', {
        header: intl.formatMessage({ id: 'admin.users.table.login_count' }),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('lastLoginAt', {
        header: '最近活跃',
        cell: (info) => {
          const value = info.getValue();
          if (!value) return '-';
          try {
            return new Date(value).toLocaleString('zh-CN');
          } catch {
            return '-';
          }
        },
      }),
      columnHelper.accessor('tags', {
        header: intl.formatMessage({ id: 'admin.users.table.tags' }),
        cell: (info) => {
          const tags = info.getValue();
          if (!tags) return '-';
          try {
            const tagArray = JSON.parse(tags);
            return (
              <div className="flex flex-wrap gap-1">
                {tagArray.slice(0, 2).map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 text-xs bg-indigo-100 text-indigo-800 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {tagArray.length > 2 && (
                  <span className="text-xs text-gray-500">+{tagArray.length - 2}</span>
                )}
              </div>
            );
          } catch {
            return '-';
          }
        },
      }),
      columnHelper.accessor('isActive', {
        header: intl.formatMessage({ id: 'admin.users.table.status' }),
        cell: (info) => (
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              info.getValue()
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {info.getValue() ? 
              intl.formatMessage({ id: 'admin.users.status.active' }) : 
              intl.formatMessage({ id: 'admin.users.status.disabled' })}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: intl.formatMessage({ id: 'admin.features.table.actions' }),
        cell: (info) => (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedUser(info.row.original);
                setShowEditModal(true);
              }}
              className="text-blue-600 hover:text-blue-900 text-sm"
            >
              <FormattedMessage id="admin.users.action.edit" defaultMessage="编辑" />
            </button>
            <button
              onClick={() => handleDeleteUser(info.row.original.id)}
              className="text-red-600 hover:text-red-900 text-sm"
            >
              <FormattedMessage id="admin.users.action.delete" defaultMessage="删除" />
            </button>
            <button
              onClick={() => { setSelectedUser(info.row.original); setShowPwdModal(true); }}
              className="text-amber-600 hover:text-amber-900 text-sm"
            >
              <FormattedMessage id="admin.users.action.set_pwd" defaultMessage="重设初始密码" />
            </button>
          </div>
        ),
      }),
    ],
    [handleDeleteUser, handleQuickLicenseTypeChange, handleQuickUserTypeChange, handleUpdateUser, intl]
  );

  const table = useReactTable({
    data: filteredUsers,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
      columnOrder: [
        'username',
        'isActive',
        'licenseModeControl',
        'industry',
        'tokenBalance',
        'lastLoginAt',
        'actions',
        'userType',
        'createdAt',
        'profession',
        'city',
        'age',
        'role',
        'licenseType',
        'totalSpent',
        '_count_transactions',
        'loginCount',
        'tags',
      ],
      columnVisibility: {
        userType: false,
        createdAt: false,
        profession: false,
        city: false,
        age: false,
        role: false,
        licenseType: false,
        totalSpent: false,
        '_count.transactions': false,
        loginCount: false,
        tags: false,
      },
    },
  });

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl"><FormattedMessage id="common.loading" defaultMessage="加载中..." /></div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="text-lg font-semibold text-gray-900 mb-3">{loadError}</div>
          <button onClick={loadUsers} className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
            重试
          </button>
        </div>
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
              <h1 className="text-3xl font-bold text-gray-900"><FormattedMessage id="admin.users.title" defaultMessage="用户管理" /></h1>
              <p className="text-gray-600 mt-1"><FormattedMessage id="admin.users.subtitle" defaultMessage="管理所有用户账号" /></p>
            </div>
            <Link href="/admin" prefetch={false} className="px-4 py-2 text-gray-600 hover:text-gray-900">
              <FormattedMessage id="admin.back" defaultMessage="← 返回管理后台" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-3xl font-bold text-gray-900">{users.length}</div>
            <div className="text-sm text-gray-600 mt-1"><FormattedMessage id="admin.users.stats.total" defaultMessage="总用户数" /></div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-3xl font-bold text-blue-500">
              {users.filter((u) => u.userType === 'real').length}
            </div>
            <div className="text-sm text-gray-600 mt-1"><FormattedMessage id="admin.users.stats.real" defaultMessage="真实用户" /></div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-3xl font-bold text-orange-500">
              {users.filter((u) => u.userType === 'virtual').length}
            </div>
            <div className="text-sm text-gray-600 mt-1"><FormattedMessage id="admin.users.stats.virtual" defaultMessage="虚拟用户" /></div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-3xl font-bold text-green-500">
              {users.filter((u) => u.isActive).length}
            </div>
            <div className="text-sm text-gray-600 mt-1"><FormattedMessage id="admin.users.stats.active" defaultMessage="活跃用户" /></div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-3xl font-bold text-purple-500">
              {users.filter((u) => u.role === 'admin').length}
            </div>
            <div className="text-sm text-gray-600 mt-1"><FormattedMessage id="admin.users.stats.admin" defaultMessage="管理员" /></div>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow flex gap-3 items-center">
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={intl.formatMessage({ id: 'admin.users.search_placeholder' })}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="all">全部状态</option>
            <option value="active">仅启用</option>
            <option value="inactive">仅禁用</option>
          </select>
          <select
            value={licenseFilter}
            onChange={(e) =>
              setLicenseFilter(e.target.value as 'all' | 'subscription' | 'buyout' | 'pro' | 'trial')
            }
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="all">全部授权</option>
            <option value="trial">流量用户</option>
            <option value="subscription">订阅用户</option>
            <option value="buyout">买断用户</option>
            <option value="pro">PRO 用户</option>
          </select>
          <button
            onClick={loadUsers}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FormattedMessage id="admin.features.btn.refresh" defaultMessage="刷新" />
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-2">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: ' 🔼',
                            desc: ' 🔽',
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 whitespace-nowrap text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">
                <FormattedMessage 
                  id="admin.pagination.page_info" 
                  defaultMessage="第 {current} 页，共 {total} 页"
                  values={{ page: table.getState().pagination.pageIndex + 1, current: table.getState().pagination.pageIndex + 1, total: table.getPageCount() }}
                />
              </span>
              <span className="text-sm text-gray-500">
                <FormattedMessage 
                  id="admin.pagination.total_records" 
                  defaultMessage="（共 {count} 条记录）"
                  values={{ total: table.getFilteredRowModel().rows.length, count: table.getFilteredRowModel().rows.length }}
                />
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {'<<'}
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {'<'}
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {'>'}
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {'>>'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSave={handleUpdateUser}
        />
      )}
      {showPwdModal && selectedUser && (
        <SetPasswordModal
          user={selectedUser}
          onClose={() => { setShowPwdModal(false); setSelectedUser(null); }}
          onSave={() => handleUpdateUser(selectedUser.id, { phone: selectedUser.phone, resetPasswordByPhone: true })}
        />
      )}
    </div>
  );
}

// Edit User Modal Component
function EditUserModal({
  user,
  onClose,
  onSave,
}: {
  user: User;
  onClose: () => void;
  onSave: (userId: string, updates: Partial<User>) => void;
}) {
  const intl = useIntl();
  const [formData, setFormData] = useState({
    name: user.name || '',
    role: user.role,
    balance: user.balance,
    tokenBalance: user.tokenBalance,
    trafficTokenBalance: user.trafficTokenBalance ?? 0,
    subscriptionTokenBalance: user.subscriptionTokenBalance ?? 0,
    licenseType: user.licenseType || 'trial',
    isActive: user.isActive,
    userType: user.userType,
    age: user.age || '',
    gender: user.gender || '',
    profession: user.profession || '',
    industry: user.industry || '',
    education: user.education || '',
    province: user.province || '',
    city: user.city || '',
    phone: user.phone || '',
    tags: user.tags || '',
    source: user.source || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextTraffic = Number(formData.trafficTokenBalance) || 0;
    const nextSubscription = Number(formData.subscriptionTokenBalance) || 0;
    const updates = {
      ...formData,
      trafficTokenBalance: nextTraffic,
      subscriptionTokenBalance: nextSubscription,
      tokenBalance: nextTraffic + nextSubscription,
      age: formData.age === '' ? null : Number(formData.age),
    } as Partial<User>;
    onSave(user.id, updates);
  };

  const isBuyout =
    formData.licenseType === 'lifetime' ||
    formData.licenseType === 'lifetime_personal' ||
    formData.licenseType === 'lifetime_pro';
  const isProBuyout = formData.licenseType === 'lifetime_pro';
  const isSubscription = formData.licenseType === 'subscription';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4"><FormattedMessage id="admin.users.edit.title" defaultMessage="编辑用户" /></h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FormattedMessage id="admin.users.field.username" defaultMessage="用户名" />
            </label>
            <input
              type="text"
              value={user.username}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FormattedMessage id="admin.users.field.email" defaultMessage="邮箱" />
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FormattedMessage id="admin.users.field.nickname" defaultMessage="昵称" />
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FormattedMessage id="admin.users.field.role" defaultMessage="角色" />
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">{intl.formatMessage({ id: 'admin.users.role.user', defaultMessage: '用户' })}</option>
              <option value="admin">{intl.formatMessage({ id: 'admin.users.role.admin', defaultMessage: '管理员' })}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FormattedMessage id="admin.users.field.balance" defaultMessage="余额" />
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) =>
                setFormData({ ...formData, balance: parseFloat(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="rounded-lg border border-gray-200 p-4 space-y-3 md:col-span-2">
            <div className="text-sm font-semibold text-gray-800">Token余额明细</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">流量余额</label>
                <input
                  type="number"
                  min={0}
                  value={formData.trafficTokenBalance}
                  onChange={(e) =>
                    setFormData({ ...formData, trafficTokenBalance: Math.max(0, Number(e.target.value) || 0) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">订阅余额</label>
                <input
                  type="number"
                  min={0}
                  value={formData.subscriptionTokenBalance}
                  onChange={(e) =>
                    setFormData({ ...formData, subscriptionTokenBalance: Math.max(0, Number(e.target.value) || 0) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Token总余额：<span className="font-semibold text-gray-900">{((Number(formData.trafficTokenBalance) || 0) + (Number(formData.subscriptionTokenBalance) || 0)).toLocaleString()}</span>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 space-y-3 md:col-span-2">
            <div className="text-sm font-semibold text-gray-800">授权控制</div>
            <div className="flex flex-wrap items-center gap-6">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isBuyout}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, licenseType: isProBuyout ? 'lifetime_pro' : 'lifetime_personal' });
                      return;
                    }
                    setFormData({ ...formData, licenseType: isSubscription ? 'subscription' : 'trial' });
                  }}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                买断权限
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isProBuyout}
                  disabled={!isBuyout}
                  onChange={(e) =>
                    setFormData({ ...formData, licenseType: e.target.checked ? 'lifetime_pro' : 'lifetime_personal' })
                  }
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50"
                />
                Pro权限
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isSubscription}
                  disabled={isBuyout}
                  onChange={(e) =>
                    setFormData({ ...formData, licenseType: e.target.checked ? 'subscription' : 'trial' })
                  }
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50"
                />
                订阅
              </label>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-500">*</span>
                <span className="text-gray-700">流量</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={isSubscription ? 'text-green-500' : 'text-gray-400'}>*</span>
                <span className="text-gray-700">订阅</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FormattedMessage id="admin.users.field.age" defaultMessage="年龄" />
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={intl.formatMessage({ id: 'admin.users.field.age', defaultMessage: '年龄' })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FormattedMessage id="admin.users.field.gender" defaultMessage="性别" />
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{intl.formatMessage({ id: 'admin.users.option.not_set', defaultMessage: '未设置' })}</option>
                <option value="male">{intl.formatMessage({ id: 'admin.users.option.male', defaultMessage: '男' })}</option>
                <option value="female">{intl.formatMessage({ id: 'admin.users.option.female', defaultMessage: '女' })}</option>
                <option value="other">{intl.formatMessage({ id: 'admin.users.option.other', defaultMessage: '其他' })}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FormattedMessage id="admin.users.field.education" defaultMessage="学历" />
              </label>
              <select
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{intl.formatMessage({ id: 'admin.users.option.not_set', defaultMessage: '未设置' })}</option>
                <option value="high_school">{intl.formatMessage({ id: 'admin.users.option.high_school', defaultMessage: '高中' })}</option>
                <option value="bachelor">{intl.formatMessage({ id: 'admin.users.option.bachelor', defaultMessage: '本科' })}</option>
                <option value="master">{intl.formatMessage({ id: 'admin.users.option.master', defaultMessage: '硕士' })}</option>
                <option value="doctor">{intl.formatMessage({ id: 'admin.users.option.doctor', defaultMessage: '博士' })}</option>
                <option value="other">{intl.formatMessage({ id: 'admin.users.option.other', defaultMessage: '其他' })}</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FormattedMessage id="admin.users.field.profession" defaultMessage="专业/职业" />
            </label>
            <input
              type="text"
              value={formData.profession}
              onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={intl.formatMessage({ id: 'admin.users.placeholder.profession', defaultMessage: '如：软件工程师、研究生等' })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FormattedMessage id="admin.users.field.industry" defaultMessage="行业" />
            </label>
            <input
              type="text"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={intl.formatMessage({ id: 'admin.users.placeholder.industry', defaultMessage: '如：IT互联网、教育培训等' })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FormattedMessage id="admin.users.field.province" defaultMessage="省份" />
              </label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={intl.formatMessage({ id: 'admin.users.placeholder.province', defaultMessage: '如：广东省' })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FormattedMessage id="admin.users.field.city" defaultMessage="城市" />
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={intl.formatMessage({ id: 'admin.users.placeholder.city', defaultMessage: '如：北京市' })}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FormattedMessage id="admin.users.field.phone" defaultMessage="手机号" />
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="138****1234"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FormattedMessage id="admin.users.field.source" defaultMessage="用户来源" />
            </label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{intl.formatMessage({ id: 'admin.users.option.not_set', defaultMessage: '未设置' })}</option>
              <option value="organic">{intl.formatMessage({ id: 'admin.users.source.organic', defaultMessage: '自然流量' })}</option>
              <option value="referral">{intl.formatMessage({ id: 'admin.users.source.referral', defaultMessage: '推荐' })}</option>
              <option value="ad">{intl.formatMessage({ id: 'admin.users.source.ad', defaultMessage: '广告' })}</option>
              <option value="social">{intl.formatMessage({ id: 'admin.users.source.social', defaultMessage: '社交媒体' })}</option>
              <option value="other">{intl.formatMessage({ id: 'admin.users.source.other', defaultMessage: '其他' })}</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FormattedMessage id="admin.users.field.tags" defaultMessage="标签（JSON数组）" />
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={intl.formatMessage({ id: 'admin.users.placeholder.tags', defaultMessage: '["学生", "论文写作"]' })}
            />
            <p className="text-xs text-gray-500 mt-1"><FormattedMessage id="admin.users.hint.tags" defaultMessage="格式：[&quot;标签1&quot;, &quot;标签2&quot;]" /></p>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              <FormattedMessage id="admin.users.field.active" defaultMessage="账号启用" />
            </label>
          </div>
          <div className="flex gap-4 mt-3 md:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FormattedMessage id="admin.users.btn.cancel" defaultMessage="取消" />
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FormattedMessage id="admin.users.btn.save" defaultMessage="保存" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SetPasswordModal({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: () => void }) {
  const phoneDigits = String(user.phone || '').replace(/\D/g, '');
  const canReset = phoneDigits.length >= 6;
  const defaultPassword = canReset ? phoneDigits.slice(-6) : '';
  const [stepConfirm, setStepConfirm] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canReset) return;
    if (!stepConfirm) {
      setStepConfirm(true);
      return;
    }
    onSave();
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4"><FormattedMessage id="admin.users.pwd.title" defaultMessage="重设初始密码" /></h3>
        <form onSubmit={submit} className="space-y-4">
          <div className="text-sm text-gray-700">
            <div>将把该用户密码重设为手机号后六位。</div>
            <div className="mt-2 text-gray-500">手机号：{user.phone || '未设置'}</div>
            <div className="mt-1 text-amber-700">初始密码：{canReset ? defaultPassword : '手机号不足6位，无法重设'}</div>
          </div>
          {stepConfirm && <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800"><FormattedMessage id="admin.users.pwd.confirm_hint" defaultMessage="请再次点击“确认设置”以完成密码重置" /></div>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg"><FormattedMessage id="admin.users.btn.cancel" defaultMessage="取消" /></button>
            <button type="submit" disabled={!canReset} className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg disabled:opacity-50">
              {stepConfirm ? <FormattedMessage id="admin.users.pwd.btn.confirm" defaultMessage="确认设置" /> : <FormattedMessage id="admin.users.pwd.btn.set" defaultMessage="设置密码" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
