'use client';

import { useEffect, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ChinaHeatmap from '@/components/ChinaHeatmap';

export default function AdminDataPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">Loading...</div>}>
      <AdminDataContent />
    </Suspense>
  );
}

function AdminDataContent() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/login');
  }, [router]);

  const handle_export = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setExporting(true);
    try {
      const response = await fetch('/api/admin/export-db', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const content_disposition = response.headers.get('Content-Disposition');
      const file_name = content_disposition?.match(/filename=\"([^\"]+)\"/)?.[1] ?? 'jarvis-db-export.json';

      anchor.href = url;
      anchor.download = file_name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export database failed:', error);
      alert('Export failed. Please confirm you are logged in as admin and try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">数据<span className="gradient-text">看板</span></h1>
            <p className="text-gray-600">仅展示真实用户分布与趋势</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handle_export}
              disabled={exporting}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? 'Exporting...' : 'Export All DB Data'}
            </button>
            <Link href="/admin" prefetch={false} className="px-4 py-2 border rounded-lg">返回管理后台</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <ChinaHeatmap source="real_user" />
        </div>
      </div>
    </div>
  );
}
