/**
 * Глобальная система обработки ошибок для диагностики проблем
 * Особенно важно для Android браузеров, которые часто показывают только "Script error"
 *
 * Ошибки логируются в консоль, но НЕ показываются пользователю
 */

// Настройки обработчика ошибок
const ERROR_HANDLER_CONFIG = {
  showErrorsToUser: false,  // false = скрывать ошибки от пользователя, true = показывать
  logToConsole: true,       // всегда логировать в консоль
  sendToServer: true        // отправлять на сервер (если настроено)
};

// Функция для отправки ошибок на сервер (опционально)
function sendErrorToServer(errorData) {
  try {
    // Можно отправлять на внешний сервис логирования или свой API
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData)
    }).catch(() => {
      // Игнорируем ошибки отправки, чтобы не создавать циклы
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
    devicePixelRatio: window.devicePixelRatio,
    memory: getMemoryInfo(),
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
  if (userAgent.match(/samsungbrowser/i)) return "Samsung Internet";
  if (userAgent.match(/ucbrowser/i)) return "UC Browser";
  return "Unknown";
}

// Функция для получения информации о памяти
function getMemoryInfo() {
  if (!performance.memory) return null;
  
  const memory = performance.memory;
  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    memoryPressure: memory.usedJSHeapSize / memory.jsHeapSizeLimit,
    deviceMemory: navigator.deviceMemory || null
  };
}

// Детекция Android и его особенностей
function getAndroidInfo() {
  const ua = navigator.userAgent;
  const isAndroid = /Android/.test(ua);
  
  if (!isAndroid) return null;
  
  // Извлекаем версию Android
  const androidVersion = ua.match(/Android\s([0-9\.]*)/);
  const chromeVersion = ua.match(/Chrome\/([0-9\.]*)/);
  
  return {
    isAndroid: true,
    version: androidVersion ? androidVersion[1] : 'unknown',
    chromeVersion: chromeVersion ? chromeVersion[1] : 'unknown',
    isWebView: /wv/.test(ua), // WebView detection
    isSamsung: /SamsungBrowser/.test(ua),
    isUC: /UCBrowser/.test(ua),
    isOldAndroid: androidVersion && parseFloat(androidVersion[1]) < 7.0,
    isLowMemory: navigator.deviceMemory && navigator.deviceMemory < 2
  };
}

// Специальная обработка для Android ошибок
function handleAndroidError(errorData) {
  const androidInfo = getAndroidInfo();
  
  if (androidInfo) {
    errorData.android = androidInfo;
    
    // Специальные сообщения для Android проблем
    if (androidInfo.isWebView) {
      errorData.possibleCause = 'Android WebView compatibility issue';
      errorData.suggestion = 'Try opening in Chrome browser directly';
    }
    
    if (androidInfo.isLowMemory) {
      errorData.possibleCause = 'Low memory Android device';
      errorData.suggestion = 'Close other apps and refresh page';
    }
    
    if (androidInfo.isOldAndroid) {
      errorData.possibleCause = 'Old Android version with limited JS support';
      errorData.suggestion = 'Update Android or use newer device';
    }
    
    if (androidInfo.isSamsung) {
      errorData.possibleCause = 'Samsung Internet browser compatibility';
      errorData.suggestion = 'Try using Chrome browser instead';
    }
    
    if (androidInfo.isUC) {
      errorData.possibleCause = 'UC Browser compatibility issue';
      errorData.suggestion = 'Try using Chrome browser instead';
    }
  }
  
  return errorData;
}

