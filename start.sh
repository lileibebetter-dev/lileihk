#!/bin/bash
# 李磊个人网站启动脚本
# 功能：启动带有GPT功能的安全聊天机器人服务器

echo "🚀 李磊个人网站 - 启动脚本"
echo "=================================="

# 检查Python3是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误：未找到Python3，请先安装Python3"
    exit 1
fi

# 检查是否在正确的目录
if [ ! -f "server.py" ]; then
    echo "❌ 错误：未找到server.py文件，请确保在正确的目录中运行此脚本"
    exit 1
fi

# 检查并安装依赖
echo "📦 检查Python依赖..."
python3 -c "import aiohttp" 2>/dev/null || {
    echo "⚠️  aiohttp未安装，正在安装..."
    pip3 install aiohttp
    if [ $? -eq 0 ]; then
        echo "✅ aiohttp安装成功"
    else
        echo "❌ aiohttp安装失败，请手动安装：pip3 install aiohttp"
        exit 1
    fi
}

# 检查环境变量配置
echo "🔧 检查环境配置..."

# 如果存在.env文件，自动加载
if [ -f ".env" ]; then
    echo "📄 发现.env文件，正在加载..."
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ 环境变量已加载"
elif [ -f "env.example" ]; then
    echo "💡 提示：发现env.example文件"
    echo "   要启用GPT功能，请："
    echo "   1. 复制配置文件：cp env.example .env"
    echo "   2. 编辑.env文件，设置真实的OPENAI_API_KEY"
    echo "   3. 重新运行此脚本"
fi

# 检查API密钥
if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your_api_key_here" ]; then
    echo "⚠️  OpenAI API密钥未配置"
    echo "💡 聊天机器人将使用本地智能回复模式"
    echo ""
    echo "要启用GPT功能，请设置API密钥："
    echo "export OPENAI_API_KEY=your_actual_api_key"
    echo "或创建.env文件并设置OPENAI_API_KEY"
else
    echo "✅ OpenAI API密钥已配置，GPT功能将启用"
fi

echo ""
echo "🌟 启动服务器..."
echo "=================================="

# 启动服务器
python3 server.py

# 如果服务器意外退出
echo ""
echo "👋 服务器已关闭"

