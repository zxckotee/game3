# Используем Node.js 18 LTS для лучшей совместимости
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем системные зависимости включая curl для health check
RUN apk add --no-cache \
    postgresql-client \
    python3 \
    make \
    g++ \
    git \
    curl

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm config set registry https://registry.npmjs.org/ && \
    npm cache clean --force && \
    npm install --legacy-peer-deps

# Копируем исходный код
COPY . .

# Экспонируем порты для React (80) и Express (3001)
EXPOSE 80 3001

# По умолчанию запускаем npm run dev
CMD ["npm", "run", "dev"]
