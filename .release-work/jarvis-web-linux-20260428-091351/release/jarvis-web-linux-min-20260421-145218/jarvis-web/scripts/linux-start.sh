#!/bin/bash

# 进入脚本所在目录
cd "$(dirname "$0")"

echo "Jarvis Web Linux 启动脚本"

# 检查 Node.js 环境
if ! command -v node &> /dev/null; then
    echo "错误: 未检测到 node 环境，请先安装 Node.js (建议 v18+)"
    exit 1
fi

# 检查并创建 .env 文件
if [ ! -f .env ]; then
    echo "未检测到 .env 文件，正在检查可用模板..."
    if [ -f .env.production ]; then
        cp .env.production .env
        echo "已从 .env.production 创建 .env"
    elif [ -f .env.example ]; then
        cp .env.example .env
        echo "已从 .env.example 创建 .env"
    else
        echo "警告: 未找到 .env 模板文件，可能需要手动配置环境变量"
    fi
fi

# 赋予执行权限（以防万一）
chmod +x server.js

echo "正在启动服务 (端口 3000)..."
# 设置生产环境并启动
export NODE_ENV=production
export PORT=3000

# 启动服务
exec node server.js
