#!/bin/bash
# 本地持久化部署脚本
# 作者：李磊

echo "🚀 李磊个人网站 - 本地持久化部署"
echo "=================================="

# 获取当前目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="lilei-portfolio"

echo "📁 项目目录: $SCRIPT_DIR"

# 方案1: 使用nohup后台运行
echo ""
echo "方案1: nohup后台运行"
echo "===================="

create_nohup_service() {
    echo "🔧 创建nohup启动脚本..."
    
    cat > "$SCRIPT_DIR/start_persistent.sh" << 'EOF'
#!/bin/bash
# 持久化启动脚本

# 设置环境变量
export OPENAI_API_KEY=sk-u8uCPPzw8TXmcBHJ1pMOaBlI27AJMO4zlREVc4oNeBkHExLE
export OPENAI_API_BASE=https://turingai.plus/v1/chat/completions
export OPENAI_MODEL=gpt-4o-mini

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 检查是否已经在运行
if pgrep -f "python3 server.py" > /dev/null; then
    echo "⚠️  服务器已经在运行中"
    echo "📊 进程信息:"
    ps aux | grep "python3 server.py" | grep -v grep
    exit 1
fi

# 创建日志目录
mkdir -p logs

# 后台启动服务器
echo "🚀 启动服务器..."
nohup python3 server.py > logs/server.log 2>&1 &

# 保存进程ID
echo $! > logs/server.pid

echo "✅ 服务器已在后台启动"
echo "📊 进程ID: $(cat logs/server.pid)"
echo "📄 日志文件: logs/server.log"
echo "🌐 访问地址: http://localhost:8000"

# 等待服务器启动
sleep 3

# 检查服务器状态
if curl -s http://localhost:8000 > /dev/null; then
    echo "✅ 服务器启动成功！"
else
    echo "❌ 服务器启动失败，请检查日志"
fi
EOF

    chmod +x "$SCRIPT_DIR/start_persistent.sh"
    
    # 创建停止脚本
    cat > "$SCRIPT_DIR/stop_server.sh" << 'EOF'
#!/bin/bash
# 停止服务器脚本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🛑 停止李磊个人网站服务器..."

# 通过PID文件停止
if [ -f "logs/server.pid" ]; then
    PID=$(cat logs/server.pid)
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        echo "✅ 服务器已停止 (PID: $PID)"
        rm -f logs/server.pid
    else
        echo "⚠️  PID文件存在但进程不在运行"
        rm -f logs/server.pid
    fi
else
    echo "⚠️  PID文件不存在，尝试按进程名停止..."
    pkill -f "python3 server.py"
    if [ $? -eq 0 ]; then
        echo "✅ 服务器已停止"
    else
        echo "❌ 未找到运行中的服务器进程"
    fi
fi

# 检查端口是否释放
sleep 2
if ! lsof -i :8000 -i :8001 > /dev/null 2>&1; then
    echo "✅ 端口已释放"
else
    echo "⚠️  端口仍被占用，请手动检查"
    lsof -i :8000 -i :8001
fi
EOF

    chmod +x "$SCRIPT_DIR/stop_server.sh"
    
    # 创建状态检查脚本
    cat > "$SCRIPT_DIR/status_server.sh" << 'EOF'
#!/bin/bash
# 检查服务器状态

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📊 李磊个人网站服务器状态"
echo "=========================="

# 检查进程
if pgrep -f "python3 server.py" > /dev/null; then
    echo "✅ 服务器进程: 运行中"
    echo "📊 进程信息:"
    ps aux | grep "python3 server.py" | grep -v grep
else
    echo "❌ 服务器进程: 未运行"
fi

echo ""

# 检查端口
if lsof -i :8000 > /dev/null 2>&1; then
    echo "✅ 端口8000: 已监听"
else
    echo "❌ 端口8000: 未监听"
fi

if lsof -i :8001 > /dev/null 2>&1; then
    echo "✅ 端口8001: 已监听"
else
    echo "❌ 端口8001: 未监听"
fi

echo ""

# 检查网站可访问性
if curl -s http://localhost:8000 > /dev/null; then
    echo "✅ 网站访问: 正常"
    echo "🌐 访问地址: http://localhost:8000"
else
    echo "❌ 网站访问: 失败"
fi

# 检查API可访问性
if curl -s http://localhost:8001/api/chat -X POST -H "Content-Type: application/json" -d '{"message":"test"}' > /dev/null; then
    echo "✅ API服务: 正常"
    echo "🤖 API地址: http://localhost:8001/api/chat"
else
    echo "❌ API服务: 失败"
fi

echo ""

# 显示日志信息
if [ -f "logs/server.log" ]; then
    echo "📄 最近日志 (最后10行):"
    echo "===================="
    tail -n 10 logs/server.log
else
    echo "📄 日志文件: 不存在"
fi
EOF

    chmod +x "$SCRIPT_DIR/status_server.sh"
    
    echo "✅ nohup脚本创建完成"
    echo "📝 使用方法:"
    echo "   启动: ./start_persistent.sh"
    echo "   停止: ./stop_server.sh"
    echo "   状态: ./status_server.sh"
}

