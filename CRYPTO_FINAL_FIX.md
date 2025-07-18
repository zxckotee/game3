# 🔥 ОКОНЧАТЕЛЬНОЕ исправление crypto-browserify

## 🚨 Проблема:
```
Module not found: Error: You attempted to import /home/gamer/game3/node_modules/crypto-browserify/index.js which falls outside of the project src/ directory.
```

**Причина:** etag-utils.js все еще пытается импортировать Node.js crypto в браузере!

## 🎯 РАДИКАЛЬНОЕ решение:

### 1. Полностью убрать crypto из etag-utils.js

Замените содержимое `src/server/utils/etag-utils.js`:

```javascript
/**
 * ETag утилиты БЕЗ crypto для совместимости с браузером
 */

// Простая функция хеширования без crypto
function simpleHash(str) {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Конвертируем в 32-битное число
  }
  
  return Math.abs(hash).toString(36);
}

// Генерация ETag без crypto
function generateETag(data) {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  const timestamp = Date.now().toString();
  const hash = simpleHash(content + timestamp);
  
  return `"${hash}"`;
}

// Проверка ETag
function isETagValid(etag, data) {
  if (!etag) return false;
  
  try {
    const content = typeof data === 'string' ? data : JSON.stringify(data);
    const hash = simpleHash(content);
    return etag.includes(hash.substring(0, 8)); // Частичное совпадение
  } catch (error) {
    return false;
  }
}

// Middleware для Express
function etagMiddleware(req, res, next) {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (res.statusCode === 200 && data) {
      const etag = generateETag(data);
      res.set('ETag', etag);
      
      const clientETag = req.headers['if-none-match'];
      if (clientETag && isETagValid(clientETag, data)) {
        return res.status(304).end();
      }
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}

module.exports = {
  generateETag,
  isETagValid,
  etagMiddleware,
  simpleHash
};
```

### 2. Исправить права доступа в Docker

Добавьте в Dockerfile:

```dockerfile
# В конце Dockerfile добавить:
RUN chown -R node:node /app
USER node
```

### 3. Обновленный Dockerfile:

```dockerfile
# Используем Ubuntu-based образ для максимальной совместимости с Ubuntu 24.04
FROM node:18-bullseye-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Обновляем пакеты и устанавливаем зависимости
RUN apt-get update && apt-get install -y \
    postgresql-client \
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

# Исправляем права доступа
RUN chown -R node:node /app

# Экспонируем порты для React (80) и Express (3001)
EXPOSE 80 3001

# Переключаемся на пользователя node
USER node

# По умолчанию запускаем npm run dev
CMD ["npm", "run", "dev"]
```

## 🚀 Команды для применения:

```bash
# 1. Остановить все
docker-compose down --volumes --remove-orphans

# 2. Удалить образы
docker rmi game3_server game3_client game3_app

# 3. Очистить кэш
docker system prune -a -f

# 4. Пересобрать и запустить
docker-compose -f docker-compose-simple.yml up -d --build
```

## 🎯 Альтернативное решение - убрать etag-utils вообще:

Если проблема остается, временно закомментируйте все импорты etag-utils:

### В файлах routes:
```javascript
// const { etagMiddleware } = require('../utils/etag-utils');

// Закомментировать все использования:
// app.use(etagMiddleware);
```

### Быстрый поиск и замена:
```bash
# Найти все файлы с импортом etag-utils
grep -r "etag-utils" src/

# Закомментировать импорты
sed -i 's/.*etag-utils.*/\/\/ &/' src/server/routes/*.js
sed -i 's/.*etagMiddleware.*/\/\/ &/' src/services/*.js
```

## 🔥 САМОЕ БЫСТРОЕ решение:

1. Замените содержимое `src/server/utils/etag-utils.js` на код выше (без crypto)
2. Обновите Dockerfile с правами доступа
3. Пересоберите контейнеры

Это должно окончательно решить проблему с crypto-browserify!