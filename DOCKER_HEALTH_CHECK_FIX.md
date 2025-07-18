# 🔧 Исправление проблемы Health Check

## Проблема:
```
ERROR: for client  Container "69e1ef82bae7" is unhealthy.
```

Server контейнер не проходит health check, поэтому client не может запуститься.

## Возможные причины:

### 1. **Health check слишком строгий**
- Таймаут 10 секунд может быть мало для запуска Express
- Сервер может запускаться дольше 40 секунд (start_period)

### 2. **Endpoint /api/health недоступен**
- Сервер может не успеть запуститься
- Проблемы с подключением к PostgreSQL

### 3. **Curl не работает внутри контейнера**
- Проблемы с сетью между контейнерами

## 🔧 Исправления:

### Вариант 1: Упростить health check
```yaml
server:
  healthcheck:
    test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/api/health"]
    interval: 30s
    timeout: 10s
    retries: 5
    start_period: 60s  # Увеличить время ожидания
```

### Вариант 2: Использовать wget вместо curl
```yaml
server:
  healthcheck:
    test: ["CMD", "wget", "-q", "--spider", "http://localhost:3001/api/health"]
    interval: 30s
    timeout: 15s
    retries: 3
    start_period: 90s
```

### Вариант 3: Проверить только процесс Node.js
```yaml
server:
  healthcheck:
    test: ["CMD", "pgrep", "-f", "node"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 60s
```

### Вариант 4: Убрать health check для server (временно)
```yaml
server:
  # Убрать весь блок healthcheck
  # healthcheck: ...

client:
  depends_on:
    postgres:
      condition: service_healthy
    server:
      condition: service_started  # Изменить на service_started
```

## 🔍 Диагностика:

### Проверить логи server контейнера:
```bash
docker-compose logs server
```

### Проверить статус health check:
```bash
docker-compose ps
docker inspect <server_container_id> | grep -A 10 Health
```

### Проверить доступность endpoint:
```bash
# Войти в server контейнер
docker-compose exec server sh

# Проверить endpoint изнутри
curl http://localhost:3001/api/health
wget -q -O- http://localhost:3001/api/health
```

## 🚀 Рекомендуемое исправление:

### 1. Обновить docker-compose.yml:
```yaml
server:
  # ... остальная конфигурация
  healthcheck:
    test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/api/health"]
    interval: 30s
    timeout: 15s
    retries: 5
    start_period: 90s  # Больше времени для запуска
```

### 2. Добавить wget в Dockerfile:
```dockerfile
# Устанавливаем системные зависимости включая wget для health check
RUN apk add --no-cache \
    postgresql-client \
    python3 \
    make \
    g++ \
    git \
    curl \
    wget
```

### 3. Улучшить health check endpoint:
```javascript
// В src/server.js
app.get('/api/health', async (req, res) => {
  try {
    // Проверить подключение к БД
    await sequelize.authenticate();
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'game-server',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      service: 'game-server',
      database: 'disconnected',
      error: error.message
    });
  }
});
```

## 🎯 Быстрое решение:

Если нужно запустить быстро, временно уберите health check для server:

```yaml
client:
  depends_on:
    postgres:
      condition: service_healthy
    server:
      condition: service_started  # Просто ждать запуска, не health check
```

Это позволит client запуститься, даже если server еще не полностью готов.