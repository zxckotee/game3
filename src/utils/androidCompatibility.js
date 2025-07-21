/**
 * Утилиты для обеспечения совместимости с Android браузерами
 * Решает специфические проблемы Android устройств
 */

import { getAndroidInfo } from './errorHandler';

// Применение Android-специфичных исправлений
export function applyAndroidFixes() {
  const androidInfo = getAndroidInfo();
  
  if (!androidInfo) return;
  
  console.log('🤖 Android устройство обнаружено:', androidInfo);
  
  // Исправление 1: Уменьшение использования памяти
  if (androidInfo.isLowMemory || androidInfo.isOldAndroid) {
    window.ANDROID_LOW_MEMORY_MODE = true;
    console.log('📱 Включен режим экономии памяти для Android');
    
    // Отключаем тяжелые функции
    window.DISABLE_HEAVY_ANIMATIONS = true;
    window.REDUCE_PARTICLE_EFFECTS = true;
    window.LIMIT_CONCURRENT_REQUESTS = true;
  }
  
  // Исправление 2: WebView совместимость
  if (androidInfo.isWebView) {
    window.ANDROID_WEBVIEW_MODE = true;
    console.log('🌐 Обнаружен Android WebView');
    
    // Отключаем некоторые функции для WebView
    window.DISABLE_HEAVY_ANIMATIONS = true;
    window.REDUCE_UPDATE_FREQUENCY = true;
    window.DISABLE_AUDIO = true; // WebView часто имеет проблемы с аудио
    
    // Показываем предупреждение пользователю
    showWebViewWarning();
  }
  
  // Исправление 3: Samsung Internet особенности
  if (androidInfo.isSamsung) {
    window.SAMSUNG_BROWSER_MODE = true;
    console.log('📱 Обнаружен Samsung Internet');
    
    // Samsung Internet имеет свои особенности с localStorage
    fixSamsungLocalStorage();
  }
  
  // Исправление 4: UC Browser особенности
  if (androidInfo.isUC) {
    window.UC_BROWSER_MODE = true;
    console.log('🌐 Обнаружен UC Browser');
    
    // UC Browser агрессивно кэширует и сжимает
    window.DISABLE_COMPRESSION_SENSITIVE_FEATURES = true;
  }
  
  // Исправление 5: Старые версии Chrome
  if (androidInfo.chromeVersion && parseInt(androidInfo.chromeVersion) < 80) {
    window.OLD_CHROME_MODE = true;
    console.log('⚠️ Старая версия Chrome обнаружена');
    
    // Загружаем дополнительные полифиллы
    loadOldChromePolyfills();
  }
  
  // Исправление 6: Общие Android оптимизации
  applyGeneralAndroidOptimizations();
}

