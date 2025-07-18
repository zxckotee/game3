# 🎯 Исправление конфигурации БД для Docker

## 🚨 Найдена проблема!

В файле `src/config/database.json` везде прописан:
```json
"host": "localhost"
```

А для Docker должно быть:
```json
"host": "postgres"
```

## 🔧 Исправленный src/config/database.json:

```json
{
  "development": {
    "username": "postgres",
    "password": "root",
    "database": "game",
    "host": "postgres",
    "dialect": "postgres",
    "port": 5432
  },
  "test": { 
    "username": "postgres",
    "password": "root",
    "database": "game",
    "host": "postgres",
    "dialect": "postgres",
    "port": 5432
  },
  "production": {
    "username": "postgres",
    "password": "root",
    "database": "game",
    "host": "postgres",
    "dialect": "postgres",
    "port": 5432,
    "dialectOptions": {
      "ssl": {
        "require": true,
        "rejectUnauthorized": false
      }
    }
  }
}
```

## 🎯 Альтернативное решение - использовать переменные окружения:

Еще лучше - сделать конфигурацию динамической:

```json
{
  "development": {
    "username": "postgres",
    "password": "root",
    "database": "game",
    "host": "postgres",
    "dialect": "postgres",
    "port": 5432,
    "use_env_variable": "DATABASE_URL"
  },
  "test": { 
    "username": "postgres",
    "password": "root",
    "database": "game",
    "host": "postgres",
    "dialect": "postgres",
    "port": 5432,
    "use_env_variable": "DATABASE_URL"
  },
  "production": {
    "use_env_variable": "DATABASE_URL",
    "dialectOptions": {
      "ssl": {
        "require": true,
        "rejectUnauthorized": false
      }
    }
  }
}
```

## 🚀 Команды для применения:

### Вариант 1: Быстрое исправление
Заменить все `"localhost"` на `"postgres"` в `src/config/database.json`:

```bash
# Остановить контейнеры
docker-compose down

# Заменить localhost на postgres в database.json
sed -i 's/"localhost"/"postgres"/g' src/config/database.json

# Перезапустить
docker-compose up -d
```

### Вариант 2: Использовать переменные окружения
В docker-compose.yml уже есть `DATABASE_URL=postgresql://postgres:root@postgres:5432/game`, поэтому можно использовать `use_env_variable`.

## 📋 Проверка после исправления:

```bash
# Проверить логи
docker-compose logs app

# Должно показать успешное подключение:
# ✓ Database connection established
# ✓ Connected to PostgreSQL

# Проверить API
curl http://localhost:3001/api/health
```

## 🎯 Ожидаемый результат:

После исправления логи должны показать:
```
✓ Database connection established
✓ Server running on port 3001
✓ Connected to PostgreSQL: postgres:5432/game
```

Вместо ошибок `ECONNREFUSED 127.0.0.1:5432`.

## 📝 Примечание:

Файл `src/sequelize-config.js` - это заглушка для браузера, реальная конфигурация БД берется из `src/config/database.json`.

Замените `localhost` на `postgres` в database.json и перезапустите контейнеры!