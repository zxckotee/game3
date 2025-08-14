# Исправление проблемы с SSL в Docker

## Проблема
При запуске приложения через Docker возникала ошибка:
```
SSL_CRT_FILE in your env, but the file '/app/ssl/culty.ru.crt' can't be found.
```

## Причина
Приложение в Docker контейнере пыталось использовать HTTPS с SSL сертификатами, но для продакшена правильная архитектура:
- **Nginx** обрабатывает HTTPS (внешний трафик)
- **Приложение** работает на HTTP внутри контейнера

## Решение

### 1. Создан отдельный `.env.docker` файл
```bash
# НЕ используем HTTPS для приложения в Docker
# HTTPS=false
# SSL_CRT_FILE не устанавливаем
# SSL_KEY_FILE не устанавливаем
```

### 2. Обновлен `docker-compose.yml`
- Используется `.env.docker` вместо `.env`
- Удалены переменные SSL для приложения
- Убрано монтирование SSL папки в приложение

### 3. Улучшен `src/server.js`
- Добавлена проверка существования SSL файлов
- Более информативные сообщения об ошибках

### 4. Создан скрипт очистки `docker-cleanup.sh`
```bash
chmod +x docker-cleanup.sh
./docker-cleanup.sh
```

## Архитектура HTTPS

```
Интернет → Nginx (HTTPS:443) → Приложение (HTTP:80/3001)
```

- **Nginx** принимает HTTPS трафик и обрабатывает SSL
- **Приложение** получает HTTP запросы от Nginx
- SSL сертификаты монтируются только в Nginx контейнер

## Команды для развертывания

### Локальная разработка (с HTTPS)
```bash
npm run dev
```
Использует `.env` с HTTPS настройками

### Docker продакшен (Nginx HTTPS)
```bash
./docker-cleanup.sh  # Очистка старых контейнеров
docker-compose up -d # Запуск с .env.docker
```

## Файлы конфигурации

- **`.env`** - для локальной разработки (HTTPS=true)
- **`.env.docker`** - для Docker (без HTTPS для приложения)
- **`nginx.conf`** - обрабатывает HTTPS для Docker
- **`docker-compose.yml`** - использует `.env.docker`

## Проверка работы

1. Запустить Docker: `docker-compose up -d`
2. Проверить логи: `docker-compose logs app`
3. Должно быть: "HTTP API сервер успешно запущен на порту 3001"
4. Nginx обрабатывает HTTPS на портах 80/443