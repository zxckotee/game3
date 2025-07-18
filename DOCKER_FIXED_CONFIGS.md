# 🔧 Исправленные Docker конфигурации

## Проблема
Server контейнер не проходит health check, что блокирует запуск client контейнера.

## 🚀 Решение 1: Исправленный docker-compose.yml

```yaml
version: '3.8'

services:
  # База данных PostgreSQL - запускается первой
  postgres:
    image: postgres:15-alpine
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

  # Express API сервер - запускается после PostgreSQL
  server:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: game_server
    ports:
      - "3001:3001"  # Express API server
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
      # ИСПРАВЛЕНИЕ: Используем wget вместо curl и увеличиваем таймауты
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 15s
      retries: 5
      start_period: 90s  # Увеличено время ожидания

  # React клиент - запускается последним
  client:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: game_client
    ports:
      - "80:80"  # React dev server на порту 80
    volumes:
      # Монтируем исходный код для hot reload
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

## 🚀 Решение 2: Исправленный Dockerfile

```dockerfile
# Используем Node.js 18 LTS для лучшей совместимости
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем системные зависимости включая wget для health check
RUN apk add --no-cache \
    postgresql-client \
    python3 \
    make \
    g++ \
    git \
    curl \
    wget

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

## 🚀 Решение 3: Улучшенный health check endpoint

Добавить в `src/server.js` после строки 111:

```javascript
// Health check endpoint для Docker с проверкой БД
app.get('/api/health', async (req, res) => {
  try {
    // Проверяем подключение к базе данных
    if (unifiedDatabase && unifiedDatabase.sequelize) {
      await unifiedDatabase.sequelize.authenticate();
    }
    
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'game-server',
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'game-server',
      database: 'disconnected',
      error: error.message,
      uptime: process.uptime()
    });
  }
});
```

## 🚀 Решение 4: Быстрое исправление (если нужно запустить срочно)

Если нужно быстро запустить, измените только зависимость client в docker-compose.yml:

```yaml
client:
  # ... остальная конфигурация
  depends_on:
    postgres:
      condition: service_healthy
    server:
      condition: service_started  # Изменить на service_started
```

## 📋 Инструкции по применению:

### Вариант A: Полное исправление
1. Замените содержимое `docker-compose.yml` на код из "Решения 1"
2. Замените содержимое `Dockerfile` на код из "Решения 2"
3. Обновите health check endpoint в `src/server.js` согласно "Решению 3"

### Вариант B: Быстрое исправление
1. Измените только зависимость client согласно "Решению 4"

### Команды для перезапуска:
```bash
# Остановить все контейнеры
docker-compose down

# Пересобрать образы
docker-compose build --no-cache

# Запустить заново
docker-compose up -d

# Проверить логи
docker-compose logs -f server
```

## 🔍 Диагностика:

### Проверить статус контейнеров:
```bash
docker-compose ps
```

### Проверить логи server:
```bash
docker-compose logs server
```

### Проверить health check изнутри контейнера:
```bash
docker-compose exec server wget -q -O- http://localhost:3001/api/health
```

### Проверить доступность endpoint с хоста:
```bash
curl http://localhost:3001/api/health
```

## ⚡ Основные изменения:

1. **wget вместо curl** - более надежный для health check
2. **Увеличенные таймауты** - start_period: 90s, timeout: 15s
3. **Добавлен wget в Dockerfile** - для health check команды
4. **Улучшенный health check endpoint** - с проверкой БД
5. **Больше retries** - 5 попыток вместо 3

Эти изменения должны решить проблему с health check и позволить всем контейнерам запуститься корректно.