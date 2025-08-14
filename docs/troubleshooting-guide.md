# Руководство по устранению проблем HTTPS

## Проблема 1: npm run dev открывает HTTP вместо HTTPS

### Причина
React dev server не использует SSL сертификаты правильно.

### Решение
Обновлен `.env` файл с дополнительными переменными:
```bash
# HTTPS настройки для React dev server
HTTPS=true
SSL_CRT_FILE=ssl/culty.ru.crt
SSL_KEY_FILE=ssl/culty.ru.key

# Дополнительные переменные для React HTTPS
REACT_APP_HTTPS=true
HTTPS_CRT_FILE=ssl/culty.ru.crt
HTTPS_KEY_FILE=ssl/culty.ru.key
```

### Проверка
1. Остановите текущий dev server (Ctrl+C)
2. Запустите заново: `npm run dev`
3. Должен открыться `https://localhost:3000`

## Проблема 2: Docker сайт недоступен

### Диагностика
Выполните следующие команды для проверки:

```bash
# Проверка статуса контейнеров
docker-compose ps

# Проверка логов приложения
docker-compose logs app

# Проверка логов Nginx
docker-compose logs nginx

# Проверка логов PostgreSQL
docker-compose logs postgres
```

### Возможные причины и решения

#### 1. Контейнеры не запущены
```bash
# Запуск контейнеров
docker-compose up -d
```

#### 2. Orphan контейнеры мешают
```bash
# Очистка и перезапуск
./docker-cleanup.sh
docker-compose up -d
```

#### 3. Порты заняты
```bash
# Проверка занятых портов
netstat -tulpn | grep :80
netstat -tulpn | grep :443
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001
netstat -tulpn | grep :5432
```

#### 4. SSL сертификаты недоступны в Nginx
```bash
# Проверка монтирования SSL
docker exec immortal-path-nginx ls -la /etc/nginx/ssl/
```

#### 5. Приложение не может подключиться к PostgreSQL
```bash
# Проверка подключения к БД
docker exec immortal-path-app ping postgres
```

### Пошаговая диагностика

1. **Проверьте статус всех контейнеров:**
   ```bash
   docker-compose ps
   ```
   Все контейнеры должны быть в состоянии "Up"

2. **Проверьте логи приложения:**
   ```bash
   docker-compose logs app | tail -20
   ```
   Ищите сообщение: "HTTP API сервер успешно запущен на порту 3001"

3. **Проверьте логи Nginx:**
   ```bash
   docker-compose logs nginx | tail -20
   ```
   Не должно быть ошибок SSL

4. **Проверьте доступность портов:**
   ```bash
   curl -I http://localhost:80
   curl -I https://localhost:443
   ```

5. **Проверьте внутреннюю связность:**
   ```bash
   docker exec immortal-path-nginx curl -I http://app:80
   ```

## Проблема 3: SSL сертификаты не работают

### Проверка сертификатов
```bash
# Проверка существования файлов
ls -la ssl/

# Проверка содержимого сертификата
openssl x509 -in ssl/culty.ru.crt -text -noout

# Проверка приватного ключа
openssl rsa -in ssl/culty.ru.key -check
```

### Проверка соответствия сертификата и ключа
```bash
openssl x509 -noout -modulus -in ssl/culty.ru.crt | openssl md5
openssl rsa -noout -modulus -in ssl/culty.ru.key | openssl md5
```
Хеши должны совпадать.

## Быстрое решение всех проблем

```bash
# 1. Остановите все процессы
pkill -f "npm run dev"
docker-compose down

# 2. Очистите Docker
./docker-cleanup.sh

# 3. Запустите Docker заново
docker-compose up -d

# 4. Проверьте статус
docker-compose ps
docker-compose logs app | tail -10

# 5. Для локальной разработки
npm run dev
```

## Контакты для поддержки

Если проблемы не решаются:
1. Сохраните вывод команд диагностики
2. Проверьте логи: `docker-compose logs > debug.log`
3. Опишите шаги, которые привели к проблеме