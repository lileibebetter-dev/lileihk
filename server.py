#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
安全的GPT API后端服务器
作者：李磊
功能：为聊天机器人提供安全的GPT API调用服务
"""

import os
import json
import asyncio
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading
import time
from typing import Dict, Any
import sys

# 尝试导入所需的库
try:
    import aiohttp
    import asyncio
except ImportError:
    print("正在安装必需的依赖...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "aiohttp"])
    import aiohttp
    import asyncio

class ChatbotAPIHandler(SimpleHTTPRequestHandler):
    """处理聊天机器人API请求的处理器"""
    
    def __init__(self, *args, **kwargs):
        # 李磊的个人信息
        self.lei_info = {
            'name': '李磊',
            'title': 'AI产品经理',
            'education': {
                'master': '香港大学硕士',
                'bachelor': '长沙理工大学本科',
                'honor': '湖南省优秀毕业生（前1%）'
            },
            'experience': [
                {
                    'company': '云鲸致人工智能',
                    'position': 'AI产品经理',
                    'description': '主导云秒搭智能体平台0-1建设，识别准确率领先竞品15%'
                },
                {
                    'company': '深圳市建筑设计研究总院',
                    'position': '建筑师',
                    'description': '开发参数化协同设计平台，将协同周期缩短37%'
                },
                {
                    'company': '香港大学',
                    'position': '研究助理',
                    'description': 'AIGC赋能建筑设计研究，成果发表于CAAD FUTURES 2025'
                }
            ],
            'projects': [
                '云秒搭智能体平台',
                '建筑参数化协同设计平台',
                'AR/VR建筑设计应用',
                '深圳房价与微博情绪关系研究'
            ],
            'skills': [
                'AI产品设计', '市场分析', '用户研究', 'Python', 
                'React', 'GPT-4V', 'Unity', '机器学习'
            ],
            'contact': {
                'email': 'lileiaad@connect.hku.hk',
                'phone': '(86) 15243684038',
                'linkedin': 'linkedin.com/in/lilei',
                'github': 'github.com/lilei'
            }
        }
        super().__init__(*args, **kwargs)
    
    def end_headers(self):
        # 添加CORS头部
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        # 处理预检请求
        self.send_response(200)
        self.end_headers()
    
    def do_POST(self):
        """处理POST请求"""
        if self.path == '/api/chat':
            self.handle_chat_request()
        else:
            self.send_error(404, "API endpoint not found")
    
    def handle_chat_request(self):
        """处理聊天请求"""
        try:
            # 读取请求数据
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            message = data.get('message', '').strip()
            if not message:
                self.send_json_response({'error': '消息不能为空'}, 400)
                return
            
            # 检查是否有有效的API密钥
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key or api_key == 'your_api_key_here':
                # 如果没有API密钥，使用本地智能回复
                response = self.generate_local_response(message)
                self.send_json_response({
                    'response': response,
                    'source': 'local',
                    'message': '使用本地智能回复（未配置OpenAI API密钥）'
                })
                return
            
            # 异步调用OpenAI API
            response = asyncio.run(self.call_openai_api(message, api_key))
            self.send_json_response({
                'response': response,
                'source': 'openai',
                'message': '来自OpenAI GPT的回复'
            })
            
        except json.JSONDecodeError:
            self.send_json_response({'error': '无效的JSON数据'}, 400)
        except Exception as e:
            print(f"处理聊天请求时出错: {e}")
            # 出错时回退到本地回复
            try:
                local_response = self.generate_local_response(data.get('message', ''))
                self.send_json_response({
                    'response': local_response,
                    'source': 'local_fallback',
                    'message': 'API调用失败，使用本地回复'
                })
            except:
                self.send_json_response({'error': '服务器内部错误'}, 500)
    
    async def call_openai_api(self, message: str, api_key: str) -> str:
        """异步调用OpenAI API"""
        
        system_prompt = f"""你是李磊的AI助手，专门为访问他个人网站的用户提供服务。

关于李磊的信息：
- 姓名：{self.lei_info['name']}
- 职位：{self.lei_info['title']}
- 教育背景：{self.lei_info['education']['master']}，{self.lei_info['education']['bachelor']}
- 荣誉：{self.lei_info['education']['honor']}

工作经历：
{chr(10).join([f"- {exp['company']} - {exp['position']}: {exp['description']}" for exp in self.lei_info['experience']])}

主要项目：
{chr(10).join([f"- {project}" for project in self.lei_info['projects']])}

技能专长：
{', '.join(self.lei_info['skills'])}

联系方式：
- 邮箱：{self.lei_info['contact']['email']}
- 电话：{self.lei_info['contact']['phone']}
- LinkedIn：{self.lei_info['contact']['linkedin']}
- GitHub：{self.lei_info['contact']['github']}

