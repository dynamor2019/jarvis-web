'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function QRConfirmPage() {
  return (
    <Suspense fallback={<div />}> 
      <QRConfirmContent />
    </Suspense>
  );
}

function QRConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('正在验证...');

  const confirmLogin = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/qrcode/confirm', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      const data = await res.json()
      if (data?.success) {
        setStatus('success')
        setMessage('登录已确认，请返回继续使用')
      } else {
        setStatus('error')
        setMessage(data?.error || '确认失败')
      }
    } catch (error: any) {
      setStatus('error')
      setMessage(error?.message || '确认失败')
    }
  }, [code, router])

  useEffect(() => {
    if (!code) {
      const t = setTimeout(() => {
        setStatus('error');
        setMessage('无效的二维码');
      }, 0);
      return () => clearTimeout(t);
    }

    const t2 = setTimeout(() => {
      confirmLogin();
    }, 0);
    return () => clearTimeout(t2);
  }, [code, confirmLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
      <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">验证中</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">登录成功</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">请返回Word插件继续使用</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">确认失败</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              前往登录
            </button>
          </>
        )}
      </div>
    </div>
  );
}