# 方案2: 创建macOS LaunchAgent (开机自启)
echo ""
echo "方案2: macOS开机自启动"
echo "===================="

create_launchd_service() {
    PLIST_PATH="$HOME/Library/LaunchAgents/com.lilei.portfolio.plist"
    
    echo "🔧 创建LaunchAgent配置..."
    
    cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.lilei.portfolio</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>$SCRIPT_DIR/start_persistent.sh</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>$SCRIPT_DIR</string>
    
    <key>EnvironmentVariables</key>
    <dict>
        <key>OPENAI_API_KEY</key>
        <string>sk-u8uCPPzw8TXmcBHJ1pMOaBlI27AJMO4zlREVc4oNeBkHExLE</string>
        <key>OPENAI_API_BASE</key>
        <string>https://turingai.plus/v1/chat/completions</string>
        <key>OPENAI_MODEL</key>
        <string>gpt-4o-mini</string>
    </dict>
    
    <key>StandardOutPath</key>
    <string>$SCRIPT_DIR/logs/launchd.out.log</string>
    
    <key>StandardErrorPath</key>
    <string>$SCRIPT_DIR/logs/launchd.err.log</string>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <true/>
    
    <key>ProcessType</key>
    <string>Background</string>
</dict>
</plist>
EOF

    echo "✅ LaunchAgent配置创建完成"
    echo "📝 使用方法:"
    echo "   加载服务: launchctl load $PLIST_PATH"
    echo "   启动服务: launchctl start com.lilei.portfolio"
    echo "   停止服务: launchctl stop com.lilei.portfolio"
    echo "   卸载服务: launchctl unload $PLIST_PATH"
    echo "   查看状态: launchctl list | grep lilei"
}

# 主菜单
echo ""
echo "请选择部署方案:"
echo "1) nohup后台运行 (推荐，简单易用)"
echo "2) macOS开机自启动 (系统级服务)"
echo "3) 创建所有脚本"
echo "4) 退出"

read -p "请输入选择 (1-4): " choice

case $choice in
    1)
        create_nohup_service
        echo ""
        echo "🎉 nohup方案设置完成！"
        echo "💡 现在可以运行: ./start_persistent.sh"
        ;;
    2)
        create_nohup_service
        create_launchd_service
        echo ""
        echo "🎉 macOS自启动方案设置完成！"
        echo "💡 现在可以运行: launchctl load ~/Library/LaunchAgents/com.lilei.portfolio.plist"
        ;;
    3)
        create_nohup_service
        create_launchd_service
        echo ""
        echo "🎉 所有脚本创建完成！"
        ;;
    4)
        echo "👋 退出部署脚本"
        exit 0
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "📋 部署方案总结:"
echo "================"
echo "📁 项目目录: $SCRIPT_DIR"
echo "🔧 管理脚本:"
echo "   - start_persistent.sh  (启动服务器)"
echo "   - stop_server.sh       (停止服务器)"
echo "   - status_server.sh     (检查状态)"
echo "📄 日志目录: logs/"
echo "🌐 访问地址: http://localhost:8000"
echo ""
echo "⚠️  注意事项:"
echo "   - 确保防火墙允许端口8000和8001"
echo "   - 如需外网访问，请配置路由器端口转发"
echo "   - 生产环境建议使用HTTPS和域名"

