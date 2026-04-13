import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Functions from '@/components/Functions';
import Themes from '@/components/Themes';
import TechHighlights from '@/components/TechHighlights';
import QuickStart from '@/components/QuickStart';
import Footer from '@/components/Footer';
import { getSystemConfig } from '@/lib/config';

const DEFAULT_LANDING_DOWNLOAD_URL = 'https://share.weiyun.com/5LObuK4n';
export const dynamic = 'force-dynamic';

function isIpHost(hostname: string): boolean {
  const ipv4 = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
  return ipv4.test(hostname) || hostname.includes(':');
}

function normalizeDownloadUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return '';
  if (value.startsWith('/')) return value;

  try {
    const parsed = new URL(value);
    if (!isIpHost(parsed.hostname)) return value;

    const pathPart = `${parsed.pathname}${parsed.search}${parsed.hash}` || '/';
    const base = (process.env.NEXT_PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');
    if (!base) return pathPart;

    const baseUrl = new URL(base);
    return `${baseUrl.origin}${pathPart}`;
  } catch {
    return value;
  }
}

export default async function Home() {
  const configuredDownloadUrl = (await getSystemConfig('landing_download_url'))?.trim() || '';
  const normalizedConfiguredUrl = normalizeDownloadUrl(configuredDownloadUrl);
  const landingDownloadUrl = normalizedConfiguredUrl || DEFAULT_LANDING_DOWNLOAD_URL;

  return (
    <div className="flex flex-col min-h-screen">
      <Hero downloadUrl={landingDownloadUrl} />
      <Features />
      <Functions />
      <Themes />
      <TechHighlights />
      <QuickStart downloadUrl={landingDownloadUrl} />
      <Footer />
    </div>
  );
}
