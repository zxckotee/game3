/**
 * Тестовый скрипт для проверки работы адаптеров
 * Демонстрирует использование адаптеров в клиентской и серверной среде
 */

// Импортируем адаптеры (используем CommonJS синтаксис)
const CharacterProfileService = require('../services/character-profile-service-adapter.cjs');
const { unifiedDatabase } = require('../services/database-connection-manager-adapter.cjs');

// Определяем окружение
const isServerEnvironment = typeof window === 'undefined';

// Функция для проверки работы адаптеров CharacterProfileService
async function testCharacterProfileAdapter() {
  console.log('=== Тестирование CharacterProfileService адаптера ===');
  console.log('Окружение:', isServerEnvironment ? 'Сервер' : 'Браузер');
  
  try {
    // Создаем тестовый профиль
    const testUserId = 999;
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
    console.log('Профиль создан:', JSON.stringify(createdProfile, null, 2));
    
    // Получаем профиль
    console.log('Получение профиля...');
    const profile = await CharacterProfileService.getCharacterProfile(testUserId);
    console.log('Полученный профиль:', JSON.stringify(profile, null, 2));
    
    // Проверяем, создан ли профиль
    const isCreated = await CharacterProfileService.isCharacterCreated(testUserId);
    console.log('Профиль создан:', isCreated);
    
    // Обновляем валюту
    console.log('Обновление валюты...');
    const updatedCurrency = await CharacterProfileService.updateCurrency(testUserId, { gold: 150 });
    console.log('Обновленная валюта:', JSON.stringify(updatedCurrency, null, 2));
    
    console.log('Тест CharacterProfileService успешно завершен');
    return true;
  } catch (error) {
    console.error('Ошибка при тестировании CharacterProfileService:', error);
    return false;
  }
}

// Функция для проверки работы адаптера DatabaseConnectionManager
async function testDatabaseConnectionAdapter() {
  console.log('=== Тестирование DatabaseConnectionManager адаптера ===');
  console.log('Окружение:', isServerEnvironment ? 'Сервер' : 'Браузер');
  
  try {
    // Проверяем статус подключения
    console.log('Проверка статуса подключения...');
    const status = await unifiedDatabase.checkStatus();
    console.log('Статус подключения:', status);
    
    // Пытаемся получить модель
    console.log('Получение тестовой модели...');
    try {
      const testModel = await unifiedDatabase.getCollection('User');
      console.log('Модель получена:', testModel ? 'Успешно' : 'Не удалось');
      
      // Пытаемся выполнить тестовый запрос
      console.log('Выполнение тестового запроса...');
      const result = await testModel.findAll({ limit: 5 });
      console.log('Результат запроса:', `Получено ${result.length} записей`);
    } catch (modelError) {
      console.warn('Ошибка при получении модели (ожидаемо в браузере):', modelError.message);
    }
    
    // Пытаемся выполнить SQL-запрос напрямую
    console.log('Выполнение SQL-запроса...');
    try {
      const sqlResult = await unifiedDatabase.query('SELECT 1+1 AS result');
      console.log('Результат SQL-запроса:', sqlResult);
    } catch (sqlError) {
      console.warn('Ошибка при выполнении SQL-запроса (ожидаемо в браузере):', sqlError.message);
    }
    
    console.log('Тест DatabaseConnectionManager успешно завершен');
    return true;
  } catch (error) {
    console.error('Ошибка при тестировании DatabaseConnectionManager:', error);
    return false;
  }
}

// Функция для запуска всех тестов
async function runAdapterTests() {
  console.log('====== Запуск тестов адаптеров ======');
  console.log('Окружение:', isServerEnvironment ? 'Сервер' : 'Браузер');
  
  const results = {
    characterProfile: await testCharacterProfileAdapter(),
    database: await testDatabaseConnectionAdapter()
  };
  
  console.log('====== Результаты тестов ======');
  console.log('CharacterProfileService:', results.characterProfile ? 'УСПЕШНО' : 'ОШИБКА');
  console.log('DatabaseConnectionManager:', results.database ? 'УСПЕШНО' : 'ОШИБКА');
  
  return results;
}

// Если файл запущен напрямую, выполняем тесты
if (typeof require !== 'undefined' && require.main === module) {
  runAdapterTests()
    .then(results => {
      console.log('Тесты завершены:', results);
    })
    .catch(error => {
      console.error('Ошибка при выполнении тестов:', error);
    });
}

// Экспортируем функцию для использования в других файлах
module.exports = {
  runAdapterTests
};