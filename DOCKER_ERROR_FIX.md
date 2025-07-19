# 🔧 Исправление ошибки ContainerConfig

## 🚨 Проблема
```
ERROR: for game_postgres  'ContainerConfig'
ERROR: for postgres  'ContainerConfig'
```

## 🚀 Решение

### Шаг 1: Полная очистка Docker
```bash
# Остановить все контейнеры проекта
docker-compose down --remove-orphans

# Удалить все контейнеры с именами game_*
docker rm -f $(docker ps -aq --filter "name=game_") 2>/dev/null || true
docker rm -f $(docker ps -aq --filter "name=immortal-path") 2>/dev/null || true

# Удалить старые образы
docker rmi -f $(docker images -q --filter "reference=game3*") 2>/dev/null || true

# Очистить неиспользуемые ресурсы
docker system prune -f

# Удалить volumes (ОСТОРОЖНО: удалит данные БД)
docker volume rm game3_postgres_data 2>/dev/null || true
```

### Шаг 2: Проверить docker-compose версию
```bash
docker-compose --version
```

Если версия старая (< 1.29), обновите или используйте `docker compose` (без дефиса).

### Шаг 3: Запуск с исправленной конфигурацией
```bash
# Сборка без кэша
docker-compose build --no-cache

# Запуск
docker-compose up
```

## 🔧 Альтернативные команды

Если проблема остается, попробуйте:

```bash
# Вариант 1: Использовать новый Docker Compose
docker compose up --build

# Вариант 2: Запуск по одному сервису
docker-compose up postgres
# Дождаться запуска PostgreSQL, затем:
docker-compose up app

# Вариант 3: Принудительное пересоздание
docker-compose up --force-recreate --build
```

## ✅ Проверка успешного запуска

После исправления должно быть:
```bash
$ docker-compose ps
NAME                    COMMAND                  SERVICE             STATUS              PORTS
immortal-path-app       "docker-entrypoint.s…"   app                 running             0.0.0.0:80->80/tcp, 0.0.0.0:3001->3001/tcp
immortal-path-postgres  "docker-entrypoint.s…"   postgres            running (healthy)   0.0.0.0:5432->5432/tcp