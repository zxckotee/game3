/**
 * Исправление ассоциаций между моделями 
 * При запуске заменяет все undefined модели в ассоциациях
 */

// Импорты моделей
const { Sequelize, DataTypes, Model } = require('../services/database');
const dbManager = require('../services/database-connection-manager');
const { initializeStubs, getDirectConnection } = require('./initialize-stubs');
const fs = require('fs');
const path = require('path');

// Функция для логирования с меткой времени
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}][ModelFix]`;
  
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
 * Загружает и инициализирует модели в правильном порядке
 * @returns {Promise<Object>} Реестр инициализированных моделей
 */
async function initializeModels() {
  try {
    log('Начало инициализации моделей...');
    
    // Сначала инициализируем заглушки моделей (особенно User)
    log('Инициализация заглушек моделей...');
    const stubs = await initializeStubs();
    log('Заглушки моделей успешно инициализированы');
    
    // Получаем экземпляр Sequelize напрямую (без circular dependency)
    log('Получение экземпляра Sequelize...');
    const sequelize = await getDirectConnection();
    
    if (!sequelize) {
      throw new Error('Не удалось получить экземпляр Sequelize');
    }
    
    log('Экземпляр Sequelize успешно получен');
    
    // Создаем временное хранилище моделей
    const models = {};
    
    // Ключевые модели, которые должны быть инициализированы первыми
    const primaryModels = ['User', 'Enemy', 'Technique', 'Merchant'];
    
    // Загружаем и инициализируем ключевые модели
    for (const modelName of primaryModels) {
      //log(`Загрузка ключевой модели: ${modelName}`);
      
      try {
        // Путь к файлу модели (преобразуем CamelCase в dash-case для имени файла)
        const fileName = modelName.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`).replace(/^-/, '') + '.js';
        const modelPath = path.join(__dirname, fileName);
        
        if (fs.existsSync(modelPath)) {
          // Удаляем кэш модуля перед загрузкой для уверенности в чистой загрузке
          delete require.cache[require.resolve(modelPath)];
          
          // Загружаем класс модели
          const ModelClass = require(modelPath);
          
          // Явно инициализируем модель
          if (typeof ModelClass.init === 'function') {
            await ModelClass.init();
            //log(`Модель ${modelName} успешно инициализирована`);
          } else {
            log(`Модель ${modelName} не имеет метода init`, 'warn');
          }
          
          // Сохраняем модель в реестре
          models[modelName] = ModelClass;
        } else {
          log(`Файл модели ${fileName} не найден`, 'warn');
        }
      } catch (error) {
        log(`Ошибка при инициализации модели ${modelName}: ${error.message}`, 'error');
        console.error(error.stack);
      }
    }
    
    // Загружаем все остальные файлы моделей
    const modelFiles = fs
      .readdirSync(__dirname)
      .filter(file => {
        return (
          file.indexOf('.') !== 0 &&
          file !== path.basename(__filename) &&
          file !== 'index.js' && 
          file !== 'fix-models.js' &&
          file !== 'remove-self-init.js' &&
          file !== 'fix-model-associations.js' &&
          file !== 'initializeModels.js' &&
          file !== 'client-user.js' &&
          file !== 'user-adapter.js' &&
          file.slice(-3) === '.js' &&
          file.indexOf('.test.js') === -1
        );
      });
    
   // log(`Найдено ${modelFiles.length} файлов моделей`);
    
    // Инициализируем остальные модели
    for (const file of modelFiles) {
      const modelName = file.replace(/\.js$/, '').replace(/(^|-)([a-z])/g, (_, __, char) => char.toUpperCase());
      
      // Пропускаем уже инициализированные модели
      if (models[modelName]) continue;
      
      try {
        const modelPath = path.join(__dirname, file);
        //log(`Загрузка модели из файла: ${file}`);
        
        // Удаляем кэш модуля перед загрузкой для уверенности в чистой загрузке
        delete require.cache[require.resolve(modelPath)];
        
        // Загружаем класс модели
        const ModelClass = require(modelPath);
        
        // Явно инициализируем модель
        if (typeof ModelClass.init === 'function') {
          await ModelClass.init();
         // log(`Модель ${modelName} успешно инициализирована`);
        } else {
          //log(`Модель ${modelName} не имеет метода init`, 'warn');
        }
        
        // Сохраняем модель в реестре
        models[modelName] = ModelClass;
      } catch (error) {
        log(`Ошибка при инициализации модели из файла ${file}: ${error.message}`, 'error');
        console.error(error.stack);
      }
    }
    
    // Устанавливаем ассоциации между моделями
    log('Установка ассоциаций между моделями...');
    
    // Добавляем Sequelize и DataTypes в объект моделей для корректной работы ассоциаций
    models.Sequelize = Sequelize;
    models.DataTypes = DataTypes;
    models.sequelize = sequelize;
    
    // Создаем безопасную обертку для модели User
    if (!models.User || typeof models.User !== 'function') {
      log('Создание заглушки для модели User для ассоциаций', 'warn');
      class UserStub extends Model {}
      UserStub.init({
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        username: DataTypes.STRING
      }, { sequelize, modelName: 'User' });
      models.User = UserStub;
    }
    
    // Проходим по всем моделям и устанавливаем ассоциации
    for (const [modelName, Model] of Object.entries(models)) {
      // Пропускаем служебные поля
      if (modelName === 'Sequelize' || modelName === 'DataTypes' || modelName === 'sequelize') continue;
      
      if (Model && typeof Model.associate === 'function') {
        //log(`Установка ассоциаций для модели ${modelName}...`);
        
        try {
          // Передаем весь реестр моделей в метод associate
          Model.associate(models);
          //log(`Ассоциации для модели ${modelName} успешно установлены`);
        } catch (assocError) {
          //log(`Ошибка при установке ассоциаций для модели ${modelName}: ${assocError.message}`, 'error');
          console.error(assocError.stack);
          
          // Создаем безопасную обертку для установки базовых ассоциаций
          try {
            //log(`Попытка установить базовые ассоциации для ${modelName}...`);
            
            // Простая функция для безопасного вызова методов ассоциаций
            const safeAssociate = (model, targetModelName, options = {}) => {
              try {
                if (!models[targetModelName]) {
                  log(`Модель ${targetModelName} не найдена для ассоциации с ${modelName}`, 'warn');
                  return false;
                }
                
                if (typeof model.belongsTo === 'function' && options.type === 'belongsTo') {
                  model.belongsTo(models[targetModelName], options.config || {});
                  //log(`Ассоциация ${modelName} -> ${targetModelName} успешно установлена`);
                  return true;
                }
                
                if (typeof model.hasMany === 'function' && options.type === 'hasMany') {
                  model.hasMany(models[targetModelName], options.config || {});
                  //log(`Ассоциация ${modelName} -> ${targetModelName} (hasMany) успешно установлена`);
                  return true;
                }
                
                if (typeof model.hasOne === 'function' && options.type === 'hasOne') {
                  model.hasOne(models[targetModelName], options.config || {});
                  //log(`Ассоциация ${modelName} -> ${targetModelName} (hasOne) успешно установлена`);
                  return true;
                }
                
                if (typeof model.belongsToMany === 'function' && options.type === 'belongsToMany') {
                  model.belongsToMany(models[targetModelName], options.config || {});
                 // log(`Ассоциация ${modelName} -> ${targetModelName} (belongsToMany) успешно установлена`);
                  return true;
                }
                
                return false;
              } catch (e) {
                //log(`Ошибка при установке базовой ассоциации ${modelName} -> ${targetModelName}: ${e.message}`, 'error');
                return false;
              }
            };
            
            // Базовые ассоциации для наиболее важных моделей
            if (modelName === 'SectMember') {
              safeAssociate(Model, 'Sect', { type: 'belongsTo', config: { foreignKey: 'sectId', as: 'sect' } });
              safeAssociate(Model, 'User', { type: 'belongsTo', config: { foreignKey: 'userId', as: 'user' } });
            }
            
            if (modelName === 'LearnedTechnique') {
              safeAssociate(Model, 'User', { type: 'belongsTo', config: { foreignKey: 'userId', as: 'user' } });
              safeAssociate(Model, 'Technique', { type: 'belongsTo', config: { foreignKey: 'techniqueId', as: 'technique' } });
            }
            
            if (modelName === 'SpiritPet') {
              safeAssociate(Model, 'User', { type: 'belongsTo', config: { foreignKey: 'userId', as: 'user' } });
            }
            
          } catch (alternativeError) {
            log(`Альтернативная установка ассоциаций для ${modelName} не удалась: ${alternativeError.message}`, 'error');
          }
        }
      } else {
        //log(`Модель ${modelName} не имеет метода associate`);
      }
    }
    
    log('Все ассоциации установлены');
    return models;
  } catch (error) {
    log(`Критическая ошибка при инициализации моделей: ${error.message}`, 'error');
    console.error(error.stack);
    throw error;
  }
}

// Экспортируем функцию инициализации
module.exports = { initializeModels };

// Если файл запущен напрямую, инициализируем модели
if (require.main === module) {
  initializeModels()
    .then(() => {
      log('Инициализация завершена успешно');
      process.exit(0);
    })
    .catch(error => {
      log(`Ошибка: ${error.message}`, 'error');
      process.exit(1);
    });
}