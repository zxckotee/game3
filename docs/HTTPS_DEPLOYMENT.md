# Развертывание HTTPS для culty.ru с Let's Encrypt

## Обзор

Этот документ описывает процесс настройки HTTPS для домена `culty.ru` с использованием Let's Encrypt и автоматическим обновлением сертификатов.

## Архитектура

```
Internet → Nginx (443/80) → React App (3000) + Express API (3001) → PostgreSQL (5432)
                ↓
           Let's Encrypt Certbot (автообновление)
```

## Предварительные требования

### 1. Сервер
- Ubuntu 20.04+ или CentOS 8+
- Docker и Docker Compose установлены
- Минимум 2GB RAM, 20GB диска
- Открытые порты: 22 (SSH), 80 (HTTP), 443 (HTTPS)

### 2. Домен
- Домен `culty.ru` должен указывать на IP сервера
- DNS записи A для `culty.ru` и `www.culty.ru`

### 3. Firewall
```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## Файлы конфигурации

### Основные файлы для продакшена:
- `docker-compose.prod.yml` - Docker Compose для продакшена
- `nginx.prod.conf` - Nginx конфигурация с HTTPS
- `Dockerfile.prod` - Оптимизированный Dockerfile
- `.env.production` - Переменные окружения для продакшена

### Скрипты развертывания:
- `scripts/init-letsencrypt.sh` - Инициализация SSL сертификатов
- `scripts/deploy-production.sh` - Полное развертывание

## Пошаговое развертывание

### Шаг 1: Подготовка сервера

```bash
# Клонируем репозиторий
git clone <repository-url>
cd game3

# Устанавливаем права на выполнение скриптов
chmod +x scripts/*.sh
```

### Шаг 2: Настройка переменных окружения

```bash
# Копируем и редактируем файл окружения
cp .env.production .env.production.local

# Обязательно измените следующие переменные:
# - DB_PASSWORD (надежный пароль для PostgreSQL)
# - JWT_SECRET (минимум 32 символа)
# - SESSION_SECRET (минимум 32 символа)
# - CERTBOT_EMAIL (ваш email для Let's Encrypt)
```

### Шаг 3: Проверка DNS

```bash
# Убедитесь, что домен указывает на ваш сервер
nslookup culty.ru
dig culty.ru A
```

### Шаг 4: Развертывание

```bash
# Запускаем автоматическое развертывание
./scripts/deploy-production.sh
```

Скрипт выполнит:
1. Проверку конфигурации
2. Сборку Docker образов
3. Запуск PostgreSQL
4. Запуск приложения
5. Инициализацию Let's Encrypt сертификатов
6. Настройку автоматического обновления

### Шаг 5: Проверка

```bash
# Проверяем статус сервисов
docker-compose -f docker-compose.prod.yml ps

# Проверяем логи
docker-compose -f docker-compose.prod.yml logs -f

# Тестируем HTTPS
curl -I https://culty.ru
curl https://culty.ru/api/health
```

## Управление сертификатами

### Ручное обновление сертификатов
```bash
docker-compose -f docker-compose.prod.yml exec certbot certbot renew
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### Проверка статуса сертификатов
```bash
docker-compose -f docker-compose.prod.yml exec certbot certbot certificates
```

### Тестирование обновления (dry-run)
```bash
docker-compose -f docker-compose.prod.yml exec certbot certbot renew --dry-run
```

## Мониторинг и обслуживание

### Логи
```bash
# Все сервисы
docker-compose -f docker-compose.prod.yml logs -f

# Конкретный сервис
docker-compose -f docker-compose.prod.yml logs -f nginx
docker-compose -f docker-compose.prod.yml logs -f app
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Бэкапы базы данных
```bash
# Создание бэкапа
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres game > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из бэкапа
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres game < backup.sql
```

### Обновление приложения
```bash
# Получаем последние изменения
git pull origin main

# Пересобираем и перезапускаем
docker-compose -f docker-compose.prod.yml build --no-cache app
docker-compose -f docker-compose.prod.yml up -d app
```

## Безопасность

### SSL/TLS настройки
- TLS 1.2 и 1.3 только
- Современные шифры
- HSTS заголовки
- OCSP Stapling
- Diffie-Hellman параметры

### Заголовки безопасности
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `X-XSS-Protection`
- `Content-Security-Policy`

### Рекомендации
1. Регулярно обновляйте Docker образы
2. Мониторьте логи на подозрительную активность
3. Настройте fail2ban для защиты от брутфорса
4. Используйте сильные пароли для всех сервисов

## Устранение неполадок

### Проблема: Сертификаты не создаются
```bash
# Проверьте DNS
nslookup culty.ru

# Проверьте доступность порта 80
curl -I http://culty.ru/.well-known/acme-challenge/test

# Проверьте логи Certbot
docker-compose -f docker-compose.prod.yml logs certbot
```

### Проблема: Nginx не запускается
```bash
# Проверьте конфигурацию
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Проверьте наличие сертификатов
ls -la ssl/certbot/conf/live/culty.ru/
```

### Проблема: Приложение недоступно
```bash
# Проверьте статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Проверьте логи приложения
docker-compose -f docker-compose.prod.yml logs app

# Проверьте подключение к базе данных
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d game -c "SELECT 1;"
```

## Контакты и поддержка

- Email: admin@culty.ru
- Документация: https://culty.ru/docs
- Мониторинг: https://culty.ru/api/health

## Полезные ссылки

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx SSL Configuration](https://ssl-config.mozilla.org/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)