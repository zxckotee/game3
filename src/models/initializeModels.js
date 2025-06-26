/**
 * Централизованная инициализация моделей Sequelize
 * Обеспечивает корректную загрузку, инициализацию и установку ассоциаций
 * между моделями в нужном порядке
 */
const fs = require('fs');
const path = require('path');
// Исправление импорта для получения доступа к unifiedDatabase
const { unifiedDatabase, getSequelizeInstance } = require('../services/database-connection-manager');

// Флаг состояния инициализации
let initialized = false;
let initializing = false;
let initPromise = null;

// Реестр моделей после инициализации
const modelRegistry = {};

/**
 * Функция для логирования с меткой времени
 */
/*function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}][ModelInit]`;
  
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
}*/

/**
 * Проверяет, была ли завершена инициализация моделей
 * @returns {boolean} true, если инициализация завершена
 */
function isInitialized() {
  return initialized;
}

/**
 * Ожидает завершения инициализации моделей
 * @returns {Promise<void>} Promise, который разрешится, когда инициализация завершится
 */
async function waitForInitialization() {
  if (initialized) {
    return; // Уже инициализировано
  }
  
  if (initializing && initPromise) {
    log('Ожидание завершения текущей инициализации моделей...');
    return initPromise;
  }
  
  // Если инициализация еще не начата, запускаем ее
  return initializeModels();
}

/**
 * Получает модель из реестра
 * @param {string} modelName - Имя модели
 * @returns {Promise<Object>} Инициализированная модель
 */
async function getModel(modelName) {
  // Проверяем, инициализированы ли модели
  if (!initialized) {
    //log(`Модели не инициализированы. Ожидание инициализации перед получением ${modelName}...`);
    await waitForInitialization();
  }
  
  // Проверяем наличие модели в реестре
  if (!modelRegistry[modelName]) {
    throw new Error(`Модель ${modelName} не найдена в реестре моделей`);
  }
  
  return modelRegistry[modelName];
}

/**
 * Инициализирует все модели в правильном порядке
 * @returns {Promise<Object>} Реестр инициализированных моделей
 */
async function initializeModels() {
  // Проверяем, не выполняется ли уже инициализация
  if (initializing) {
    //log('Инициализация моделей уже выполняется. Ожидание завершения...');
    return initPromise;
  }
  
  // Проверяем, не завершена ли уже инициализация
  if (initialized) {
    //log('Модели уже инициализированы.');
    return modelRegistry;
  }
  
  initializing = true;
  //log('Начало инициализации моделей...');
  
  // Создаем Promise, который будет отслеживать процесс инициализации
  initPromise = (async () => {
    try {
      // Получаем экземпляр Sequelize
      log('Получение экземпляра Sequelize...');
      
      // Используем initializeDatabaseConnection напрямую
      const { initializeDatabaseConnection } = require('../services/database-connection-manager');
      
      if (!initializeDatabaseConnection) {
        throw new Error('initializeDatabaseConnection не определен в database-connection-manager');
      }
      
      const result = await initializeDatabaseConnection();
      const sequelize = result.db;
      
      if (!sequelize) {
        throw new Error('Не удалось получить экземпляр Sequelize');
      }
      
      log('Экземпляр Sequelize успешно получен');
      
      // Загружаем все файлы моделей из директории models
      const modelFiles = fs
        .readdirSync(__dirname)
        .filter(file => {
          return (
            file.indexOf('.') !== 0 &&
            file !== path.basename(__filename) &&
            file !== 'index.js' &&
            file !== 'fix-models.js' &&
            file !== 'client-user.js' &&
            file !== 'user-adapter.js' &&
            file.slice(-3) === '.js' &&
            file.indexOf('.test.js') === -1
          );
        });
      
      log(`Найдено ${modelFiles.length} файлов моделей`);
      
      // Сортируем модели для правильного порядка инициализации
      // Некоторые модели должны быть инициализированы раньше других из-за зависимостей
      const priorityModels = ['user.js', 'enemy.js', 'technique.js', 'merchant.js'];
      
      modelFiles.sort((a, b) => {
        const aPriority = priorityModels.indexOf(a);
        const bPriority = priorityModels.indexOf(b);
        
        if (aPriority !== -1 && bPriority !== -1) {
          return aPriority - bPriority;
        }
        
        if (aPriority !== -1) {
          return -1;
        }
        
        if (bPriority !== -1) {
          return 1;
        }
        
        return a.localeCompare(b);
      });
      
      /*log('Порядок инициализации моделей:');
      modelFiles.forEach((file, index) => {
        log(`${index + 1}. ${file}`);
      });*/
      
      // Загружаем модели
      for (const file of modelFiles) {
        try {
          const modelPath = path.join(__dirname, file);
          //log(`Загрузка модели из файла: ${file}`);
          
          // Удаляем кэш модуля перед загрузкой для уверенности в чистой загрузке
          delete require.cache[require.resolve(modelPath)];
          
          const Model = require(modelPath);
          
          // Получаем имя модели
          const modelName = Model.name || file.replace('.js', '');
          
          // Проверяем, имеет ли модель асинхронный метод init
          if (typeof Model.init === 'function') {
            //log(`Инициализация модели ${modelName}...`);
            
            try {
              // Вызываем инициализацию модели
              await Model.init();
              //log(`Модель ${modelName} успешно инициализирована`);
              
              // Сохраняем модель в реестре после успешной инициализации
              modelRegistry[modelName] = Model;
            } catch (initError) {
              //log(`Ошибка при инициализации модели ${modelName}: ${initError.message}`, 'error');
              console.error(initError.stack);
              // Мы не бросаем исключение здесь, чтобы продолжить инициализацию других моделей
            }
          } else {
            //log(`Модель ${modelName} не имеет метода init, сохраняем как есть`, 'warn');
            modelRegistry[modelName] = Model;
          }
        } catch (error) {
          //log(`Ошибка при загрузке модели из файла ${file}: ${error.message}`, 'error');
          console.error(error.stack);
        }
      }
      
      // Устанавливаем ассоциации между моделями
      //log('Установка ассоциаций между моделями...');
      
      for (const [modelName, Model] of Object.entries(modelRegistry)) {
        if (Model && typeof Model.associate === 'function') {
          //log(`Установка ассоциаций для модели ${modelName}...`);
          
          try {
            // Передаем весь реестр моделей в метод associate
            Model.associate(modelRegistry);
           // log(`Ассоциации для модели ${modelName} успешно установлены`);
          } catch (assocError) {
            //log(`Ошибка при установке ассоциаций для модели ${modelName}: ${assocError.message}`, 'error');
            console.error(assocError.stack);
          }
        } else {
          //log(`Модель ${modelName} не имеет метода associate`);
        }
      }
      
      // Отмечаем завершение инициализации
      initialized = true;
      initializing = false;
      //log('Инициализация моделей успешно завершена');
      
      return modelRegistry;
    } catch (error) {
      log(`Критическая ошибка при инициализации моделей: ${error.message}`, 'error');
      console.error(error.stack);
      initializing = false;
      throw error;
    }
  })();
  
  return initPromise;
}

module.exports = {
  initializeModels,
  getModel,
  isInitialized,
  waitForInitialization,
  modelRegistry
};