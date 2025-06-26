FROM node:16-alpine

WORKDIR /app

# Установка системных зависимостей
RUN apk add --no-cache postgresql-client

# Копирование файлов package
COPY package*.json ./

# Установка зависимостей с очисткой кеша npm
RUN npm config set registry https://registry.npmjs.org/ && \
    npm cache clean --force && \
    npm install --legacy-peer-deps --no-fund --no-audit --force && \
    npm install ajv@8.12.0 --force

# Копирование всего проекта
COPY . .

# Сборка проекта
RUN npm run build

# Экспозиция порта
EXPOSE 80

# Команда запуска
ENV HOST=0.0.0.0
CMD ["sh", "-c", "HOST=0.0.0.0 npm start"]
