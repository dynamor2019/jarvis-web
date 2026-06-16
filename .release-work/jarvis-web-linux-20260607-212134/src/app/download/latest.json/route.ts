import { NextResponse } from 'next/server';
import { getSystemConfig } from '@/lib/config';

const DEFAULT_DOWNLOAD_URL = 'https://share.weiyun.com/5LObuK4n';
const DEFAULT_VERSION = '3.0.0';

function normalizeDownloadUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return DEFAULT_DOWNLOAD_URL;
  if (!value.startsWith('/')) return value;

  const base = (process.env.NEXT_PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');
  return base ? `${base}${value}` : value;
}

export async function GET() {
  const configuredUrl = (await getSystemConfig('landing_download_url')) || '';
  const installerUrl = normalizeDownloadUrl(configuredUrl);

  return NextResponse.json({
    latestVersion: process.env.JARVIS_LATEST_VERSION || DEFAULT_VERSION,
    installerUrl,
    sha256: process.env.JARVIS_INSTALLER_SHA256 || '',
    releaseNotes: [
      '支持应用内检测新版本',
      '支持下载安装到本机后启动安装器',
    ],
  });
}
