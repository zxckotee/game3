# План диагностики и решения ошибки "Script error"

## Анализ проблемы

Ошибка `Script error` в строке `bundle.js:114416:58` указывает на проблему в собранном JavaScript файле. Это общая ошибка, которая может возникать по нескольким причинам.

## Выявленные проблемы

### 1. Конфигурация браузеров (package.json)
```json
"browserslist": {
  "production": [
    ">0.2%",
    "not dead", 
    "not op_mini all"
  ],
  "development": [
    "last 1 chrome version",
    "last 1 firefox version", 
    "last 1 safari version"
  ]
}
```
**Проблема**: Не поддерживаются старые браузеры (IE, старые версии Edge, Safari)

### 2. Webpack конфигурация (craco.config.js)
- Отключены source maps: `GENERATE_SOURCEMAP=false`
- Сложные fallback'и для Node.js модулей
- Игнорирование предупреждений может скрывать реальные проблемы

### 3. Отсутствие глобальной обработки ошибок
- Нет `window.onerror` обработчика
- Нет `window.addEventListener('unhandledrejection')` 
- Нет детального логирования ошибок

## План решения

### Этап 1: Добавление глобальной обработки ошибок

Создать файл `src/utils/errorHandler.js`:

```javascript
/**
 * Глобальная система обработки ошибок для диагностики проблем
 */

// Функция для отправки ошибок на сервер (опционально)
function sendErrorToServer(errorData) {
  try {
    // Можно отправлять на внешний сервис логирования
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData)
    }).catch(() => {
      // Игнорируем ошибки отправки
    });
  } catch (e) {
    // Игнорируем ошибки
  }
}

// Функция для сбора информации о браузере
function getBrowserInfo() {
  const ua = navigator.userAgent;
  return {
    userAgent: ua,
    browser: detectBrowser(ua),
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    screen: {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    url: window.location.href,
    timestamp: new Date().toISOString()
  };
}

function detectBrowser(userAgent) {
  if (userAgent.match(/chrome|chromium|crios/i)) return "Chrome";
  if (userAgent.match(/firefox|fxios/i)) return "Firefox";
  if (userAgent.match(/safari/i)) return "Safari";
  if (userAgent.match(/opr\//i)) return "Opera";
  if (userAgent.match(/edg/i)) return "Edge";
  if (userAgent.match(/msie|trident/i)) return "Internet Explorer";
  return "Unknown";
}

// Глобальный обработчик JavaScript ошибок
export function initGlobalErrorHandler() {
  // Обработка синхронных ошибок
  window.onerror = function(message, source, lineno, colno, error) {
    const errorData = {
      type: 'javascript-error',
      message: message,
      source: source,
      line: lineno,
      column: colno,
      error: error ? error.toString() : null,
      stack: error ? error.stack : null,
      browser: getBrowserInfo()
    };
    
    console.error('🚨 JavaScript Error:', errorData);
    sendErrorToServer(errorData);
    
    // Не блокируем выполнение
    return false;
  };
  
  // Обработка асинхронных ошибок (Promise rejections)
  window.addEventListener('unhandledrejection', function(event) {
    const errorData = {
      type: 'unhandled-promise-rejection',
      reason: event.reason ? event.reason.toString() : 'Unknown',
      stack: event.reason && event.reason.stack ? event.reason.stack : null,
      browser: getBrowserInfo()
    };
    
    console.error('🚨 Unhandled Promise Rejection:', errorData);
    sendErrorToServer(errorData);
  });
  
  // Обработка ошибок загрузки ресурсов
  window.addEventListener('error', function(event) {
    if (event.target !== window) {
      const errorData = {
        type: 'resource-error',
        element: event.target.tagName,
        source: event.target.src || event.target.href,
        message: 'Failed to load resource',
        browser: getBrowserInfo()
      };
      
      console.error('🚨 Resource Error:', errorData);
      sendErrorToServer(errorData);
    }
  }, true);
  
  console.log('✅ Global error handler initialized');
}

// Функция для тестирования обработчика ошибок
export function testErrorHandler() {
  console.log('🧪 Testing error handler...');
  
  // Тест синхронной ошибки
  setTimeout(() => {
    throw new Error('Test synchronous error');
  }, 100);
  
  // Тест асинхронной ошибки
  setTimeout(() => {
    Promise.reject(new Error('Test promise rejection'));
  }, 200);
}

// Добавляем функции в window для отладки
if (typeof window !== 'undefined') {
  window.testErrorHandler = testErrorHandler;
  window.getBrowserInfo = getBrowserInfo;
}
```

