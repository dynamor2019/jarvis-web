'use client';

import { useEffect } from 'react';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const ACTION_MISMATCH_RELOAD_KEY = 'jarvis_action_mismatch_reloaded';

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    const message = String(error?.message || '');
    const isActionMismatch = message.includes('Failed to find Server Action');
    if (!isActionMismatch) return;

    try {
      const reloaded = sessionStorage.getItem(ACTION_MISMATCH_RELOAD_KEY);
      if (!reloaded) {
        sessionStorage.setItem(ACTION_MISMATCH_RELOAD_KEY, '1');
        window.location.reload();
      } else {
        sessionStorage.removeItem(ACTION_MISMATCH_RELOAD_KEY);
      }
    } catch {
      window.location.reload();
    }
  }, [error]);

  return (
    <html>
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <h2>页面需要刷新</h2>
        <p style={{ marginTop: 8 }}>检测到部署版本切换导致的请求失配，请刷新页面后重试。</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{ marginTop: 16, padding: '8px 14px', cursor: 'pointer' }}
        >
          立即刷新
        </button>
        <button
          type="button"
          onClick={() => reset()}
          style={{ marginTop: 16, marginLeft: 8, padding: '8px 14px', cursor: 'pointer' }}
        >
          重试
        </button>
      </body>
    </html>
  );
}