请以友好、专业的语气回答用户问题，重点介绍李磊的专业能力和项目经验。回复应该简洁明了，通常控制在200字以内。"""

        # 获取模型和API端点配置
        model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
        api_base = os.getenv('OPENAI_API_BASE', 'https://turingai.plus/v1/chat/completions')
        
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            "max_tokens": int(os.getenv('OPENAI_MAX_TOKENS', '500')),
            "temperature": float(os.getenv('OPENAI_TEMPERATURE', '0.7'))
        }
        
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        print(f"🤖 调用API: {api_base}")
        print(f"📝 使用模型: {model}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    api_base,
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        print(f"📥 API响应数据: {data}")
                        
                        # 检查不同的响应格式
                        if 'choices' in data and len(data['choices']) > 0:
                            choice = data['choices'][0]
                            if 'message' in choice and 'content' in choice['message']:
                                content = choice['message']['content'].strip()
                            elif 'text' in choice:
                                content = choice['text'].strip()
                            elif isinstance(choice, str):
                                content = choice.strip()
                            else:
                                print(f"⚠️ 未知的choice格式: {choice}")
                                content = str(choice)
                        elif 'data' in data:
                            content = data['data'].strip()
                        elif 'result' in data:
                            content = data['result'].strip()
                        elif 'response' in data:
                            content = data['response'].strip()
                        else:
                            print(f"⚠️ 未知的响应格式: {data}")
                            content = str(data)
                        
                        if not content:
                            content = "抱歉，收到了空响应。"
                        
                        return content
                    else:
                        error_text = await response.text()
                        print(f"OpenAI API错误 {response.status}: {error_text}")
                        raise Exception(f"API调用失败: {response.status}")
        except asyncio.TimeoutError:
            raise Exception("API调用超时")
        except Exception as e:
            print(f"OpenAI API调用异常: {e}")
            raise
    
    def generate_local_response(self, message: str) -> str:
        """生成本地智能回复"""
        message_lower = message.lower()
        
        # 问候语
        if any(word in message_lower for word in ['你好', 'hi', 'hello', '您好', '嗨', 'hey']):
            greetings = [
                f'你好！很高兴见到你！我是{self.lei_info["name"]}的AI助手，可以为您介绍他的项目、研究经历和专业技能。有什么想了解的吗？',
                f'您好！欢迎访问{self.lei_info["name"]}的个人网站！我可以为您详细介绍他在AI产品管理、建筑设计和研究领域的精彩经历。',
                f'Hi！我是{self.lei_info["name"]}的智能助手，很高兴为您服务！他是一位经验丰富的{self.lei_info["title"]}，您想了解哪个方面呢？'
            ]
            import random
            return random.choice(greetings)
        
        # 关于李磊
        if any(word in message_lower for word in ['李磊', '介绍', '背景', '是谁', '简介']):
            return f'{self.lei_info["name"]}是一位优秀的{self.lei_info["title"]}，{self.lei_info["education"]["master"]}，{self.lei_info["education"]["bachelor"]}，{self.lei_info["education"]["honor"]}。他具备从前沿研究到产品落地的全链路能力，擅长以产品化方法探索和驱动AI技术的商业价值。'
        
        # 工作经验
        if any(word in message_lower for word in ['工作', '经验', '云鲸致', '职业', '经历', '公司']):
            exp_text = f'{self.lei_info["name"]}拥有丰富的工作经验：\n\n'
            for exp in self.lei_info['experience']:
                exp_text += f'🏢 {exp["company"]} - {exp["position"]}\n{exp["description"]}\n\n'
            return exp_text.strip()
        
        # 项目相关
        if any(word in message_lower for word in ['项目', '云秒搭', '智能体', '平台', '产品']):
            projects = [
                f'{self.lei_info["name"]}主导了云秒搭智能体平台的0-1建设，基于"垂直行业解决方案工厂"的核心战略。通过深度竞品分析与用户访谈，将识别准确率做到领先竞品15%。',
                f'他还开发了建筑参数化协同设计平台，将协同周期缩短37%，以及基于Unity的AR/VR建筑设计应用，为建筑行业带来了创新的解决方案。',
                f'{self.lei_info["name"]}参与了深圳房价与微博情绪关系的数据科学研究项目，与MIT学者合作，展现了他在跨学科研究方面的能力。'
            ]
            import random
            return random.choice(projects)
        
        # 技能相关
        if any(word in message_lower for word in ['技能', '技术', '能力', '专长', '擅长']):
            skills_text = f'{self.lei_info["name"]}具备全面的AI产品管理技能：\n\n'
            skills_text += '🎯 核心能力：AI产品设计、市场分析、用户研究、技术选型\n'
            skills_text += f'💻 技术栈：{", ".join(self.lei_info["skills"])}\n'
            skills_text += '🚀 专业领域：AI Agent、计算机视觉、AIGC、建筑参数化设计'
            return skills_text
        
        # 联系方式
        if any(word in message_lower for word in ['联系', '邮箱', '电话', '微信', '怎么找', 'contact']):
            contact = self.lei_info['contact']
            return f'很高兴您想要联系{self.lei_info["name"]}！以下是他的联系方式：\n\n📧 邮箱：{contact["email"]}\n📱 电话：{contact["phone"]}\n💼 LinkedIn：{contact["linkedin"]}\n💻 GitHub：{contact["github"]}\n\n欢迎随时联系，他很乐意与您交流AI产品管理和技术创新的话题！'
        
        # 感谢和再见
        if any(word in message_lower for word in ['谢谢', '感谢', '再见', '拜拜', 'thank']):
            return f'非常感谢您对{self.lei_info["name"]}的关注！如果您有任何其他问题，或者希望与{self.lei_info["name"]}取得联系，请随时告诉我。祝您生活愉快！👋'
        
        # 默认回复
        default_responses = [
            f'这是一个很有趣的问题！{self.lei_info["name"]}在AI产品管理方面有很多经验，您想了解他的哪个具体项目呢？',
            f'让我为您介绍一下{self.lei_info["name"]}的专业背景。他是{self.lei_info["title"]}，在智能体平台、建筑参数化设计、数据科学等领域都有丰富经验。',
            f'您想了解{self.lei_info["name"]}的哪个方面呢？我可以为您介绍他的项目经历、研究背景、专业技能或联系方式。',
            f'{self.lei_info["name"]}是一位很有才华的{self.lei_info["title"]}，在多个领域都有出色表现。您对哪个方面比较感兴趣？'
        ]
        import random
        return random.choice(default_responses)
    
    def send_json_response(self, data: Dict[str, Any], status_code: int = 200):
        """发送JSON响应"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))


