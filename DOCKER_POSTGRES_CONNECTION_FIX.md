# 🚨 Исправление подключения к PostgreSQL

## Проблема:
```
PostgreSQL: connect ECONNREFUSED 127.0.0.1:5432
```

Приложение пытается подключиться к `127.0.0.1:5432` вместо `postgres:5432` (имя контейнера).

## 🔧 Причина:

В коде приложения где-то жестко прописан `localhost` или `127.0.0.1` вместо использования переменной окружения `DB_HOST=postgres`.

## 🎯 Решения:

### 1. Проверить переменные окружения в контейнере:
```bash
docker-compose exec app env | grep -i postgres
docker-compose exec app env | grep -i db
```

### 2. Проверить файлы конфигурации БД:

#### В src/sequelize-config.js:
Должно быть:
```javascript
const config = {
  host: process.env.DB_HOST || 'postgres',  // НЕ localhost!
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'game',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root'
};
```

#### В src/services/database-connection-manager.js:
Должно использовать переменные окружения, а не хардкод.

### 3. Проверить .env файл:
```bash
cat .env | grep -i db
```

Должно содержать:
```
DB_HOST=postgres
DB_PORT=5432
DB_NAME=game
DB_USER=postgres
DB_PASSWORD=root
```

### 4. Временное решение - добавить в docker-compose.yml:

```yaml
app:
  # ... остальная конфигурация
  environment:
    - NODE_ENV=development
    - PORT=80
    - DATABASE_URL=postgresql://postgres:root@postgres:5432/game
    - DB_HOST=postgres  # ВАЖНО!
    - DB_PORT=5432
    - DB_NAME=game
    - DB_USER=postgres
    - DB_PASSWORD=root
    - REACT_APP_API_URL=http://localhost:3001
    - CHOKIDAR_USEPOLLING=true
    - WATCHPACK_POLLING=true
  # Добавить extra_hosts для совместимости
  extra_hosts:
    - "localhost:host-gateway"
```

### 5. Проверить статус PostgreSQL:
```bash
# Проверить что PostgreSQL запущен
docker-compose exec postgres pg_isready -U postgres

# Проверить подключение изнутри app контейнера
docker-compose exec app psql -h postgres -U postgres -d game -c "SELECT 1;"
```

## 🚀 Быстрое исправление:

### Вариант A: Обновить docker-compose.yml
Добавить `extra_hosts` и убедиться что `DB_HOST=postgres`:

```yaml
app:
  # ... остальная конфигурация
  environment:
    - DB_HOST=postgres  # Убедиться что это postgres, а не localhost
    # ... остальные переменные
  extra_hosts:
    - "localhost:host-gateway"
```

### Вариант B: Использовать host.docker.internal
Если проблема остается, изменить на:
```yaml
app:
  environment:
    - DB_HOST=host.docker.internal  # Подключение к хосту
```

## 🔍 Диагностика:

```bash
# Проверить сеть Docker
docker network ls
docker network inspect game3_default

# Проверить что контейнеры в одной сети
docker-compose exec app ping postgres

# Проверить переменные окружения
docker-compose exec app printenv | grep DB
```

## 📋 Ожидаемый результат:

После исправления логи должны показать:
```
✓ Database connection established
✓ Server running on port 3001
✓ Connected to PostgreSQL
```

Вместо ошибок `ECONNREFUSED`.

Проверьте конфигурацию БД в коде и убедитесь, что используется `DB_HOST=postgres`!