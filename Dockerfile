# Используем Node.js 18 LTS для лучшей совместимости
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем системные зависимости
RUN apk add --no-cache \
    postgresql-client \
    python3 \
    make \
    g++ \
    git

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm config set registry https://registry.npmjs.org/ && \
    npm cache clean --force && \
    npm install --legacy-peer-deps && \
    npm install concurrently --save-dev

# Копируем исходный код
COPY . .

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Меняем владельца файлов
RUN chown -R nextjs:nodejs /app
USER nextjs

# Экспонируем порты для React (3000) и Express (3001)
EXPOSE 3000 3001

# Команда для разработки
CMD ["npm", "run", "dev"]
