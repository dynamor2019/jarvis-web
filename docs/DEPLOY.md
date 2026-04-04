# 部署指南

## 快速部署（宝塔）

### 1. 环境准备
- Node.js 18+
- PM2: `npm install -g pm2`

### 2. 上传代码
上传到 `/www/wwwroot/jarvis`

### 3. 配置环境
```bash
cd /www/wwwroot/jarvis
cp .env.production.example .env.production
nano .env.production
```

修改这3项：
```env
JWT_SECRET="your-random-32-chars"
NEXT_PUBLIC_WEB_URL="https://your-domain.com"
DATABASE_URL="file:./prisma/production.db"
```

### 4. 一键部署
```bash
chmod +x deploy.sh
./deploy.sh
```

### 5. 初始化数据
```bash
node init-all-data.js
```

### 6. 配置Nginx
复制 `nginx.conf.example` 到宝塔网站配置，修改域名

### 7. 申请SSL
宝塔面板 -> SSL -> Let's Encrypt

### 8. 访问测试
https://your-domain.com

## 默认账号
- 邮箱: admin@jarvis.com
- 密码: admin123

**部署后立即修改密码！**

## 常用命令
```bash
pm2 status              # 查看状态
pm2 logs jarvis-web     # 查看日志
pm2 restart jarvis-web  # 重启
./deploy.sh             # 更新部署
```
