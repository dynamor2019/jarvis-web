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

export default async function Home() {
  const configuredDownloadUrl = (await getSystemConfig('landing_download_url'))?.trim() || '';
  const landingDownloadUrl = configuredDownloadUrl || DEFAULT_LANDING_DOWNLOAD_URL;

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
