/**
 * Провайдер соединения с базой данных
 * Этот файл обеспечивает прямой доступ к экземпляру Sequelize без циклических зависимостей
 */

const Sequelize = require('sequelize');

// Кэш для экземпляра Sequelize
let sequelizeInstance = null;
let databasePromise = null;

/**
 * Загружает конфигурацию базы данных с диска
 * @returns {Object} Конфигурация базы данных
 */
function loadDatabaseConfig() {
  try {
    // Требуем файл конфигурации напрямую
    const baseConfig = require('../config/database.json');
    const env = process.env.NODE_ENV || 'development';
    const envConfig = baseConfig[env];
    
    // Поддержка переменных окружения для Docker (аналогично database-connection-manager.js)
    const config = {
      ...baseConfig,
      [env]: {
        ...envConfig,
        host: process.env.DB_HOST || envConfig.host,
        port: parseInt(process.env.DB_PORT) || envConfig.port,
        database: process.env.DB_NAME || envConfig.database,
        username: process.env.DB_USER || envConfig.username,
        password: process.env.DB_PASSWORD || envConfig.password
      }
    };
    
    if (process.env.DB_HOST) {
      console.log('connection-provider: Используются переменные окружения для подключения к БД');
      console.log(`connection-provider: Подключение к ${config[env].host}:${config[env].port}`);
    }
    
    return config;
  } catch (error) {
    console.error('Ошибка при загрузке конфигурации базы данных:', error);
    throw new Error('Не удалось загрузить конфигурацию базы данных');
  }
}

/**
 * Проверяет соединение с базой данных путем выполнения простого запроса
 * @param {Sequelize} sequelize - Экземпляр Sequelize для проверки
 * @returns {Promise<boolean>} - true, если соединение работает
 */
async function testConnection(sequelize) {
  try {
    // Простой запрос для проверки соединения
    await sequelize.query('SELECT 1+1 AS result');
    return true;
  } catch (error) {
    console.error('Ошибка при проверке соединения с базой данных:', error);
    return false;
  }
}

/**
 * Инициализирует соединение с базой данных
 * @returns {Promise<Object>} Объект с экземпляром sequelize
 */
async function initConnection() {
  if (sequelizeInstance) {
    return { db: sequelizeInstance };
  }

  try {
    console.log('Инициализация соединения с базой данных через connection-provider...');
    const config = loadDatabaseConfig();
    const env = process.env.NODE_ENV || 'development';
    const dbConfig = config[env];

    // Создаем экземпляр Sequelize
    sequelizeInstance = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

    // Проверяем соединение
    const isConnected = await testConnection(sequelizeInstance);
    if (!isConnected) {
      throw new Error('Не удалось подключиться к базе данных');
    }

    console.log('Соединение с базой данных через connection-provider установлено');
    return { db: sequelizeInstance };
  } catch (error) {
    console.error('Ошибка при инициализации соединения:', error);
    throw error;
  }
}

/**
 * Получает экземпляр Sequelize
 * @returns {Promise<Object>} Объект с экземпляром sequelize
 */
async function getSequelizeInstance() {
  if (!databasePromise) {
    databasePromise = initConnection();
  }
  return databasePromise;
}

/**
 * Сбрасывает соединение с базой данных
 * Используется преимущественно для тестирования
 */
function resetConnection() {
  sequelizeInstance = null;
  databasePromise = null;
}

module.exports = {
  getSequelizeInstance,
  resetConnection
};