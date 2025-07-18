# 🔍 Различия между локальным ПК и Docker сервером

## 🚨 Проблема:
- **Локально (npm start):** Работает отлично
- **Docker сервер:** crypto-browserify ошибка

## 🎯 Причина различий:

### На локальном ПК:
- React и Express запускаются **отдельно**
- `npm start` = только React (порт 3000)
- `npm run server` = только Express (порт 3001)
- **Нет смешивания** серверного и клиентского кода

### В Docker:
- `npm run dev` = **одновременно** React + Express
- React **видит** серверные файлы в src/server/
- Webpack пытается **собрать** etag-utils.js для браузера
- **crypto-browserify ошибка** при сборке

## 🔧 Найденные файлы с etag-utils:

1. `src/server/routes/technique-routes.js`
2. `src/server/routes/spirit-pets-routes.js` 
3. `src/server/routes/sect-routes.js`
4. `src/server/routes/inventory-routes.js`
5. `src/server/routes/enemy-routes.js`
6. `src/server.js`
7. `src/services/inventory-service.js`

## 🚀 Решения:

### Решение 1: Исключить server папку из React сборки

Добавить в `craco.config.js`:

```javascript
const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Исключить серверные файлы из клиентской сборки
      webpackConfig.module.rules.push({
        test: /\.js$/,
        include: path.resolve(__dirname, 'src/server'),
        use: 'ignore-loader'
      });
      
      return webpackConfig;
    }
  },
  devServer: {
    port: 80
  }
};
```

### Решение 2: Переместить server папку наружу

```bash
# Переместить server папку на уровень выше
mv src/server ./server

# Обновить импорты в package.json
# "server": "node server/server.js"
```

### Решение 3: Убрать crypto из etag-utils.js

Заменить содержимое `src/server/utils/etag-utils.js`:

```javascript
// Простая версия без crypto для совместимости
function calculateETag(data) {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  const hash = content.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return `"${Math.abs(hash).toString(36)}"`;
}

module.exports = { calculateETag };
```

### Решение 4: Отдельные Dockerfile для server и client

**Dockerfile.server:**
```dockerfile
FROM node:18-bullseye-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
EXPOSE 3001
CMD ["npm", "run", "server"]
```

**Dockerfile.client:**
```dockerfile
FROM node:18-bullseye-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
EXPOSE 80
CMD ["npm", "start"]
```

## ⚡ БЫСТРОЕ решение ПРЯМО СЕЙЧАС:

### Вариант A: Обновить craco.config.js
```javascript
const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Исключить server папку из сборки React
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        '@server': false
      };
      
      // Игнорировать server файлы
      webpackConfig.module.rules.push({
        test: /\.js$/,
        include: [
          path.resolve(__dirname, 'src/server'),
          path.resolve(__dirname, 'src/services')
        ],
        use: 'null-loader'
      });
      
      return webpackConfig;
    }
  },
  devServer: {
    port: 80,
    host: '0.0.0.0'
  }
};
```

### Вариант B: Простой etag-utils без crypto
Заменить `src/server/utils/etag-utils.js` на версию без crypto (код выше).

## 🎯 Рекомендация:

1. **Сначала попробуйте Вариант B** (простой etag-utils)
2. Если не поможет - **Вариант A** (обновить craco.config.js)
3. Если все еще проблемы - **переместить server папку** наружу

## 📋 Команды для применения:

```bash
# Остановить контейнеры
docker-compose down

# Применить изменения в файлах
# (etag-utils.js или craco.config.js)

# Пересобрать и запустить
docker-compose -f docker-compose-simple.yml up -d --build
```

Проблема в том, что Docker смешивает серверный и клиентский код, а локально они разделены!