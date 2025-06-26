/**
 * Скрипт для предварительной загрузки моделей
 * Запускается перед запуском сервера для инициализации всех необходимых моделей
 */

// Импорты моделей
const { Sequelize, DataTypes, Model } = require('../services/database');
const dbManager = require('../services/database-connection-manager');

// Импортируем инициализатор заглушек
const { initializeStubs } = require('./initialize-stubs');

// Импорт моделей, которые нужно загрузить заранее
const Enemy = require('./enemy');
const Technique = require('./technique');
const EnemyTimeModifier = require('./enemy-time-modifier');
const EnemyWeatherModifier = require('./enemy-weather-modifier');
const Merchant = require('./merchant');
const Achievement = require('./achievement');
const ItemCatalog = require('./item-catalog');

// Функция для логирования с меткой времени
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}][PreloadModels]`;
  
  switch (type) {
    case 'error':
      console.error(`${prefix} ОШИБКА: ${message}`);
      break;
    case 'warn':
      console.warn(`${prefix} ПРЕДУПРЕЖДЕНИЕ: ${message}`);
      break;
    default:
      console.log(`${prefix} ${message}`);
  }
}

/**
 * Инициализирует экземпляр Sequelize для моделей
 * @returns {Promise<Sequelize>} Экземпляр Sequelize
 */
async function getSequelizeInstance() {
  try {
    // Используем прямой вызов без circular dependency
    const initializeDatabaseConnection = dbManager.initializeDatabaseConnection;
    const result = await initializeDatabaseConnection();
    return result.db;
  } catch (error) {
    log(`Ошибка при получении экземпляра Sequelize: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Инициализирует модель с заданным экземпляром Sequelize
 * @param {Model} ModelClass - Класс модели для инициализации
 * @param {string} modelName - Имя модели для логирования
 * @param {Sequelize} sequelize - Экземпляр Sequelize
 * @returns {Promise<Model>} - Инициализированная модель
 */
async function initializeModel(ModelClass, modelName, sequelize) {
  try {
    log(`Инициализация модели ${modelName}...`);
    if (typeof ModelClass.init === 'function') {
      await ModelClass.init();
      log(`Модель ${modelName} успешно инициализирована`);
      return ModelClass;
    } else {
      log(`Модель ${modelName} не имеет метода init, пропускаем`, 'warn');
      return null;
    }
  } catch (error) {
    log(`Ошибка при инициализации модели ${modelName}: ${error.message}`, 'error');
    console.error(error.stack);
    return null;
  }
}

/**
 * Предварительно загружает ключевые модели
 * @returns {Promise<Object>} - Объект с загруженными моделями
 */
async function preloadModels() {
  try {
    log('Начало предварительной загрузки моделей...');
    
    // Сначала инициализируем заглушки моделей
    log('Инициализация заглушек моделей...');
    const stubs = await initializeStubs();
    log('Заглушки моделей успешно инициализированы');
    
    // Получаем экземпляр Sequelize
    log('Получение экземпляра Sequelize...');
    const sequelize = await getSequelizeInstance();
    log('Экземпляр Sequelize успешно получен');
    
    // Инициализируем модели
    const preloadedModels = {
      // Добавляем заглушки в список загруженных моделей
      ...stubs
    };
    
    // Загружаем ключевые модели
    const modelsToLoad = [
      { class: Enemy, name: 'Enemy' },
      { class: Technique, name: 'Technique' },
      { class: EnemyTimeModifier, name: 'EnemyTimeModifier' },
      { class: EnemyWeatherModifier, name: 'EnemyWeatherModifier' },
      { class: Merchant, name: 'Merchant' },
      { class: Achievement, name: 'Achievement' },
      { class: ItemCatalog, name: 'ItemCatalog' }
    ];
    
    for (const model of modelsToLoad) {
      preloadedModels[model.name] = await initializeModel(model.class, model.name, sequelize);
    }
    
    log('Регистрация моделей в менеджере соединений...');
    // Регистрируем модели в менеджере соединений
    Object.entries(preloadedModels).forEach(([name, model]) => {
      if (model) {
        dbManager.registerModel(name, model);
        //log(`Модель ${name} зарегистрирована в менеджере соединений`);
      }
    });
    
    log('Предварительная загрузка моделей завершена успешно');
    return preloadedModels;
  } catch (error) {
    log(`Ошибка при предварительной загрузке моделей: ${error.message}`, 'error');
    console.error(error.stack);
    throw error;
  }
}

// Экспортируем функцию предварительной загрузки
module.exports = { preloadModels };

// Если скрипт запущен напрямую, выполняем предварительную загрузку
if (require.main === module) {
  preloadModels()
    .then(() => {
      log('Предварительная загрузка завершена успешно');
      process.exit(0);
    })
    .catch(error => {
      log(`Ошибка: ${error.message}`, 'error');
      process.exit(1);
    });
}