#!/bin/bash

# Скрипт для развертывания приложения в продакшене с HTTPS
# Использование: ./scripts/deploy-production.sh

set -e

echo "### Развертывание Immortal Path на culty.ru ###"

# Проверяем наличие необходимых файлов
if [ ! -f ".env.production" ]; then
    echo "❌ Файл .env.production не найден!"
    echo "Скопируйте .env.production.example и настройте переменные окружения"
    exit 1
fi

if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Файл docker-compose.prod.yml не найден!"
    exit 1
fi

# Проверяем, что домен указывает на этот сервер
echo "### Проверка DNS для culty.ru ###"
if ! nslookup culty.ru > /dev/null 2>&1; then
    echo "⚠️  Предупреждение: DNS для culty.ru не настроен или недоступен"
    read -p "Продолжить развертывание? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Останавливаем существующие контейнеры если они есть
echo "### Остановка существующих контейнеров ###"
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# Создаем необходимые директории
echo "### Создание директорий ###"
mkdir -p ssl/certbot/conf
mkdir -p ssl/certbot/www
mkdir -p ssl/dhparam

# Собираем образы
echo "### Сборка Docker образов ###"
docker-compose -f docker-compose.prod.yml build --no-cache

# Запускаем базу данных
echo "### Запуск PostgreSQL ###"
docker-compose -f docker-compose.prod.yml up -d postgres

# Ждем готовности базы данных
echo "### Ожидание готовности базы данных ###"
sleep 10

# Запускаем приложение
echo "### Запуск приложения ###"
docker-compose -f docker-compose.prod.yml up -d app

# Проверяем, есть ли уже сертификаты
if [ ! -f "ssl/certbot/conf/live/culty.ru/fullchain.pem" ]; then
    echo "### SSL сертификаты не найдены. Запуск инициализации Let's Encrypt ###"
    chmod +x scripts/init-letsencrypt.sh
    ./scripts/init-letsencrypt.sh
else
    echo "### SSL сертификаты найдены. Запуск nginx ###"
    docker-compose -f docker-compose.prod.yml up -d nginx
fi

# Запускаем автоматическое обновление сертификатов
echo "### Запуск автоматического обновления сертификатов ###"
docker-compose -f docker-compose.prod.yml up -d certbot-renew

# Проверяем статус всех сервисов
echo "### Проверка статуса сервисов ###"
docker-compose -f docker-compose.prod.yml ps

# Проверяем доступность API
echo "### Проверка доступности API ###"
sleep 5
if curl -f -k https://culty.ru/api/health > /dev/null 2>&1; then
    echo "✅ API доступен по HTTPS"
elif curl -f http://culty.ru/api/health > /dev/null 2>&1; then
    echo "⚠️  API доступен только по HTTP"
else
    echo "❌ API недоступен"
fi

echo ""
echo "### Развертывание завершено! ###"
echo "🌐 Сайт: https://culty.ru"
echo "🔧 API: https://culty.ru/api/health"
echo ""
echo "📋 Полезные команды:"
echo "  Логи:           docker-compose -f docker-compose.prod.yml logs -f"
echo "  Статус:         docker-compose -f docker-compose.prod.yml ps"
echo "  Остановка:      docker-compose -f docker-compose.prod.yml down"
echo "  Обновление SSL: docker-compose -f docker-compose.prod.yml exec certbot certbot renew"
echo ""
echo "🔒 Не забудьте:"
echo "  1. Настроить firewall (порты 80, 443, 22)"
echo "  2. Настроить регулярные бэкапы базы данных"
echo "  3. Мониторить логи и производительность"