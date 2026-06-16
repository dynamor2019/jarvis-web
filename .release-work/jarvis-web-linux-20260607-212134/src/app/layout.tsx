import './globals.css';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import LanguageProvider from '@/components/LanguageProvider';
import IconProviderClient from '@/components/IconProviderClient';
import UserProfileSyncClient from '@/components/UserProfileSyncClient';

const Navbar = dynamic(() => import('@/components/Navbar'));
const BroadcastLauncher = dynamic(() => import('@/components/BroadcastLauncher'));

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://www.jarvisai.com.cn'),
  title: {
    default: '小贾AI - 智能 Word 写作助手',
    template: '%s | 小贾AI',
  },
  description: '小贾AI是面向中文办公场景的智能写作助手，支持从提纲到成稿到格式统一的一体化文档交付。',
  applicationName: '小贾AI',
  keywords: ['小贾AI', 'AI写作', 'Word写作助手', '中文写作', '办公提效'],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: '小贾AI - 智能 Word 写作助手',
    description: '中文办公写作提效工具，支持生成、润色、排版与文档交付。',
    type: 'website',
    locale: 'zh_CN',
    url: '/',
    siteName: '小贾AI',
  },
  icons: { icon: '/jarvisAI.svg' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <IconProviderClient>
          <LanguageProvider>
            <Navbar />
            <main className="min-h-screen" style={{ paddingTop: '64px' }}>
              {children}
            </main>
            <div className="w-full border-t border-gray-200 bg-white py-3 text-center text-xs text-gray-500">
              津ICP备2026000398号-1
            </div>
            <UserProfileSyncClient />
            <Suspense fallback={null}>
              <BroadcastLauncher />
            </Suspense>
          </LanguageProvider>
        </IconProviderClient>
      </body>
    </html>
  );
}
