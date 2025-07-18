# 🏗️ Разделенная Docker архитектура

## 📋 Обзор

Создана разделенная Docker конфигурация с тремя отдельными сервисами:

### 🔧 Сервисы:
1. **postgres** - База данных PostgreSQL 16
2. **server** - Express API сервер (порт 3001)
3. **app** - React приложение (порт 80)

## 📁 Файлы конфигурации:

### 1. `Dockerfile.app` - React приложение
```dockerfile
# Multi-stage build для оптимизации
FROM node:18-alpine
# Сборка React приложения
# Nginx для раздачи статических файлов
```

### 2. `Dockerfile.server` - Express сервер
```dockerfile
# Node.js Alpine с curl для healthcheck
FROM node:18-alpine
# Копирование только серверного кода
# Переменные окружения для Docker
```

### 3. `docker-compose.yml` - Оркестрация
```yaml
# Три отдельных сервиса с правильными зависимостями
# Healthcheck'и для каждого сервиса
# Изолированная сеть
```

## 🚀 Команды запуска:

### Полный запуск всех сервисов:
```bash
docker-compose up -d
```

### Запуск отдельных сервисов:
```bash
# Только PostgreSQL
docker-compose up -d postgres

# PostgreSQL + Express сервер
docker-compose up -d postgres server

# Все сервисы
docker-compose up -d postgres server app
```

### Проверка статуса:
```bash
# Статус всех сервисов
docker-compose ps

# Логи конкретного сервиса
docker-compose logs postgres
docker-compose logs server
docker-compose logs app
```

## 🔗 Архитектура подключений:

```
React App (port 80)
    ↓ HTTP requests
Express Server (port 3001)
    ↓ PostgreSQL connection
PostgreSQL (port 5432)
```

### Сетевые настройки:
- **Внутри Docker**: сервисы общаются по именам (`postgres`, `server`)
- **Снаружи**: доступ через localhost и проброшенные порты

## ⚙️ Переменные окружения:

### Для server контейнера:
```env
NODE_ENV=production
DB_HOST=postgres
DB_PORT=5432
DB_NAME=game
DB_USER=postgres
DB_PASSWORD=root
```

### Для app контейнера:
```env
REACT_APP_API_URL=http://localhost:3001
```

## 🏥 Health Checks:

### PostgreSQL:
```bash
pg_isready -U postgres -d game
```

### Express Server:
```bash
curl -f http://localhost:3001/api/health
```

## 🔄 Зависимости сервисов:

1. **postgres** - запускается первым
2. **server** - ждет готовности postgres
3. **app** - ждет готовности server

## 🛠️ Разработка:

### Локальная разработка (рекомендуемый подход):
```bash
# 1. Запустить только PostgreSQL
docker-compose up -d postgres

# 2. Локально запустить сервер
npm run server

# 3. Локально запустить React
npm start
```

### Полная Docker разработка:
```bash
# Запустить все в Docker
docker-compose up -d

# Пересобрать при изменениях
docker-compose up -d --build
```

## 🔧 Отладка:

### Проверка подключений:
```bash
# Проверить PostgreSQL
docker-compose exec postgres psql -U postgres -d game -c "SELECT 1;"

# Проверить Express API
curl http://localhost:3001/api/health

# Проверить React приложение
curl http://localhost:80
```

### Логи для отладки:
```bash
# Все логи
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f server
```

## 📊 Преимущества разделенной архитектуры:

✅ **Изоляция сервисов** - каждый компонент в отдельном контейнере
✅ **Независимое масштабирование** - можно масштабировать каждый сервис отдельно
✅ **Простая отладка** - проблемы изолированы в конкретном сервисе
✅ **Гибкость развертывания** - можно запускать только нужные сервисы
✅ **Оптимизация ресурсов** - каждый контейнер содержит только необходимое

## 🎯 Результат:

Теперь у вас есть полностью разделенная Docker архитектура, где:
- **app** = только React приложение
- **server** = только Express API
- **postgres** = только база данных

Каждый сервис можно разрабатывать, тестировать и развертывать независимо!