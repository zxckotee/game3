# 🔧 Исправление проблемы версий PostgreSQL

## 🚨 Проблема
```
FATAL: database files are incompatible with server
DETAIL: The data directory was initialized by PostgreSQL version 16, which is not compatible with this version 13.21
```

## ✅ Решение применено

### 1. Обновлен docker-compose.yml:
- **PostgreSQL 13** → **PostgreSQL 16** для совместимости с данными
- Добавлен **healthcheck** для PostgreSQL контейнера
- Добавлена **condition: service_healthy** для app контейнера
- Создана **dedicated network** для изоляции сервисов
- Добавлены **POSTGRES_INITDB_ARGS** для правильной инициализации

### 2. Ключевые изменения:

#### PostgreSQL контейнер:
```yaml
postgres:
  image: postgres:16  # Было: postgres:13
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres -d game"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 30s
```

#### App контейнер:
```yaml
app:
  depends_on:
    postgres:
      condition: service_healthy  # Ждет готовности PostgreSQL
```

#### Сеть:
```yaml
networks:
  game_network:
    driver: bridge
```

## 🚀 Команды для применения:

### Остановить и очистить (если нужно):
```bash
docker-compose down
docker volume rm game3_postgres_data  # Только если нужно очистить данные
```

### Запустить с новой конфигурацией:
```bash
docker-compose up -d
```

### Проверить статус:
```bash
docker-compose ps
docker-compose logs postgres
docker-compose logs app
```

## 🔍 Проверка работы:

### 1. PostgreSQL готов:
```bash
docker-compose exec postgres pg_isready -U postgres -d game
```

### 2. Приложение подключено:
```bash
curl http://localhost:3001/api/health
```

### 3. React доступен:
```bash
curl http://localhost:80
```

## 📋 Что исправлено:
- ✅ Совместимость версий PostgreSQL (16 ↔ 16)
- ✅ Healthcheck для PostgreSQL
- ✅ Правильные зависимости контейнеров
- ✅ Изолированная сеть
- ✅ Ожидание готовности БД перед стартом приложения

## 🎯 Результат:
Теперь приложение будет ждать полной готовности PostgreSQL перед попыткой подключения, что устранит ошибки `EHOSTUNREACH` и несовместимости версий.