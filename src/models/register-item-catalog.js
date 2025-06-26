'use strict';

/**
 * Скрипт для регистрации модели ItemCatalog в системе
 */

// Импортируем необходимые модули
const dbManager = require('../services/database-connection-manager');
const ItemCatalog = require('./item-catalog');

/**
 * Регистрирует модель ItemCatalog в системе
 */
async function registerItemCatalogModel() {
  try {
    console.log('[ItemCatalog] Начало регистрации модели ItemCatalog...');
    
    // Получаем соединение с базой данных
    const connection = await dbManager.getConnection();
    if (!connection || !connection.db) {
      throw new Error('Не удалось получить соединение с базой данных');
    }
    
    // Инициализируем модель (асинхронный метод init)
    try {
      await ItemCatalog.init();
      console.log('[ItemCatalog] Модель ItemCatalog успешно инициализирована');
    } catch (initError) {
      console.error(`[ItemCatalog] Ошибка при инициализации модели: ${initError.message}`);
      throw initError;
    }
    
    // Регистрируем модель в менеджере соединений
    dbManager.registerModel('ItemCatalog', ItemCatalog);
    
    console.log('[ItemCatalog] Модель ItemCatalog успешно зарегистрирована');
    return ItemCatalog;
  } catch (error) {
    console.error(`[ItemCatalog] Ошибка при регистрации модели ItemCatalog: ${error.message}`);
    console.error(error.stack);
    throw error;
  }
}

// Экспортируем функцию регистрации
module.exports = { registerItemCatalogModel };

// Если скрипт запущен напрямую, выполняем регистрацию
if (require.main === module) {
  registerItemCatalogModel()
    .then(() => {
      console.log('[ItemCatalog] Регистрация завершена успешно');
      process.exit(0);
    })
    .catch(error => {
      console.error(`[ItemCatalog] Ошибка: ${error.message}`);
      process.exit(1);
    });
}