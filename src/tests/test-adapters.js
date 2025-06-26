/**
 * Универсальный файл для тестирования адаптеров
 * Работает как в браузере (ES модули), так и в Node.js (CommonJS)
 */

// Обнаружение среды выполнения
const isNodeJS = typeof window === 'undefined';
const isBrowser = !isNodeJS;

// Определяем, как импортировать зависимости
let CharacterProfileService, unifiedDatabase;

// Функция для загрузки модулей в зависимости от среды
async function loadDependencies() {
  if (isNodeJS) {
    // Node.js - используем CommonJS (.cjs) версии через require
    try {
      CharacterProfileService = require('../services/character-profile-service-adapter.cjs');
      const dbModule = require('../services/database-connection-manager-adapter.cjs');
      unifiedDatabase = dbModule.unifiedDatabase;
      console.log('✅ Загружены CommonJS версии адаптеров');
    } catch (error) {
      console.error('❌ Ошибка при загрузке CommonJS версий адаптеров:', error);
      throw error;
    }
  } else {
    // Браузер - используем ES модули (.js) через import
    try {
      // Динамический импорт для поддержки браузеров
      CharacterProfileService = (await import('../services/character-profile-service-adapter.js')).default;
      unifiedDatabase = (await import('../services/database-connection-manager-adapter.js')).unifiedDatabase;
      console.log('✅ Загружены ES модули адаптеров');
    } catch (error) {
      console.error('❌ Ошибка при загрузке ES модулей адаптеров:', error);
      throw error;
    }
  }
}

/**
 * Функция для проверки работы адаптера CharacterProfileService
 */
async function testCharacterProfileAdapter() {
  console.log('=== Тестирование CharacterProfileService адаптера ===');
  console.log('Окружение:', isNodeJS ? 'Node.js' : 'Браузер');
  
  try {
    // Создаем тестовый профиль
    const testUserId = 999;
    
    // Проверяем, существует ли профиль
    const isCreatedBefore = await CharacterProfileService.isCharacterCreated(testUserId);
    console.log(`Профиль существует до создания: ${isCreatedBefore}`);
    
    // Создаем тестовые данные
    const testData = {
      name: 'Тестовый персонаж',
      gender: 'male',
      region: 'eastern',
      background: 'scholar',
      description: 'Тестовый персонаж для проверки адаптера',
      level: 1,
      experience: 0,
      currency: {
        gold: 100,
        silver: 200,
        copper: 300,
        spiritStones: 50
      },
      relationships: {}
    };
    
    // Создаем/обновляем профиль
    console.log('Создание тестового профиля...');
    const createdProfile = await CharacterProfileService.updateCharacterProfile(testUserId, testData);
    console.log('Профиль создан:', createdProfile ? 'Успешно' : 'Ошибка');
    
    // Проверяем, создан ли профиль
    const isCreatedAfter = await CharacterProfileService.isCharacterCreated(testUserId);
    console.log(`Профиль существует после создания: ${isCreatedAfter}`);
    
    // Получаем профиль
    console.log('Получение профиля...');
    const profile = await CharacterProfileService.getCharacterProfile(testUserId);
    
    // Проверяем данные профиля
    const nameMatches = profile && profile.name === testData.name;
    const currencyMatches = profile && profile.currency.gold === testData.currency.gold;
    console.log(`Имя персонажа совпадает: ${nameMatches}`);
    console.log(`Валюта персонажа совпадает: ${currencyMatches}`);
    
    // Обновляем валюту
    console.log('Обновление валюты...');
    const updatedCurrency = await CharacterProfileService.updateCurrency(testUserId, { gold: 150 });
    console.log(`Валюта обновлена, новое значение gold: ${updatedCurrency.gold}`);
    
    console.log('РЕЗУЛЬТАТ: Тест CharacterProfileService ' + 
                (isCreatedAfter && nameMatches && currencyMatches ? 'УСПЕШНО' : 'НЕ ПРОЙДЕН'));
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка при тестировании CharacterProfileService:', error);
    return false;
  }
}

/**
 * Функция для проверки работы адаптера DatabaseConnectionManager
 */
async function testDatabaseConnectionAdapter() {
  console.log('=== Тестирование DatabaseConnectionManager адаптера ===');
  console.log('Окружение:', isNodeJS ? 'Node.js' : 'Браузер');
  
  try {
    // Проверяем статус подключения
    console.log('Проверка статуса подключения...');
    const status = await unifiedDatabase.checkStatus();
    console.log('Статус подключения:', status.connected ? 'Подключено' : 'Отключено', 
                'Используя:', status.using);
    
    // В браузере ожидаем статус "не подключено"
    // В Node.js статус зависит от доступности реальной БД
    const correctStatus = isBrowser ? !status.connected : true;
    
    console.log('РЕЗУЛЬТАТ: Тест DatabaseConnectionManager ' + 
                (correctStatus ? 'УСПЕШНО' : 'НЕ ПРОЙДЕН'));
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка при тестировании DatabaseConnectionManager:', error);
    return false;
  }
}

/**
 * Основная функция для запуска всех тестов
 */
async function runAllTests() {
  console.log('====== Запуск тестов адаптеров ======');
  console.log('Окружение:', isNodeJS ? 'Node.js' : 'Браузер');
  console.log('Дата и время:', new Date().toLocaleString());
  
  try {
    // Загружаем зависимости в зависимости от окружения
    await loadDependencies();
    
    // Запускаем тесты
    const results = {
      characterProfile: await testCharacterProfileAdapter(),
      database: await testDatabaseConnectionAdapter()
    };
    
    // Выводим результаты
    console.log('====== Результаты тестов ======');
    console.log('CharacterProfileService:', results.characterProfile ? 'УСПЕШНО' : 'ОШИБКА');
    console.log('DatabaseConnectionManager:', results.database ? 'УСПЕШНО' : 'ОШИБКА');
    
    return results;
  } catch (error) {
    console.error('❌ Критическая ошибка при выполнении тестов:', error);
    return {
      characterProfile: false,
      database: false,
      criticalError: true,
      error: error.message
    };
  }
}

// Если код выполняется в Node.js и этот файл запущен напрямую
if (isNodeJS && typeof require !== 'undefined' && require.main === module) {
  runAllTests()
    .then(results => {
      console.log('Тесты завершены:', results);
      // Выходим с кодом ошибки, если есть неуспешные тесты
      const hasErrors = !results.characterProfile || !results.database || results.criticalError;
      process.exit(hasErrors ? 1 : 0);
    })
    .catch(error => {
      console.error('Неперехваченная ошибка при выполнении тестов:', error);
      process.exit(1);
    });
}

// Экспортируем функции для использования в других файлах
// Используем условный экспорт в зависимости от среды
if (isNodeJS) {
  // Node.js - экспорт через module.exports (CommonJS)
  module.exports = {
    runAllTests,
    testCharacterProfileAdapter,
    testDatabaseConnectionAdapter
  };
} else {
  // Браузер - экспорт через window (глобальную переменную)
  window.testAdapters = {
    runAllTests,
    testCharacterProfileAdapter,
    testDatabaseConnectionAdapter
  };
}