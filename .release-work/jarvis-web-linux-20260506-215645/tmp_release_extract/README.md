# Jarvis Web 使用说明（2026-04）

本项目是 Jarvis 的 Web 端（Next.js 16），支持本地开发、构建以及 Linux 服务器直接运行。

## 1. 本地开发

```bash
npm install
npm run dev
```

- 默认地址：`http://127.0.0.1:3010`
- 开发脚本定义：`next dev -p 3010`

## 2. 生产构建（本地打包后上传 Linux）

```bash
npm install
npm run build
```

构建完成后请确保以下目录/文件随包一起上传：

- `.next_build/standalone/`
- `.next/static/`（或 `.next_build/static/`，按实际构建产物）
- `public/`
- `start.sh`
- `.env.production`
- `prisma/`（若使用 SQLite，本目录内应包含 `jarvis.db`）

## 3. Linux 启动（推荐）

在服务器项目根目录执行：

```bash
chmod +x start.sh
./start.sh
```

`start.sh` 已内置以下能力：

- 自动检测并回收 3000 端口占用；
- 自动读取 `.env.production`（兼容 UTF-16/CRLF）；
- 自动检查 `.next_build` 构建产物；
- 数据库默认不强制执行 `prisma db push`（避免启动时 CPU 飙高）；
- 可按需写入 Nginx 反向代理配置并重载。

## 4. 常用启动参数（按需设置）

```bash
# 缺少构建产物时自动构建
export AUTO_BUILD_ON_START=1

# 强制执行 prisma db push（默认 0，不建议常开）
export FORCE_DB_PUSH=1

# 启动时执行 prisma generate（默认 0）
export PRISMA_GENERATE_ON_START=1

# 同步 static/public 到 standalone（默认 0）
export SYNC_STANDALONE_ASSETS=1
```

## 5. 快速排错

- 报错 `Cannot find module 'next'`：当前目录缺少依赖，先执行 `npm install`。
- 报错 `Could not find a production build in './.next_build'`：先执行 `npm run build`。
- 页面 404 且缺失 `/_next/static/...`：确认 `static` 已随 standalone 一起上传，或启用 `SYNC_STANDALONE_ASSETS=1`。
- 启动即高 CPU：确认未开启 `FORCE_DB_PUSH=1`，并检查是否有重复进程（如 PM2/systemd/docker）抢占同端口。

## 6. NPM Scripts

- `npm run dev`：本地开发（3010）
- `npm run build`：生产构建
- `npm run start`：通过 standalone 启动
