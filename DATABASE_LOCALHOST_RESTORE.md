# 🔄 Восстановление локальной конфигурации базы данных

## 📋 Выполненные изменения

### 1. Обновлен src/config/database.json
Изменен хост для всех окружений с `"postgres"` на `"localhost"`:

```json
{
  "development": {
    "host": "localhost"  // Было: "postgres"
  },
  "test": {
    "host": "localhost"  // Было: "postgres"
  },
  "production": {
    "host": "localhost"  // Было: "postgres"
  }
}
```

### 2. Обновлен .env файл
Изменены переменные окружения для локального подключения:

```env
# Было:
DB_HOST=postgres
DATABASE_URL=postgresql://postgres:root@postgres:5432/game

# Стало:
DB_HOST=localhost
DATABASE_URL=postgresql://postgres:root@localhost:5432/game
```

## 🎯 Результат

Теперь приложение настроено для работы с локальной PostgreSQL базой данных:

- **Хост**: `localhost` (вместо Docker контейнера `postgres`)
- **Порт**: `5432` (стандартный PostgreSQL порт)
- **База данных**: `game`
- **Пользователь**: `postgres`
- **Пароль**: `root`

## 🚀 Для запуска локально

### 1. Убедитесь, что PostgreSQL запущен локально:
```bash
# Windows (если установлен как сервис)
net start postgresql-x64-16

# Linux/macOS
sudo systemctl start postgresql
# или
brew services start postgresql
```

### 2. Создайте базу данных (если не существует):
```bash
psql -U postgres -c "CREATE DATABASE game;"
```

### 3. Запустите приложение:
```bash
npm run dev
```

## 📝 Примечания

- Файл `src/sequelize-config.js` не требует изменений - он содержит только заглушки для браузера
- Docker конфигурация остается доступной в `docker-compose.yml` для контейнерного развертывания
- Для переключения обратно на Docker нужно будет изменить хост с `localhost` на `postgres`

## 🔧 Переключение между режимами

### Для Docker:
```json
"host": "postgres"
```

### Для локальной разработки:
```json
"host": "localhost"