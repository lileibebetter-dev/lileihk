// 聊天机器人模块
// 作者：李磊
// 功能：为个人网站提供智能AI助手功能

class Chatbot {
    constructor() {
        this.isOpen = false;
        this.conversationHistory = [];
        this.init();
    }

    // 初始化聊天机器人
    init() {
        this.bindEvents();
        this.setupKeyboardShortcuts();
        this.checkProtocol();
    }

    // 检查协议并显示警告
    checkProtocol() {
        const isFileProtocol = window.location.protocol === 'file:';
        const warningElement = document.getElementById('protocolWarning');
        
        if (isFileProtocol && warningElement) {
            warningElement.style.display = 'block';
        }
    }

    // 绑定事件
    bindEvents() {
        const toggle = document.getElementById('chatbotToggle');
        const input = document.getElementById('chatbotInput');
        const sendBtn = document.getElementById('chatbotSendBtn');
        const closeBtn = document.getElementById('chatbotCloseBtn');
        
        if (toggle) {
            toggle.addEventListener('click', () => this.toggle());
        }

        if (input) {
            input.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // 点击外部关闭聊天窗口
        document.addEventListener('click', (event) => {
            const chatbotWindow = document.getElementById('chatbotWindow');
            const chatbotToggle = document.getElementById('chatbotToggle');
            
            if (chatbotWindow && chatbotToggle &&
                chatbotWindow.style.display === 'flex' && 
                !chatbotWindow.contains(event.target) && 
                !chatbotToggle.contains(event.target)) {
                this.close();
            }
        });
    }

    // 设置键盘快捷键
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + Shift + C 打开/关闭聊天窗口
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
                event.preventDefault();
                this.toggle();
            }
            
