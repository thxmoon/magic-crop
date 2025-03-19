# Magic Crop 部署指南

## 方案一：使用 Render.com 部署（推荐）

[Render](https://render.com) 是一个简单易用的云平台，支持直接从 GitHub 部署 Node.js 应用。

### 步骤：

1. 注册 [Render.com](https://render.com) 账号
2. 点击 "New +" 按钮，选择 "Web Service"
3. 连接你的 GitHub 仓库
4. 配置以下设置：
   - **Name**: magic-crop (或任何你喜欢的名称)
   - **Environment**: Node
   - **Region**: 选择离你用户最近的区域
   - **Branch**: master (或你的主分支)
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (或按需选择)
5. 在 "Environment Variables" 部分添加以下环境变量：
   - `NODE_ENV`: production
   - `NEXT_PUBLIC_SUPABASE_URL`: 你的 Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 你的 Supabase 匿名密钥
6. 点击 "Create Web Service"

Render 会自动部署你的应用，并提供一个 `*.onrender.com` 的域名。

## 方案二：使用 DigitalOcean App Platform

DigitalOcean 的 App Platform 提供了一个简单的方式来部署 Node.js 应用，无需管理服务器。

### 步骤：

1. 注册 [DigitalOcean](https://digitalocean.com) 账号
2. 在控制面板中，点击 "Create" > "Apps"
3. 连接你的 GitHub 仓库
4. 选择你的仓库和分支
5. 配置以下设置：
   - **Environment**: Node.js
   - **Build Command**: `npm ci && npm run build`
   - **Run Command**: `npm start`
   - **HTTP Port**: 3000
6. 添加环境变量：
   - `NODE_ENV`: production
   - `NEXT_PUBLIC_SUPABASE_URL`: 你的 Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 你的 Supabase 匿名密钥
7. 选择计划（Basic 计划足够用于小型应用）
8. 点击 "Launch App"

## 方案三：使用 Heroku

Heroku 是一个流行的 PaaS 平台，非常适合部署 Node.js 应用。

### 步骤：

1. 注册 [Heroku](https://heroku.com) 账号
2. 安装 [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
3. 在项目根目录创建 `Procfile` 文件，内容为：
   ```
   web: npm start
   ```
4. 初始化 Git 仓库（如果尚未初始化）：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
5. 创建 Heroku 应用：
   ```bash
   heroku create magic-crop
   ```
6. 设置环境变量：
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set NEXT_PUBLIC_SUPABASE_URL=你的Supabase网址
   heroku config:set NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
   ```
7. 部署应用：
   ```bash
   git push heroku master
   ```

## 方案四：使用传统 VPS (如 DigitalOcean Droplet)

如果你想要更多控制权，可以使用传统的 VPS 部署。

### 步骤：

1. 创建一个 VPS（如 DigitalOcean Droplet，选择 Ubuntu 20.04）
2. 通过 SSH 连接到服务器
3. 安装 Node.js 和 npm：
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
4. 安装 PM2（进程管理器）：
   ```bash
   sudo npm install -g pm2
   ```
5. 克隆你的仓库：
   ```bash
   git clone https://github.com/thxmoon/magic-crop.git
   cd magic-crop
   ```
6. 安装依赖并构建应用：
   ```bash
   npm ci
   npm run build
   ```
7. 设置环境变量：
   ```bash
   echo "NODE_ENV=production" >> .env
   echo "NEXT_PUBLIC_SUPABASE_URL=你的Supabase网址" >> .env
   echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥" >> .env
   ```
8. 使用 PM2 启动应用：
   ```bash
   pm2 start npm --name "magic-crop" -- start
   pm2 save
   pm2 startup
   ```
9. 安装 Nginx 作为反向代理：
   ```bash
   sudo apt install nginx -y
   ```
10. 配置 Nginx：
    ```bash
    sudo nano /etc/nginx/sites-available/magic-crop
    ```
    添加以下配置：
    ```
    server {
        listen 80;
        server_name your-domain.com;
        
        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```
11. 启用配置：
    ```bash
    sudo ln -s /etc/nginx/sites-available/magic-crop /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```
12. 设置 SSL（可选但推荐）：
    ```bash
    sudo apt install certbot python3-certbot-nginx -y
    sudo certbot --nginx -d your-domain.com
    ```

## 故障排除

如果在部署过程中遇到问题，请检查以下几点：

1. **构建失败**：
   - 确保所有依赖都正确安装
   - 检查 `package.json` 中的脚本是否正确
   - 检查 Node.js 版本兼容性

2. **运行时错误**：
   - 确保所有必要的环境变量都已设置
   - 检查日志以获取详细错误信息
   - 确保 Supabase 配置正确

3. **网络问题**：
   - 确保端口 3000 未被防火墙阻止
   - 检查 DNS 设置是否正确
   - 确保 SSL 证书（如果使用）有效

## 推荐方案

对于你的情况，我最推荐使用 **Render.com**，因为：

1. 它不需要 Docker
2. 设置简单，直接从 GitHub 部署
3. 有免费计划
4. 自动处理 HTTPS
5. 不需要修改代码

如果 Render 不适合你，DigitalOcean App Platform 是一个很好的替代选择。
