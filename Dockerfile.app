# Dockerfile для React приложения
FROM node:18-alpine

# Установка рабочей директории
WORKDIR /app

# Копирование package.json и package-lock.json
COPY package*.json ./

# Установка зависимостей
RUN npm ci --only=production

# Копирование исходного кода (исключая server)
COPY public/ ./public/
COPY src/ ./src/
COPY craco.config.js ./
COPY .env ./

# Исключаем server папку из копирования
RUN rm -rf ./src/server/

# Сборка React приложения
RUN npm run build

# Установка nginx для раздачи статических файлов
FROM nginx:alpine
COPY --from=0 /app/build /usr/share/nginx/html

# Копирование конфигурации nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Открытие порта 80
EXPOSE 80

# Запуск nginx
CMD ["nginx", "-g", "daemon off;"]