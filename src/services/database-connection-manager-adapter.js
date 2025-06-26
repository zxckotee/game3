/**
 * CommonJS версия адаптера для подключения к базе данных
 * Для использования в Node.js среде
 */

const { isServerEnvironment } = require('../sequelize-config');

// Объект для экспорта
let connectionManager;

// В браузере используем заглушку (хотя этот файл не должен загружаться в браузере)
if (!isServerEnvironment) {
  // Заглушка для клиентской среды
  connectionManager = {
    // Пустой объект базы данных для клиента
    unifiedDatabase: {
      // Метод-заглушка для запросов
      query: () => Promise.reject(new Error('База данных недоступна в браузере')),
      
      // Метод-заглушка для получения моделей
      getCollection: () => Promise.reject(new Error('База данных недоступна в браузере')),
      
      // Метод-заглушка для транзакций
      transaction: () => Promise.reject(new Error('База данных недоступна в браузере'))
    },
    
    // Метод-заглушка для инициализации подключения
    initializeDatabaseConnection: () => Promise.reject(new Error('База данных недоступна в браузере')),
    
    // Метод-заглушка для получения экземпляра Sequelize
    getSequelizeInstance: () => Promise.reject(new Error('База данных недоступна в браузере'))
  };
} else {
  // На сервере используем реальное подключение к базе данных
  try {
    // Прямой require для использования в CommonJS
    const dbConnectionManager = require('./database-connection-manager');
    connectionManager = dbConnectionManager;
  } catch (error) {
    console.error('Ошибка при импорте database-connection-manager:', error);
    
    // В случае ошибки создаем заглушку даже на сервере
    // чтобы приложение не упало полностью
    connectionManager = {
      unifiedDatabase: {
        query: () => Promise.reject(new Error('Ошибка при инициализации базы данных')),
        getCollection: () => Promise.reject(new Error('Ошибка при инициализации базы данных')),
        transaction: () => Promise.reject(new Error('Ошибка при инициализации базы данных'))
      },
      initializeDatabaseConnection: () => Promise.reject(new Error('Ошибка при инициализации базы данных')),
      getSequelizeInstance: () => Promise.reject(new Error('Ошибка при инициализации базы данных'))
    };
  }
}

// Экспортируем объекты и методы для CommonJS
module.exports = {
  unifiedDatabase: connectionManager.unifiedDatabase,
  initializeDatabaseConnection: connectionManager.initializeDatabaseConnection,
  getSequelizeInstance: connectionManager.getSequelizeInstance,
  default: connectionManager
};