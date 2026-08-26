#!/bin/bash
# LLM Hub 一键部署脚本
# 在服务器上运行：curl -fsSL https://raw.githubusercontent.com/jiabei-nerd/llm-hub/main/deploy.sh | bash

set -e

echo "=== LLM Hub 部署开始 ==="

# 安装 Docker（如果没有）
if ! command -v docker &> /dev/null; then
    echo "安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# 安装 docker-compose plugin（如果没有）
if ! docker compose version &> /dev/null; then
    echo "安装 Docker Compose..."
    apt-get update && apt-get install -y docker-compose-plugin
fi

# 克隆代码
if [ ! -d "llm-hub" ]; then
    echo "克隆代码..."
    git clone https://github.com/jiabei-nerd/llm-hub.git
fi

cd llm-hub

# 启动服务
echo "启动服务..."
docker compose up -d --build

# 等待数据库就绪
echo "等待数据库..."
sleep 10

# 初始化数据库
echo "初始化数据库..."
docker compose exec web npx prisma db push
docker compose exec web npx tsx prisma/seed.ts

echo ""
echo "=== 部署完成 ==="
echo "访问地址: http://$(curl -s ifconfig.me):3000"
echo "管理员账号: admin@llmhub.com"
echo "管理员密码: admin123"
echo ""
echo "下一步: 绑定域名 + 配置 HTTPS（可选）"
