# Docker Setup - Исправленная версия

## Архитектура

- **PostgreSQL** - База данных на порту 5432
- **React Client** - CRACO/webpack на порту 80 (`npm run start`)
- **Express Server** - API сервер на порту 3001 (`npm run server`)

## Быстрый запуск

### 1. Очистка поврежденных контейнеров

```bash
# Сделать скрипт исполняемым
chmod +x docker-cleanup.sh

# Запустить очистку
./docker-cleanup.sh
```

### 2. Запуск сервисов

```bash
# Сборка и запуск
docker-compose up --build

# Или в фоновом режиме
docker-compose up --build -d
```

### 3. Проверка работы

- **React клиент**: http://localhost
- **API сервер**: http://localhost:3001
- **PostgreSQL**: localhost:5432

## Структура сервисов

```yaml
services:
  postgres:    # База данных
    ports: ["5432:5432"]
    
  client:      # React приложение
    ports: ["80:80"]
    command: ["npm", "run", "start"]
    
  server:      # Express API
    ports: ["3001:3001"] 
    command: ["npm", "run", "server"]
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

## Troubleshooting

### Ошибка ContainerConfig
```bash
# Полная очистка
./docker-cleanup.sh

# Пересборка
docker-compose up --build --force-recreate
```

### Порты заняты
```bash
# Найти процессы на портах
sudo lsof -i :80
sudo lsof -i :3001
sudo lsof -i :5432

# Убить процессы
sudo kill -9 $(sudo lsof -t -i:80)
sudo kill -9 $(sudo lsof -t -i:3001)
```

### Проблемы с правами
```bash
# Исправить права на файлы
sudo chown -R $USER:$USER .
```

### Hot reload не работает
Убедитесь что в `.env` есть:
```env
CHOKIDAR_USEPOLLING=true
WATCHPACK_POLLING=true
```

## Переменные окружения

Основные настройки в `.env`:
```env
# Порты
PORT=3001                    # Express сервер
REACT_APP_PORT=80           # React клиент

# API
REACT_APP_API_URL=http://localhost:3001

# База данных
DATABASE_URL=postgresql://postgres:root@postgres:5432/game
```

## Отличия от предыдущей версии

❌ **Было неправильно:**
- Nginx для проксирования
- Один контейнер для клиента и сервера
- Неправильные порты

✅ **Стало правильно:**
- Отдельные контейнеры для client и server
- React на порту 80, Express на 3001
- Без лишнего Nginx
- Правильные команды запуска