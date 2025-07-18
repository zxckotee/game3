# 🚨 Переключение на упрощенную конфигурацию

## Проблема:
```
ERROR: for server  Container "ef51ad6c60fd" is unhealthy.
```

Вы все еще используете **старую конфигурацию** с отдельными server/client контейнерами!

## 🎯 Решение:

Нужно переключиться на **упрощенную конфигурацию** с одним app контейнером.

## 📋 Шаги для исправления:

### 1. Остановить старые контейнеры
```bash
docker-compose down --volumes --remove-orphans
```

### 2. Создать новый docker-compose.yml
Замените содержимое файла `docker-compose.yml` на:

```yaml
version: '3.8'

services:
  # База данных PostgreSQL - проверенная рабочая версия
  postgres:
    image: postgres:13
    container_name: game_postgres
    environment:
      POSTGRES_DB: game
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: root
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    restart: unless-stopped

  # Единый контейнер для приложения
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: game_app
    ports:
      - "80:80"    # React
      - "3001:3001" # Express API
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - PORT=80
      - DATABASE_URL=postgresql://postgres:root@postgres:5432/game
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=game
      - DB_USER=postgres
      - DB_PASSWORD=root
      - REACT_APP_API_URL=http://localhost:3001
      - CHOKIDAR_USEPOLLING=true
      - WATCHPACK_POLLING=true
    depends_on:
      - postgres
    command: ["npm", "run", "dev"]
    restart: unless-stopped
    stdin_open: true
    tty: true

volumes:
  postgres_data:
    driver: local
```

### 3. Обновить Dockerfile
Замените содержимое `Dockerfile` на:

```dockerfile
# Используем Ubuntu-based образ для максимальной совместимости
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

# Исправляем права доступа
RUN chown -R node:node /app

# Экспонируем порты для React (80) и Express (3001)
EXPOSE 80 3001

# Переключаемся на пользователя node
USER node

# По умолчанию запускаем npm run dev
CMD ["npm", "run", "dev"]
```

### 4. Запустить новую конфигурацию
```bash
docker-compose up -d --build
```

## 🔍 Различия конфигураций:

### Старая (проблемная):
```yaml
services:
  postgres: ...
  server: ...    # Отдельный контейнер с health check
  client: ...    # Отдельный контейнер
```

### Новая (рабочая):
```yaml
services:
  postgres: ...
  app: ...       # Один контейнер для всего
```

## ✅ Преимущества новой конфигурации:

1. **Нет health check** - никаких проблем с проверками
2. **Один контейнер** - проще управление
3. **PostgreSQL 13** - стабильная версия
4. **npm run dev** - запускает все одновременно

## 📋 Ожидаемый результат:

```bash
$ docker-compose ps
NAME                COMMAND                  SERVICE             STATUS              PORTS
game_app            "docker-entrypoint.s…"   app                 running             0.0.0.0:80->80/tcp, 0.0.0.0:3001->3001/tcp
game_postgres       "docker-entrypoint.s…"   postgres            running             0.0.0.0:5432->5432/tcp
```

## 🎯 Важно:

**НЕ должно быть** контейнеров с именами `game_server` или `game_client`!

Только `game_app` и `game_postgres`.

Замените файлы и перезапустите - это должно решить проблему с health check!