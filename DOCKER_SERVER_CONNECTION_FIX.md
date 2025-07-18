# 🔧 Исправление подключения server контейнера к PostgreSQL

## 🚨 Проблема
```
Error: connect ECONNREFUSED 127.0.0.1:5432
npm run server exited with code 1
```

## ✅ Решение применено

### 1. Создан отдельный конфигурационный файл для Docker
**Файл**: `src/config/database.docker.json`
```json
{
  "production": {
    "host": "postgres",  // Вместо localhost
    "username": "postgres",
    "password": "root",
    "database": "game",
    "dialect": "postgres",
    "port": 5432
  }
}
```

### 2. Обновлен Dockerfile.server
**Ключевые изменения**:
```dockerfile
# Копируем Docker-специфичную конфигурацию БД
COPY src/config/database.docker.json ./src/config/database.json

# НЕ копируем .env файл
# Используем только переменные окружения Docker

# Переменные окружения
ENV NODE_ENV=production
ENV DB_HOST=postgres
ENV DATABASE_URL=postgresql://postgres:root@postgres:5432/game

# Запуск напрямую
CMD ["node", "src/server.js"]
```

### 3. Переменные окружения в docker-compose.yml
```yaml
server:
  environment:
    - NODE_ENV=production
    - DB_HOST=postgres
    - DB_PORT=5432
    - DB_NAME=game
    - DB_USER=postgres
    - DB_PASSWORD=root
    - DATABASE_URL=postgresql://postgres:root@postgres:5432/game
```

## 🔄 Команды для применения исправлений

### Пересобрать server контейнер:
```bash
docker-compose build server
```

### Запустить с новой конфигурацией:
```bash
docker-compose up -d postgres server
```

### Проверить логи:
```bash
docker-compose logs server
```

## 🎯 Ожидаемый результат

После применения исправлений:
- ✅ Server контейнер подключается к `postgres:5432`
- ✅ Нет ошибок `ECONNREFUSED 127.0.0.1:5432`
- ✅ Express сервер запускается успешно
- ✅ API доступен на `http://localhost:3001`

## 🔍 Проверка работы

### 1. Проверить подключение к PostgreSQL:
```bash
docker-compose exec server node -e "
const { Client } = require('pg');
const client = new Client({
  host: 'postgres',
  port: 5432,
  database: 'game',
  user: 'postgres',
  password: 'root'
});
client.connect().then(() => {
  console.log('✅ Подключение к PostgreSQL успешно');
  client.end();
}).catch(err => {
  console.error('❌ Ошибка подключения:', err.message);
});
"
```

### 2. Проверить API health check:
```bash
curl http://localhost:3001/api/health
```

### 3. Проверить статус всех сервисов:
```bash
docker-compose ps
```

## 📋 Что исправлено:

- ✅ **Конфигурация БД**: Создан отдельный файл для Docker
- ✅ **Dockerfile.server**: Использует правильную конфигурацию
- ✅ **Переменные окружения**: Переопределяют localhost на postgres
- ✅ **Команда запуска**: Прямой запуск без npm scripts
- ✅ **Изоляция конфигураций**: Локальная и Docker конфигурации разделены

Теперь server контейнер должен успешно подключаться к PostgreSQL!