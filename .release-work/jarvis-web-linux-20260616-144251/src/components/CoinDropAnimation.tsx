'use client';

import { useEffect, useState } from 'react';

interface Coin {
  id: number;
  left: number;
  delay: number;
}

export default function CoinDropAnimation() {
  const [coins, setCoins] = useState<Coin[]>([]);

  useEffect(() => {
    // 生成多个硬币
    const newCoins = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.random() * 80 + 10, // 10% - 90%
      delay: Math.random() * 0.3
    }));
    setCoins(newCoins);

    // 动画完成后清理
    const timer = setTimeout(() => {
      setCoins([]);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style>{`
        @keyframes coinDrop {
          0% {
            transform: translateY(-100px) rotateZ(0deg);
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateY(400px) rotateZ(720deg);
            opacity: 0;
          }
        }

        @keyframes coinSpin {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }

        .coin-drop {
          animation: coinDrop 2s ease-in forwards;
          position: fixed;
          pointer-events: none;
          z-index: 9999;
        }

        .coin-icon {
          animation: coinSpin 0.6s linear infinite;
          display: inline-block;
          font-size: 32px;
          filter: drop-shadow(0 2px 4px rgba(79, 70, 229, 0.3));
        }
      `}</style>

      {coins.map((coin) => (
        <div
          key={coin.id}
          className="coin-drop"
          style={{
            left: `${coin.left}%`,
            top: '50%',
            animationDelay: `${coin.delay}s`
          }}
        >
          <div className="coin-icon">💰</div>
        </div>
      ))}
    </>
  );
}
