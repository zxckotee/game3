# 🚨 Диагностика ошибки "Container is unhealthy"

## ✅ Что работает
- PostgreSQL запустился успешно: `Creating immortal-path-postgres ... done`
- Сеть создана: `Creating network "game3_app_network"`
- Volume создан: `Creating volume "game3_postgres_data"`

## ❌ Проблема
```
ERROR: for app  Container "2f13c390d874" is unhealthy.
```

## 🔍 Диагностика

### Шаг 1: Проверить логи приложения
```bash
# Посмотреть что происходит в контейнере приложения
docker-compose logs app

# Или по ID контейнера
docker logs 2f13c390d874
```

### Шаг 2: Проверить статус контейнеров
```bash
# Проверить статус всех контейнеров
docker-compose ps

# Детальная информация
docker inspect 2f13c390d874
```

### Шаг 3: Проверить health check
```bash
# Проверить health check приложения
docker-compose exec app curl -f http://localhost:3001/api/health || echo "Health check failed"
```

## 🎯 Возможные причины

### 1. Приложение не запустилось
- Ошибка в коде
- Проблема с зависимостями
- Ошибка подключения к PostgreSQL

### 2. Health check не настроен
В docker-compose.yml нет health check для app, но Docker может использовать внутренний

### 3. Порты не доступны
- Приложение не слушает на портах 80/3001
- Конфликт портов

### 4. Проблема с переменными окружения
- DB_HOST=postgres не работает
- Неправильные настройки подключения

## 🚀 Решения

### Решение 1: Убрать health check зависимость
```yaml
# В docker-compose.yml изменить:
depends_on:
  postgres:
    condition: service_healthy
# На:
depends_on:
  - postgres
```

### Решение 2: Добавить health check для app
```yaml
app:
  # ... остальная конфигурация
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 60s
```

### Решение 3: Запуск без health check
```bash
# Запустить без проверки зависимостей
docker-compose up --no-deps app
```

## ⚡ Быстрое исправление

### Вариант 1: Проверить логи и исправить
```bash
# 1. Посмотреть что случилось
docker-compose logs app

# 2. Если есть ошибки - исправить
# 3. Перезапустить
docker-compose restart app
```

### Вариант 2: Упростить зависимости
```bash
# Остановить все
docker-compose down

# Изменить docker-compose.yml (убрать condition: service_healthy)
# Запустить заново
docker-compose up
```

## 🔧 Команды для диагностики

```bash
# Проверить все контейнеры
docker-compose ps

# Логи PostgreSQL
docker-compose logs postgres

# Логи приложения
docker-compose logs app

# Войти в контейнер приложения
docker-compose exec app sh

# Проверить подключение к PostgreSQL из приложения
docker-compose exec app ping postgres

# Проверить переменные окружения
docker-compose exec app env | grep DB_
```

## 📋 Ожидаемые результаты диагностики

### Если приложение работает:
```
app_1  | Попытка подключения к PostgreSQL (postgres:5432)...
app_1  | Используются переменные окружения для подключения к БД
app_1  | Успешное подключение к PostgreSQL подтверждено
app_1  | API сервер успешно запущен на порту 3001
```

### Если есть проблемы:
```
app_1  | Error: connect ECONNREFUSED postgres:5432
app_1  | КРИТИЧЕСКАЯ ОШИБКА: Не удалось подключиться к PostgreSQL
```

## 🎯 Следующие шаги

1. **Проверить логи**: `docker-compose logs app`
2. **Найти ошибку** в логах
3. **Исправить проблему** (обычно подключение к БД)
4. **Перезапустить**: `docker-compose restart app`

Скорее всего проблема в подключении к PostgreSQL или в health check зависимости.