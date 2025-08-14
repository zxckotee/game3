# HTTPS Setup для culty.ru

## Быстрый старт

### 1. Подготовка
```bash
# Клонируйте репозиторий
git clone <repository-url>
cd game3

# Настройте переменные окружения
cp .env.production.example .env.production
nano .env.production  # Измените пароли и секреты!
```

### 2. Развертывание
```bash
# Сделайте скрипты исполняемыми
chmod +x scripts/*.sh

# Запустите автоматическое развертывание
./scripts/deploy-production.sh
```

### 3. Проверка
```bash
# Проверьте статус
docker-compose -f docker-compose.prod.yml ps

# Тестируйте HTTPS
curl -I https://culty.ru
curl https://culty.ru/api/health
```

## Структура файлов

```
├── docker-compose.prod.yml     # Docker Compose для продакшена
├── nginx.prod.conf            # Nginx с HTTPS конфигурацией
├── Dockerfile.prod           # Оптимизированный Dockerfile
├── .env.production          # Переменные окружения (НЕ в git)
├── .env.production.example  # Пример переменных окружения
├── scripts/
│   ├── init-letsencrypt.sh     # Инициализация SSL сертификатов
│   └── deploy-production.sh    # Полное развертывание
├── ssl/                       # SSL сертификаты (автосоздание)
└── docs/
    └── HTTPS_DEPLOYMENT.md    # Подробная документация
```

## Важные команды

```bash
# Логи
docker-compose -f docker-compose.prod.yml logs -f

# Обновление сертификатов
docker-compose -f docker-compose.prod.yml exec certbot certbot renew

# Бэкап базы данных
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres game > backup.sql

# Остановка
docker-compose -f docker-compose.prod.yml down
```

## Безопасность

### Многоуровневая защита HTTPS:
1. **Nginx редирект** - серверный редирект HTTP → HTTPS
2. **JavaScript редирект** - клиентский редирект в index.html
3. **CSP upgrade-insecure-requests** - автоматическое обновление HTTP запросов
4. **HSTS заголовки** - принудительное использование HTTPS в браузере

⚠️ **ОБЯЗАТЕЛЬНО измените в .env.production:**
- `DB_PASSWORD` - пароль PostgreSQL
- `JWT_SECRET` - секрет для JWT токенов (мин. 32 символа)
- `SESSION_SECRET` - секрет для сессий (мин. 32 символа)
- `CERTBOT_EMAIL` - ваш email для Let's Encrypt

## Поддержка

📖 Полная документация: [`docs/HTTPS_DEPLOYMENT.md`](docs/HTTPS_DEPLOYMENT.md)

🌐 Сайт: https://culty.ru

🔧 API Health: https://culty.ru/api/health