            // Escape 关闭聊天窗口
            if (event.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    // 切换聊天窗口显示状态
    toggle() {
        console.log('切换聊天窗口状态');
        const chatbotWindow = document.getElementById('chatbotWindow');
        if (!chatbotWindow) {
            console.error('找不到聊天窗口元素');
            return;
        }

        const isVisible = chatbotWindow.style.display === 'flex';
        
        if (isVisible) {
            this.close();
        } else {
            this.open();
        }
    }

    // 打开聊天窗口
    open() {
        const chatbotWindow = document.getElementById('chatbotWindow');
        const input = document.getElementById('chatbotInput');
        
        if (chatbotWindow) {
            chatbotWindow.style.display = 'flex';
            this.isOpen = true;
            
            // 延迟聚焦输入框
            if (input) {
                setTimeout(() => input.focus(), 100);
            }
            
            // 添加打开动画
            chatbotWindow.style.transform = 'translateY(20px)';
            chatbotWindow.style.opacity = '0';
            
            setTimeout(() => {
                chatbotWindow.style.transform = 'translateY(0)';
                chatbotWindow.style.opacity = '1';
            }, 10);
        }
    }

    // 关闭聊天窗口
    close() {
        const chatbotWindow = document.getElementById('chatbotWindow');
        if (chatbotWindow) {
            chatbotWindow.style.display = 'none';
            this.isOpen = false;
        }
    }

    // 发送消息
    async sendMessage() {
        console.log('发送消息');
        const input = document.getElementById('chatbotInput');
        const message = input.value.trim();
        
        if (!message) {
            console.log('消息为空，不处理');
            return;
        }
        
        // 添加用户消息
        this.addMessage(message, 'user');
        input.value = '';
        
        // 显示打字指示器
        this.showTypingIndicator();
        
        try {
            // 首先尝试调用后端API
            const response = await this.callBackendAPI(message);
            this.hideTypingIndicator();
            this.addMessage(response, 'bot');
        } catch (error) {
            console.warn('API调用失败，使用本地回复:', error);
            
            // 检查是否是CORS或file协议问题
            const isFileProtocol = window.location.protocol === 'file:';
            if (isFileProtocol) {
                // 如果是file协议，显示特殊提示
                setTimeout(() => {
                    this.hideTypingIndicator();
                    const corsMessage = `⚠️ 检测到您正在通过文件协议访问页面。\n\n🌐 要使用GPT功能，请访问：http://localhost:8000\n\n💡 目前使用本地智能回复模式。`;
                    this.addMessage(corsMessage, 'bot');
                }, 500);
            } else {
                // 如果API调用失败，回退到本地回复
                setTimeout(() => {
                    this.hideTypingIndicator();
                    const response = this.generateResponse(message);
                    this.addMessage(response + '\n\n💡 (本地回复模式)', 'bot');
                }, 500);
            }
        }
    }

    // 调用后端API
    async callBackendAPI(message) {
        // 检测当前环境并设置正确的API URL
        const isLocalDevelopment = window.location.hostname === 'localhost' || 
                                   window.location.hostname === '127.0.0.1' ||
                                   window.location.protocol === 'file:';
        
        const API_BASE_URL = isLocalDevelopment 
            ? 'http://localhost:8001' 
            : '/api'; // 生产环境使用相对路径
        
        console.log('当前协议:', window.location.protocol);
        console.log('当前主机:', window.location.hostname);
        console.log('使用API基础URL:', API_BASE_URL);
        console.log('正在调用后端API:', `${API_BASE_URL}/api/chat`);
        
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // 根据响应来源添加标识
        let responseText = data.response;
        if (data.source === 'openai') {
            responseText += '\n\n🤖 (GPT智能回复)';
        } else if (data.source === 'local') {
            responseText += '\n\n💡 (本地智能回复)';
        } else if (data.source === 'local_fallback') {
            responseText += '\n\n⚠️ (API调用失败，本地回复)';
        }
        
        console.log('API调用成功，来源:', data.source);
        return responseText;
    }

    // 添加消息到聊天界面
    addMessage(text, sender) {
        console.log(`添加消息: ${sender} - ${text}`);
        const messagesContainer = document.getElementById('chatbotMessages');
        
        if (!messagesContainer) {
            console.error('找不到消息容器');
            return;
        }
        
        const messageDiv = document.createElement('div');
        
        // 设置消息样式类
        messageDiv.className = `chatbot-message ${sender}`;
        
        // 如果是机器人消息，支持换行
        if (sender === 'bot') {
            messageDiv.style.whiteSpace = 'pre-line';
        }
        
        messageDiv.textContent = text;
        messagesContainer.appendChild(messageDiv);
        
        // 滚动到底部
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // 保存对话历史
        this.conversationHistory.push({
            text,
            sender,
            timestamp: new Date()
        });
        
        // 添加消息动画
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            messageDiv.style.transition = 'all 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 10);
    }

    // 显示打字指示器
    showTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.style.display = 'flex';
            const messagesContainer = document.getElementById('chatbotMessages');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }
    }

    // 隐藏打字指示器
    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    // 生成智能回复
    generateResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        // 检测当前语言设置
        const currentLanguage = localStorage.getItem('preferred-language') || 'zh';
        const isChinese = currentLanguage === 'zh';
        
        // 问候语 - 更多变体
        if (message.includes('你好') || message.includes('hi') || message.includes('hello') || 
            message.includes('您好') || message.includes('嗨') || message.includes('hey')) {
            const greetings = isChinese ? [
                '你好！很高兴见到你！我是李磊的AI助手，可以为您介绍他的项目、研究经历和专业技能。有什么想了解的吗？',
                '您好！欢迎访问李磊的个人网站！我可以为您详细介绍他在AI产品管理、建筑设计和研究领域的精彩经历。',
                'Hi！我是李磊的智能助手，很高兴为您服务！李磊是一位经验丰富的AI产品经理，您想了解他的哪个方面呢？'
            ] : [
                'Hello! Nice to meet you! I am Li Lei\'s AI assistant and can introduce you to his projects, research experience and professional skills. What would you like to know?',
                'Welcome to Li Lei\'s personal website! I can provide detailed information about his experience in AI product management, architectural design and research.',
                'Hi! I\'m Li Lei\'s intelligent assistant, happy to serve you! Li Lei is an experienced AI Product Manager. Which aspect would you like to know about?'
            ];
            return greetings[Math.floor(Math.random() * greetings.length)];
        }
        
        // 关于李磊 - 扩展关键词
        if (message.includes('李磊') || message.includes('介绍') || message.includes('背景') || 
            message.includes('是谁') || message.includes('简介') || message.includes('个人资料')) {
            return isChinese ? 
                '李磊是一位优秀的AI产品经理，硕士毕业于香港大学，本科毕业于长沙理工大学，曾获评湖南省优秀毕业生（前1%）。他具备从前沿研究到产品落地的全链路能力，擅长以产品化方法探索和驱动AI技术的商业价值。在云鲸致人工智能主导了云秒搭智能体平台从0到1的建设，在香港大学将产品化方法创新性地应用于AIGC赋能建筑设计研究。' :
                'Li Lei is an excellent AI Product Manager who graduated with a Master\'s degree from the University of Hong Kong and a Bachelor\'s degree from Changsha University of Science and Technology, where he was honored as a Top 1% Outstanding Graduate of Hunan Province. He has comprehensive capabilities from cutting-edge research to product implementation, specializing in exploring and driving the commercial value of AI technology through product-oriented methodologies. He led the development of Yunmiaoda AI Agent platform from 0 to 1 at Cloudzai AI, and innovatively applied product-oriented methodologies to AIGC-enabled architectural design research at the University of Hong Kong.';
        }
        
        // 项目相关 - 更详细分类
        if (message.includes('项目') || message.includes('云秒搭') || message.includes('智能体') || 
            message.includes('平台') || message.includes('产品')) {
            const projectResponses = isChinese ? [
                '李磊主导了云秒搭智能体平台的0-1建设，基于"垂直行业解决方案工厂"的核心战略。通过深度竞品分析与用户访谈，将识别准确率做到领先竞品15%，同时降低了20%的推理成本。',
                '他还开发了建筑参数化协同设计平台，将协同周期缩短37%，以及基于Unity的AR/VR建筑设计应用，为建筑行业带来了创新的解决方案。',
                '李磊参与了深圳房价与微博情绪关系的数据科学研究项目，与MIT学者合作，展现了他在跨学科研究方面的能力。'
            ] : [
                'Li Lei led the 0-to-1 development of the Yunmiaoda AI Agent platform, based on the core strategy of "Vertical Industry Solution Factory". Through in-depth competitive analysis and user interviews, he achieved 15% higher recognition accuracy than competitors while reducing inference costs by 20%.',
                'He also developed a parametric collaborative design platform that reduced collaboration cycles by 37%, and an AR/VR architectural design application based on Unity, bringing innovative solutions to the construction industry.',
                'Li Lei participated in the data science research project on the relationship between Shenzhen housing prices and Weibo sentiment, collaborating with MIT scholars, demonstrating his cross-disciplinary research capabilities.'
            ];
            return projectResponses[Math.floor(Math.random() * projectResponses.length)];
        }
        
        // 研究相关 - 扩展关键词
        if (message.includes('研究') || message.includes('论文') || message.includes('caad') || 
            message.includes('学术') || message.includes('发表') || message.includes('建筑设计') || 
            message.includes('aigc')) {
            return isChinese ? 
                '李磊在香港大学担任研究助理期间，将产品化方法应用于AIGC赋能建筑设计的研究。他的研究成果以第一作者身份发表于CAAD FUTURES 2025国际会议，将设计方案的整体产出效率提升了7倍。这项研究展现了AI技术在创意设计领域的巨大潜力。' :
                'During his tenure as a Research Assistant at the University of Hong Kong, Li Lei applied product-oriented methodologies to AIGC-enabled architectural design research. His research findings were published as the first author at CAAD FUTURES 2025 international conference, improving overall design output efficiency by 7 times. This research demonstrates the enormous potential of AI technology in creative design fields.';
        }
        
        // 技能相关 - 更全面的技能描述
        if (message.includes('技能') || message.includes('技术') || message.includes('能力') || 
            message.includes('专长') || message.includes('擅长') || message.includes('会什么')) {
            return isChinese ? 
                '李磊具备全面的AI产品管理技能：\n🎯 核心能力：AI产品设计、市场分析、用户研究、技术选型\n💻 技术栈：Python、React、GPT-4V、Unity、机器学习\n🚀 专业领域：AI Agent、计算机视觉、AIGC、建筑参数化设计\n📊 商业能力：竞品分析、用户访谈、数据分析、产品策略' :
                'Li Lei possesses comprehensive AI product management skills:\n🎯 Core Capabilities: AI Product Design, Market Analysis, User Research, Technical Selection\n💻 Tech Stack: Python, React, GPT-4V, Unity, Machine Learning\n🚀 Professional Fields: AI Agent, Computer Vision, AIGC, Parametric Design\n📊 Business Skills: Competitive Analysis, User Interviews, Data Analysis, Product Strategy';
        }
        
        // 联系方式 - 更友好的格式
        if (message.includes('联系') || message.includes('邮箱') || message.includes('电话') || 
            message.includes('微信') || message.includes('怎么找') || message.includes('contact')) {
            return isChinese ? 
                '很高兴您想要联系李磊！以下是他的联系方式：\n\n📧 邮箱：lileiaad@connect.hku.hk\n📱 电话：(86) 15243684038\n💼 LinkedIn：linkedin.com/in/lilei\n💻 GitHub：github.com/lilei\n\n欢迎随时联系，他很乐意与您交流AI产品管理和技术创新的话题！' :
                'Great to hear you want to contact Li Lei! Here are his contact details:\n\n📧 Email: lileiaad@connect.hku.hk\n📱 Phone: (86) 15243684038\n💼 LinkedIn: linkedin.com/in/lilei\n💻 GitHub: github.com/lilei\n\nFeel free to reach out anytime! He\'s happy to discuss AI product management and technological innovation topics with you!';
        }
        
        // 工作经验 - 更详细
        if (message.includes('工作') || message.includes('经验') || message.includes('云鲸致') || 
            message.includes('职业') || message.includes('经历') || message.includes('公司')) {
            return isChinese ? 
                '李磊拥有丰富的工作经验：\n\n🤖 云鲸致人工智能 - AI产品经理\n作为初创团队核心成员，主导云秒搭智能体平台从0到1的建设\n\n🏗️ 深圳市建筑设计研究总院 - 建筑师\n开发参数化协同设计平台，将协同周期缩短37%\n\n🎓 香港大学 - 研究助理\n专注AIGC赋能建筑设计研究，成果发表于国际顶级会议' :
                'Li Lei has rich work experience:\n\n🤖 YunJingZhi AI - AI Product Manager\nAs a core member of the startup team, led the 0-to-1 development of Yunmiaoda AI Agent platform\n\n🏗️ SZADI - Architect\nDeveloped parametric collaborative design platform, reducing collaboration cycles by 37%\n\n🎓 University of Hong Kong - Research Assistant\nFocused on AIGC-enabled architectural design research, published in top international conferences';
        }
        
        // 教育背景 - 更详细
        if (message.includes('教育') || message.includes('学历') || message.includes('大学') || 
            message.includes('学校') || message.includes('毕业') || message.includes('香港大学')) {
            return isChinese ? 
                '李磊的教育背景非常优秀：\n\n🎓 香港大学 - 硕士学位\n专注于AIGC赋能建筑设计研究，师从国际知名学者\n\n🏫 长沙理工大学 - 本科学位\n获评湖南省优秀毕业生（前1%），展现了优异的学术表现\n\n他的跨学科教育背景为他在AI产品管理领域提供了独特的视角。' :
                'Li Lei has an excellent educational background:\n\n🎓 University of Hong Kong - Master\'s Degree\nFocused on AIGC-enabled architectural design research, mentored by internationally renowned scholars\n\n🏫 Changsha University of Science and Technology - Bachelor\'s Degree\nHonored as Top 1% Outstanding Graduate of Hunan Province, demonstrating excellent academic performance\n\nHis interdisciplinary educational background provides him with a unique perspective in AI product management.';
        }
        
        // AR/VR相关
        if (message.includes('ar') || message.includes('vr') || message.includes('虚拟现实') || 
            message.includes('增强现实') || message.includes('unity')) {
            return isChinese ? 
                '李磊在AR/VR领域有出色的项目经验！他基于Unity开发了沉浸式建筑设计应用，为建筑师提供了全新的设计体验。这个项目将传统的2D设计转化为3D沉浸式体验，大大提升了设计效率和创新性。' :
                'Li Lei has excellent project experience in AR/VR! He developed an immersive architectural design application based on Unity, providing architects with a completely new design experience. This project transforms traditional 2D design into 3D immersive experiences, greatly improving design efficiency and innovation.';
        }
        
        // 数据科学相关
        if (message.includes('数据') || message.includes('机器学习') || message.includes('python') || 
            message.includes('算法') || message.includes('分析')) {
            return isChinese ? 
                '李磊在数据科学方面有丰富经验！他参与了深圳房价与微博情绪关系的研究项目，与MIT学者合作，运用机器学习算法分析大数据。他熟练掌握Python、数据挖掘、统计分析等技术，能够从数据中提取有价值的商业洞察。' :
                'Li Lei has rich experience in data science! He participated in the research project on the relationship between Shenzhen housing prices and Weibo sentiment, collaborating with MIT scholars and using machine learning algorithms to analyze big data. He is proficient in Python, data mining, statistical analysis and other technologies, able to extract valuable business insights from data.';
        }
        
        // 感谢和再见
        if (message.includes('谢谢') || message.includes('感谢') || message.includes('再见') || 
            message.includes('拜拜') || message.includes('thank')) {
            return isChinese ? 
                '非常感谢您对李磊的关注！如果您有任何其他问题，或者希望与李磊取得联系，请随时告诉我。祝您生活愉快！👋' :
                'Thank you very much for your attention to Li Lei! If you have any other questions or would like to get in touch with Li Lei, please let me know anytime. Have a great day! 👋';
        }
        
        // 默认回复 - 更多样化
        const defaultResponses = isChinese ? [
            '这是一个很有趣的问题！李磊在AI产品管理方面有很多经验，您想了解他的哪个具体项目呢？',
            '让我为您介绍一下李磊的专业背景。他是AI产品经理，在智能体平台、建筑参数化设计、数据科学等领域都有丰富经验。',
            '您想了解李磊的哪个方面呢？我可以为您介绍他的项目经历、研究背景、专业技能或联系方式。',
            '李磊是一位很有才华的AI产品经理，在多个领域都有出色表现。您对哪个方面比较感兴趣？',
            '我可以为您详细介绍李磊的工作经验、教育背景、技术能力或者研究成果。您希望了解哪个方面呢？',
            '李磊在AI技术产品化方面有独特的见解和丰富实践。您想了解他的具体项目案例还是技术能力？'
        ] : [
            'That\'s a very interesting question! Li Lei has a lot of experience in AI product management. Which specific project would you like to know about?',
            'Let me introduce Li Lei\'s professional background. He is an AI Product Manager with rich experience in AI Agent platforms, parametric design, data science and other fields.',
            'What aspect of Li Lei would you like to know about? I can introduce you to his project experience, research background, professional skills or contact information.',
            'Li Lei is a very talented AI Product Manager with outstanding performance in multiple fields. Which aspect are you most interested in?',
            'I can provide detailed information about Li Lei\'s work experience, educational background, technical capabilities or research achievements. Which aspect would you like to know about?',
            'Li Lei has unique insights and rich practice in AI technology productization. Would you like to know about his specific project cases or technical capabilities?'
        ];
        
        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }

    // 获取对话历史
    getConversationHistory() {
        return this.conversationHistory;
    }

    // 清空对话历史
    clearConversationHistory() {
        this.conversationHistory = [];
        const messagesContainer = document.getElementById('chatbotMessages');
        if (messagesContainer) {
            // 保留欢迎消息
            const welcomeMessage = messagesContainer.querySelector('div');
            messagesContainer.innerHTML = '';
            if (welcomeMessage) {
                messagesContainer.appendChild(welcomeMessage);
            }
        }
    }

    // 导出对话历史
    exportConversation() {
        const data = {
            timestamp: new Date().toISOString(),
            conversation: this.conversationHistory
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chatbot-conversation-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// 全局函数，为了保持向后兼容性
window.toggleChatbot = function() {
    if (window.chatbotInstance) {
        window.chatbotInstance.toggle();
    }
};

window.closeChatbot = function() {
    if (window.chatbotInstance) {
        window.chatbotInstance.close();
    }
};

window.sendMessage = function() {
    if (window.chatbotInstance) {
        window.chatbotInstance.sendMessage();
    }
};

// 页面加载完成后初始化聊天机器人
document.addEventListener('DOMContentLoaded', function() {
    window.chatbotInstance = new Chatbot();
    console.log('聊天机器人初始化完成');
});
