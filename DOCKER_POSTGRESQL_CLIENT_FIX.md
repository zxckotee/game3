# 🚨 Исправление ошибки postgresql-client-16

## Проблема:
```
E: Unable to locate package postgresql-client-16
ERROR: Service 'server' failed to build : Build failed
```

**Причина:** В Ubuntu Bullseye нет пакета `postgresql-client-16`, он называется по-другому.

## 🔧 Исправление Dockerfile

Замените в Dockerfile:

```dockerfile
# НЕПРАВИЛЬНО:
RUN apt-get update && apt-get install -y \
    postgresql-client-16 \
    ...

# ПРАВИЛЬНО:
RUN apt-get update && apt-get install -y \
    postgresql-client \
    ...
```

## 📋 Полный исправленный Dockerfile:

```dockerfile
# Используем Ubuntu-based образ для максимальной совместимости с Ubuntu 24.04
FROM node:18-bullseye-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Обновляем пакеты и устанавливаем зависимости
RUN apt-get update && apt-get install -y \
    postgresql-client \
    python3 \
    build-essential \
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

## 🎯 Альтернативные варианты:

### Вариант 1: Использовать Ubuntu 22.04 (Jammy)
```dockerfile
FROM node:18-jammy-slim

RUN apt-get update && apt-get install -y \
    postgresql-client-14 \
    ...
```

### Вариант 2: Добавить PostgreSQL репозиторий
```dockerfile
FROM node:18-bullseye-slim

RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    && wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
    && echo "deb http://apt.postgresql.org/pub/repos/apt/ bullseye-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update && apt-get install -y \
    postgresql-client-16 \
    ...
```

### Вариант 3: Простое решение (рекомендуется)
```dockerfile
FROM node:18-bullseye-slim

RUN apt-get update && apt-get install -y \
    postgresql-client \
    python3 \
    build-essential \
    git \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*
```

## 🚀 Команды для исправления:

1. Исправьте Dockerfile (замените `postgresql-client-16` на `postgresql-client`)
2. Пересоберите образы:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 📝 Примечание:

Пакет `postgresql-client` в Ubuntu Bullseye включает клиент PostgreSQL 13, который совместим с PostgreSQL 16.9 для базовых операций подключения и health check.