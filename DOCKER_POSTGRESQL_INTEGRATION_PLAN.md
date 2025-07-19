# 🐘 План интеграции PostgreSQL 16 в Docker конфигурацию

## 🎯 Проблема

Когда приложение запускается в Docker:
- `localhost` внутри контейнера указывает на сам контейнер, а не на хост
- Нужно использовать имя сервиса PostgreSQL для подключения
- Требуется правильная настройка сети между контейнерами

## 🚀 Решение

### 1. Добавить PostgreSQL 16 в docker-compose.yml

```yaml
services:
  # PostgreSQL 16 база данных
  postgres:
    image: postgres:16
    container_name: immortal-path-postgres
    environment:
      POSTGRES_DB: game
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: root
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"  # Доступ с хоста для psql
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d game"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app_network

  # Приложение (React + Express)
  app:
    # ... остальная конфигурация
    environment:
      # ВАЖНО: DB_HOST=postgres (имя сервиса, а не localhost)
      - DB_HOST=postgres
      - DATABASE_URL=postgresql://postgres:root@postgres:5432/game
    depends_on:
      postgres:
        condition: service_healthy
```

### 2. Создать отдельные переменные окружения

**Для локальной разработки (.env):**
```env
DB_HOST=localhost
DATABASE_URL=postgresql://postgres:root@localhost:5432/game
```

**Для Docker (.env.docker):**
```env
DB_HOST=postgres
DATABASE_URL=postgresql://postgres:root@postgres:5432/game
```

### 3. Настроить инициализацию базы данных

- SQL файлы из папки `sql/` автоматически выполнятся при первом запуске
- Порядок выполнения: по алфавиту (00_, 01_, 02_, ...)
- Volume `postgres_data` сохранит данные между перезапусками

### 4. Настроить сетевое взаимодействие

- Оба контейнера в одной сети `app_network`
- PostgreSQL доступен по имени `postgres` внутри Docker
- PostgreSQL доступен по `localhost:5432` с хоста для psql

## 🔧 Ключевые изменения

1. **Имя хоста**: `localhost` → `postgres` в Docker
2. **Зависимости**: app ждет готовности postgres
3. **Health check**: проверка готовности PostgreSQL
4. **Volumes**: сохранение данных и инициализация SQL
5. **Сеть**: правильная настройка связи между контейнерами

## ✅ Ожидаемый результат

- `npm run dev` (без Docker) → подключается к localhost:5432
- `docker-compose up` → подключается к postgres:5432
- `psql -h localhost -U postgres` с хоста → работает
- Автоматическая инициализация базы данных из SQL файлов
- Сохранение данных между перезапусками

## 📋 Файлы для создания/изменения

1. `docker-compose.yml` - добавить PostgreSQL 16
2. `.env.docker` - переменные для Docker
3. `docker-compose.override.yml` - переопределение для разработки
4. Документация по использованию