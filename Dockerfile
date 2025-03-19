FROM node:18-alpine

WORKDIR /app

# 安装依赖项
COPY package.json package-lock.json ./
RUN npm ci

# 复制源代码
COPY . .

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
