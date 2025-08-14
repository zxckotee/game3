#!/bin/bash

echo "🧹 Очистка Docker контейнеров и образов..."

# Останавливаем все контейнеры
echo "Остановка всех контейнеров..."
docker-compose down --remove-orphans

# Удаляем неиспользуемые контейнеры
echo "Удаление неиспользуемых контейнеров..."
docker container prune -f

# Удаляем неиспользуемые образы
echo "Удаление неиспользуемых образов..."
docker image prune -f

# Удаляем неиспользуемые сети
echo "Удаление неиспользуемых сетей..."
docker network prune -f

# Удаляем неиспользуемые volumes (осторожно с данными!)
echo "Удаление неиспользуемых volumes..."
docker volume prune -f

echo "✅ Очистка завершена!"
echo ""
echo "Для запуска приложения используйте:"
echo "docker-compose up -d"