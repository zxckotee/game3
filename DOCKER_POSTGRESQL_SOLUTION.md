# 🐘 Решение интеграции PostgreSQL 16 в Docker

## 🎯 Проблема

- У вас есть `database.json` (host: localhost) - для локальной разработки
- У вас есть `database.docker.json` (host: postgres) - для Docker
- Нужно добавить PostgreSQL 16 в Docker так, чтобы:
  - Внутри Docker: приложение подключается к `postgres:5432`
  - С хоста: вы можете использовать `psql -h localhost -U postgres`

## 🚀 Решение

### 1. Новый docker-compose.yml с PostgreSQL 16

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
    build:
      context: .
      dockerfile: Dockerfile
    container_name: immortal-path-app
    ports:
      - "80:80"      # React dev server
      - "3001:3001"  # Express API server
    volumes:
      # Монтируем исходный код для hot reload
      - .:/app
      # Исключаем node_modules для производительности
      - /app/node_modules
      # ВАЖНО: Монтируем database.docker.json как database.json
      - ./src/config/database.docker.json:/app/src/config/database.json:ro
      - ./package.json:/app/package.json:ro
      - ./craco.config.js:/app/craco.config.js:ro
      - ./.env:/app/.env:ro
    environment:
      # Переменные для разработки
      - NODE_ENV=development
      - PORT=3001
      - REACT_APP_PORT=80
      - REACT_APP_API_URL=http://localhost:3001
      # Hot reload настройки
      - CHOKIDAR_USEPOLLING=true
      - WATCHPACK_POLLING=true
      - GENERATE_SOURCEMAP=false
      - SKIP_PREFLIGHT_CHECK=true
      - FAST_REFRESH=true
      - CI=false
      # Безопасность (для разработки)
      - JWT_SECRET=dev_jwt_secret_change_in_production
      - SESSION_SECRET=dev_session_secret_change_in_production
      # Database - используем database.docker.json
      - USE_DATABASE=true
      - USE_MERCHANT_FILES=true
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    stdin_open: true
    tty: true
    networks:
      - app_network

volumes:
  postgres_data:
    driver: local

networks:
  app_network:
    driver: bridge
```

### 2. Ключевые особенности решения

**Умное монтирование конфигурации:**
```yaml
# Подменяем database.json на database.docker.json внутри контейнера
- ./src/config/database.docker.json:/app/src/config/database.json:ro
```

**Двойной доступ к PostgreSQL:**
- Внутри Docker: `postgres:5432` (через сеть app_network)
- С хоста: `localhost:5432` (через port mapping)

**Автоматическая инициализация:**
- SQL файлы из `./sql/` выполняются при первом запуске
- Данные сохраняются в volume `postgres_data`

### 3. Как это работает

**Локальная разработка (`npm run dev`):**
- Использует `src/config/database.json` (host: localhost)
- Подключается к вашему локальному PostgreSQL

**Docker разработка (`docker-compose up`):**
- Монтирует `database.docker.json` как `database.json`
- Приложение видит host: postgres
- PostgreSQL доступен на localhost:5432 для psql

### 4. Команды для использования

```bash
# Запуск с PostgreSQL
docker-compose up --build

# Подключение к PostgreSQL с хоста (как обычно)
psql -h localhost -U postgres -d game

# Просмотр логов
docker-compose logs postgres
docker-compose logs app

# Остановка
docker-compose down

# Полная очистка (включая данные)
docker-compose down -v
```

### 5. Проверка работоспособности

**Ожидаемые логи при запуске:**
```
postgres_1 | PostgreSQL init process complete; ready for start up
app_1      | Попытка подключения к PostgreSQL (postgres:5432)...
app_1      | Успешное подключение к PostgreSQL подтверждено
app_1      | API сервер успешно запущен на порту 3001
```

**Проверка подключения:**
```bash
# С хоста
psql -h localhost -U postgres -d game

# Из контейнера приложения
docker-compose exec app psql -h postgres -U postgres -d game
```

## ✅ Преимущества решения

1. **Прозрачность**: Код не меняется, только конфигурация
2. **Гибкость**: Локальная разработка работает как раньше
3. **Удобство**: psql работает с localhost как обычно
4. **Автоматизация**: База инициализируется из SQL файлов
5. **Изоляция**: Данные сохраняются между перезапусками

Готов создать файлы?