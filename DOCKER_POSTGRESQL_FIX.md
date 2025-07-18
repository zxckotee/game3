# 🔧 Исправление проблем с PostgreSQL и Alpine Linux

## 🚨 Обнаруженные проблемы:

1. **Несоответствие версий PostgreSQL**: На сервере PostgreSQL 16.9, в Docker указан postgres:15-alpine
2. **Проблемы с Alpine Linux репозиториями**: WARNING: opening from cache https://dl-cdn.alpinelinux.org/alpine/v3.21/main: No such file or directory

## 🚀 Исправленная конфигурация

### 1. Обновленный docker-compose.yml

```yaml
version: '3.8'

services:
  # База данных PostgreSQL - совместимая версия с сервером
  postgres:
    image: postgres:16-alpine  # Изменено с 15 на 16
    container_name: game_postgres
    environment:
      POSTGRES_DB: game
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: root
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d game"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - game_network

  # Express API сервер
  server:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: game_server
    ports:
      - "3001:3001"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - PORT=3001
      - DATABASE_URL=postgresql://postgres:root@postgres:5432/game
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=game
      - DB_USER=postgres
      - DB_PASSWORD=root
    depends_on:
      postgres:
        condition: service_healthy
    command: ["npm", "run", "server"]
    restart: unless-stopped
    networks:
      - game_network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 15s
      retries: 5
      start_period: 90s

  # React клиент
  client:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: game_client
    ports:
      - "80:80"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - PORT=80
      - REACT_APP_API_URL=http://localhost:3001
      - CHOKIDAR_USEPOLLING=true
      - WATCHPACK_POLLING=true
    depends_on:
      postgres:
        condition: service_healthy
      server:
        condition: service_healthy
    command: ["npm", "run", "start"]
    restart: unless-stopped
    stdin_open: true
    tty: true
    networks:
      - game_network

volumes:
  postgres_data:
    driver: local

networks:
  game_network:
    driver: bridge
```

### 2. Исправленный Dockerfile (стабильная версия Alpine)

```dockerfile
# Используем стабильную версию Alpine Linux
FROM node:18-alpine3.19

# Устанавливаем рабочую директорию
WORKDIR /app

# Обновляем индекс пакетов и устанавливаем зависимости
RUN apk update && apk add --no-cache \
    postgresql16-client \
    python3 \
    make \
    g++ \
    git \
    curl \
    wget \
    && rm -rf /var/cache/apk/*

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
```

### 3. Альтернативный Dockerfile (если проблемы с Alpine)

```dockerfile
# Используем Ubuntu-based образ для большей стабильности
FROM node:18-bullseye-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Обновляем пакеты и устанавливаем зависимости
RUN apt-get update && apt-get install -y \
    postgresql-client \
    python3 \
    make \
    g++ \
    git \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

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
```

## 🔧 Инструкции по применению:

### Вариант A: Использовать PostgreSQL 16 + стабильный Alpine
1. Замените `docker-compose.yml` на версию выше (с postgres:16-alpine)
2. Замените `Dockerfile` на версию с alpine3.19

### Вариант B: Использовать Ubuntu-based образ (более стабильно)
1. Замените `docker-compose.yml` на версию выше (с postgres:16-alpine)
2. Замените `Dockerfile` на Ubuntu-based версию

### Команды для применения:

```bash
# Остановить и удалить старые контейнеры
docker-compose down --volumes

# Очистить старые образы
docker system prune -a

# Пересобрать с новой конфигурацией
docker-compose build --no-cache

# Запустить
docker-compose up -d

# Проверить статус
docker-compose ps
```

## 🔍 Проверка совместимости PostgreSQL:

```bash
# Проверить версию в контейнере
docker-compose exec postgres psql -U postgres -c "SELECT version();"

# Проверить подключение
docker-compose exec postgres pg_isready -U postgres -d game
```

## ⚡ Быстрое решение (если все еще проблемы):

Если проблемы продолжаются, используйте внешнюю PostgreSQL:

```yaml
# В docker-compose.yml уберите postgres сервис и измените server:
server:
  # ... остальная конфигурация
  environment:
    - NODE_ENV=development
    - PORT=3001
    - DATABASE_URL=postgresql://postgres:root@host.docker.internal:5432/game
    - DB_HOST=host.docker.internal  # Подключение к PostgreSQL на хосте
    - DB_PORT=5432
    - DB_NAME=game
    - DB_USER=postgres
    - DB_PASSWORD=root
  # Убрать depends_on postgres
```

## 📋 Основные изменения:

1. **PostgreSQL 16** вместо 15 для совместимости
2. **Alpine 3.19** вместо 3.21 для стабильности  
3. **postgresql16-client** вместо postgresql-client
4. **Очистка кэша APK** для уменьшения размера образа
5. **Ubuntu альтернатива** для максимальной стабильности

Эти изменения должны решить проблемы с версиями и репозиториями Alpine Linux.