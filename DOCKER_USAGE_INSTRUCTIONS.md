# 🐳 Инструкции по использованию новой Docker конфигурации

## 📋 Созданные файлы

✅ **Все файлы пересозданы:**

1. `Dockerfile.new` - Оптимизированный Dockerfile для разработки
2. `docker-compose.new.yml` - Упрощенная конфигурация без PostgreSQL
3. `.dockerignore.new` - Оптимизация сборки
4. `.env.docker` - Docker-специфичные переменные окружения

## 🚀 Быстрый запуск

### 1. Тестирование новой конфигурации

```bash
# Сборка и запуск новой конфигурации
docker-compose -f docker-compose.new.yml up --build

# Или в фоновом режиме
docker-compose -f docker-compose.new.yml up -d --build
```

### 2. Проверка работоспособности

После запуска проверьте:

- **React приложение**: http://localhost:80
- **API сервер**: http://localhost:3001/api/status
- **Proxy работает**: http://localhost:80/api/status

### 3. Просмотр логов

```bash
# Все логи
docker-compose -f docker-compose.new.yml logs -f

# Только логи приложения
docker-compose -f docker-compose.new.yml logs -f app
```

## 🔄 Замена старой конфигурации

### После успешного тестирования:

```bash
# 1. Остановить старую конфигурацию (если запущена)
docker-compose down --rmi all -v

# 2. Создать резервные копии старых файлов
mv Dockerfile Dockerfile.old
mv docker-compose.yml docker-compose.old.yml 2>/dev/null || true
mv .dockerignore .dockerignore.old 2>/dev/null || true

# 3. Заменить файлы на новые
mv Dockerfile.new Dockerfile
mv docker-compose.new.yml docker-compose.yml
mv .dockerignore.new .dockerignore

# 4. Запустить с новой конфигурацией
docker-compose up --build
```

## 🎯 Что делает новая конфигурация

### Архитектура
- **Один контейнер** вместо сложной архитектуры
- **npm run dev** запускает concurrently React + Express
- **Без PostgreSQL** как требовалось
- **Hot reload** для обеих частей приложения

### Порты
- **80** - React dev server (craco)
- **3001** - Express API server
- **Proxy** настроен в craco.config.js: `/api` → Express

### Оптимизации
- Кэширование npm зависимостей
- Исключение node_modules из volume
- Минимальный базовый образ
- Быстрая сборка через .dockerignore

## ✅ Ожидаемые результаты

### Успешный запуск должен показать:

```bash
$ docker-compose -f docker-compose.new.yml up
Creating network "game3_app_network" with the default driver
Creating immortal-path-app ... done
Attaching to immortal-path-app
immortal-path-app | 
immortal-path-app | > immortal-path@1.0.0 dev
immortal-path-app | > concurrently "npm run start" "npm run server"
immortal-path-app | 
immortal-path-app | [0] 
immortal-path-app | [0] > immortal-path@1.0.0 start
immortal-path-app | [0] > craco start
immortal-path-app | [1] 
immortal-path-app | [1] > immortal-path@1.0.0 server
immortal-path-app | [1] > node src/server.js
immortal-path-app | [0] Starting the development server...
immortal-path-app | [1] API сервер успешно запущен на порту 3001
immortal-path-app | [0] Compiled successfully!
immortal-path-app | [0] You can now view immortal-path in the browser.
immortal-path-app | [0]   Local:            http://localhost:80
```

### Проверка статуса:

```bash
$ docker-compose -f docker-compose.new.yml ps
NAME                COMMAND                  SERVICE             STATUS              PORTS
immortal-path-app   "docker-entrypoint.s…"   app                 running             0.0.0.0:80->80/tcp, 0.0.0.0:3001->3001/tcp
```

## 🛠️ Команды для разработки

```bash
# Перезапуск приложения
docker-compose -f docker-compose.new.yml restart app

# Вход в контейнер
docker-compose -f docker-compose.new.yml exec app sh

# Установка новых зависимостей
docker-compose -f docker-compose.new.yml exec app npm install package-name

# Остановка
docker-compose -f docker-compose.new.yml down
```

## 🚨 Возможные проблемы

### Порт 80 занят
```bash
# Измените в docker-compose.new.yml
ports:
  - "8080:80"  # Вместо "80:80"
```

### Hot reload не работает
Переменные уже настроены в конфигурации:
- `CHOKIDAR_USEPOLLING=true`
- `WATCHPACK_POLLING=true`

### Docker не запущен
```bash
# Запустите Docker Desktop или Docker Engine
# Затем повторите команды
```

## 🎯 Готово к использованию!

Новая Docker конфигурация полностью готова и оптимизирована для точного копирования `npm run dev` без PostgreSQL.

**Следующий шаг:** Протестируйте конфигурацию командой:
```bash
docker-compose -f docker-compose.new.yml up --build