'use client';

import { useState, useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';

interface PaymentQRCodeProps {
  orderId: string;
  amount: number;
  paymentMethod: 'alipay' | 'wechat';
  onSuccess: () => void;
}

export default function PaymentQRCode({ orderId, amount, paymentMethod, onSuccess }: PaymentQRCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [status, setStatus] = useState<'pending' | 'paid' | 'expired' | 'failed'>('pending');
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(300); // 5分钟倒计时
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const statusCheckRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    generateQRCode();
    startStatusCheck();
    startCountdown();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (statusCheckRef.current) clearInterval(statusCheckRef.current);
    };
  }, [orderId, paymentMethod]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payment/qrcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          paymentMethod,
          amount
        })
      });

      const data = await response.json();
      if (data.success) {
        setQrCodeUrl(data.qrCodeUrl);
      } else {
        
        setStatus('failed');
      }
    } catch (error) {
      
      setStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const startStatusCheck = () => {
    statusCheckRef.current = setInterval(async () => {
      try {
        const response = await fetch('/api/payment/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId })
        });

        const data = await response.json();
        if (data.success) {
          if (data.status === 'paid') {
            setStatus('paid');
            if (statusCheckRef.current) clearInterval(statusCheckRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
            setTimeout(onSuccess, 1000);
          }
        }
      } catch (error) {
        
      }
    }, 2000); // 每2秒检查一次
  };

  const startCountdown = () => {
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setStatus('expired');
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (statusCheckRef.current) clearInterval(statusCheckRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMockPay = async () => {
    try {
      const response = await fetch('/api/payment/mock-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      const data = await response.json();
      if (data.success) {
        setStatus('paid');
        setTimeout(onSuccess, 1000);
      }
    } catch (error) {
      
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4F46E5] mb-4"></div>
        <p className="text-gray-600">
          <FormattedMessage id="payment.generating_qr" defaultMessage="生成支付二维码中..." />
        </p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-6xl mb-4">❌</div>
        <p className="text-red-600 font-medium">
          <FormattedMessage id="payment.qr_failed" defaultMessage="生成支付二维码失败" />
        </p>
        <button
          onClick={generateQRCode}
          className="mt-4 px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA] transition-colors"
        >
          <FormattedMessage id="payment.retry" defaultMessage="重试" />
        </button>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="text-center py-8">
        <div className="text-orange-500 text-6xl mb-4">⏰</div>
        <p className="text-orange-600 font-medium mb-4">
          <FormattedMessage id="payment.expired" defaultMessage="支付已超时" />
        </p>
        <button
          onClick={generateQRCode}
          className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA] transition-colors"
        >
          <FormattedMessage id="payment.regenerate" defaultMessage="重新生成" />
        </button>
      </div>
    );
  }

  if (status === 'paid') {
    return (
      <div className="text-center py-8">
        <div className="text-green-500 text-6xl mb-4">✅</div>
        <p className="text-green-600 font-medium text-lg">
          <FormattedMessage id="payment.success" defaultMessage="支付成功！" />
        </p>
        <p className="text-gray-600 mt-2">
          <FormattedMessage id="payment.redirecting" defaultMessage="正在跳转..." />
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      {/* 倒计时 */}
      <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
        <p className="text-orange-700 font-medium">
          <FormattedMessage id="payment.time_left" defaultMessage="剩余时间" />: {formatTime(countdown)}
        </p>
      </div>

      {/* 二维码 */}
      <div className="mb-6 p-4 bg-white border-2 border-gray-200 rounded-lg inline-block">
        {qrCodeUrl ? (
          <img
            src={qrCodeUrl}
            alt="Payment QR Code"
            className="w-48 h-48 mx-auto"
          />
        ) : (
          <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
            <span className="text-gray-500">
              <FormattedMessage id="payment.qr_loading" defaultMessage="二维码加载中..." />
            </span>
          </div>
        )}
      </div>

      {/* 支付方式提示 */}
      <div className="mb-4">
        <p className="text-gray-600 mb-2">
          {paymentMethod === 'alipay' ? (
            <FormattedMessage id="payment.alipay_tip" defaultMessage="请使用支付宝扫码支付" />
          ) : (
            <FormattedMessage id="payment.wechat_tip" defaultMessage="请使用微信扫码支付" />
          )}
        </p>
        <div className="flex items-center justify-center gap-2">
          <div className={`w-6 h-6 rounded flex items-center justify-center text-white text-sm font-bold ${
            paymentMethod === 'alipay' ? 'bg-blue-500' : 'bg-green-500'
          }`}>
            {paymentMethod === 'alipay' ? '支' : '微'}
          </div>
          <span className="text-sm text-gray-600">
            {paymentMethod === 'alipay' ? '支付宝' : '微信支付'}
          </span>
        </div>
      </div>

      {/* 开发环境模拟支付按钮 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-700 text-sm mb-2">
            <FormattedMessage id="payment.dev_mode" defaultMessage="开发模式 - 测试功能" />
          </p>
          <button
            onClick={handleMockPay}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
          >
            <FormattedMessage id="payment.mock_pay" defaultMessage="模拟支付成功" />
          </button>
        </div>
      )}

      {/* 支付状态 */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <div className="animate-pulse w-2 h-2 bg-[#4F46E5] rounded-full"></div>
        <span className="text-sm text-gray-600">
          <FormattedMessage id="payment.waiting" defaultMessage="等待支付中..." />
        </span>
      </div>
    </div>
  );
}