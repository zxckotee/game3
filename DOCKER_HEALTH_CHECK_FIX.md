# 🔧 Исправление проблемы с health check

## 🚨 Проблема
- Логи приложения пустые: `Attaching to` (контейнер не запустился)
- Ошибка: `Container is unhealthy`
- PostgreSQL работает, но приложение не может запуститься

## 🎯 Причина
В docker-compose.yml есть зависимость:
```yaml
depends_on:
  postgres:
    condition: service_healthy
```

Но контейнер приложения не может дождаться health check PostgreSQL.

## 🚀 Быстрое исправление

### Вариант 1: Упростить зависимости (РЕКОМЕНДУЕТСЯ)
```bash
# Остановить все
docker-compose down

# Изменить docker-compose.yml - убрать condition: service_healthy
# Заменить на простую зависимость
```

### Вариант 2: Запустить без зависимостей
```bash
# Запустить PostgreSQL отдельно
docker-compose up postgres -d

# Подождать 10-15 секунд
sleep 15

# Запустить приложение
docker-compose up app
```

### Вариант 3: Принудительный запуск
```bash
# Остановить все
docker-compose down

# Запустить без проверки зависимостей
docker-compose up --no-deps
```

## 📝 Изменения в docker-compose.yml

Нужно изменить секцию depends_on:

### БЫЛО:
```yaml
depends_on:
  postgres:
    condition: service_healthy
```

### ДОЛЖНО БЫТЬ:
```yaml
depends_on:
  - postgres
```

## ⚡ Команды для исправления

```bash
# 1. Остановить все контейнеры
docker-compose down

# 2. Исправить docker-compose.yml (убрать condition: service_healthy)

# 3. Запустить заново
docker-compose up

# 4. Проверить статус
docker-compose ps
```

## 🎯 Ожидаемый результат после исправления

```bash
$ docker-compose ps
NAME                    COMMAND                  SERVICE             STATUS              PORTS
immortal-path-app       "docker-entrypoint.s…"   app                 running             0.0.0.0:80->80/tcp, 0.0.0.0:3001->3001/tcp
immortal-path-postgres  "docker-entrypoint.s…"   postgres            running (healthy)   0.0.0.0:5432->5432/tcp
```

## 🔧 Альтернативное решение

Если не хотите менять файл, можно запустить поэтапно:

```bash
# 1. Запустить только PostgreSQL
docker-compose up postgres -d

# 2. Дождаться готовности (проверить логи)
docker-compose logs postgres

# 3. Когда PostgreSQL готов, запустить приложение
docker-compose up app
```

Проблема в том, что health check зависимость слишком строгая для разработки.