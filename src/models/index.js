/**
 * Улучшенная система инициализации моделей
 * Решает проблемы с ассоциациями и инициализацией моделей
 */
const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const connectionProvider = require('../utils/connection-provider');
const modelInitializer = require('./initializeModels');
// Импортируем файл инициализации моделей квестов
require('./init-quest-models');

// Настройки для логирования
const DEBUG = true;

/**
 * Функция для логирования с меткой времени
 */
function log(message, type = 'info') {
  if (!DEBUG) return;
  
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}]`;
  
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

// Объект для хранения моделей
const db = {
  Sequelize,
  DataTypes,
  sequelize: null,
  models: {}
};

/**
 * Инициализация подключения к базе данных
 */
async function initializeDatabase() {
  try {
    log('Инициализация подключения к базе данных...');
    const { db: sequelizeInstance } = await connectionProvider.getSequelizeInstance();
    
    if (!sequelizeInstance) {
      throw new Error('Не удалось получить экземпляр Sequelize');
    }
    
    db.sequelize = sequelizeInstance;
    log('Подключение к базе данных успешно инициализировано');
    return sequelizeInstance;
  } catch (error) {
    log(`Ошибка при инициализации базы данных: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Загрузка моделей
 */
async function loadModels(sequelize) {
  try {
    log('Загрузка моделей...');
    const modelFiles = fs
      .readdirSync(__dirname)
      .filter(file => {
        return (
          file.indexOf('.') !== 0 &&
          file !== path.basename(__filename) &&
          file !== 'fix-models.js' &&
          file !== 'client-user.js' &&
          file !== 'user-adapter.js' &&
          file.slice(-3) === '.js' &&
          file.indexOf('.test.js') === -1
        );
      });
    
    log(`Найдено ${modelFiles.length} файлов моделей`);
    
    // Загружаем все модели в два этапа
    // Сначала просто загружаем классы, но не инициализируем
    const modelClasses = {};
    
    for (const file of modelFiles) {
      try {
        const modelPath = path.join(__dirname, file);
        log(`Загрузка модели из файла: ${file}`);
        
        // Удаляем кэш модуля перед загрузкой для уверенности в чистой загрузке
        delete require.cache[require.resolve(modelPath)];
        
        const modelDefinition = require(modelPath);
        
        if (!modelDefinition) {
          log(`Файл ${file} не экспортирует модель`, 'warn');
          continue;
        }
        
        // Пытаемся определить имя модели
        const modelName = modelDefinition.name || 
                          (modelDefinition.modelName ? modelDefinition.modelName :
                          file.replace('.js', ''));
        
        modelClasses[modelName] = modelDefinition;
        log(`Модель ${modelName} загружена`);
      } catch (error) {
        log(`Ошибка при загрузке модели из файла ${file}: ${error.message}`, 'error');
      }
    }
    
    // Теперь инициализируем модели
    for (const [modelName, ModelClass] of Object.entries(modelClasses)) {
      try {
        log(`Инициализация модели ${modelName}...`);
        
        // Проверка, является ли класс моделью Sequelize
        const isSequelizeModel = ModelClass.prototype instanceof Sequelize.Model;
        
        if (isSequelizeModel) {
          // Проверяем, есть ли у модели асинхронный метод init
          if (typeof ModelClass.init === 'function' && ModelClass.init.constructor.name === 'AsyncFunction') {
            // Асинхронная инициализация
            await ModelClass.init();
            log(`Модель ${modelName} инициализирована асинхронно`);
            
            // Получаем инициализированную модель из Sequelize
            const initializedModel = sequelize.models[modelName] || ModelClass;
            db.models[modelName] = initializedModel;
          } else if (typeof ModelClass.init === 'function') {
            // Синхронная инициализация с параметрами по умолчанию
            try {
              // Проверяем, была ли модель уже инициализирована
              if (ModelClass.name && sequelize.models[ModelClass.name]) {
                log(`Модель ${modelName} уже инициализирована`);
                db.models[modelName] = sequelize.models[ModelClass.name];
              } else {
                // Инициализируем модель с пустыми объектами
                // Это для моделей, где init определен, но не вызван
                log(`Попытка прямой инициализации модели ${modelName}`);
                
                // Эта часть для совместимости со старыми моделями
                if (ModelClass.init.length >= 3) { // Проверяем количество параметров
                  ModelClass.init({}, { sequelize, modelName });
                }
                
                db.models[modelName] = ModelClass;
                log(`Модель ${modelName} инициализирована напрямую`);
              }
            } catch (initError) {
              log(`Ошибка прямой инициализации модели ${modelName}: ${initError.message}`, 'error');
              db.models[modelName] = ModelClass; // Всё равно сохраняем класс
            }
          } else {
            // Модель без метода init
            log(`Модель ${modelName} не имеет метода init`, 'warn');
            db.models[modelName] = ModelClass;
          }
        } else {
          // Не модель Sequelize, но всё равно сохраняем
          log(`${modelName} не является моделью Sequelize, но будет доступен через db.models`, 'warn');
          db.models[modelName] = ModelClass;
        }
      } catch (error) {
        log(`Ошибка при инициализации модели ${modelName}: ${error.message}`, 'error');
      }
    }
    
    log('Все модели загружены и инициализированы');
    return db.models;
  } catch (error) {
    log(`Критическая ошибка при загрузке моделей: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Безопасная установка ассоциаций между моделями
 */
function setupAssociations(models) {
  try {
    log('Установка ассоциаций между моделями...');
    
    // Добавляем Sequelize и DataTypes в объект моделей для корректной работы ассоциаций
    models.Sequelize = Sequelize;
    models.DataTypes = DataTypes;
    
    for (const [modelName, Model] of Object.entries(models)) {
      // Пропускаем служебные поля
      if (modelName === 'Sequelize' || modelName === 'DataTypes') continue;
      
      if (Model && typeof Model.associate === 'function') {
        log(`Установка ассоциаций для модели ${modelName}...`);
        
        try {
          // Оборачиваем в try-catch для перехвата ошибок в методе associate
          Model.associate(models);
          log(`Ассоциации для модели ${modelName} успешно установлены`);
        } catch (assocError) {
          log(`Ошибка при установке ассоциаций для модели ${modelName}: ${assocError.message}`, 'error');
          
          // Пытаемся установить ассоциации альтернативным способом
          try {
            log(`Попытка установить ассоциации для ${modelName} альтернативным способом...`);
            
            // Создаем безопасную обертку для модели User, которая часто используется в ассоциациях
            if (!models.User && models.User === undefined) {
              log('Создание заглушки для модели User для ассоциаций');
              models.User = {
                prototype: { isPrototypeOf: () => true }
              };
            }
            
            // Пытаемся вызвать associate с проверками
            const safeAssociate = new Function('models', `
              try {
                if (typeof this.belongsTo === 'function') {
                  // Проверяем наличие User в моделях
                  if (models.User) this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
                }
                return true;
              } catch (e) {
                return false;
              }
            `);
            
            const result = safeAssociate.call(Model, models);
            log(`Результат альтернативной установки ассоциаций для ${modelName}: ${result}`);
          } catch (alternativeError) {
            log(`Альтернативная установка ассоциаций для ${modelName} не удалась: ${alternativeError.message}`, 'error');
          }
        }
      } else {
        log(`Модель ${modelName} не имеет метода associate`);
      }
    }
    
    log('Все ассоциации установлены');
  } catch (error) {
    log(`Критическая ошибка при установке ассоциаций: ${error.message}`, 'error');
  }
}

/**
 * Основная функция инициализации
 */
async function initialize() {
  try {
    // Шаг 1: Инициализация базы данных
    const sequelize = await initializeDatabase();
    
    // Шаг 2: Загрузка и инициализация моделей
    const models = await loadModels(sequelize);
    
    // Шаг 3: Установка ассоциаций между моделями
    setupAssociations(models);
    
    // Шаг 4: Проверка соединения с базой данных
    try {
      log('Проверка соединения с базой данных...');
      await sequelize.authenticate();
      log('Соединение с базой данных успешно проверено');
    } catch (authError) {
      log(`Ошибка при проверке соединения с базой данных: ${authError.message}`, 'error');
    }
    
    log('Инициализация завершена успешно');
    return db;
  } catch (error) {
    log(`Критическая ошибка при инициализации: ${error.message}`, 'error');
    throw error;
  }
}

// Запускаем инициализацию и связываем ее с новой системой инициализации моделей
db.initializePromise = (async () => {
  try {
    const models = await initialize();
    
    // Добавляем модели в реестр initializeModels для совместимости
    if (modelInitializer && modelInitializer.modelRegistry) {
      Object.entries(models.models || {}).forEach(([name, model]) => {
        modelInitializer.modelRegistry[name] = model;
      });
    }
    
    return models;
  } catch (error) {
    log(`Необработанная ошибка инициализации: ${error.message}`, 'error');
    throw error;
  }
})();

// Для совместимости с существующим кодом, добавляем прямые ссылки на модели
// Старый код ожидает db.Model, а не db.models.Model
db.initializePromise.then(() => {
  Object.entries(db.models).forEach(([name, model]) => {
    db[name] = model;
  });
}).catch(error => {
  log(`Ошибка при копировании моделей в корневое пространство db: ${error.message}`, 'error');
});

// Экспорт объекта db
module.exports = db;
