# 🚨 Срочное исправление Docker проблемы

## Проблема:
```
ERROR: for client  Container "f7731db95b8b" is unhealthy.
ERROR: for server  Container "f7731db95b8b" is unhealthy.
```

**Причина:** Один контейнер используется для server и client - это неправильно!

## 🔧 Быстрое решение

### Вариант 1: Временно убрать health check

Замените в `docker-compose.yml`:

```yaml
client:
  # ... остальная конфигурация
  depends_on:
    postgres:
      condition: service_healthy
    server:
      condition: service_started  # Изменить на service_started
```

### Вариант 2: Исправить архитектуру контейнеров

Проблема в том, что server и client используют один Dockerfile. Нужно разделить:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16.9
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

  # ТОЛЬКО Express API сервер
  server:
    build:
      context: .
      dockerfile: Dockerfile.server  # Отдельный Dockerfile
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
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 15s
      retries: 5
      start_period: 90s

  # ТОЛЬКО React клиент
  client:
    build:
      context: .
      dockerfile: Dockerfile.client  # Отдельный Dockerfile
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

## 🚀 Самое быстрое решение СЕЙЧАС:

1. Остановите контейнеры:
```bash
docker-compose down
```

2. Измените в `docker-compose.yml` только одну строку:
```yaml
client:
  depends_on:
    postgres:
      condition: service_healthy
    server:
      condition: service_started  # Вместо service_healthy
```

3. Запустите снова:
```bash
docker-compose up -d
```

## 📋 Диагностика:

Проверьте логи:
```bash
docker-compose logs server
docker-compose logs client
docker-compose ps
```

## 🎯 Долгосрочное решение:

Создать отдельные Dockerfile для server и client, но это требует больше времени.

**ИСПОЛЬЗУЙТЕ БЫСТРОЕ РЕШЕНИЕ** - измените `condition: service_healthy` на `condition: service_started` для client зависимости от server.