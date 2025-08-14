#!/bin/bash

echo "🚀 Запуск HTTPS для culty.ru"

# Останавливаем существующие контейнеры
echo "⏹️  Остановка существующих контейнеров..."
docker-compose down

# Запускаем с новой конфигурацией
echo "🔄 Запуск контейнеров с HTTPS..."
docker-compose up -d

# Ждем запуска
echo "⏳ Ожидание запуска сервисов..."
sleep 10

# Проверяем статус
echo "📊 Статус контейнеров:"
docker-compose ps

echo ""
echo "✅ Готово!"
echo "🌐 HTTP:  http://culty.ru (редирект на HTTPS)"
echo "🔒 HTTPS: https://culty.ru"
echo "🔧 API:   https://culty.ru/api/health"
echo ""
echo "📋 Полезные команды:"
echo "  Логи:     docker-compose logs -f"
echo "  Остановка: docker-compose down"
echo "  Перезапуск: docker-compose restart"