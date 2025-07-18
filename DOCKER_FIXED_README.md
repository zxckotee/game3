# Docker Setup - Исправленная версия

## Архитектура

- **PostgreSQL** - База данных на порту 5432
- **React Client** - CRACO/webpack на порту 3000 (`npm run start`)
- **Express Server** - API сервер на порту 3001 (`npm run server`)

## Быстрый запуск

### 1. Остановка зависших контейнеров

```bash
# Остановить все контейнеры
docker-compose down --remove-orphans

# Убить зависшие процессы
docker kill $(docker ps -q) 2>/dev/null || true
```

### 2. Очистка (если нужно)

```bash
# Сделать скрипт исполняемым
chmod +x docker-cleanup.sh

# Запустить очистку
./docker-cleanup.sh
```

### 3. Запуск сервисов

```bash
# Сборка и запуск
docker-compose up --build

# Или в фоновом режиме
docker-compose up --build -d
```

### 4. Проверка работы

- **React клиент**: http://localhost:3000
- **API сервер**: http://localhost:3001
- **PostgreSQL**: localhost:5432

## Структура сервисов

```yaml
services:
  postgres:    # База данных
    ports: ["5432:5432"]
    
  client:      # React приложение
    ports: ["3000:3000"]
    command: ["npm", "run", "start"]
    
  server:      # Express API
    ports: ["3001:3001"] 
    command: ["npm", "run", "server"]
```

## Исправления зависания

### Проблема: "Running in..." зависает

**Причина:** Порт 80 требует root прав, непривилегированный пользователь не может его использовать.

**Решение:** Изменили порт React с 80 на 3000 (стандартный для dev server).

### Если контейнер все еще зависает:

```bash
# 1. Остановить все
docker-compose down --remove-orphans

# 2. Убить зависшие контейнеры
docker kill $(docker ps -q) 2>/dev/null || true

# 3. Проверить порты
sudo lsof -i :3000
sudo lsof -i :3001

# 4. Освободить порты если заняты
sudo kill -9 $(sudo lsof -t -i:3000) 2>/dev/null || true
sudo kill -9 $(sudo lsof -t -i:3001) 2>/dev/null || true

# 5. Запустить заново
docker-compose up --build
```

## Команды для разработки

```bash
# Просмотр логов
docker-compose logs -f client
docker-compose logs -f server
docker-compose logs -f postgres

# Перезапуск отдельного сервиса
docker-compose restart client
docker-compose restart server

# Выполнение команд в контейнере
docker-compose exec client npm install
docker-compose exec server npm run migrate

# Остановка
docker-compose down
```

## Инициализация базы данных

```bash
# Миграции
docker-compose exec server npm run migrate

# Заполнение данными
docker-compose exec server npm run seed
```

## Переменные окружения

Основные настройки в `.env`:
```env
# Порты
PORT=3001                    # Express сервер
REACT_APP_PORT=3000         # React клиент

# API
REACT_APP_API_URL=http://localhost:3001

# База данных
DATABASE_URL=postgresql://postgres:root@postgres:5432/game
```

## Отличия от предыдущей версии

❌ **Было неправильно:**
- Порт 80 для React (требует root)
- Непривилегированный пользователь nextjs
- Nginx для проксирования

✅ **Стало правильно:**
- Порт 3000 для React (стандартный)
- Запуск от root в контейнере
- Отдельные контейнеры для client и server
- Без лишнего Nginx

## Troubleshooting

### Контейнер зависает на "Running in..."
```bash
# Проблема с портами - используйте стандартные порты
# React: 3000, Express: 3001
```

### Hot reload не работает
```bash
# Убедитесь что в .env есть:
CHOKIDAR_USEPOLLING=true
WATCHPACK_POLLING=true
```

### Ошибки прав доступа
```bash
# Исправить права на файлы
sudo chown -R $USER:$USER .