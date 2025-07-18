# 🧹 Полная очистка Docker кэша и перезапуск

## Проблема:
```
ERROR: for server  Container "12500091de82" is unhealthy.
```

Несмотря на то, что health check убран из docker-compose.yml, Docker все еще использует старую конфигурацию из кэша.

## 🚀 Решение: Полная очистка

### Шаг 1: Остановить и удалить все
```bash
# Остановить все контейнеры проекта
docker-compose down

# Удалить все контейнеры, сети и volumes
docker-compose down --volumes --remove-orphans

# Удалить образы проекта
docker-compose down --rmi all --volumes --remove-orphans
```

### Шаг 2: Очистить Docker кэш
```bash
# Удалить все неиспользуемые образы
docker image prune -a

# Удалить все неиспользуемые контейнеры
docker container prune

# Удалить все неиспользуемые сети
docker network prune

# Удалить все неиспользуемые volumes
docker volume prune

# ПОЛНАЯ очистка (осторожно!)
docker system prune -a --volumes
```

### Шаг 3: Пересобрать с нуля
```bash
# Пересобрать образы без кэша
docker-compose build --no-cache

# Запустить заново
docker-compose up -d
```

## 🔍 Диагностика

### Проверить что health check действительно убран:
```bash
# Проверить конфигурацию
docker-compose config

# Должно показать server без healthcheck секции
```

### Проверить логи:
```bash
# Логи всех сервисов
docker-compose logs

# Логи конкретного сервиса
docker-compose logs server
docker-compose logs postgres
```

### Проверить статус:
```bash
# Статус контейнеров
docker-compose ps

# Детальная информация о контейнере
docker inspect game_server
```

## ⚡ Быстрая команда (все в одном):

```bash
docker-compose down --rmi all --volumes --remove-orphans && \
docker system prune -a --volumes -f && \
docker-compose build --no-cache && \
docker-compose up -d
```

## 🎯 Ожидаемый результат:

После полной очистки и пересборки:

```bash
$ docker-compose ps
NAME                COMMAND                  SERVICE             STATUS              PORTS
game_client         "docker-entrypoint.s…"   client              running             0.0.0.0:80->80/tcp
game_postgres       "docker-entrypoint.s…"   postgres            running (healthy)   0.0.0.0:5432->5432/tcp
game_server         "docker-entrypoint.s…"   server              running             0.0.0.0:3001->3001/tcp
```

**Важно:** server должен быть в статусе `running`, а НЕ `running (healthy)`, так как health check убран.

## 🔧 Если проблема остается:

### Проверить Dockerfile:
Убедиться, что в Dockerfile нет HEALTHCHECK инструкций:
```bash
grep -i healthcheck Dockerfile
```

### Проверить docker-compose.yml:
```bash
grep -A 10 -B 5 healthcheck docker-compose.yml
```

Должен показать только postgres healthcheck, но НЕ server.

## 📋 Альтернативное решение:

Если проблема все еще есть, можно временно использовать простую архитектуру:

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
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql:/docker-entrypoint-initdb.d

  app:
    build: .
    container_name: game_app
    ports:
      - "80:80"
      - "3001:3001"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:root@postgres:5432/game
    depends_on:
      - postgres
    command: ["npm", "run", "dev"]

volumes:
  postgres_data:
```

Это запустит все в одном контейнере без сложных зависимостей.