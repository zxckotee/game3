# Простое решение проблемы с crypto

## Проблема
Файлы `src/utils/etag-utils.js` и серверные файлы попадают в клиентскую сборку React.

## Быстрое решение

### 1. Переместить серверные файлы
Переместите файлы, которые используют Node.js crypto, в папку `src/server/`:

```bash
# Переместить etag-utils.js
mv src/utils/etag-utils.js src/server/utils/
```

### 2. Создать браузерную версию etag-utils
Создайте `src/utils/etag-utils-browser.js`:

```javascript
/**
 * Браузерная версия etag-utils без Node.js crypto
 */

/**
 * Простой хеш для браузера (без crypto)
 * @param {Object} data - Данные для хеширования
 * @returns {string} - Простой хеш
 */
function calculateETag(data) {
  const str = JSON.stringify(data);
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Конвертируем в 32-битное число
  }
  
  return `"${Math.abs(hash).toString(16)}"`;
}

export { calculateETag };
```

### 3. Обновить импорты
В файлах, которые используют etag-utils, измените импорт:

```javascript
// Было:
// const { calculateETag } = require('../utils/etag-utils');

// Стало:
import { calculateETag } from '../utils/etag-utils-browser';
```

### 4. Исключить серверные файлы из сборки
Обновите `craco.config.js`:

```javascript
const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Исключаем серверные файлы из клиентской сборки
      webpackConfig.module.rules.push({
        test: /src\/server\//,
        use: 'null-loader'
      });

      // Исключаем файлы с Node.js crypto
      webpackConfig.module.rules.push({
        test: /etag-utils\.js$/,
        use: 'null-loader'
      });

      return webpackConfig;
    }
  }
};
```

### 5. Альтернативное решение - условный импорт
Создайте `src/utils/crypto-adapter.js`:

```javascript
/**
 * Адаптер для crypto - работает и в браузере, и в Node.js
 */

let crypto;
let isServer = false;

// Определяем среду выполнения
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  // Node.js среда
  isServer = true;
  try {
    crypto = require('crypto');
  } catch (e) {
    console.warn('Node.js crypto недоступен');
  }
} else {
  // Браузерная среда
  crypto = window.crypto;
}

/**
 * Создает хеш данных
 * @param {Object} data - Данные для хеширования
 * @returns {string} - Хеш
 */
function createHash(data) {
  const str = JSON.stringify(data);
  
  if (isServer && crypto && crypto.createHash) {
    // Node.js версия
    return crypto.createHash('md5').update(str).digest('hex');
  } else {
    // Браузерная версия - простой хеш
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

export { createHash };
```

## Самое простое решение (рекомендуемое)

### Добавьте в package.json:
```json
{
  "scripts": {
    "build": "GENERATE_SOURCEMAP=false react-scripts build"
  }
}
```

### Создайте файл `.env.production`:
```env
GENERATE_SOURCEMAP=false
SKIP_PREFLIGHT_CHECK=true
```

### Обновите craco.config.js:
```javascript
module.exports = {
  webpack: {
    configure: (webpackConfig, { env }) => {
      if (env === 'production') {
        // В продакшене исключаем проблемные файлы
        webpackConfig.externals = {
          ...webpackConfig.externals,
          'crypto': 'crypto'
        };
      }
      
      return webpackConfig;
    }
  }
};
```

## Команды для исправления:

```bash
# 1. Создать папку для серверных утилит
mkdir -p src/server/utils

# 2. Переместить проблемный файл
mv src/utils/etag-utils.js src/server/utils/

# 3. Очистить кеш и пересобрать
rm -rf node_modules package-lock.json build
npm install
npm run build
```

Это должно решить проблему раз и навсегда!