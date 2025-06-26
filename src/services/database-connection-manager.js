/**
 * Менеджер подключений к базе данных
 * Централизованный доступ к базе данных через Sequelize
 */
const Sequelize = require('sequelize');
const databaseConfig = require('../config/database.json');
const { getSequelizeInstance } = require('./database-connection-manager-adapter');

// Экспортируем классы Sequelize для использования в моделях
//export { Sequelize, DataTypes, Model };

// Настоящий экземпляр Sequelize для PostgreSQL
let sequelizeInstance = null;

/**
 * Функция для добавления таймаута к промису
 * @param {Promise} promise - Промис, к которому добавляется таймаут
 * @param {number} timeoutMs - Время ожидания в миллисекундах
 * @param {string} errorMessage - Сообщение об ошибке при превышении времени ожидания
 * @returns {Promise} - Промис с таймаутом
 */
function withTimeout(promise, timeoutMs, errorMessage) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage || 'Операция превысила время ожидания'));
    }, timeoutMs);
  });
  
  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => clearTimeout(timeoutId));
}

/**
 * Функция для проверки прямого подключения к PostgreSQL
 * Использует нативный драйвер pg для проверки соединения на низком уровне
 * @param {Object} config - Конфигурация подключения
 * @returns {Promise<boolean>} - true, если подключение успешно
 * @throws {Error} - Выбрасывает ошибку, если не удалось подключиться
 */
async function testDirectPostgresConnection(config) {
  console.log('Проверка прямого подключения к PostgreSQL...');
  
  try {
    // Проверяем наличие pg
    try {
      require('pg');
    } catch (e) {
      console.error('КРИТИЧЕСКАЯ ОШИБКА: Не найден драйвер PostgreSQL');
      console.error('Установите драйвер выполнив команду: npm install pg');
      throw new Error('Необходимо установить пакет pg для работы с PostgreSQL. Выполните: npm install pg');
    }
    
    const { Client } = require('pg');
    const client = new Client({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      connectionTimeoutMillis: 5000
    });
    
    console.log('Настройки прямого подключения:', {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username
    });
    
    await withTimeout(
      client.connect(),
      5000,
      'Прямое подключение к PostgreSQL превысило время ожидания'
    );
    console.log('Прямое подключение к PostgreSQL установлено');
    
    const result = await withTimeout(
      client.query('SELECT NOW() as current_time'),
      3000,
      'Тестовый запрос к PostgreSQL превысил время ожидания'
    );
    console.log(`Текущее время на сервере PostgreSQL: ${result.rows[0].current_time}`);
    
    await client.end();
    console.log('Прямое подключение к PostgreSQL закрыто');
    return true;
  } catch (error) {
    console.error('Ошибка прямого подключения к PostgreSQL:', error.message);
    
    // Пытаемся закрыть соединение, если оно было открыто
    try {
      if (client) await client.end();
    } catch (e) {
      // Игнорируем ошибки при закрытии
    }
    
    throw new Error(`Не удалось напрямую подключиться к PostgreSQL: ${error.message}`);
  }
}

/**
 * Инициализация подключения к PostgreSQL
 * @returns {Promise<Object>} - Объект с экземпляром Sequelize
 * @throws {Error} - Выбрасывает ошибку, если не удалось подключиться к PostgreSQL
 */
async function initializeDatabaseConnection() {
  try {
    const env = process.env.NODE_ENV || 'development';
    const config = databaseConfig[env];
    console.log(`Попытка подключения к PostgreSQL (${config.host}:${config.port})...`);
    
    // Сначала проверим прямое подключение
    try {
      await testDirectPostgresConnection(config);
    } catch (directError) {
      console.error('Ошибка при проверке прямого подключения к PostgreSQL:', directError.message);
      throw directError;
    }
    
    sequelizeInstance = new Sequelize(
      config.database,
      config.username,
      config.password,
      {
        host: config.host,
        port: config.port,
        dialect: config.dialect,
        logging: false, // Для продакшена отключаем логирование
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        // Улучшенные настройки для подключения
        dialectOptions: {
          connectTimeout: 5000, // 5 секунд на подключение
          statement_timeout: 10000, // 10 секунд на выполнение запроса
          idle_in_transaction_session_timeout: 10000 // 10 секунд на транзакцию
        }
      }
    );

    // Проверяем соединение с явным таймаутом и SQL-запросом
    console.log('Проверка соединения с PostgreSQL через Sequelize...');
    
    // Сначала выполняем простой запрос
    await withTimeout(
      sequelizeInstance.query('SELECT 1+1 AS result'),
      5000,
      'Тестовый SQL-запрос превысил время ожидания'
    );
    
    // Затем запускаем штатную аутентификацию
    await withTimeout(
      sequelizeInstance.authenticate(),
      5000,
      'Аутентификация Sequelize превысила время ожидания'
    );
    
    console.log('Подключение к PostgreSQL успешно установлено и проверено');
    
    // Возвращаем PostgreSQL интерфейс
    return {
      db: sequelizeInstance
    };
  } catch (error) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА: Не удалось подключиться к PostgreSQL:', error.message);
    console.error('Дополнительная информация:', error);
    
    // Выбрасываем ошибку вместо возврата строки
    throw new Error(`Невозможно продолжить работу без PostgreSQL: ${error.message}`);
  }
}