class DualServerHandler:
    """双服务器处理器：同时运行静态文件服务器和API服务器"""
    
    def __init__(self, static_port=8000, api_port=8001):
        self.static_port = static_port
        self.api_port = api_port
        self.static_server = None
        self.api_server = None
    
    def start_static_server(self):
        """启动静态文件服务器"""
        try:
            self.static_server = HTTPServer(('localhost', self.static_port), SimpleHTTPRequestHandler)
            print(f"✅ 静态文件服务器启动在: http://localhost:{self.static_port}")
            self.static_server.serve_forever()
        except Exception as e:
            print(f"❌ 静态文件服务器启动失败: {e}")
    
    def start_api_server(self):
        """启动API服务器"""
        try:
            self.api_server = HTTPServer(('localhost', self.api_port), ChatbotAPIHandler)
            print(f"✅ API服务器启动在: http://localhost:{self.api_port}")
            print(f"📡 聊天API端点: http://localhost:{self.api_port}/api/chat")
            self.api_server.serve_forever()
        except Exception as e:
            print(f"❌ API服务器启动失败: {e}")
    
    def start(self):
        """启动双服务器"""
        print("🚀 正在启动李磊个人网站服务器...")
        print("=" * 50)
        
        # 检查API密钥配置
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key or api_key == 'your_api_key_here':
            print("⚠️  未检测到OpenAI API密钥")
            print("💡 聊天机器人将使用本地智能回复模式")
            print("🔧 要启用GPT功能，请设置环境变量：export OPENAI_API_KEY=your_key")
        else:
            print("✅ 检测到OpenAI API密钥，GPT功能已启用")
        
        print("=" * 50)
        
        # 创建线程启动两个服务器
        static_thread = threading.Thread(target=self.start_static_server, daemon=True)
        api_thread = threading.Thread(target=self.start_api_server, daemon=True)
        
        static_thread.start()
        time.sleep(0.5)  # 给静态服务器一点启动时间
        api_thread.start()
        
        print("\n🌟 服务器已启动！")
        print(f"🌐 访问网站: http://localhost:{self.static_port}")
        print(f"🤖 API服务: http://localhost:{self.api_port}")
        print("\n⌨️  按 Ctrl+C 停止服务器")
        
        try:
            # 保持主线程运行
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n\n👋 正在关闭服务器...")
            if self.static_server:
                self.static_server.shutdown()
            if self.api_server:
                self.api_server.shutdown()
            print("✅ 服务器已关闭")


if __name__ == "__main__":
    # 切换到脚本所在目录
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # 启动双服务器
    server = DualServerHandler()
    server.start()
