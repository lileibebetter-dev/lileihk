# 李磊个人网站 - GPT聊天机器人

## 🤖 功能特性

- **安全的GPT集成**：API密钥保护在后端，确保安全性
- **智能回退机制**：GPT不可用时自动切换到本地智能回复
- **双重回复模式**：
  - 🤖 GPT智能回复（需API密钥）
  - 💡 本地智能回复（无需API密钥）
- **实时响应状态**：显示回复来源和状态

## 🚀 快速启动

### 方法一：使用启动脚本（推荐）

```bash
# 直接运行启动脚本
./start.sh
```

### 方法二：手动启动

```bash
# 1. 安装依赖
pip3 install aiohttp

# 2. 启动服务器
python3 server.py
```

## 🔧 配置GPT功能

### 1. 获取OpenAI API密钥

1. 访问 [OpenAI API Keys](https://platform.openai.com/api-keys)
2. 登录并创建新的API密钥
3. 复制生成的密钥

### 2. 配置方法

#### 选项A：使用环境变量（推荐）

```bash
# 设置环境变量
export OPENAI_API_KEY=your_actual_api_key_here

# 启动服务器
python3 server.py
```

#### 选项B：使用配置文件

```bash
# 1. 复制配置文件模板
cp env.example .env

# 2. 编辑.env文件，设置真实的API密钥
# OPENAI_API_KEY=your_actual_api_key_here

# 3. 加载环境变量并启动
source .env && python3 server.py
```

## 📡 服务器架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   静态文件服务器   │    │    API服务器     │    │   OpenAI API    │
│   Port: 8000    │────│   Port: 8001    │────│                │
│                 │    │                 │    │                 │
│  • HTML/CSS/JS  │    │  • 聊天API      │    │  • GPT-3.5     │
│  • 图片资源      │    │  • 安全认证      │    │  • 智能回复     │
│  • 静态资源      │    │  • 错误处理      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔒 安全特性

1. **API密钥保护**：密钥仅存储在服务器端，前端无法访问
2. **CORS配置**：防止跨域攻击
3. **错误处理**：API调用失败时自动回退
4. **本地回复**：即使没有网络也能正常工作

## 📱 使用说明

### 访问网站

1. 启动服务器后，访问：`http://localhost:8000`
2. 点击右下角的聊天机器人图标
3. 开始与AI助手对话

### 聊天功能

- **快捷键**：`Ctrl/Cmd + Shift + C` 打开/关闭聊天窗口
- **退出**：按 `Escape` 键关闭聊天窗口
- **回复模式**：
  - 🤖 GPT智能回复：使用OpenAI GPT模型
  - 💡 本地智能回复：基于预设规则的智能回复
  - ⚠️ 回退模式：API调用失败时的本地回复

## 🎯 支持的对话类型

李磊的AI助手可以回答关于以下方面的问题：

- 👨‍💼 **个人背景**：教育经历、工作经验
- 🚀 **项目经验**：云秒搭智能体平台、建筑参数化设计等
- 🔬 **研究成果**：AIGC赋能建筑设计、学术论文
- 💻 **技术技能**：AI产品设计、Python、React等
- 📞 **联系方式**：邮箱、电话、LinkedIn等

## 🛠️ 开发者信息

### 文件结构

```
├── server.py          # 后端API服务器
├── chatbot.js         # 前端聊天机器人逻辑
├── chatbot.css        # 聊天机器人样式
├── home.html          # 主页面
├── start.sh           # 启动脚本
├── env.example        # 环境变量模板
└── README_GPT.md      # 使用说明
```

### API接口

```
POST /api/chat
Content-Type: application/json

{
  "message": "用户消息"
}

Response:
{
  "response": "AI回复内容",
  "source": "openai|local|local_fallback",
  "message": "状态信息"
}
```

## 🆘 故障排除

### 常见问题

1. **API调用失败**
   - 检查API密钥是否正确设置
   - 确认网络连接正常
   - 检查OpenAI API账户余额

2. **服务器启动失败**
   - 确认Python3已安装
   - 检查端口8000/8001是否被占用
   - 安装必要依赖：`pip3 install aiohttp`

3. **聊天机器人无响应**
   - 检查浏览器控制台错误信息
   - 确认API服务器正在运行
   - 刷新页面重试

### 调试模式

启动服务器时会在控制台显示详细的调试信息，包括：
- 服务器启动状态
- API密钥配置状态
- 每次API调用的结果
- 错误信息和回退处理

## 📝 更新日志

- **v2.0** - 添加GPT功能，安全的后端API
- **v1.0** - 基础聊天机器人，本地回复

## 👨‍💻 开发者

**李磊** - AI产品经理
- 邮箱：lileiaad@connect.hku.hk
- GitHub：github.com/lilei
- LinkedIn：linkedin.com/in/lilei

