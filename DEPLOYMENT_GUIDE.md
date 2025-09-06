# 李磊个人网站 - 部署指南

## 🚀 部署方案概览

本指南提供了多种部署方案，从本地开发到生产环境，满足不同需求。

---

## 📋 目录

1. [本地持久化运行](#1-本地持久化运行)
2. [Docker容器化部署](#2-docker容器化部署)
3. [云服务部署](#3-云服务部署)
4. [域名和HTTPS配置](#4-域名和https配置)
5. [监控和维护](#5-监控和维护)

---

## 1. 📱 本地持久化运行

### 方案A: nohup后台运行 (推荐)

```bash
# 1. 运行部署脚本
chmod +x deploy_local.sh
./deploy_local.sh

# 2. 选择选项1，创建nohup脚本

# 3. 启动服务器
./start_persistent.sh

# 4. 检查状态
./status_server.sh

# 5. 停止服务器
./stop_server.sh
```

**优点**: 简单易用，适合开发测试
**缺点**: 需要电脑保持开机

### 方案B: macOS开机自启动

```bash
# 1. 创建LaunchAgent服务
./deploy_local.sh  # 选择选项2

# 2. 加载服务
launchctl load ~/Library/LaunchAgents/com.lilei.portfolio.plist

# 3. 启动服务
launchctl start com.lilei.portfolio

# 4. 检查服务状态
launchctl list | grep lilei

# 5. 卸载服务 (如需)
launchctl unload ~/Library/LaunchAgents/com.lilei.portfolio.plist
```

**优点**: 开机自启动，系统级服务
**缺点**: 仍需要电脑保持开机

---

## 2. 🐳 Docker容器化部署

### 方案A: Docker Compose (推荐)

```bash
# 1. 安装Docker和Docker Compose
# macOS: brew install docker docker-compose
# 或下载 Docker Desktop

# 2. 构建和启动
docker-compose up -d

# 3. 查看状态
docker-compose ps
docker-compose logs -f

# 4. 停止服务
docker-compose down

# 5. 重新部署
docker-compose down
docker-compose up -d --build
```

### 方案B: 单独Docker容器

```bash
# 1. 构建镜像
docker build -t lilei-portfolio .

# 2. 运行容器
docker run -d \
  --name lilei-portfolio \
  -p 8000:8000 \
  -p 8001:8001 \
  -e OPENAI_API_KEY=your_api_key \
  -e OPENAI_API_BASE=https://turingai.plus/v1/chat/completions \
  -e OPENAI_MODEL=gpt-4o-mini \
  --restart unless-stopped \
  lilei-portfolio

# 3. 查看日志
docker logs -f lilei-portfolio

# 4. 停止容器
docker stop lilei-portfolio
docker rm lilei-portfolio
```

**优点**: 环境隔离，易于迁移，支持自动重启
**缺点**: 需要学习Docker

---

## 3. ☁️ 云服务部署

### 方案A: VPS服务器 (推荐)

#### 阿里云/腾讯云/华为云

```bash
# 1. 购买云服务器 (1核2G内存即可)
# 2. 连接服务器
ssh root@your_server_ip

# 3. 安装Docker
curl -fsSL https://get.docker.com | sh
systemctl start docker
systemctl enable docker

# 4. 上传项目文件
scp -r . root@your_server_ip:/opt/lilei-portfolio/

# 5. 运行服务
cd /opt/lilei-portfolio
docker-compose up -d

# 6. 配置防火墙
# 阿里云控制台: 安全组开放8000,8001端口
# 腾讯云控制台: 防火墙开放8000,8001端口
```

#### AWS EC2

```bash
# 1. 创建EC2实例 (t2.micro免费层)
# 2. 配置安全组开放8000,8001端口
# 3. 连接实例
ssh -i your-key.pem ec2-user@your-instance-ip

# 4. 安装Docker
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# 5. 部署应用
# (同VPS部署步骤)
```

### 方案B: Serverless部署

#### Vercel (前端 + API)

```bash
# 1. 安装Vercel CLI
npm i -g vercel

# 2. 部署
vercel --prod

# 3. 配置环境变量
vercel env add OPENAI_API_KEY
vercel env add OPENAI_API_BASE
vercel env add OPENAI_MODEL
```

#### Railway

```bash
# 1. 连接GitHub仓库
# 2. 一键部署
# 3. 配置环境变量
```

**优点**: 免运维，自动扩容，全球CDN
**缺点**: 可能有冷启动延迟

---

## 4. 🌐 域名和HTTPS配置

### 方案A: Nginx反向代理 + Let's Encrypt

```bash
# 1. 安装Nginx
sudo apt install nginx

# 2. 配置Nginx
sudo nano /etc/nginx/sites-available/lilei-portfolio

# 配置内容:
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api/ {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# 3. 启用配置
sudo ln -s /etc/nginx/sites-available/lilei-portfolio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 4. 安装SSL证书
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 方案B: Cloudflare + 域名

```bash
# 1. 在Cloudflare添加域名
# 2. 配置DNS A记录指向服务器IP
# 3. 启用Cloudflare SSL/TLS
# 4. 配置页面规则和缓存
```

---

## 5. 📊 监控和维护

### 健康检查脚本

```bash
# 创建监控脚本
cat > monitor.sh << 'EOF'
#!/bin/bash
# 健康检查和自动重启

check_service() {
    if ! curl -s http://localhost:8000 > /dev/null; then
        echo "$(date): 服务异常，正在重启..."
        docker-compose restart
        sleep 10
        if curl -s http://localhost:8000 > /dev/null; then
            echo "$(date): 服务重启成功"
        else
            echo "$(date): 服务重启失败，请手动检查"
        fi
    fi
}

check_service
EOF

# 添加到crontab (每5分钟检查一次)
(crontab -l 2>/dev/null; echo "*/5 * * * * /path/to/monitor.sh >> /var/log/portfolio-monitor.log") | crontab -
```

### 日志管理

```bash
# 日志轮转配置
sudo nano /etc/logrotate.d/lilei-portfolio

# 配置内容:
/opt/lilei-portfolio/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 root root
}
```

### 备份脚本

```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/lilei-portfolio"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/portfolio_$DATE.tar.gz \
    /opt/lilei-portfolio \
    --exclude=/opt/lilei-portfolio/logs

# 保留最近30天的备份
find $BACKUP_DIR -name "portfolio_*.tar.gz" -mtime +30 -delete
EOF

# 每天备份
(crontab -l 2>/dev/null; echo "0 2 * * * /path/to/backup.sh") | crontab -
```

---

## 🔧 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   lsof -i :8000 :8001
   kill -9 <PID>
   ```

2. **Docker容器无法启动**
   ```bash
   docker logs lilei-portfolio
   docker-compose logs
   ```

3. **API调用失败**
   ```bash
   curl -X POST http://localhost:8001/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"test"}'
   ```

4. **内存不足**
   ```bash
   free -h
   docker system prune -a
   ```

### 性能优化

1. **启用Gzip压缩**
2. **配置CDN**
3. **数据库连接池**
4. **缓存策略**

---

## 📞 技术支持

如有问题，请联系：
- 📧 邮箱：lileiaad@connect.hku.hk
- 💻 GitHub：github.com/lilei
- 💼 LinkedIn：linkedin.com/in/lilei

---

## 📄 许可证

本项目采用 MIT 许可证。

