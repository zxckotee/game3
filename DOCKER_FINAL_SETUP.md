 с         Setup - Финальная конфигурация

## ✅ Все проблемы решены!

### 🔧 Исправления:

1. **Проблема crypto-browserify** - решена перемещением файлов
2. **Порядок запуска сервисов** - исправлен с зависимостями
3. **Health checks** - добавлены для правильной последовательности
4. **Порты** - настроены правильно (80 для React, 3001 для Express)

## 📋 Правильный порядок запуска:

```
1. postgres     (База данных с health check)
2. server       (Express API, ждет postgres)  
3. client       (React, ждет postgres + server)
```

## 🚀 Команды для запуска:

### Первый запуск:
```bash
# 1. Остановить все старые контейнеры
docker-compose down --remove-orphans

# 2. Очистить поврежденные контейнеры (если нужно)
./docker-cleanup.sh

# 3. Запустить с правильными зависимостями
docker-compose up --build
```

### Обычный запуск:
```bash
docker-compose up
```

## 🔍 Мониторинг запуска:

```bash
# Следить за логами всех сервисов
docker-compose logs -f

# Отдельно по сервисам
docker-compose logs -f postgres
docker-compose logs -f server  
docker-compose logs -f client
```

## 📊 Проверка состояния:

```bash
# Проверить статус всех сервисов
docker-compose ps

# Проверить health checks
docker-compose exec postgres pg_isready -U postgres -d game
curl http://localhost:3001/api/health
```

## 🌐 Доступ к приложению:

- **React клиент**: http://localhost (порт 80)
- **API сервер**: http://localhost:3001
- **Health check**: http://localhost:3001/api/health
- **PostgreSQL**: localhost:5432

## 🔧 Конфигурация зависимостей:

```yaml
services:
  postgres:
    # Запускается первым
    healthcheck: pg_isready
    
  server:
    # Ждет готовности postgres
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck: curl /api/health
    
  client:
    # Ждет готовности postgres + server
    depends_on:
      postgres:
        condition: service_healthy
      server:
        condition: service_healthy
```

## 🐛 Troubleshooting:

### Если сервер не может подключиться к PostgreSQL:
```bash
# Проверить статус postgres
docker-compose exec postgres pg_isready -U postgres -d game

# Проверить логи postgres
docker-compose logs postgres

# Перезапустить только postgres
docker-compose restart postgres
```

### Если клиент запускается раньше сервера:
```bash
# Проверить health check сервера
curl http://localhost:3001/api/health

# Проверить зависимости в docker-compose.yml
# client должен зависеть от server
```

### Полная перезагрузка:
```bash
docker-compose down --remove-orphans
docker-compose up --build --force-recreate
```

## 📁 Структура файлов:

```
project/
├── docker-compose.yml     # Правильные зависимости
├── Dockerfile            # С curl для health checks
├── .env                  # Переменные окружения
├── src/server.js         # Health check endpoint
└── src/server/utils/     # Серверные утилиты (etag-utils)
```

## ✅ Результат:

1. **PostgreSQL** запускается первым и проходит health check
2. **Express сервер** ждет готовности PostgreSQL и запускается
3. **React клиент** ждет готовности обоих и запускается последним
4. **Все сервисы** работают на правильных портах
5. **crypto-browserify** больше не вызывает ошибок

Теперь Docker запускается в правильном порядке и все работает! 🎉