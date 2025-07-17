# План обновления Docker конфигурации

## Анализ текущей архитектуры

На основе изучения проекта выявлено:

### Структура проекта
- **Frontend**: React приложение с CRACO конфигурацией
- **Backend**: Express.js сервер на порту 3001
- **Database**: PostgreSQL
- **Dev команда**: `npm run dev` запускает concurrently React (порт 3000) и Express сервер (порт 3001)

### Текущие проблемы Docker конфигурации
1. Dockerfile настроен только для production сборки (`npm run build`)
2. Не поддерживает dev режим с hot reload
3. Неправильные переменные окружения в docker-compose.yml
4. Порты не соответствуют реальной архитектуре

## Новая конфигурация Docker

### Dockerfile для разработки

```dockerfile
# Используем Node.js 18 LTS для лучшей совместимости
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем системные зависимости
RUN apk add --no-cache \
    postgresql-client \
    python3 \
    make \
    g++ \
    git

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm config set registry https://registry.npmjs.org/ && \
    npm cache clean --force && \
    npm install --legacy-peer-deps && \
    npm install concurrently --save-dev

# Копируем исходный код
COPY . .

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Меняем владельца файлов
RUN chown -R nextjs:nodejs /app
USER nextjs

# Экспонируем порты для React (3000) и Express (3001)
EXPOSE 3000 3001

# Команда для разработки
CMD ["npm", "run", "dev"]
```

### docker-compose.yml для разработки

```yaml
version: '3.8'

services:
  # База данных PostgreSQL
  postgres:
    image: postgres:15-alpine
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

  # Основное приложение (React + Express)
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: game_app
    ports:
      - "3000:3000"  # React dev server
      - "3001:3001"  # Express API server
    volumes:
      # Монтируем исходный код для hot reload
      - .:/app
      - /app/node_modules
      - /app/build
    environment:
      - NODE_ENV=development
      - REACT_APP_API_URL=http://localhost:3001
      - DATABASE_URL=postgresql://postgres:root@postgres:5432/game
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=game
      - DB_USER=postgres
      - DB_PASSWORD=root
      - PORT=3001
      - REACT_APP_PORT=3000
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    stdin_open: true
    tty: true

  # Nginx для проксирования (опционально)
  nginx:
    image: nginx:alpine
    container_name: game_nginx
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
    driver: local

networks:
  default:
    name: game_network
```

### Обновленный nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server app:3000;
    }
    
    upstream backend {
        server app:3001;
    }

    server {
        listen 80;
        server_name localhost;

        # Проксирование API запросов
        location /api/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Проксирование WebSocket для hot reload
        location /sockjs-node {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }

        # Все остальные запросы к React приложению
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

### Обновленный .dockerignore

```
node_modules
npm-debug.log
build
.git
.gitignore
.env
*.log
.vscode
.DS_Store
coverage
.nyc_output
docs
README.md
*.md
.dockerignore
Dockerfile
docker-compose.yml
```

## Переменные окружения

### .env файл для разработки

```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=game
DB_USER=postgres
DB_PASSWORD=root
DATABASE_URL=postgresql://postgres:root@postgres:5432/game

# Application
NODE_ENV=development
PORT=3001
REACT_APP_PORT=3000
REACT_APP_API_URL=http://localhost:3001

# Security
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
```

## Команды для запуска

### Разработка
```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f app

# Остановка
docker-compose down

# Пересборка при изменении Dockerfile
docker-compose up --build
```

### Инициализация базы данных
```bash
# Выполнение миграций
docker-compose exec app npm run migrate

# Заполнение начальными данными
docker-compose exec app npm run seed
```

## Преимущества новой конфигурации

1. **Hot Reload**: Изменения в коде автоматически отражаются без перезапуска контейнера
2. **Разделение портов**: React (3000) и Express (3001) работают на разных портах
3. **Healthcheck**: Проверка готовности PostgreSQL перед запуском приложения
4. **Volume mapping**: Исходный код монтируется для разработки
5. **Nginx**: Опциональное проксирование для production-like окружения
6. **Безопасность**: Запуск под непривилегированным пользователем

## Структура после применения

```
project/
├── Dockerfile              # Новый Dockerfile для dev
├── docker-compose.yml      # Обновленный compose файл
├── nginx.conf              # Конфигурация Nginx
├── .dockerignore           # Обновленный ignore файл
├── .env                    # Переменные окружения
└── src/                    # Исходный код приложения
```

## Следующие шаги

1. Переключиться в режим Code для реализации изменений
2. Создать новые Docker файлы
3. Обновить переменные окружения
4. Протестировать запуск в Docker
5. Документировать процесс развертывания