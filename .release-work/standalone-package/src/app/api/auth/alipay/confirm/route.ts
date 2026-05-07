import { NextRequest, NextResponse } from 'next/server';

declare global {
  var alipayTickets: Record<string, any> | undefined;
}

// 支付宝扫码后的确认页面
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticket = searchParams.get('ticket');
    
    if (!ticket) {
      return new NextResponse(
        '<html><body><h1>参数错误</h1><p>缺少ticket参数</p></body></html>',
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }
    
    // 检查ticket
    const tickets = globalThis.alipayTickets || {};
    const ticketData = tickets[ticket];
    
    if (!ticketData) {
      return new NextResponse(
        '<html><body><h1>登录失败</h1><p>ticket已过期或不存在</p></body></html>',
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }
    
    // 返回确认页面
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>确认登录 - JarvisAI</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #1677ff 0%, #00a6ff 100%);
            padding: 20px;
          }
          .container {
            background: white;
            padding: 2.5rem;
            border-radius: 1.5rem;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 420px;
            width: 100%;
            animation: slideUp 0.4s ease-out;
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem;
            background: linear-gradient(135deg, #1677ff 0%, #00a6ff 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            color: white;
            font-weight: bold;
          }
          h1 {
            color: #1f2937;
            margin: 0 0 0.5rem;
            font-size: 1.75rem;
          }
          .subtitle {
            color: #6b7280;
            margin: 0 0 2rem;
            font-size: 0.95rem;
          }
          .info-box {
            background: #f9fafb;
            padding: 1.5rem;
            border-radius: 1rem;
            margin-bottom: 2rem;
            border: 2px solid #e5e7eb;
          }
          .info-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: 0.75rem 0;
            font-size: 0.9rem;
          }
          .label {
            color: #6b7280;
            font-weight: 500;
          }
          .value {
            color: #1f2937;
            font-weight: 600;
          }
          .icon {
            width: 20px;
            height: 20px;
            margin-right: 8px;
            vertical-align: middle;
          }
          .buttons {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
          }
          .btn {
            flex: 1;
            padding: 1rem;
            border: none;
            border-radius: 0.75rem;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .btn-primary {
            background: linear-gradient(135deg, #1677ff 0%, #00a6ff 100%);
            color: white;
          }
          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(22, 119, 255, 0.4);
          }
          .btn-secondary {
            background: #f3f4f6;
            color: #6b7280;
          }
          .btn-secondary:hover {
            background: #e5e7eb;
          }
          .security-note {
            margin-top: 1.5rem;
            padding: 1rem;
            background: #e6f7ff;
            border-radius: 0.75rem;
            font-size: 0.85rem;
            color: #0050b3;
            display: flex;
            align-items: start;
            text-align: left;
          }
          .security-note svg {
            width: 20px;
            height: 20px;
            margin-right: 10px;
            flex-shrink: 0;
            margin-top: 2px;
          }
          .loading {
            display: none;
            margin-top: 1rem;
          }
          .spinner {
            border: 3px solid #f3f4f6;
            border-top: 3px solid #1677ff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">J</div>
          <h1>确认登录</h1>
          <p class="subtitle">请确认是否登录 JarvisAI 智能写作助手</p>
          
          <div class="info-box">
            <div class="info-item">
              <span class="label">
                <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                </svg>
                登录账号
              </span>
              <span class="value">测试用户</span>
            </div>
            <div class="info-item">
              <span class="label">
                <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
                登录方式
              </span>
              <span class="value">支付宝扫码</span>
            </div>
            <div class="info-item">
              <span class="label">
                <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                </svg>
                登录地点
              </span>
              <span class="value">开发环境</span>
            </div>
          </div>

          <div class="security-note">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
            <div>
              <strong>安全提示：</strong>请确认是您本人操作。登录后将获得完整的账户访问权限。
            </div>
          </div>

          <div class="buttons">
            <button class="btn btn-secondary" onclick="cancelLogin()">取消</button>
            <button class="btn btn-primary" onclick="confirmLogin()">确认登录</button>
          </div>

          <div class="loading" id="loading">
            <div class="spinner"></div>
            <p style="margin-top: 1rem; color: #6b7280;">正在登录...</p>
          </div>
        </div>

        <script>
          const ticket = '${ticket}';

          function cancelLogin() {
            if (confirm('确定要取消登录吗？')) {
              window.close();
            }
          }

          async function confirmLogin() {
            const buttons = document.querySelector('.buttons');
            const loading = document.getElementById('loading');
            
            buttons.style.display = 'none';
            loading.style.display = 'block';

            try {
              // 调用dev接口更新ticket状态
              const response = await fetch('/api/auth/alipay/dev?ticket=' + ticket + '&action=confirm');
              
              if (response.ok) {
                // 显示成功页面
                document.body.innerHTML = \`
                  <div class="container" style="animation: slideUp 0.4s ease-out;">
                    <div style="width: 80px; height: 80px; margin: 0 auto 1.5rem; background: #52c41a; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                      <svg style="width: 40px; height: 40px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                    <h1 style="color: #1f2937; margin-bottom: 0.5rem;">登录成功！</h1>
                    <p style="color: #6b7280; margin-bottom: 2rem;">欢迎使用 JarvisAI 智能写作助手</p>
                    <div style="background: #f6ffed; padding: 1.5rem; border-radius: 1rem; margin-bottom: 2rem; border: 2px solid #b7eb8f;">
                      <p style="color: #389e0d; font-size: 0.95rem; margin: 0;">
                        <strong>🎉 新用户福利</strong><br>
                        已为您赠送 <strong>100,000 Token</strong>
                      </p>
                    </div>
                    <p style="color: #9ca3af; font-size: 0.9rem;">请返回登录页面，系统将自动完成登录</p>
                    <button onclick="window.close()" style="margin-top: 1.5rem; padding: 0.75rem 2rem; background: linear-gradient(135deg, #1677ff 0%, #00a6ff 100%); color: white; border: none; border-radius: 0.75rem; font-size: 1rem; font-weight: 600; cursor: pointer;">
                      关闭窗口
                    </button>
                  </div>
                \`;
              } else {
                throw new Error('登录失败');
              }
            } catch (error) {
              alert('登录失败：' + error.message);
              buttons.style.display = 'flex';
              loading.style.display = 'none';
            }
          }
          // 自动确认，无需手动点击
          confirmLogin();
        </script>
      </body>
      </html>`,
      { 
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' } 
      }
    );
  } catch (error: unknown) {
    console.error('显示确认页面失败:', error);
    const message = error instanceof Error ? error.message : '未知错误';
    return new NextResponse(
      `<html><body><h1>错误</h1><p>${message}</p></body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}
