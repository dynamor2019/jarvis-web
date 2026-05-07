'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormattedMessage } from 'react-intl';
import PaymentQRCode from '@/components/PaymentQRCode';
import CoinDropAnimation from '@/components/CoinDropAnimation';

interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  bonusTokens: number;
  price: number;
  isActive: boolean;
  sortOrder: number;
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'alipay' | 'wechat'>('alipay');
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);

  // 预设的 Token 包
  const defaultPackages: TokenPackage[] = [
    { id: '1', name: '基础包', tokens: 10000, bonusTokens: 0, price: 9.9, isActive: true, sortOrder: 1 },
    { id: '2', name: '标准包', tokens: 50000, bonusTokens: 5000, price: 49.9, isActive: true, sortOrder: 2 },
    { id: '3', name: '专业包', tokens: 100000, bonusTokens: 15000, price: 99.9, isActive: true, sortOrder: 3 },
    { id: '4', name: '企业包', tokens: 500000, bonusTokens: 100000, price: 499.9, isActive: true, sortOrder: 4 },
  ];

  useEffect(() => {
    // 从 URL 参数获取预选包
    const packageId = searchParams?.get('package');
    if (packageId) {
      const pkg = defaultPackages.find(p => p.id === packageId);
      if (pkg) setSelectedPackage(pkg);
    }
    setPackages(defaultPackages);
  }, [searchParams]);

  const createOrder = async () => {
    if (!selectedPackage) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('请先登录');
        router.push('/login');
        return;
      }

      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderType: 'token_pack',
          productName: selectedPackage.name,
          amount: selectedPackage.price,
          tokens: selectedPackage.tokens + selectedPackage.bonusTokens
        })
      });

      const data = await response.json();
      if (data.success) {
        setCurrentOrder(data.order);
      } else {
        alert(data.error || '创建订单失败');
      }
    } catch (error) {
      
      alert('创建订单失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowCoinAnimation(true);
    setTimeout(() => {
      alert('支付成功！Token 已充值到您的账户');
      router.push('/dashboard');
    }, 2000);
  };

  if (currentOrder) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        {showCoinAnimation && <CoinDropAnimation />}
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                <FormattedMessage id="payment.scan_to_pay" defaultMessage="扫码支付" />
              </h1>
              <p className="text-gray-600">
                <FormattedMessage id="payment.order_no" defaultMessage="订单号" />: {currentOrder.orderNo}
              </p>
            </div>

            <PaymentQRCode
              orderId={currentOrder.id}
              amount={currentOrder.amount}
              paymentMethod={paymentMethod}
              onSuccess={handlePaymentSuccess}
            />

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">
                  <FormattedMessage id="payment.product" defaultMessage="商品" />:
                </span>
                <span className="font-medium">{currentOrder.productName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  <FormattedMessage id="payment.amount" defaultMessage="金额" />:
                </span>
                <span className="text-xl font-bold text-[#4F46E5]">¥{currentOrder.amount}</span>
              </div>
            </div>

            <button
              onClick={() => setCurrentOrder(null)}
              className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FormattedMessage id="payment.back_to_select" defaultMessage="返回选择" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              <FormattedMessage id="payment.title" defaultMessage="Token 充值" />
            </h1>
            <p className="text-gray-600">
              <FormattedMessage id="payment.subtitle" defaultMessage="选择合适的 Token 包，享受 AI 服务" />
            </p>
          </div>

          {/* Token 包选择 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`bg-white rounded-lg shadow-lg p-6 cursor-pointer transition-all duration-200 ${
                  selectedPackage?.id === pkg.id
                    ? 'ring-2 ring-[#4F46E5] transform scale-105'
                    : 'hover:shadow-xl hover:scale-102'
                }`}
                onClick={() => setSelectedPackage(pkg)}
              >
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                  <div className="text-3xl font-bold text-[#4F46E5] mb-2">¥{pkg.price}</div>
                  <div className="text-gray-600 mb-4">
                    {pkg.tokens.toLocaleString()} Tokens
                    {pkg.bonusTokens > 0 && (
                      <div className="text-sm text-green-600">
                        +{pkg.bonusTokens.toLocaleString()} 赠送
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    总计: {(pkg.tokens + pkg.bonusTokens).toLocaleString()} Tokens
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 支付方式选择 */}
          {selectedPackage && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                <FormattedMessage id="payment.method" defaultMessage="支付方式" />
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  className={`p-4 border-2 rounded-lg flex items-center justify-center gap-3 transition-colors ${
                    paymentMethod === 'alipay'
                      ? 'border-[#4F46E5] bg-[#4F46E5]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('alipay')}
                >
                  <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold">
                    支
                  </div>
                  <span className="font-medium">支付宝</span>
                </button>
                <button
                  className={`p-4 border-2 rounded-lg flex items-center justify-center gap-3 transition-colors ${
                    paymentMethod === 'wechat'
                      ? 'border-[#4F46E5] bg-[#4F46E5]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('wechat')}
                >
                  <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white font-bold">
                    微
                  </div>
                  <span className="font-medium">微信支付</span>
                </button>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">选中商品:</span>
                  <span className="font-medium">{selectedPackage.name}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">Token 数量:</span>
                  <span className="font-medium">
                    {(selectedPackage.tokens + selectedPackage.bonusTokens).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-bold">支付金额:</span>
                  <span className="text-2xl font-bold text-[#4F46E5]">¥{selectedPackage.price}</span>
                </div>

                <button
                  onClick={createOrder}
                  disabled={loading}
                  className="w-full glow-button py-3 rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? (
                    <FormattedMessage id="payment.creating" defaultMessage="创建订单中..." />
                  ) : (
                    <FormattedMessage id="payment.create_order" defaultMessage="立即支付" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4F46E5]"></div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}