### Этап 2: Улучшение конфигурации Webpack

Обновить `craco.config.js`:

```javascript
// Добавить в конфигурацию
module.exports = {
  webpack: {
    configure: (webpackConfig, { env }) => {
      // Включаем source maps для production для лучшей отладки
      if (env === 'production') {
        webpackConfig.devtool = 'source-map';
      }
      
      // Добавляем crossorigin для лучшей обработки ошибок
      webpackConfig.output = {
        ...webpackConfig.output,
        crossOriginLoading: 'anonymous'
      };
      
      // Остальная конфигурация...
      return webpackConfig;
    }
  }
};
```

### Этап 3: Обновление HTML для CORS

Обновить `public/index.html`:

```html
<!-- Добавить crossorigin для скриптов -->
<script crossorigin="anonymous"></script>

<!-- Добавить мета-теги для лучшей совместимости -->
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="format-detection" content="telephone=no">
```

### Этап 4: Улучшение поддержки браузеров

Обновить `package.json`:

```json
"browserslist": {
  "production": [
    ">0.2%",
    "not dead",
    "not op_mini all",
    "ie >= 11",
    "edge >= 12"
  ],
  "development": [
    "last 2 chrome version",
    "last 2 firefox version",
    "last 2 safari version",
    "ie >= 11"
  ]
}
```

### Этап 5: Добавление полифиллов

Создать `src/polyfills.js`:

```javascript
// Полифиллы для старых браузеров
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// Полифилл для fetch
if (!window.fetch) {
  require('whatwg-fetch');
}

// Полифилл для Promise
if (!window.Promise) {
  window.Promise = require('es6-promise').Promise;
}

// Полифилл для Object.assign
if (!Object.assign) {
  Object.assign = require('object-assign');
}
```

### Этап 6: Интеграция в приложение

Обновить `src/index.js`:

```javascript
import React from 'react';
import { createRoot } from 'react-dom/client';

// Импортируем полифиллы первыми
import './polyfills';

// Импортируем обработчик ошибок
import { initGlobalErrorHandler } from './utils/errorHandler';

import App from './App';

// Инициализируем обработчик ошибок
initGlobalErrorHandler();

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## Инструменты для диагностики

### 1. Консольные команды для отладки

```javascript
// Проверка браузера
window.getBrowserInfo()

// Тест обработчика ошибок
window.testErrorHandler()

// Проверка загруженных скриптов
Array.from(document.scripts).map(s => ({
  src: s.src,
  crossOrigin: s.crossOrigin,
  loaded: s.readyState
}))
```

### 2. Мониторинг ошибок

Добавить в `src/App.js`:

```javascript
useEffect(() => {
  // Логируем информацию о браузере при загрузке
  console.log('🌐 Browser Info:', window.getBrowserInfo?.());
  
  // Проверяем поддержку современных функций
  const features = {
    fetch: typeof fetch !== 'undefined',
    promise: typeof Promise !== 'undefined',
    arrow: (() => { try { eval('() => {}'); return true; } catch { return false; } })(),
    const: (() => { try { eval('const x = 1'); return true; } catch { return false; } })(),
    let: (() => { try { eval('let x = 1'); return true; } catch { return false; } })(),
    spread: (() => { try { eval('[...[]'); return true; } catch { return false; } })(),
    destructuring: (() => { try { eval('const {x} = {}'); return true; } catch { return false; } })()
  };
  
  console.log('🔧 Feature Support:', features);
  
  // Предупреждаем о неподдерживаемых функциях
  const unsupported = Object.entries(features)
    .filter(([key, supported]) => !supported)
    .map(([key]) => key);
    
  if (unsupported.length > 0) {
    console.warn('⚠️ Unsupported features:', unsupported);
  }
}, []);
```

## Следующие шаги

1. **Реализовать код**: Переключиться в режим Code для создания файлов
2. **Тестировать**: Проверить работу на разных браузерах
3. **Мониторить**: Собирать данные об ошибках с удаленного сервера
4. **Оптимизировать**: Улучшать совместимость на основе данных

## Ожидаемые результаты

После внедрения этих изменений:
- Получим детальную информацию об ошибках
- Улучшим совместимость со старыми браузерами
- Сможем точно диагностировать проблему работодателя
- Предотвратим подобные ошибки в будущем