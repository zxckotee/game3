# 📦 Оптимизация установки npm зависимостей в Docker

## 🐌 Текущая ситуация

Команда `npm ci --only=production=false --silent` зависает на Step 5/15.

## ⏱️ Сколько ждать?

### Время установки зависимостей:
- **Обычно**: 3-10 минут
- **С медленным интернетом**: 10-20 минут
- **Факторы влияния**:
  - Скорость интернета
  - Количество зависимостей (~30-50 пакетов)
  - Компиляция нативных модулей (sqlite3, bcrypt и др.)

### На машине с 4 CPU:
- **npm ci**: 5-15 минут (нормально)
- **Компиляция**: может занять дополнительное время

## 🚀 Оптимизации для ускорения

### 1. Использовать npm cache
```dockerfile
# Добавить перед npm ci:
RUN npm config set cache /tmp/.npm
```

### 2. Отключить необязательные зависимости
```dockerfile
# Вместо:
RUN npm ci --only=production=false --silent

# Использовать:
RUN npm ci --only=production=false --silent --no-optional
```

### 3. Использовать более быстрый registry
```dockerfile
RUN npm config set registry https://registry.npmjs.org/
RUN npm ci --only=production=false --silent
```

### 4. Многоэтапная сборка для кэширования
```dockerfile
# Кэшировать слой с зависимостями
COPY package*.json ./
RUN npm ci --only=production=false --silent

# Копировать код отдельно
COPY . .
```

## 🔧 Оптимизированный Dockerfile

```dockerfile
# Новый оптимизированный Dockerfile для разработки
FROM node:18-bullseye-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем только необходимые системные зависимости
RUN apt-get update && apt-get install -y \
    git \
    curl \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Настраиваем npm для ускорения
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set cache /tmp/.npm

# Копируем package.json и package-lock.json для кэширования зависимостей
COPY package*.json ./

# Устанавливаем зависимости с оптимизацией
RUN npm ci --only=production=false --silent --no-optional

# Копируем исходный код
COPY . .

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
```

## ⚡ Быстрое решение СЕЙЧАС

### Вариант 1: Подождать (5-15 минут)
- npm ci работает, просто медленно
- Это нормально для первой сборки

### Вариант 2: Прервать и оптимизировать
```bash
# Прервать сборку
Ctrl+C

# Применить оптимизированный Dockerfile
# Запустить заново
docker-compose build --no-cache
```

### Вариант 3: Использовать готовый образ
```dockerfile
# В начале Dockerfile использовать образ с предустановленными зависимостями
FROM node:18-bullseye-slim

# Или использовать Alpine (меньше размер)
FROM node:18-alpine
```

## 📊 Мониторинг процесса

### Проверить что происходит:
```bash
# В другом терминале
docker ps
docker logs <container_id>

# Проверить использование ресурсов
docker stats
```

### Признаки нормальной работы:
- CPU usage: 50-100%
- Memory usage: растет постепенно
- Network I/O: активность скачивания

### Признаки проблем:
- CPU usage: 0%
- Memory usage: не растет
- Network I/O: нет активности

## 🎯 Рекомендация

**Для первого запуска**: Подождать 10-15 минут
**Для последующих**: Использовать оптимизированный Dockerfile

Время установки зависимостей: **5-15 минут** (нормально)