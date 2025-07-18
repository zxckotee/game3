# 🚀 Полное руководство по развертыванию игры в Docker

## 📋 Обзор проекта

**Архитектура:** Client (React) → API-service → Server (Express) → Database (PostgreSQL)

**Компоненты:**
- **Frontend:** React приложение на порту 80
- **Backend:** Express.js API сервер на порту 3001  
- **Database:** PostgreSQL на порту 5432
- **Контейнеризация:** Docker + docker-compose

## 🔧 Исправленные проблемы

### ✅ Решенные проблемы:
1. **crypto-browserify ошибка** - перенесен `etag-utils.js` в серверную папку
2. **Неправильные зависимости сервисов** - настроена правильная последовательность запуска
3. **Health check проблемы** - улучшены таймауты и используется wget
4. **Импорты etag-utils** - обновлены во всех 8 файлах

### 🛠️ Ключевые изменения:
- Файл `src/utils/etag-utils.js` → `src/server/utils/etag-utils.js`
- Обновлены импорты в файлах: character-routes.js, cultivation-routes.js, inventory-routes.js, sect-routes.js, spirit-pets-routes.js, technique-routes.js, character-stats-service.js, inventory-service.js
- Улучшен health check с проверкой БД
- Увеличены таймауты для health check

## 🚀 Инструкции по развертыванию

### Шаг 1: Применить исправления

#### A. Обновить docker-compose.yml
Замените содержимое файла на конфигурацию из `DOCKER_FIXED_CONFIGS.md` (Решение 1)

#### B. Обновить Dockerfile  
Замените содержимое файла на конфигурацию из `DOCKER_FIXED_CONFIGS.md` (Решение 2)

#### C. Улучшить health check endpoint
В файле `src/server.js` замените простой health check на улучшенную версию из `DOCKER_FIXED_CONFIGS.md` (Решение 3)

### Шаг 2: Команды развертывания

```bash
# 1. Остановить существующие контейнеры
docker-compose down

# 2. Очистить старые образы (опционально)
docker-compose down --rmi all --volumes --remove-orphans

# 3. Пересобрать образы
docker-compose build --no-cache

# 4. Запустить все сервисы
docker-compose up -d

# 5. Проверить статус
docker-compose ps
```

### Шаг 3: Проверка работоспособности

```bash
# Проверить логи всех сервисов
docker-compose logs

# Проверить логи конкретного сервиса
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f postgres

# Проверить health check
curl http://localhost:3001/api/health

# Проверить доступность приложения
curl http://localhost:80
```

## 🔍 Диагностика проблем

### Если server контейнер не запускается:

```bash
# Проверить логи server
docker-compose logs server

# Войти в контейнер для диагностики
docker-compose exec server sh

# Проверить health check изнутри
wget -q -O- http://localhost:3001/api/health
```

### Если client контейнер не запускается:

```bash
# Проверить зависимости
docker-compose ps

# Проверить логи client
docker-compose logs client

# Проверить переменные окружения
docker-compose exec client env | grep REACT
```

### Если postgres не готов:

```bash
# Проверить готовность БД
docker-compose exec postgres pg_isready -U postgres -d game

# Проверить логи БД
docker-compose logs postgres
```

## ⚡ Быстрое исправление

Если нужно запустить срочно и server health check все еще не работает:

1. В `docker-compose.yml` измените зависимость client:
```yaml
client:
  depends_on:
    postgres:
      condition: service_healthy
    server:
      condition: service_started  # Вместо service_healthy
```

2. Перезапустите:
```bash
docker-compose down
docker-compose up -d
```

## 📊 Ожидаемый результат

После успешного развертывания:

```bash
$ docker-compose ps
NAME                COMMAND                  SERVICE             STATUS              PORTS
game_client         "docker-entrypoint.s…"   client              running             0.0.0.0:80->80/tcp
game_postgres       "docker-entrypoint.s…"   postgres            running (healthy)   0.0.0.0:5432->5432/tcp
game_server         "docker-entrypoint.s…"   server              running (healthy)   0.0.0.0:3001->3001/tcp
```

### Доступные URL:
- **Игра:** http://localhost:80
- **API:** http://localhost:3001
- **Health Check:** http://localhost:3001/api/health
- **База данных:** localhost:5432

## 🔧 Полезные команды

```bash
# Перезапуск конкретного сервиса
docker-compose restart server

# Пересборка конкретного сервиса
docker-compose build server

# Просмотр логов в реальном времени
docker-compose logs -f

# Очистка всех Docker ресурсов
docker system prune -a

# Вход в контейнер
docker-compose exec server sh
docker-compose exec client sh
docker-compose exec postgres psql -U postgres -d game
```

## 📁 Структура файлов

```
game3/
├── docker-compose.yml          # Основная конфигурация
├── Dockerfile                  # Образ для сборки
├── package.json               # Зависимости и скрипты
├── src/
│   ├── server.js              # Express сервер с health check
│   ├── server/
│   │   └── utils/
│   │       └── etag-utils.js  # Перенесенный файл
│   └── ...
├── DOCKER_FIXED_CONFIGS.md    # Исправленные конфигурации
├── DOCKER_HEALTH_CHECK_FIX.md # Диагностика health check
└── DOCKER_DEPLOYMENT_GUIDE.md # Это руководство
```

## 🎯 Заключение

Все основные проблемы Docker конфигурации решены:
- ✅ crypto-browserify ошибка исправлена
- ✅ Health check настроен правильно  
- ✅ Зависимости сервисов корректны
- ✅ Таймауты увеличены для стабильности

Проект готов к развертыванию на удаленном сервере!