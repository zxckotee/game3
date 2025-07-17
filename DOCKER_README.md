# Docker Setup для Immortal Path Game

## Обзор

Этот проект теперь полностью настроен для разработки с использованием Docker. Конфигурация поддерживает:

- **Hot Reload** для React и Express
- **PostgreSQL** база данных с автоматической инициализацией
- **Nginx** для проксирования (опционально)
- **Volume mapping** для разработки

## Быстрый старт

### 1. Запуск всех сервисов

```bash
# Запуск в фоновом режиме
docker-compose up -d

# Запуск с выводом логов
docker-compose up
```

### 2. Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Только приложение
docker-compose logs -f app

# Только база данных
docker-compose logs -f postgres
```

### 3. Остановка

```bash
# Остановка всех сервисов
docker-compose down

# Остановка с удалением volumes (ОСТОРОЖНО: удалит данные БД)
docker-compose down -v
```

## Доступные порты

- **3000** - React Development Server (с hot reload)
- **3001** - Express API Server
- **5432** - PostgreSQL Database
- **80** - Nginx Proxy (опционально)

## Инициализация базы данных

### Автоматическая инициализация

При первом запуске PostgreSQL автоматически выполнит все SQL файлы из папки `sql/`:

```bash
# Файлы выполняются в алфавитном порядке
sql/00_reference_tables.sql
sql/01_quests.sql
sql/02_merchants.sql
# ... и так далее
```

### Ручная инициализация

```bash
# Выполнение миграций
docker-compose exec app npm run migrate

# Заполнение начальными данными
docker-compose exec app npm run seed
```

## Команды разработки

### Работа с контейнером приложения

```bash
# Вход в контейнер
docker-compose exec app sh

# Установка новых зависимостей
docker-compose exec app npm install package-name

# Запуск тестов
docker-compose exec app npm test

# Проверка статуса
docker-compose exec app npm run check:imports
```

### Работа с базой данных

```bash
# Подключение к PostgreSQL
docker-compose exec postgres psql -U postgres -d game

# Создание бэкапа
docker-compose exec postgres pg_dump -U postgres game > backup.sql

# Восстановление из бэкапа
docker-compose exec -T postgres psql -U postgres game < backup.sql
```

## Переменные окружения

Основные переменные настроены в файле `.env`:

```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=game
DB_USER=postgres
DB_PASSWORD=root

# Application
NODE_ENV=development
PORT=3001
REACT_APP_PORT=3000
REACT_APP_API_URL=http://localhost:3001
```

## Структура проекта в Docker

```
/app (в контейнере)
├── src/                 # Исходный код (монтируется как volume)
├── public/              # Статические файлы
├── sql/                 # SQL скрипты для инициализации БД
├── node_modules/        # Зависимости (volume для производительности)
└── build/               # Собранное приложение (volume)
```

## Troubleshooting

### Проблемы с hot reload

Если hot reload не работает, добавьте в `.env`:

```env
CHOKIDAR_USEPOLLING=true
WATCHPACK_POLLING=true
```

### Проблемы с правами доступа

```bash
# Исправление прав на файлы
sudo chown -R $USER:$USER .

# Пересборка контейнера
docker-compose build --no-cache app
```

### Проблемы с базой данных

```bash
# Проверка статуса PostgreSQL
docker-compose exec postgres pg_isready -U postgres

# Пересоздание базы данных
docker-compose down -v
docker-compose up postgres -d
```

### Очистка Docker

```bash
# Удаление всех контейнеров и образов проекта
docker-compose down --rmi all -v

# Очистка неиспользуемых Docker объектов
docker system prune -a
```

## Production режим

Для production создайте отдельный `docker-compose.prod.yml`:

```yaml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
    command: ["npm", "start"]
```

## Мониторинг

### Проверка ресурсов

```bash
# Использование ресурсов контейнерами
docker stats

# Информация о контейнерах
docker-compose ps
```

### Логи

```bash
# Логи с временными метками
docker-compose logs -f -t

# Последние 100 строк логов
docker-compose logs --tail=100
```

## Полезные команды

```bash
# Пересборка только приложения
docker-compose build app

# Запуск без nginx
docker-compose up app postgres

# Выполнение команды в новом контейнере
docker-compose run --rm app npm run migrate

# Копирование файлов из контейнера
docker cp game_app:/app/logs ./logs