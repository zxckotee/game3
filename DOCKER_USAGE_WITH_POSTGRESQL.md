# 🐘 Инструкции по использованию Docker с PostgreSQL 16

## ✅ Что реализовано

1. **Модифицирован `database-connection-manager.js`** - поддержка переменных окружения
2. **Обновлен `docker-compose.yml`** - добавлен PostgreSQL 16
3. **Настроена автоматическая инициализация** - SQL файлы из папки `sql/`
4. **Настроены зависимости** - приложение ждет готовности PostgreSQL

## 🚀 Как это работает

### Локальная разработка (`npm run dev`)
- Переменные окружения `DB_*` не установлены
- Использует `src/config/database.json` (host: localhost)
- Подключается к вашему локальному PostgreSQL

### Docker разработка (`docker-compose up`)
- Переменные окружения `DB_HOST=postgres` установлены
- Переопределяет настройки из database.json
- Подключается к PostgreSQL контейнеру

### PostgreSQL доступность
- **Внутри Docker**: `postgres:5432` (между контейнерами)
- **С хоста**: `localhost:5432` (для psql)

## 📋 Команды для использования

### Запуск полной системы
```bash
# Сборка и запуск всех сервисов
docker-compose up --build

# Запуск в фоновом режиме
docker-compose up -d --build

# Просмотр логов
docker-compose logs -f

# Просмотр логов только PostgreSQL
docker-compose logs -f postgres

# Просмотр логов только приложения
docker-compose logs -f app
```

### Работа с PostgreSQL
```bash
# Подключение к PostgreSQL с хоста (как обычно)
psql -h localhost -U postgres -d game

# Подключение из контейнера приложения
docker-compose exec app psql -h postgres -U postgres -d game

# Проверка статуса PostgreSQL
docker-compose exec postgres pg_isready -U postgres -d game
```

### Управление контейнерами
```bash
# Остановка всех сервисов
docker-compose down

# Остановка с удалением volumes (ОСТОРОЖНО: удалит данные БД)
docker-compose down -v

# Перезапуск только приложения
docker-compose restart app

# Перезапуск только PostgreSQL
docker-compose restart postgres
```

### Отладка
```bash
# Проверка переменных окружения в контейнере
docker-compose exec app env | grep DB_

# Вход в контейнер приложения
docker-compose exec app sh

# Вход в контейнер PostgreSQL
docker-compose exec postgres bash

# Проверка статуса всех контейнеров
docker-compose ps
```

## ✅ Ожидаемые результаты

### Успешный запуск
```bash
$ docker-compose up --build
Creating network "game3_app_network" with the default driver
Creating volume "game3_postgres_data" with local driver
Creating immortal-path-postgres ... done
Creating immortal-path-app      ... done
Attaching to immortal-path-postgres, immortal-path-app
postgres_1  | PostgreSQL init process complete; ready for start up
app_1       | Попытка подключения к PostgreSQL (postgres:5432)...
app_1       | Используются переменные окружения для подключения к БД
app_1       | Успешное подключение к PostgreSQL подтверждено
app_1       | API сервер успешно запущен на порту 3001
app_1       | Compiled successfully!
app_1       | You can now view immortal-path in the browser.
app_1       | Local:            http://localhost:80
```

### Проверка статуса
```bash
$ docker-compose ps
NAME                    COMMAND                  SERVICE             STATUS              PORTS
immortal-path-app       "docker-entrypoint.s…"   app                 running             0.0.0.0:80->80/tcp, 0.0.0.0:3001->3001/tcp
immortal-path-postgres  "docker-entrypoint.s…"   postgres            running (healthy)   0.0.0.0:5432->5432/tcp
```

### Проверка подключения
```bash
$ psql -h localhost -U postgres -d game
Password for user postgres: root
psql (16.x)
Type "help" for help.

game=# \dt
# Должны отобразиться таблицы из SQL файлов
```

## 🔧 Автоматическая инициализация базы данных

При первом запуске PostgreSQL автоматически выполнит все SQL файлы из папки `sql/` в алфавитном порядке:

```
sql/00_reference_tables.sql
sql/01_quests.sql
sql/02_merchants.sql
...
```

Данные сохраняются в volume `postgres_data` и не теряются при перезапуске контейнеров.

## 🚨 Важные моменты

1. **Первый запуск может занять время** - PostgreSQL инициализирует базу данных
2. **Данные сохраняются** между перезапусками в volume `postgres_data`
3. **Локальная разработка не изменилась** - `npm run dev` работает как раньше
4. **psql работает как обычно** - подключение через `localhost:5432`

## 🎯 Готово к использованию!

Новая Docker конфигурация полностью готова. Теперь у вас есть:

- ✅ PostgreSQL 16 в Docker
- ✅ Автоматическая инициализация базы данных
- ✅ Hot reload для React и Express
- ✅ Доступ к PostgreSQL через psql
- ✅ Сохранение данных между перезапусками
- ✅ Совместимость с локальной разработкой

**Команда для запуска:**
```bash
docker-compose up --build
```

**Доступ к приложению:**
- React: http://localhost:80
- API: http://localhost:3001
- PostgreSQL: localhost:5432 (psql)