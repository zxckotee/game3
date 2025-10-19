# 🔒 Полная настройка SSL сертификата

## Обзор конфигураций

Все возможные конфигурации проекта настроены для использования SSL сертификата `ssl/culty.ru.crt` и `ssl/culty.ru.key`.

## 📁 Файлы сертификатов

```
ssl/
├── culty.ru.crt    # SSL сертификат
└── culty.ru.key    # Приватный ключ
```

## ⚙️ Конфигурационные файлы

### 1. **Серверная часть (Node.js/Express)**

#### `src/server.js`
- ✅ Добавлена поддержка HTTPS сервера на порту 3443
- ✅ Автоматическое создание HTTPS сервера при наличии сертификатов
- ✅ Подключение HTTPS redirect middleware для production
- ✅ Обработка ошибок HTTPS сервера

**Ключевые изменения:**
```javascript
// HTTPS сервер на порту 3443
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

// Создание HTTPS сервера с SSL сертификатами
function createHttpsServer() {
  const httpsOptions = {
    key: fs.readFileSync('ssl/culty.ru.key'),
    cert: fs.readFileSync('ssl/culty.ru.crt')
  };
  return https.createServer(httpsOptions, app);
}
```

### 2. **Фронтенд (React/Webpack)**

#### `craco.config.js`
- ✅ HTTPS настройки для webpack dev server
- ✅ SSL сертификаты подключены к dev server
- ✅ Проксирование API через HTTPS
- ✅ WebSocket поддержка через HTTPS

**Ключевые настройки:**
```javascript
devServer: {
  https: {
    key: path.resolve(__dirname, 'ssl/culty.ru.key'),
    cert: path.resolve(__dirname, 'ssl/culty.ru.crt')
  },
  port: 443,
  proxy: {
    '/api': {
      target: process.env.REACT_APP_API_URL_HTTPS || 'http://localhost:3001'
    }
  }
}
```

#### `webpack.config.js`
- ✅ Полная HTTPS конфигурация для webpack dev server
- ✅ Автоматическая проверка наличия SSL сертификатов
- ✅ Проксирование API через HTTPS/HTTP
- ✅ Поддержка переменных окружения для SSL

**Ключевые настройки:**
```javascript
devServer: {
  port: process.env.REACT_APP_PORT || 443,
  https: process.env.HTTPS === 'true' ? {
    key: fs.readFileSync(path.resolve(__dirname, 'ssl/culty.ru.key')),
    cert: fs.readFileSync(path.resolve(__dirname, 'ssl/culty.ru.crt'))
  } : false,
  proxy: {
    '/api': {
      target: process.env.REACT_APP_API_URL_HTTPS || 'http://localhost:3001',
      changeOrigin: true,
      secure: false
    }
  }
}
```

### 3. **Docker конфигурация**

#### `docker-compose.yml`
- ✅ Добавлен порт 3443 для HTTPS API
- ✅ Монтирование SSL сертификатов
- ✅ Переменные окружения для HTTPS

**Порты:**
```yaml
ports:
  - "80:80"      # React dev server (HTTP)
  - "443:443"    # React dev server (HTTPS) 
  - "3001:3001"  # Express API server (HTTP)
  - "3443:3443"  # Express API server (HTTPS)
```

#### `Dockerfile`
- ✅ Экспорт портов 80, 443, 3001, 3443
- ✅ Переменные окружения для HTTPS

### 4. **Nginx конфигурация**

#### `nginx.conf`
- ✅ HTTPS сервер блок на порту 443
- ✅ SSL сертификаты настроены
- ✅ Автоматический редирект HTTP → HTTPS
- ✅ Проксирование через HTTPS backend

**SSL настройки:**
```nginx
server {
    listen 443 ssl;
    ssl_certificate /app/ssl/culty.ru.crt;
    ssl_certificate_key /app/ssl/culty.ru.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}
```

### 5. **Переменные окружения**

#### `.env` (Development)
```bash
PORT=3001
HTTPS_PORT=3443
REACT_APP_PORT=443
HTTPS=true
SSL_CRT_FILE=ssl/culty.ru.crt
SSL_KEY_FILE=ssl/culty.ru.key
REACT_APP_API_URL=http://localhost:3001
REACT_APP_API_URL_HTTPS=https://localhost:3443
```

#### `.env.production` (Production)
```bash
PORT=3001
HTTPS_PORT=3443
REACT_APP_PORT=443
HTTPS=true
SSL_CRT_FILE=ssl/culty.ru.crt
SSL_KEY_FILE=ssl/culty.ru.key
REACT_APP_API_URL=https://culty.ru
REACT_APP_API_URL_HTTPS=https://culty.ru:3443
```

### 6. **Middleware**

#### `src/server/middleware/https-redirect-middleware.js`
- ✅ Автоматический редирект HTTP → HTTPS
- ✅ Активируется только в production режиме
- ✅ Поддержка proxy headers

## 🚀 Способы запуска

### Локальная разработка
```bash
npm start
# Доступно: https://localhost:443
```

### Docker разработка
```bash
./start.sh
# или
docker-compose up --build
```

### Production
```bash
NODE_ENV=production npm run server
```

## 🌐 Доступные URL

### Development режим
- **Фронтенд HTTP:** http://localhost:80
- **Фронтенд HTTPS:** https://localhost:443
- **API HTTP:** http://localhost:3001
- **API HTTPS:** https://localhost:3443

### Production режим
- **Фронтенд:** https://culty.ru:443
- **API:** https://culty.ru:3443
- **HTTP → HTTPS редирект:** автоматический

## 🔧 Диагностика

### Проверка сертификатов
```bash
# Проверка срока действия
openssl x509 -in ssl/culty.ru.crt -text -noout

# Проверка соответствия ключа и сертификата
openssl rsa -in ssl/culty.ru.key -pubout | openssl md5
openssl x509 -in ssl/culty.ru.crt -pubkey -noout | openssl md5
```

### Проверка HTTPS подключения
```bash
# Тест HTTPS API
curl -k https://localhost:3443/api/status

# Тест фронтенда
curl -k https://localhost:443
```

## 📋 Архитектура

```
┌─────────────────┐    ┌─────────────────┐
│   Браузер       │────│   Nginx:443     │
│                 │    │   (SSL Termination)│
└─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │  React:443      │
                       │  (HTTPS)        │
                       └─────────────────┘
                                │
                       ┌─────────────────┐
                       │  Express:3443   │
                       │  (HTTPS API)    │
                       └─────────────────┘
```

## ✅ Статус конфигураций

- [x] **Серверная часть** - Полностью настроена
- [x] **Фронтенд** - Полностью настроен  
- [x] **Docker** - Полностью настроен
- [x] **Nginx** - Полностью настроен
- [x] **Переменные окружения** - Полностью настроены
- [x] **HTTPS редиректы** - Полностью настроены
- [x] **SSL сертификаты** - Подключены ко всем компонентам

## 🔐 Безопасность

1. **SSL протоколы:** TLSv1.2, TLSv1.3
2. **Cipher suites:** HIGH:!aNULL:!MD5
3. **HTTPS редиректы:** Автоматические в production
4. **Secure headers:** Настроены в middleware

## 📝 Примечания

- Все конфигурации поддерживают как HTTP, так и HTTPS режимы
- HTTPS автоматически активируется при наличии сертификатов
- В development режиме доступны оба протокола
- В production режиме HTTP автоматически редиректится на HTTPS
- SSL сертификаты монтируются в Docker контейнеры
- Поддержка hot reload через HTTPS WebSocket

**Все возможные конфигурации успешно настроены для SSL сертификата! 🎉**