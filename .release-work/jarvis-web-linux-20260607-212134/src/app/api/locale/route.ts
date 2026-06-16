import { NextRequest, NextResponse } from 'next/server';

const COUNTRY_TO_LOCALE: Record<string, string> = {
  CN: 'zh-CN',
  HK: 'zh-CN',
  MO: 'zh-CN',
  TW: 'zh-CN',
  US: 'en-US',
  GB: 'en-US',
  AU: 'en-US',
  CA: 'en-US',
  NZ: 'en-US',
  FR: 'fr-FR',
  DE: 'de-DE',
  ES: 'es-ES'
};

function fromCountryCode(code?: string | null) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return '';
  return COUNTRY_TO_LOCALE[normalized] || '';
}

function fromAcceptLanguage(raw?: string | null) {
  const value = String(raw || '').toLowerCase();
  if (!value) return '';
  if (value.includes('zh')) return 'zh-CN';
  if (value.includes('fr')) return 'fr-FR';
  if (value.includes('de')) return 'de-DE';
  if (value.includes('es')) return 'es-ES';
  if (value.includes('en')) return 'en-US';
  return '';
}

export async function GET(request: NextRequest) {
  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-country-code') ||
    request.headers.get('x-geo-country');

  const byIp = fromCountryCode(country);
  if (byIp) {
    return NextResponse.json({ success: true, locale: byIp, source: 'ip' });
  }

  const byHeader = fromAcceptLanguage(request.headers.get('accept-language'));
  if (byHeader) {
    return NextResponse.json({ success: true, locale: byHeader, source: 'accept-language' });
  }

  return NextResponse.json({ success: true, locale: 'zh-CN', source: 'default' });
}
