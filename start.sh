#!/bin/bash

# Проверяем наличие Docker
if ! command -v docker &> /dev/null; then
    echo "Docker не установлен. Пожалуйста, установите Docker."
    exit 1
fi

# Проверяем наличие Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose не установлен. Пожалуйста, установите Docker Compose."
    exit 1
fi

# Проверяем наличие SSL сертификатов
if [ ! -f "ssl/culty.ru.crt" ] || [ ! -f "ssl/culty.ru.key" ]; then
    echo "ВНИМАНИЕ: SSL сертификаты не найдены в папке ssl/"
    echo "Приложение будет работать только по HTTP"
fi

# Останавливаем существующие контейнеры
echo "Останавливаем существующие контейнеры..."
docker-compose down

# Собираем и запускаем контейнеры
echo "Собираем и запускаем контейнеры..."
docker-compose up --build -d

# Проверяем статус
echo "Проверяем статус контейнеров..."
docker-compose ps

echo "============================================="
echo "Приложение успешно запущено!"
echo "============================================="
echo "HTTP доступ:"
echo "  - Фронтенд: http://localhost:80"
echo "  - API: http://localhost:3001"
echo ""
echo "HTTPS доступ:"
echo "  - Фронтенд: https://localhost:443"
echo "  - API: https://localhost:3443"
echo ""
echo "SSL сертификаты:"
if [ -f "ssl/culty.ru.crt" ] && [ -f "ssl/culty.ru.key" ]; then
    echo "  ✅ Найдены и активны"
else
    echo "  ❌ Не найдены"
fi
echo "============================================="