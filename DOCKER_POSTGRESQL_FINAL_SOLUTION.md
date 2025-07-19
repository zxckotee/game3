# 🐘 Финальное решение PostgreSQL 16 + Docker

## 🎯 Анализ архитектуры

В `database-connection-manager.js`:
- Использует `database.json[NODE_ENV]` для конфигурации
- Можно переопределить параметры через переменные окружения
- Не нужно подменять файлы!

## 🚀 Элегантное решение

### 1. Модификация database-connection-manager.js

Добавим поддержку переменных окружения:

```javascript
// В initializeDatabaseConnection()
const env = process.env.NODE_ENV || 'development';
const config = {
  ...databaseConfig[env],
  // Переопределяем из переменных окружения если есть
  host: process.env.DB_HOST || databaseConfig[env].host,
  port: process.env.DB_PORT || databaseConfig[env].port,
  database: process.env.DB_NAME || databaseConfig[env].database,
  username: process.env.DB_USER || databaseConfig[env].username,
  password: process.env.DB_PASSWORD || databaseConfig[env].password
};
```

### 2. Новый docker-compose.yml

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
      # Database - ПЕРЕОПРЕДЕЛЯЕМ для Docker
      - USE_DATABASE=true
      - USE_MERCHANT_FILES=true
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=game
      - DB_USER=postgres
      - DB_PASSWORD=root
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

### 3. Как это работает

**Локальная разработка (`npm run dev`):**
- Переменные окружения не установлены
- Использует `database.json` (host: localhost)
- Подключается к локальному PostgreSQL

**Docker разработка (`docker-compose up`):**
- Переменные окружения установлены: `DB_HOST=postgres`
- Переопределяет host из database.json
- Подключается к контейнеру postgres

**PostgreSQL доступность:**
- Внутри Docker: `postgres:5432`
- С хоста: `localhost:5432` для psql

### 4. Преимущества

1. **Не меняем файлы конфигурации** - они остаются как есть
2. **Гибкость** - переменные окружения переопределяют настройки
3. **Прозрачность** - код остается читаемым
4. **Совместимость** - локальная разработка работает как раньше

### 5. Команды

```bash
# Запуск с PostgreSQL
docker-compose up --build

# Подключение к PostgreSQL с хоста
psql -h localhost -U postgres -d game

# Проверка переменных в контейнере
docker-compose exec app env | grep DB_
```

## ✅ Готов к реализации

Нужно:
1. Модифицировать `database-connection-manager.js`
2. Создать новый `docker-compose.yml`
3. Протестировать оба режима

Приступаем?