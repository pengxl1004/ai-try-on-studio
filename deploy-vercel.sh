#!/bin/bash

# Vercel 部署脚本
# 使用方法：chmod +x deploy-vercel.sh && ./deploy-vercel.sh

set -e

echo "🚀 开始部署到 Vercel..."

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo " 正在安装 Vercel CLI..."
    npm install -g vercel@latest
fi

# 检查是否已登录
echo "🔐 检查 Vercel 登录状态..."
vercel whoami || {
    echo "⚠️  请先登录 Vercel"
    echo "运行：vercel login"
    exit 1
}

# 构建项目
echo "🔨 构建项目..."
pnpm install
pnpm build

# 部署到生产环境
echo "🌐 部署到 Vercel..."
vercel --prod

echo "✅ 部署完成！"
echo "📝 请在 Vercel 控制台查看你的永久链接"
