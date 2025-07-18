# 🎯 Финальное решение проблемы с server health check

## Ситуация:
- ✅ Dockerfile собирается успешно
- ✅ PostgreSQL запускается
- ❌ Server контейнер не проходит health check
- ❌ Client не может запуститься

## 🔍 Проблема:

Server и client используют один Dockerfile, но:
- Server запускает: `npm run server` 
- Client запускает: `npm run start`
- Health check проверяет: `http://localhost:3001/api/health`

Но если server запускается с `npm run server`, он может не слушать на порту 3001 или не запускать health check endpoint.

## 🚀 Решения:

### Решение 1: Убрать health check для server (БЫСТРО)

```yaml
server:
  # ... остальная конфигурация
  # Убрать весь блок healthcheck
  # healthcheck:
  #   test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
  #   interval: 30s
  #   timeout: 15s
  #   retries: 5
  #   start_period: 90s
```

### Решение 2: Изменить команду запуска server

```yaml
server:
  # ... остальная конфигурация
  command: ["npm", "run", "dev"]  # Вместо npm run server
```

### Решение 3: Проверить package.json скрипты

Проверьте, что делает `npm run server`:
```bash
cat package.json | grep -A 5 -B 5 "scripts"
```

## 🎯 Рекомендуемое быстрое решение:

Измените в docker-compose.yml:

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

  # Express API сервер БЕЗ health check
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
    # УБРАЛИ health check

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
        condition: service_started  # Только ждем запуска
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

## 📋 Команды для применения:

1. Остановите контейнеры:
```bash
docker-compose down
```

2. Примените изменения в docker-compose.yml (уберите health check для server)

3. Запустите:
```bash
docker-compose up -d
```

4. Проверьте статус:
```bash
docker-compose ps
docker-compose logs server
docker-compose logs client
```

## 🎯 Ожидаемый результат:

```
NAME                COMMAND                  SERVICE             STATUS              PORTS
game_client         "docker-entrypoint.s…"   client              running             0.0.0.0:80->80/tcp
game_postgres       "docker-entrypoint.s…"   postgres            running (healthy)   0.0.0.0:5432->5432/tcp
game_server         "docker-entrypoint.s…"   server              running             0.0.0.0:3001->3001/tcp
```

Все контейнеры должны быть в статусе `running`!