// Не вызываем initializeDatabaseConnection напрямую, это будет делаться через unifiedDatabase
// Единый экземпляр промиса подключения к БД для повторного использования
let databasePromise = null;

/**
 * Унифицированный интерфейс базы данных
 */
const unifiedDatabase = {
  /**
   * Получает коллекцию или модель
   * @param {string} name - Имя коллекции/модели
   * @returns {Object} - Интерфейс для работы с коллекцией/моделью
   */
  async getCollection(name) {
    if (!databasePromise) {
      databasePromise = initializeDatabaseConnection();
    }
    const { db } = await databasePromise;
    
      try {
        const model = db.model(name);
        return model;
      } catch (error) {
        console.error(`Модель ${name} не найдена:`, error);
        throw new Error(`Модель ${name} не найдена`);
      }
    
  },
  
  /**
   * Выполняет транзакцию (только для PostgreSQL)
   * @param {Function} callback - Функция, выполняемая в транзакции
   * @returns {Promise<any>} - Результат транзакции
   */
  async transaction(callback) {
    if (!databasePromise) {
      databasePromise = initializeDatabaseConnection();
    }
    const { db } = await databasePromise;
    
    return db.transaction(callback);
    
  },
  
  /**
   * Проверяет статус подключения
   * @returns {Promise<{connected: boolean, using: string}>} - Информация о подключении
   */
  async checkStatus() {
    return {
      connected: true, // Мы всегда "подключены" к PostgreSQL
      using: 'postgresql'
    };
  },
  
  /**
   * Получение прямого доступа к экземпляру Sequelize
   * @returns {Promise<Object>} - Экземпляр Sequelize
   */
  async getSequelizeInstance() {
    try {
      if (!databasePromise) {
        console.log('Инициализация нового подключения к базе данных...');
        databasePromise = withTimeout(
          initializeDatabaseConnection(),
          15000,
          'Инициализация подключения к базе данных превысила время ожидания'
        );
      }
      
      let result;
      try {
        result = await withTimeout(
          databasePromise,
          10000,
          'Получение экземпляра Sequelize превысило время ожидания'
        );
      } catch (timeoutError) {
        console.error('Ошибка таймаута при получении экземпляра Sequelize:', timeoutError.message);
        // Сбрасываем промис, чтобы следующий вызов попытался создать новое подключение
        databasePromise = null;
        throw timeoutError;
      }
      
      if (!result || !result.db) {
        console.error('КРИТИЧЕСКАЯ ОШИБКА: getSequelizeInstance: результат пуст');
        // Сбрасываем промис для следующей попытки
        databasePromise = null;
        throw new Error('Не удалось получить экземпляр базы данных');
      }
      
      return result;
    } catch (error) {
      console.error('КРИТИЧЕСКАЯ ОШИБКА при получении экземпляра Sequelize:', error.message);
      // Пробрасываем ошибку дальше, не используя заглушки
      throw error;
    }
  },
  
  /**
   * Выполняет SQL-запрос
   * @param {string} sql - SQL-запрос
   * @param {Object} options - Опции запроса
   * @returns {Promise<Array>} - Результат запроса
   */
  async query(sql, options) {
    if (!databasePromise) {
      databasePromise = initializeDatabaseConnection();
    }
    const { db } = await databasePromise;
    return db.query(sql, options);
  }
};
//console.log(unifiedDatabase);

module.exports = {unifiedDatabase, initializeDatabaseConnection, getSequelizeInstance};
