# 🔧 Исправление проблемы подключения к PostgreSQL в Docker

## 🚨 Проблема

Контейнер приложения не может подключиться к PostgreSQL, который запущен в родительской папке:

```
КРИТИЧЕСКАЯ ОШИБКА: Не удалось подключиться к PostgreSQL: connect ECONNREFUSED 127.0.0.1:5432
```

## 🎯 Причина

Внутри Docker контейнера `localhost` (127.0.0.1) указывает на сам контейнер, а не на хост-машину где запущен PostgreSQL.

## 🚀 Решения

### Решение 1: Подключение к внешнему PostgreSQL (РЕКОМЕНДУЕТСЯ)

Используйте основной `docker-compose.yml` - он уже настроен для подключения к внешнему PostgreSQL:

```bash
# Запуск с подключением к внешнему PostgreSQL
docker-compose up --build
```

**Что изменено:**
- `DB_HOST=host.docker.internal` - специальный хост для доступа к хост-машине
- `extra_hosts` - дополнительная настройка для Linux
- `USE_DATABASE=true` - включена база данных

### Решение 2: Полное отключение PostgreSQL

Если хотите запустить без PostgreSQL вообще:

```bash
# Запуск БЕЗ PostgreSQL
docker-compose -f docker-compose.no-db.yml up --build
```

**Что отключено:**
- `USE_DATABASE=false`
- `SKIP_DB_CONNECTION=true`
- `DB_DISABLED=true`

## 🔍 Диагностика

### Проверка подключения к PostgreSQL с хоста:

```bash
# Это должно работать (как вы проверили)
psql -h localhost -U postgres -d game
```

### Проверка из контейнера:

```bash
# Войти в контейнер
docker-compose exec app sh

# Попробовать подключиться к PostgreSQL
# Вариант 1: через host.docker.internal
psql -h host.docker.internal -U postgres -d game

# Вариант 2: через IP хоста (найти командой)
ip route show default | awk '/default/ {print $3}'
```

## 🛠️ Альтернативные решения

### Вариант A: Использовать network_mode: host (только Linux)

```yaml
services:
  app:
    # ... остальная конфигурация
    network_mode: host
    # Убрать ports и networks
```

### Вариант B: Найти IP хоста и использовать его

```bash
# Найти IP хоста
docker run --rm alpine ip route show default | awk '/default/ {print $3}'

# Использовать найденный IP в docker-compose.yml
- DB_HOST=192.168.65.1  # Пример IP
```

### Вариант C: Добавить PostgreSQL в docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: game
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: root
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    # ... остальная конфигурация
    depends_on:
      - postgres
    environment:
      - DB_HOST=postgres  # Имя сервиса
```

## ✅ Тестирование решений

### 1. Тест с внешним PostgreSQL:

```bash
# Остановить старые контейнеры
docker-compose down

# Запустить с новой конфигурацией
docker-compose up --build

# Проверить логи
docker-compose logs app
```

**Ожидаемый результат:**
```
immortal-path-app | API сервер успешно запущен на порту 3001
immortal-path-app | Успешное подключение к PostgreSQL подтверждено
```

### 2. Тест без PostgreSQL:

```bash
# Остановить старые контейнеры
docker-compose down

# Запустить без PostgreSQL
docker-compose -f docker-compose.no-db.yml up --build

# Проверить логи
docker-compose -f docker-compose.no-db.yml logs app
```

**Ожидаемый результат:**
```
immortal-path-app | API сервер успешно запущен на порту 3001
immortal-path-app | База данных отключена, используются файлы
```

## 🎯 Рекомендация

1. **Сначала попробуйте Решение 1** (внешний PostgreSQL):
   ```bash
   docker-compose up --build
   ```

2. **Если не работает, используйте Решение 2** (без PostgreSQL):
   ```bash
   docker-compose -f docker-compose.no-db.yml up --build
   ```

3. **Для отладки** проверьте подключение из контейнера:
   ```bash
   docker-compose exec app sh
   ping host.docker.internal
   ```

## 📋 Файлы конфигурации

- `docker-compose.yml` - с подключением к внешнему PostgreSQL
- `docker-compose.no-db.yml` - без PostgreSQL
- `Dockerfile` - оптимизированный для разработки
- `.env` - переменные окружения для хоста

Выберите подходящий вариант и протестируйте!