'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface BroadcastCardProps {
  id: string;
  title: string;
  content: string;
  type: 'promotion' | 'tutorial' | 'announcement' | 'service';
  imageUrl?: string;
  actionUrl?: string;
  actionText?: string;
  displayDuration: number;
  onClose?: () => void;
}

export default function BroadcastCard({
  id,
  title,
  content,
  type,
  imageUrl,
  actionUrl,
  actionText,
  displayDuration,
  onClose
}: BroadcastCardProps) {
  const [progress, setProgress] = useState(100);
  const [isClosing, setIsClosing] = useState(false);
  const [isForeground, setIsForeground] = useState(true);

  useEffect(() => {
    const syncForeground = () => {
      const visible = typeof document !== 'undefined' ? !document.hidden : true;
      const focused = typeof document !== 'undefined' ? document.hasFocus() : true;
      setIsForeground(visible && focused);
    };

    syncForeground();
    window.addEventListener('focus', syncForeground);
    window.addEventListener('blur', syncForeground);
    document.addEventListener('visibilitychange', syncForeground);

    return () => {
      window.removeEventListener('focus', syncForeground);
      window.removeEventListener('blur', syncForeground);
      document.removeEventListener('visibilitychange', syncForeground);
    };
  }, []);


  // 杩涘害鏉″姩鐢?
  useEffect(() => {
    if (!isForeground || isClosing) {
      return;
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / displayDuration);
        if (newProgress <= 0) {
          handleClose();
          return 0;
        }
        return newProgress;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [displayDuration, isForeground, isClosing]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const handleAction = () => {
    if (actionUrl) {
      window.open(actionUrl, '_blank');
    }
  };

  // 鏍规嵁绫诲瀷鑾峰彇棰滆壊
  const getTypeStyles = () => {
    switch (type) {
      case 'promotion':
        return {
          badge: 'bg-pink-100 text-pink-700',
          accent: 'from-pink-500 to-pink-600',
          button: 'bg-pink-500 hover:bg-pink-600'
        };
      case 'tutorial':
        return {
          badge: 'bg-blue-100 text-blue-700',
          accent: 'from-blue-500 to-blue-600',
          button: 'bg-blue-500 hover:bg-blue-600'
        };
      case 'service':
        return {
          badge: 'bg-green-100 text-green-700',
          accent: 'from-green-500 to-green-600',
          button: 'bg-green-500 hover:bg-green-600'
        };
      default:
        return {
          badge: 'bg-purple-100 text-purple-700',
          accent: 'from-purple-500 to-purple-600',
          button: 'bg-purple-500 hover:bg-purple-600'
        };
    }
  };

  const getTypeLabel = () => {
    const labels = {
      promotion: '淇冮攢',
      tutorial: '鏁欑▼',
      announcement: '鍏憡',
      service: '鏈嶅姟'
    };
    return labels[type];
  };

  const styles = getTypeStyles();

  return (
    <div
      className={`fixed bottom-6 right-6 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 backdrop-blur-sm border border-white/20 ${
        isClosing ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100'
      }`}
    >
      {/* 椤堕儴杩涘害鏉?*/}
      <div className="h-1.5 bg-gradient-to-r from-gray-100 to-gray-200">
        <div
          className={`h-full bg-gradient-to-r ${styles.accent} transition-all duration-100 shadow-lg`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 涓诲鍣?- 鐜颁唬鍗＄墖甯冨眬 */}
      <div className="p-6 space-y-4">
        {/* 椤堕儴锛氭爣绛惧拰鍏抽棴鎸夐挳 */}
        <div className="flex items-center justify-between">
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase ${styles.badge}`}>
            {getTypeLabel()}
          </span>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110 flex-shrink-0"
            aria-label="鍏抽棴"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 鍥剧墖鍖哄煙 - 鍏ㄥ鐜颁唬璁捐 */}
        <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 group">
          {imageUrl ? (
            <>
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </>
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${styles.accent} flex items-center justify-center`}>
              <div className="text-white text-6xl opacity-30">
                {type === 'promotion' && '馃帀'}
                {type === 'tutorial' && '馃摎'}
                {type === 'announcement' && '馃摙'}
                {type === 'service' && '馃敡'}
              </div>
            </div>
          )}
        </div>

        {/* 鍐呭鍖哄煙 */}
        <div className="space-y-3">
          {/* 鏍囬 */}
          <h3 className="text-xl font-bold text-gray-900 leading-tight line-clamp-2">
            {title}
          </h3>
          
          {/* 鎻忚堪 */}
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
            {content}
          </p>
        </div>

        {/* 搴曢儴锛氭搷浣滄寜閽拰杩涘害 */}
        <div className="flex items-center gap-3 pt-2">
          {actionUrl && actionText && (
            <button
              onClick={handleAction}
              className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 ${styles.button} hover:shadow-lg hover:scale-105 active:scale-95`}
            >
              {actionText}
            </button>
          )}
          
          {/* 杩涘害鎸囩ず鍣?*/}
          <div className="flex-shrink-0 flex items-center gap-1">
            <div className="text-xs text-gray-500 font-medium">
              {Math.round(progress)}%
            </div>
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center">
              <div 
                className={`w-6 h-6 rounded-full bg-gradient-to-r ${styles.accent}`}
                style={{
                  clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((progress / 100) * 2 * Math.PI - Math.PI / 2)}% ${50 + 50 * Math.sin((progress / 100) * 2 * Math.PI - Math.PI / 2)}%)`
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
