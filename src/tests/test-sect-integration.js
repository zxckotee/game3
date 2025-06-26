/**
 * Интеграционный тест для проверки работы системы сект
 * Запускать в браузере через консоль разработчика
 */

// Вспомогательная функция для форматирования вывода
function logResult(title, result) {
  console.log(`%c ${title} `, 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;');
  console.log(result);
  console.log('---------------------------------------------------');
}

// Вспомогательная функция для форматирования ошибок
function logError(title, error) {
  console.log(`%c ${title} `, 'background: #F44336; color: white; padding: 2px 5px; border-radius: 3px;');
  console.error(error);
  console.log('---------------------------------------------------');
}

// 1. Тестирование импорта модулей
async function testModulesImport() {
  console.log('%c ТЕСТ 1: Импорт модулей ', 'background: #2196F3; color: white; padding: 3px 5px; border-radius: 3px; font-weight: bold;');
  
  try {
    const SectAdapter = require('../services/sect-adapter');
    logResult('Импорт SectAdapter:', SectAdapter);
    
    const SectServiceAPI = require('../services/sect-api');
    logResult('Импорт SectServiceAPI:', SectServiceAPI);
    
    return { success: true, modules: { SectAdapter, SectServiceAPI } };
  } catch (error) {
    logError('Ошибка при импорте модулей:', error);
    return { success: false, error };
  }
}

// 2. Тестирование отладочного API без авторизации
async function testDebugApi(userId = 1) {
  console.log('%c ТЕСТ 2: Отладочный API ', 'background: #2196F3; color: white; padding: 3px 5px; border-radius: 3px; font-weight: bold;');
  
  try {
    const SectServiceAPI = require('../services/sect-api');
    
    // Тестируем специальный отладочный метод без авторизации
    const debugResult = await SectServiceAPI.debugGetUserSectNoAuth(userId);
    logResult(`Отладочный запрос для userId=${userId}:`, debugResult);
    
    // Тестируем отладочный маршрут API
    const response = await fetch(`/api/debug/users/${userId}/sect`);
    const statusText = response.statusText;
    const status = response.status;
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = await response.text();
    }
    
    const result = { status, statusText, data };
    logResult(`Отладочный маршрут для userId=${userId}:`, result);
    
    return { success: response.ok, debug: debugResult, api: result };
  } catch (error) {
    logError('Ошибка при тестировании отладочного API:', error);
    return { success: false, error };
  }
}

// 3. Тестирование адаптера с Redux
async function testAdapterWithRedux(userId = 1) {
  console.log('%c ТЕСТ 3: Адаптер с Redux ', 'background: #2196F3; color: white; padding: 3px 5px; border-radius: 3px; font-weight: bold;');
  
  try {
    const SectAdapter = require('../services/sect-adapter');
    
    // Получаем секту пользователя через адаптер
    const sect = await SectAdapter.getUserSect(userId);
    logResult(`Получение секты через адаптер для userId=${userId}:`, sect);
    
    // Проверяем состояние Redux, если доступно
    let reduxState = null;
    try {
      const { store } = require('../context/GameContext');
      if (store && typeof store.getState === 'function') {
        reduxState = store.getState().sect;
        logResult('Состояние Redux после запроса:', reduxState);
      } else {
        console.log('%c Redux store недоступен ', 'background: #FF9800; color: white; padding: 2px 5px; border-radius: 3px;');
      }
    } catch (reduxError) {
      logError('Ошибка при получении Redux state:', reduxError);
    }
    
    return { success: !!sect, sect, reduxState };
  } catch (error) {
    logError('Ошибка при тестировании адаптера с Redux:', error);
    return { success: false, error };
  }
}

// 4. Тестирование прямых API запросов
async function testDirectApiRequests(userId = 1) {
  console.log('%c ТЕСТ 4: Прямые API запросы ', 'background: #2196F3; color: white; padding: 3px 5px; border-radius: 3px; font-weight: bold;');
  
  try {
    // Пытаемся получить токен авторизации
    let authToken = null;
    try {
      authToken = localStorage.getItem('authToken');
      logResult('Токен авторизации:', authToken ? `${authToken.substring(0, 10)}...` : 'отсутствует');
    } catch (tokenError) {
      logError('Ошибка при получении токена:', tokenError);
    }
    
    // Выполняем прямой запрос к API
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`/api/users/${userId}/sect`, { headers });
    const statusText = response.statusText;
    const status = response.status;
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = await response.text();
    }
    
    const result = { status, statusText, data };
    logResult(`Прямой запрос API для userId=${userId}:`, result);
    
    return { success: response.ok, api: result, authToken: !!authToken };
  } catch (error) {
    logError('Ошибка при прямом запросе API:', error);
    return { success: false, error };
  }
}

// Функция для запуска всех тестов последовательно
async function runAllTests(userId = 1) {
  console.log('%c ЗАПУСК ИНТЕГРАЦИОННЫХ ТЕСТОВ СИСТЕМЫ СЕКТ ', 'background: #673AB7; color: white; padding: 5px; border-radius: 3px; font-weight: bold; font-size: 14px;');
  console.log(`Тестирование для userId: ${userId}`);
  console.log('===================================================');
  
  const results = {};
  
  // Тест 1: Импорт модулей
  results.modules = await testModulesImport();
  console.log('===================================================');
  
  // Тест 2: Отладочный API
  results.debugApi = await testDebugApi(userId);
  console.log('===================================================');
  
  // Тест 3: Адаптер с Redux
  results.adapter = await testAdapterWithRedux(userId);
  console.log('===================================================');
  
  // Тест 4: Прямые API запросы
  results.directApi = await testDirectApiRequests(userId);
  console.log('===================================================');
  
  // Подведение итогов
  const allSuccessful = 
    results.modules.success && 
    results.debugApi.success && 
    results.adapter.success && 
    results.directApi.success;
  
  if (allSuccessful) {
    console.log('%c ВСЕ ТЕСТЫ УСПЕШНО ПРОЙДЕНЫ! ', 'background: #4CAF50; color: white; padding: 5px; border-radius: 3px; font-weight: bold; font-size: 14px;');
  } else {
    console.log('%c НЕКОТОРЫЕ ТЕСТЫ ЗАВЕРШИЛИСЬ С ОШИБКАМИ ', 'background: #F44336; color: white; padding: 5px; border-radius: 3px; font-weight: bold; font-size: 14px;');
  }
  
  console.log('Итоговые результаты:', results);
  return results;
}

// Экспорт функций для использования в консоли браузера
module.exports = {
  testModulesImport,
  testDebugApi,
  testAdapterWithRedux,
  testDirectApiRequests,
  runAllTests
};

// Автоматический запуск, если скрипт загружен напрямую
if (typeof window !== 'undefined' && window.location.pathname.includes('test-sect-integration')) {
  console.log('Автоматический запуск тестов...');
  runAllTests();
}

/**
 * Как использовать этот скрипт:
 * 
 * 1. В консоли браузера:
 *    const tests = require('./src/tests/test-sect-integration.js');
 *    tests.runAllTests(1); // где 1 - ID пользователя для тестирования
 * 
 * 2. Через HTML:
 *    <script src="./src/tests/test-sect-integration.js"></script>
 * 
 * 3. Через Node.js:
 *    node src/tests/test-sect-integration.js
 */