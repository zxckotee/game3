#!/bin/bash

echo "🧹 Очистка Docker контейнеров и образов..."

# Остановка всех контейнеров проекта
echo "Остановка контейнеров..."
docker-compose down --remove-orphans

# Удаление поврежденных контейнеров
echo "Удаление поврежденных контейнеров..."
docker container prune -f

# Удаление неиспользуемых образов
echo "Удаление неиспользуемых образов..."
docker image prune -f

# Удаление volumes (ОСТОРОЖНО: удалит данные БД!)
echo "⚠️  ВНИМАНИЕ: Удаление volumes удалит все данные PostgreSQL!"
read -p "Удалить volumes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Удаление volumes..."
    docker volume prune -f
    docker volume rm game3_postgres_data 2>/dev/null || true
fi

# Удаление сетей
echo "Удаление неиспользуемых сетей..."
docker network prune -f

echo "✅ Очистка завершена!"
echo ""
echo "Теперь можно запустить:"
echo "docker-compose up --build"