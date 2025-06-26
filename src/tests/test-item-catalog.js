'use strict';

/**
 * Тестовый скрипт для проверки модели ItemCatalog
 */

// Импортируем необходимые модули
const { registerItemCatalogModel } = require('../models/register-item-catalog');
const modelRegistry = require('../models/registry');

// Асинхронная функция для запуска теста
async function testItemCatalog() {
  try {
    console.log('Запуск теста модели ItemCatalog...');
    
    // 1. Инициализируем реестр моделей
    console.log('Инициализация реестра моделей...');
    await modelRegistry.initializeRegistry();
    console.log('Реестр моделей инициализирован');
    
    // 2. Регистрируем модель ItemCatalog
    console.log('Регистрация модели ItemCatalog...');
    await registerItemCatalogModel();
    console.log('Модель ItemCatalog зарегистрирована');
    
    // 3. Получаем модель из реестра
    const ItemCatalog = modelRegistry.getModel('ItemCatalog');
    console.log('Получена модель ItemCatalog из реестра:');
    console.log(ItemCatalog);
    
    // Проверяем наличие метода findAll
    if (typeof ItemCatalog.findAll === 'function') {
      console.log('Метод findAll существует в модели ItemCatalog');
    } else {
      console.error('ОШИБКА: Метод findAll не найден в модели ItemCatalog');
      console.log('Доступные методы:', Object.getOwnPropertyNames(ItemCatalog));
      console.log('Прототип:', Object.getOwnPropertyNames(Object.getPrototypeOf(ItemCatalog)));
    }
    
    // 4. Тестируем запрос к базе данных
    console.log('Выполнение тестового запроса findAll...');
    try {
      const items = await ItemCatalog.findAll();
      console.log(`Запрос выполнен успешно. Получено ${items.length} предметов`);
      
      // Выводим первые 3 предмета для проверки
      if (items.length > 0) {
        console.log('Примеры предметов:');
        items.slice(0, 3).forEach(item => {
          console.log(`- ${item.item_id}: ${item.name} (${item.rarity})`);
        });
      }
    } catch (queryError) {
      console.error('ОШИБКА при выполнении запроса findAll:', queryError);
    }
    
    console.log('Тест модели ItemCatalog завершен');
    return true;
  } catch (error) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА при тестировании модели ItemCatalog:', error);
    return false;
  }
}

// Если скрипт запущен напрямую, выполняем тест
if (require.main === module) {
  testItemCatalog()
    .then(success => {
      console.log(`Тестирование ${success ? 'успешно завершено' : 'завершилось с ошибками'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Необработанная ошибка:', error);
      process.exit(1);
    });
}

// Экспортируем функцию тестирования
module.exports = { testItemCatalog };