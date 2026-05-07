# 部署与打包说明（Standalone）

## 一、生成部署包（在本地）
1. 进入项目目录：`cd C:\Jarvis\jarvis-web`
2. 执行构建：`npm run build`
3. 关键检查：确保以下两个目录都存在
   - `.next_build/standalone`
   - `.next_build/static`
4. 打包时必须同时包含：
   - `standalone/**`（服务端运行文件）
   - `standalone/.next_build/static/**`（前端 CSS/JS 静态资源）

> 注意：如果缺少 `.next_build/static`，线上会出现 `/_next/static/chunks/*.js 404`，页面只显示裸 HTML。

## 二、服务器部署（Linux）
1. 上传 zip 到服务器，例如：`/opt/jarvis-web`
2. 解压覆盖：`unzip -o your-package.zip`
3. 进入目录：`cd /opt/jarvis-web/standalone`
4. 启动命令（与 start.sh 一致）：
   - `PORT=3010 HOSTNAME=0.0.0.0 NODE_ENV=production node server.js`

## 三、反向代理（Nginx/宝塔）
- 反代目标必须是：`http://127.0.0.1:3010`
- 不要单独写 `/_next` 静态目录规则，整站反代到 Node 即可。

## 四、部署后自检
1. 本机探活：`curl -I http://127.0.0.1:3010`
2. 静态资源探活：`curl -I http://127.0.0.1:3010/_next/static/chunks/<实际文件名>.js`
3. 域名访问并强刷缓存（Ctrl+F5）

## 五、常见问题
- `502`：Node 未监听 3010 或反代端口写错
- `chunks 404`：部署包缺 `.next_build/static` 或 Nginx 规则拦截 `/_next`