// Показать предупреждение для WebView
function showWebViewWarning() {
  // Создаем предупреждение только если его еще нет
  if (document.getElementById('webview-warning')) return;
  
  const warning = document.createElement('div');
  warning.id = 'webview-warning';
  warning.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #ff9800;
    color: white;
    padding: 10px;
    text-align: center;
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 14px;
  `;
  
  warning.innerHTML = `
    ⚠️ Обнаружен WebView. Для лучшей работы откройте в браузере Chrome.
    <button onclick="this.parentElement.remove()" style="margin-left: 10px; background: white; color: #ff9800; border: none; padding: 5px 10px; border-radius: 3px;">✕</button>
  `;
  
  document.body.appendChild(warning);
  
  // Автоматически скрываем через 10 секунд
  setTimeout(() => {
    if (warning.parentElement) {
      warning.remove();
    }
  }, 10000);
}

// Исправление для Samsung Internet localStorage
function fixSamsungLocalStorage() {
  try {
    // Samsung Internet иногда имеет проблемы с localStorage
    const testKey = '__samsung_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
  } catch (error) {
    console.warn('Samsung Internet localStorage issue detected, using fallback');
    
    // Создаем fallback для localStorage
    window.localStorage = {
      _data: {},
      setItem: function(key, value) {
        this._data[key] = String(value);
      },
      getItem: function(key) {
        return this._data[key] || null;
      },
      removeItem: function(key) {
        delete this._data[key];
      },
      clear: function() {
        this._data = {};
      }
    };
  }
}

// Полифиллы для старых версий Chrome на Android
function loadOldChromePolyfills() {
  // Полифилл для Object.entries
  if (!Object.entries) {
    Object.entries = function(obj) {
      return Object.keys(obj).map(key => [key, obj[key]]);
    };
  }
  
  // Полифилл для Array.includes
  if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement) {
      return this.indexOf(searchElement) !== -1;
    };
  }
  
  // Полифилл для String.includes
  if (!String.prototype.includes) {
    String.prototype.includes = function(search) {
      return this.indexOf(search) !== -1;
    };
  }
  
  // Полифилл для Promise.finally
  if (Promise && !Promise.prototype.finally) {
    Promise.prototype.finally = function(callback) {
      return this.then(
        value => Promise.resolve(callback()).then(() => value),
        reason => Promise.resolve(callback()).then(() => { throw reason; })
      );
    };
  }
  
  console.log('🔧 Полифиллы для старого Chrome загружены');
}

// Общие оптимизации для Android
function applyGeneralAndroidOptimizations() {
  // Оптимизация 1: Уменьшение частоты обновлений
  if (window.ANDROID_LOW_MEMORY_MODE) {
    // Увеличиваем интервалы обновления
    window.GAME_UPDATE_INTERVAL = 2000; // вместо 1000ms
    window.WEATHER_UPDATE_INTERVAL = 30000; // вместо 15000ms
  }
  
  // Оптимизация 2: Отключение requestAnimationFrame для анимаций
  if (window.DISABLE_HEAVY_ANIMATIONS) {
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function(callback) {
      // Заменяем на setTimeout для экономии ресурсов
      return setTimeout(callback, 33); // ~30fps вместо 60fps
    };
  }
  
  // Оптимизация 3: Принудительная сборка мусора
  if (window.gc && window.ANDROID_LOW_MEMORY_MODE) {
    setInterval(() => {
      try {
        window.gc();
      } catch (e) {
        // Игнорируем ошибки
      }
    }, 30000); // Каждые 30 секунд
  }
  
  // Оптимизация 4: Ограничение одновременных запросов
  if (window.LIMIT_CONCURRENT_REQUESTS) {
    const originalFetch = window.fetch;
    let activeRequests = 0;
    const maxConcurrentRequests = 3;
    
    window.fetch = function(...args) {
      if (activeRequests >= maxConcurrentRequests) {
        return new Promise(resolve => {
          setTimeout(() => resolve(originalFetch(...args)), 100);
        });
      }
      
      activeRequests++;
      return originalFetch(...args).finally(() => {
        activeRequests--;
      });
    };
  }
}

// Проверка производительности Android устройства
export function checkAndroidPerformance() {
  const androidInfo = getAndroidInfo();
  if (!androidInfo) return null;
  
  const performance = {
    isLowEnd: false,
    recommendations: []
  };
  
  // Проверка памяти
  if (androidInfo.isLowMemory) {
    performance.isLowEnd = true;
    performance.recommendations.push('Закройте другие приложения для освобождения памяти');
  }
  
  // Проверка версии Android
  if (androidInfo.isOldAndroid) {
    performance.isLowEnd = true;
    performance.recommendations.push('Рассмотрите обновление Android для лучшей производительности');
  }
  
  // Проверка браузера
  if (androidInfo.isWebView) {
    performance.recommendations.push('Откройте игру в браузере Chrome для лучшей производительности');
  }
  
  if (androidInfo.isSamsung || androidInfo.isUC) {
    performance.recommendations.push('Попробуйте использовать Chrome браузер вместо текущего');
  }
  
  return performance;
}

// Создание упрощенного режима для слабых Android устройств
export function shouldUseSimplifiedMode() {
  const androidInfo = getAndroidInfo();
  if (!androidInfo) return false;
  
  // Используем упрощенный режим для:
  return androidInfo.isLowMemory || 
         androidInfo.isOldAndroid || 
         (androidInfo.chromeVersion && parseInt(androidInfo.chromeVersion) < 70);
}

// Инициализация Android совместимости
export function initAndroidCompatibility() {
  const androidInfo = getAndroidInfo();
  
  if (androidInfo) {
    console.log('🤖 Инициализация Android совместимости...');
    
    // Применяем исправления
    applyAndroidFixes();
    
    // Проверяем производительность
    const performance = checkAndroidPerformance();
    if (performance && performance.isLowEnd) {
      console.warn('📱 Обнаружено слабое Android устройство');
      console.log('💡 Рекомендации:', performance.recommendations);
    }
    
    // Показываем информацию пользователю
    if (performance && performance.recommendations.length > 0) {
      showAndroidRecommendations(performance.recommendations);
    }
    
    console.log('✅ Android совместимость инициализирована');
  }
}

// Показать рекомендации для Android пользователей
function showAndroidRecommendations(recommendations) {
  // Показываем рекомендации в консоли
  console.group('💡 Рекомендации для улучшения производительности:');
  recommendations.forEach(rec => console.log('•', rec));
  console.groupEnd();
  
  // Можно также показать уведомление в интерфейсе
  // (это будет реализовано в AndroidCompatibilityWrapper)
}

// Экспортируем функции
export { getAndroidInfo };