# Jarvis Web Linux Deployment Package

## 目标

生成一个最小可运行的 Linux 部署包，避免把开发依赖和源码一起打包，减小体积并保证服务器上只需运行 `start.sh`。

## 生成步骤

请在 Linux 环境中执行：

```bash
cd /path/to/jarvis-web
bash package-linux.sh
```

这会生成一个类似 `jarvis-web-linux-minimal-YYYYMMDDHHMMSS.tar.gz` 的压缩包。

如果服务器资源不足导致打包失败，或者你希望完全避免在服务器上执行 npm 安装，请先在打包机上准备好 `node_modules`，然后使用：

```bash
bash package-linux-noinstall.sh
```

这会直接打包当前目录已有的 `node_modules`，不在服务器上执行任何 npm 安装步骤。
## 运行规则

- 必须在 Linux 上打包：
  - 这样生成的 `node_modules` 才能保证 Linux 平台兼容。
- 只安装生产依赖：
  - 脚本会执行 `npm ci --production` 或 `npm install --production`。
- 如果服务器资源不足，使用 `--skip-install`：
  - `bash package-linux.sh --skip-install`
  - 这会跳过服务器上的安装步骤，直接打包现有的 `node_modules`。
  - 前提是 `node_modules` 已经在可用构建环境中准备好。
- 不打包开发依赖：
  - `typescript`
  - `eslint`
  - `@types/*`
  - `autoprefixer`
  - `postcss`
  - `tailwindcss`
  - `browserslist`
  - `baseline-browser-mapping`
  - 以及其它仅用于开发/编译的工具包
- 只保留运行时必要文件：
  - `start.sh`
  - `server.js`
  - `.next_build/`
  - `package.json`
  - `package-lock.json`
  - `node_modules/`
  - `prisma/`
  - `public/`
  - `certs/`
  - `plugins/`
  - `data/`（如果需要持久化数据）
  - `.env.production`
  - `nginx.conf.example`
  - `deploy-checklist.txt`

## 打包规则

1. 在 `jarvis-web` 根目录执行：
   - `bash package-linux.sh`
2. 脚本会创建临时目录并复制以下目录/文件：
   - `start.sh`
   - `server.js`
   - `.next_build/`
   - `prisma/`
   - `public/`
   - `certs/`
   - `plugins/`
   - `data/`
   - `.env.production`
   - `package.json`
   - `package-lock.json`
   - `nginx.conf.example`
   - `deploy-checklist.txt`
3. 脚本会显式排除以下目录和文件，即使它们在仓库中也不会进入最终包：
   - `output/`
   - `dist/`
   - `src/`
   - `docs/`
   - `.git/`
   - `.vscode/`
   - `.codeguard/`
   - `.github/`
   - `.idea/`
   - `README.md`
   - `README.LINUX.md`
4. 在临时目录内执行：
   - `npm ci --production`
   - 如果失败则回退到 `npm install --production`
5. 打包时不包含源码目录、测试文件、文档、`.git`、`.vscode`、`.codeguard` 等非运行时文件。

> 注意：请不要手工用 `tar -czf` 打整个项目目录，这会把 `output`、`src`、`docs` 等不必要文件一并打包。请务必使用 `package-linux.sh` 或 `package-linux-noinstall.sh`。
## 部署步骤

1. 上传生成的 tar 包到目标 Linux 服务器。
2. 解压包：

```bash
tar -xzf jarvis-web-linux-minimal-*.tar.gz
```

3. 进入解压目录后执行：

```bash
chmod +x start.sh
./start.sh
```

如果你使用的是无安装包：

```bash
tar -xzf jarvis-web-linux-noinstall-*.tar.gz
cd <解压目录>
chmod +x start.sh
./start.sh
```

4. 部署完成后可通过 `curl` 验证：

```bash
curl -i http://127.0.0.1:3000/api/health
```

> 只要包里包含 `start.sh` 和运行时必要文件，解压后直接执行 `./start.sh` 就能启动服务。

## 注意

- 该包仍然依赖 `start.sh` 和 `server.js` 正常运行。
- 如果需要数据库恢复，请确保 `.env.production` 中的 `DATABASE_URL` 指向有效的 SQLite 路径。
- 该脚本会在构建时生成最小生产依赖，无需在服务器上重新执行 `npm install`。

## 现成包

仓库中已有较大旧包：

- `jarvis-web-linux-full-20260404-214745.tar.gz`
- `jarvis-web-linux-full-20260404-213211.zip`

推荐优先使用由 `package-linux.sh` 生成的精简包。