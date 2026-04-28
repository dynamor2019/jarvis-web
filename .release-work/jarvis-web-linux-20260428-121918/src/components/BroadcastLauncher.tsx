'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import BroadcastContainer from './BroadcastContainer';

interface Broadcast {
  id: string;
  title: string;
  content: string;
  type: 'promotion' | 'tutorial' | 'announcement' | 'service';
  imageUrl?: string;
  actionUrl?: string;
  actionText?: string;
  displayDuration: number;
}

export default function BroadcastLauncher() {
  const searchParams = useSearchParams();
  const [isWordWebView, setIsWordWebView] = useState(false);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const sseRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const byQuery = searchParams.get('wv') === '1';
    const byBridge =
      typeof window !== 'undefined' &&
      !!(window as any).chrome?.webview;
    setIsWordWebView(byQuery || byBridge);
  }, [searchParams]);

  useEffect(() => {
    if (!isWordWebView) {
      setBroadcasts([]);
    }
  }, [isWordWebView]);

  const upsertBroadcast = useCallback((incoming: Broadcast) => {
    setBroadcasts(prev => {
      const exists = prev.some(b => b.id === incoming.id);
      if (exists) {
        return prev.map(b => (b.id === incoming.id ? incoming : b));
      }
      return [incoming, ...prev];
    });
  }, []);

  const loadActiveBroadcasts = useCallback(async () => {
    try {
      const response = await fetch('/api/broadcast?action=active&audience=all', {
        cache: 'no-store',
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data?.success && Array.isArray(data.broadcasts)) {
        setBroadcasts(data.broadcasts);
      }
    } catch {
      // no-op: keep UI silent on transient fetch failures
    }
  }, []);

  useEffect(() => {
    if (!isWordWebView) return;
    loadActiveBroadcasts();
    const interval = window.setInterval(loadActiveBroadcasts, 60 * 1000);
    return () => window.clearInterval(interval);
  }, [isWordWebView, loadActiveBroadcasts]);

  useEffect(() => {
    if (!isWordWebView) return;
    const sse = new EventSource('/api/broadcast/sse');
    sseRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === 'broadcast' && payload?.broadcast) {
          upsertBroadcast(payload.broadcast as Broadcast);
        }
      } catch {
        // ignore malformed messages
      }
    };

    sse.onerror = () => {
      // Let EventSource auto-reconnect.
    };

    return () => {
      sse.close();
      sseRef.current = null;
    };
  }, [isWordWebView, upsertBroadcast]);

  if (!isWordWebView || !broadcasts.length) {
    return null;
  }

  return <BroadcastContainer broadcasts={broadcasts} />;
}
