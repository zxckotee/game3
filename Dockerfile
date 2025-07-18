# Новый оптимизированный Dockerfile для разработки
FROM node:18-bullseye-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем только необходимые системные зависимости
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Копируем package.json и package-lock.json для кэширования зависимостей
COPY package*.json ./

# Устанавливаем зависимости с оптимизацией
RUN npm ci --only=production=false --silent

# Копируем исходный код
COPY . .

# Создаем пользователя для безопасности
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Экспонируем порты
EXPOSE 80 3001

# Устанавливаем переменные окружения для разработки
ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true
ENV GENERATE_SOURCEMAP=false
ENV SKIP_PREFLIGHT_CHECK=true
ENV FAST_REFRESH=true
ENV CI=false

# Запускаем npm run dev (concurrently запускает React и Express)
CMD ["npm", "run", "dev"]