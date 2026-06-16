import { NextRequest } from 'next/server';

/**
 * 获取客户端真实 IP 地址
 * 优先读取 X-Forwarded-For (反向代理)，其次 X-Real-IP，最后回退到 unknown
 */
export function getClientIp(request: NextRequest | Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  
  return 'unknown';
}
