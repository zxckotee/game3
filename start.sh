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

# Останавливаем существующие контейнеры
echo "Останавливаем существующие контейнеры..."
docker-compose down

# Собираем и запускаем контейнеры
echo "Собираем и запускаем контейнеры..."
docker-compose up --build -d

# Проверяем статус
echo "Проверяем статус контейнеров..."
docker-compose ps

echo "Приложение запущено на http://localhost:3000" 