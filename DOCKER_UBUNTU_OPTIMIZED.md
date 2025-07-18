# 🐧 Оптимизированная конфигурация для Ubuntu 24.04 + PostgreSQL 16.9

## 🎯 Ваша среда:
- **ОС**: Ubuntu 24.04
- **PostgreSQL**: 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)
- **Архитектура**: Полная совместимость с Ubuntu-based образами

## 🚀 Оптимальная конфигурация

### 1. Рекомендуемый docker-compose.yml

```yaml
version: '3.8'

services:
  # База данных PostgreSQL - точно такая же версия как на хосте
  postgres:
    image: postgres:16.9  # Точное соответствие вашей версии
    container_name: game_postgres
    environment:
      POSTGRES_DB: game
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: root
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d game"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - game_network

  # Express API сервер
  server:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: game_server
    ports:
      - "3001:3001"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - PORT=3001
      - DATABASE_URL=postgresql://postgres:root@postgres:5432/game
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=game
      - DB_USER=postgres
      - DB_PASSWORD=root
    depends_on:
      postgres:
        condition: service_healthy
    command: ["npm", "run", "server"]
    restart: unless-stopped
    networks:
      - game_network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 15s
      retries: 5
      start_period: 90s

  # React клиент
  client:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: game_client
    ports:
      - "80:80"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - PORT=80
      - REACT_APP_API_URL=http://localhost:3001
      - CHOKIDAR_USEPOLLING=true
      - WATCHPACK_POLLING=true
    depends_on:
      postgres:
        condition: service_healthy
      server:
        condition: service_healthy
    command: ["npm", "run", "start"]
    restart: unless-stopped
    stdin_open: true
    tty: true
    networks:
      - game_network

volumes:
  postgres_data:
    driver: local

networks:
  game_network:
    driver: bridge
```

### 2. Оптимизированный Dockerfile для Ubuntu

```dockerfile
# Используем Ubuntu-based образ для максимальной совместимости с хостом
FROM node:18-bullseye-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Обновляем пакеты и устанавливаем зависимости
RUN apt-get update && apt-get install -y \
    postgresql-client-16 \
    python3 \
    build-essential \
    git \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm config set registry https://registry.npmjs.org/ && \
    npm cache clean --force && \
    npm install --legacy-peer-deps

# Копируем исходный код
COPY . .

# Экспонируем порты для React (80) и Express (3001)
EXPOSE 80 3001

# По умолчанию запускаем npm run dev
CMD ["npm", "run", "dev"]
```

## 🎯 Альтернативный вариант: Использование хостовой PostgreSQL

Если хотите использовать PostgreSQL с хоста (рекомендуется для продакшена):

### docker-compose.yml без PostgreSQL контейнера

```yaml
version: '3.8'

services:
  # Express API сервер - подключается к PostgreSQL на хосте
  server:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: game_server
    ports:
      - "3001:3001"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - PORT=3001
      - DATABASE_URL=postgresql://postgres:root@host.docker.internal:5432/game
      - DB_HOST=host.docker.internal  # Подключение к PostgreSQL на хосте
      - DB_PORT=5432
      - DB_NAME=game
      - DB_USER=postgres
      - DB_PASSWORD=root
    command: ["npm", "run", "server"]
    restart: unless-stopped
    networks:
      - game_network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 15s
      retries: 5
      start_period: 90s

  # React клиент
  client:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: game_client
    ports:
      - "80:80"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - PORT=80
      - REACT_APP_API_URL=http://localhost:3001
      - CHOKIDAR_USEPOLLING=true
      - WATCHPACK_POLLING=true
    depends_on:
      - server
    command: ["npm", "run", "start"]
    restart: unless-stopped
    stdin_open: true
    tty: true
    networks:
      - game_network

networks:
  game_network:
    driver: bridge
```

## 🔧 Настройка хостовой PostgreSQL

Если используете хостовую PostgreSQL, настройте доступ:

```bash
# Редактировать postgresql.conf
sudo nano /etc/postgresql/16/main/postgresql.conf

# Добавить:
listen_addresses = 'localhost,172.17.0.1'  # Docker bridge IP

# Редактировать pg_hba.conf
sudo nano /etc/postgresql/16/main/pg_hba.conf

# Добавить:
host    all             all             172.17.0.0/16           md5

# Перезапустить PostgreSQL
sudo systemctl restart postgresql
```

## 📊 Сравнение вариантов

| Вариант | Преимущества | Недостатки |
|---------|-------------|------------|
| **PostgreSQL в контейнере** | Изолированность, легкое развертывание | Дублирование ресурсов |
| **PostgreSQL на хосте** | Использование существующей БД, производительность | Сложнее настройка |

## 🚀 Рекомендации

### Для разработки:
Используйте **PostgreSQL в контейнере** - проще и изолированно

### Для продакшена:
Используйте **PostgreSQL на хосте** - лучше производительность и управление

## 💡 Преимущества Ubuntu-based образов для вашей среды:

1. **Полная совместимость** с Ubuntu 24.04
2. **Одинаковые версии пакетов** с хостом
3. **Лучшая отладка** - знакомые инструменты
4. **Стабильность** - проверенная совместимость
5. **PostgreSQL клиент 16** - точное соответствие

## 🎯 Итоговая рекомендация

Для вашей среды Ubuntu 24.04 + PostgreSQL 16.9 **оптимально использовать Ubuntu-based образы** вместо Alpine. Это даст максимальную совместимость и стабильность.

Используйте первую конфигурацию с PostgreSQL 16.9 в контейнере для простоты развертывания.