// Глобальный обработчик JavaScript ошибок
export function initGlobalErrorHandler() {
  // Обработка синхронных ошибок
  window.onerror = function(message, source, lineno, colno, error) {
    let errorData = {
      type: 'javascript-error',
      message: message,
      source: source,
      line: lineno,
      column: colno,
      error: error ? error.toString() : null,
      stack: error ? error.stack : null,
      browser: getBrowserInfo()
    };
    
    // Добавляем Android-специфичную информацию
    errorData = handleAndroidError(errorData);
    
    // Логируем в консоль если включено
    if (ERROR_HANDLER_CONFIG.logToConsole) {
      console.error('🚨 JavaScript Error (Enhanced):', errorData);
    }
    
    // Отправляем на сервер если включено
    if (ERROR_HANDLER_CONFIG.sendToServer) {
      sendErrorToServer(errorData);
    }
    
    // Возвращаем true чтобы предотвратить показ ошибки пользователю
    // false = показать ошибку пользователю, true = скрыть ошибку
    return !ERROR_HANDLER_CONFIG.showErrorsToUser;
  };
  
  // Обработка асинхронных ошибок (Promise rejections)
  window.addEventListener('unhandledrejection', function(event) {
    let errorData = {
      type: 'unhandled-promise-rejection',
      reason: event.reason ? event.reason.toString() : 'Unknown',
      stack: event.reason && event.reason.stack ? event.reason.stack : null,
      browser: getBrowserInfo()
    };
    
    errorData = handleAndroidError(errorData);
    
    // Логируем в консоль если включено
    if (ERROR_HANDLER_CONFIG.logToConsole) {
      console.error('🚨 Unhandled Promise Rejection:', errorData);
    }
    
    // Отправляем на сервер если включено
    if (ERROR_HANDLER_CONFIG.sendToServer) {
      sendErrorToServer(errorData);
    }
    
    // Предотвращаем показ ошибки пользователю если настроено
    if (!ERROR_HANDLER_CONFIG.showErrorsToUser) {
      event.preventDefault();
    }
  });
  
  // Обработка ошибок загрузки ресурсов
  window.addEventListener('error', function(event) {
    if (event.target !== window) {
      let errorData = {
        type: 'resource-error',
        element: event.target.tagName,
        source: event.target.src || event.target.href,
        message: 'Failed to load resource',
        browser: getBrowserInfo()
      };
      
      errorData = handleAndroidError(errorData);
      
      console.error('🚨 Resource Error:', errorData);
      sendErrorToServer(errorData);
    }
  }, true);
  
  console.log('✅ Global error handler initialized');
  
  // Логируем информацию о браузере при инициализации
  const browserInfo = getBrowserInfo();
  console.log('🌐 Browser Info:', browserInfo);
  
  // Специальное предупреждение для Android
  const androidInfo = getAndroidInfo();
  if (androidInfo) {
    console.log('🤖 Android Device Detected:', androidInfo);
    
    if (androidInfo.isWebView) {
      console.warn('⚠️ WebView detected. For better performance, open in Chrome browser.');
    }
    
    if (androidInfo.isLowMemory) {
      console.warn('📱 Low memory device detected. Close other apps for better performance.');
    }
    
    if (androidInfo.isOldAndroid) {
      console.warn('⚠️ Old Android version detected. Some features may not work properly.');
    }
  }
}

// Функция для тестирования обработчика ошибок
export function testErrorHandler() {
  console.log('🧪 Testing error handler...');
  
  // Тест синхронной ошибки
  setTimeout(() => {
    throw new Error('Test synchronous error for debugging');
  }, 100);
  
  // Тест асинхронной ошибки
  setTimeout(() => {
    Promise.reject(new Error('Test promise rejection for debugging'));
  }, 200);
}

// Функция для мониторинга памяти (особенно важно для Android)
export function startMemoryMonitoring() {
  if (!performance.memory) {
    console.warn('Memory API недоступен в этом браузере');
    return;
  }
  
  const checkMemory = () => {
    const memory = getMemoryInfo();
    
    // Предупреждение при высоком использовании памяти
    if (memory.memoryPressure > 0.8) {
      console.warn('🚨 Высокое использование памяти:', memory);
      
      // Попытка освободить память
      if (window.gc) {
        window.gc(); // Принудительная сборка мусора (только в Chrome с флагом)
      }
      
      // Уведомляем пользователя
      const androidInfo = getAndroidInfo();
      if (androidInfo) {
        console.warn('💡 Рекомендация для Android: закройте другие приложения и вкладки');
      }
    }
  };
  
  // Проверяем память каждые 10 секунд
  setInterval(checkMemory, 10000);
  
  // Первая проверка сразу
  checkMemory();
  
  console.log('📊 Memory monitoring started');
}

// Функции для управления настройками обработчика ошибок
export function setErrorHandlerConfig(config) {
  Object.assign(ERROR_HANDLER_CONFIG, config);
  console.log('🔧 Настройки обработчика ошибок обновлены:', ERROR_HANDLER_CONFIG);
}

export function getErrorHandlerConfig() {
  return { ...ERROR_HANDLER_CONFIG };
}

// Быстрые функции для включения/отключения показа ошибок
export function hideErrorsFromUser() {
  ERROR_HANDLER_CONFIG.showErrorsToUser = false;
  console.log('🔇 Ошибки скрыты от пользователей (логируются в консоль)');
}

export function showErrorsToUser() {
  ERROR_HANDLER_CONFIG.showErrorsToUser = true;
  console.log('🔊 Ошибки будут показываться пользователям');
}

// Добавляем функции в window для отладки
if (typeof window !== 'undefined') {
  window.testErrorHandler = testErrorHandler;
  window.getBrowserInfo = getBrowserInfo;
  window.getAndroidInfo = getAndroidInfo;
  window.startMemoryMonitoring = startMemoryMonitoring;
  
  // Функции управления настройками
  window.setErrorHandlerConfig = setErrorHandlerConfig;
  window.getErrorHandlerConfig = getErrorHandlerConfig;
  window.hideErrorsFromUser = hideErrorsFromUser;
  window.showErrorsToUser = showErrorsToUser;
}

export { getBrowserInfo, getAndroidInfo };