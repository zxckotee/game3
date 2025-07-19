/**
 * Централизованный реестр моделей
 * Предназначен для загрузки, инициализации и регистрации всех моделей
 * Решает проблемы с циклическими зависимостями и доступом к моделям
 */

const fs = require('fs');
const path = require('path');
const connectionProvider = require('../utils/connection-provider');

// Кэш для хранения инициализированных моделей
const modelCache = {};

// Метка завершения инициализации
let initialized = false;

// Промис инициализации
let initPromise = null;

/**
 * Функция для инициализации всех моделей
 * @returns {Promise<Object>} Объект с зарегистрированными моделями
 */
async function initializeAllModels() {
  console.log('[REGISTRY DEBUG] Вызов initializeAllModels(), initialized =', initialized);
  
  if (initialized) {
    console.log('[REGISTRY DEBUG] Registry уже инициализирован, возвращаем кэш');
    return modelCache;
  }

  try {
    console.log('[REGISTRY DEBUG] Начинаем инициализацию реестра моделей...');
    
    // Получаем экземпляр Sequelize
    const sequelizeResult = await connectionProvider.getSequelizeInstance();
    const sequelize = sequelizeResult.db;
    
    // Специальная обработка для модели User
    // User инициализируется самостоятельно, но нужно добавить её в registry
    console.log('[REGISTRY DEBUG] Пытаемся добавить модель User в registry...');
    try {
      const { getInitializedUserModel } = require('./user');
      console.log('[REGISTRY DEBUG] Получили getInitializedUserModel функцию');
      const UserModel = await getInitializedUserModel();
      console.log('[REGISTRY DEBUG] Получили UserModel:', !!UserModel);
      modelCache['User'] = UserModel;
      console.log('[REGISTRY DEBUG] Модель User добавлена в registry из собственной инициализации');
    } catch (error) {
      console.error('[REGISTRY DEBUG] Не удалось добавить модель User в registry:', error.message);
      console.error('[REGISTRY DEBUG] Stack trace:', error.stack);
    }
    
    // Получаем список файлов моделей
    const modelFiles = fs.readdirSync(__dirname)
      .filter(file => {
        return (
          file.indexOf('.') !== 0 &&
          file !== 'registry.js' &&
          file !== 'index.js' &&
          file !== 'fix-circular-dependency.js' &&
          file !== 'fix-model-associations.js' &&
          file !== 'fix-models.js' &&
          file !== 'initialize-stubs.js' &&
          file !== 'client-user.js' &&
          file !== 'user-adapter.js' &&
          file.slice(-3) === '.js'
        );
      });
    
    //console.log(`Найдено ${modelFiles.length} файлов моделей`);
    
    // Сначала просто загрузим все модели без инициализации
    for (const file of modelFiles) {
      try {
        // Получаем имя модели из имени файла
        let modelName = file.replace('.js', '');
        // Преобразуем kebab-case в CamelCase
        modelName = modelName.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
        // Преобразуем первую букву в заглавную
        modelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
        
        // Загружаем файл модели
        //console.log(`Загрузка модели: ${modelName} из файла ${file}`);
        const modelPath = path.join(__dirname, file);
        let actualModelOrFunction = require(modelPath);
        let initializedModel;

        // Проверяем, что модель корректно загружена
        if (!actualModelOrFunction) {
          console.warn(`Модель ${modelName} не экспортирована из файла ${file}`);
          continue;
        }

        if (typeof actualModelOrFunction === 'function' &&
            (actualModelOrFunction.length >= 1 && actualModelOrFunction.length <= 2) && // Ожидаем (sequelize, DataTypes) или (sequelize)
            !actualModelOrFunction.prototype // Убедимся, что это не класс-конструктор Sequelize (у них есть prototype)
           ) {
          // Это функция вида (sequelize, DataTypes) => { ... }
          // console.log(`Модель ${modelName} экспортируется как функция. Вызываем с sequelize...`);
          try {
            initializedModel = actualModelOrFunction(sequelize, sequelize.Sequelize.DataTypes); // Передаем sequelize и DataTypes
            if (!initializedModel || (typeof initializedModel.init !== 'function' && typeof initializedModel.findByPk !== 'function' && !initializedModel.sequelize)) {
                // Если результат вызова не похож на модель Sequelize
                console.warn(`Результат вызова функции для ${modelName} не является ожидаемой моделью Sequelize. Используем исходный экспорт как класс, если возможно.`);
                initializedModel = actualModelOrFunction; // Используем исходный экспорт, если он сам по себе класс
            } else {
                // console.log(`Модель ${modelName} успешно инициализирована через вызов функции.`);
            }
          } catch (e) {
            console.error(`Ошибка при вызове функции-экспорта для модели ${modelName}:`, e);
            initializedModel = actualModelOrFunction; // В случае ошибки, используем исходный экспорт
          }
        } else {
          // Это класс или уже объект модели
          initializedModel = actualModelOrFunction;
        }
        
        modelCache[modelName] = initializedModel;
        // console.log(`Модель ${modelName} (${typeof initializedModel}) добавлена в кэш.`);

      } catch (error) {
        console.error(`Ошибка при загрузке или инициализации модели из файла ${file}:`, error);
      }
    }
    
    // Теперь проходим по моделям в кэше для дополнительной инициализации (если это классы с методом init)
    // и регистрации в sequelize.models, если это еще не произошло.
    console.log('Дополнительная инициализация и проверка регистрации моделей...');
    for (const [modelName, CachedModel] of Object.entries(modelCache)) {
      try {
        // Если модель является классом Sequelize и имеет метод init (для моделей, наследующих Sequelize.Model)
        if (typeof CachedModel === 'function' && CachedModel.prototype instanceof sequelize.Sequelize.Model && typeof CachedModel.init === 'function') {
          // console.log(`Модель ${modelName} является классом Sequelize с методом init. Проверяем инициализацию...`);
          // Убедимся, что модель еще не в sequelize.models или что она не была инициализирована через sequelize.define
          if (!sequelize.models[modelName] && !CachedModel.sequelize) { // CachedModel.sequelize появляется после init
            // console.log(`Инициализация класса модели ${modelName} через init()...`);
            if (CachedModel.init.constructor.name === 'AsyncFunction') {
              await CachedModel.init(sequelize.Sequelize.DataTypes, { sequelize, modelName }); // Передаем DataTypes и опции
            } else {
              CachedModel.init(sequelize.Sequelize.DataTypes, { sequelize, modelName }); // Передаем DataTypes и опции
            }
             // После init, модель должна быть в sequelize.models[modelName]
             if (sequelize.models[modelName]) {
                modelCache[modelName] = sequelize.models[modelName]; // Обновляем кэш на случай, если init вернул новый экземпляр
                // console.log(`Модель ${modelName} успешно инициализирована и зарегистрирована в Sequelize.`);
             } else {
                // console.warn(`Модель ${modelName} не была автоматически зарегистрирована в Sequelize после вызова init().`);
             }
          } else {
            // console.log(`Модель ${modelName} уже инициализирована или зарегистрирована.`);
            if (sequelize.models[modelName] && modelCache[modelName] !== sequelize.models[modelName]) {
                 modelCache[modelName] = sequelize.models[modelName]; // Синхронизируем кэш
            }
          }
        } else if (typeof CachedModel === 'object' && CachedModel !== null && CachedModel.sequelize) {
            // Это уже инициализированный объект модели (например, через sequelize.define)
            // console.log(`Модель ${modelName} уже является инициализированным объектом.`);
            if (!sequelize.models[modelName]) {
                sequelize.models[modelName] = CachedModel; // Убедимся, что она в sequelize.models
            }
        } else {
          // console.log(`Модель ${modelName} не требует вызова init() или уже обработана.`);
        }
        
        // Старый блок явной регистрации удален/закомментирован, так как sequelize.define или Model.init должны это делать.
        // if (sequelize && CachedModel.name && !sequelize.models[CachedModel.name]) {
        //   // Эта логика может быть избыточной или неверной, если CachedModel - это функция-фабрика
        //   // sequelize.models[CachedModel.name] = CachedModel;
        // }
      } catch (error) {
        console.error(`Ошибка при дополнительной инициализации/регистрации модели ${modelName}:`, error);
      }
    }
    
    // Устанавливаем ассоциации между моделями
    // Только для моделей, которые имеют метод associate и еще не установили ассоциации
    console.log('Установка ассоциаций между моделями...');
    for (const [modelName, ModelClass] of Object.entries(modelCache)) {
      try {
        if (typeof ModelClass.associate === 'function') {
          // Проверяем, не установлены ли уже ассоциации для этой модели
          const hasAssociations = ModelClass.associations && Object.keys(ModelClass.associations).length > 0;
          
          if (!hasAssociations) {
            console.log(`Установка ассоциаций для модели ${modelName}...`);
            ModelClass.associate(modelCache);
          } else {
            console.log(`Ассоциации для модели ${modelName} уже установлены, пропускаем`);
          }
        }
      } catch (error) {
        console.error(`Ошибка при установке ассоциаций для модели ${modelName}:`, error);
      }
    }
    
    initialized = true;
    console.log('[REGISTRY DEBUG] Реестр моделей успешно инициализирован');
    console.log('[REGISTRY DEBUG] Модели в кэше:', Object.keys(modelCache));
    return modelCache;
  } catch (error) {
    console.error('[REGISTRY DEBUG] Критическая ошибка при инициализации реестра моделей:', error);
    console.error('[REGISTRY DEBUG] Stack trace:', error.stack);
    throw error;
  }
}

/**
 * Получение модели по имени
 * @param {string} modelName - Имя модели
 * @returns {Object} Модель
 * @throws {Error} Если модель не найдена или реестр не инициализирован
 */
function getModel(modelName) {
  if (!initialized) {
    throw new Error('Реестр моделей не инициализирован. Вызовите await initializeRegistry() перед использованием');
  }
  
  if (modelCache[modelName]) {
    return modelCache[modelName];
  }
  
  // Пытаемся найти модель в кэше без учета регистра
  const caseInsensitiveMatch = Object.keys(modelCache).find(
    key => key.toLowerCase() === modelName.toLowerCase()
  );
  
  if (caseInsensitiveMatch) {
    //console.log(`Модель '${modelName}' найдена в реестре как '${caseInsensitiveMatch}'`);
    return modelCache[caseInsensitiveMatch];
  }
  
  //throw new Error(`Модель '${modelName}' не найдена в реестре`);
}

/**
 * Асинхронная инициализация реестра
 * @returns {Promise<Object>} Промис, который разрешается после инициализации реестра
 */
function initializeRegistry() {
  console.log('[REGISTRY DEBUG] Вызов initializeRegistry(), initPromise =', !!initPromise);
  
  if (!initPromise) {
    console.log('[REGISTRY DEBUG] Создаем новый initPromise');
    initPromise = initializeAllModels();
  } else {
    console.log('[REGISTRY DEBUG] initPromise уже существует, возвращаем его');
  }
  
  return initPromise;
}
// Функция для регистрации модели в кэше
function register(name, model) {
  modelCache[name] = model;
  return model;
}

// НЕ вызываем автоматическую инициализацию при импорте - это может вызывать конфликты
// initializeRegistry().then((res) => {console.log(getModel('AlchemyRecipe'));});
// Экспортируем функции и не запускаем инициализацию автоматически
module.exports = {
  initializeRegistry,
  getModel,
  register,
  // Функция для проверки статуса инициализации
  isInitialized: () => initialized,
  // Функция для получения всего кэша моделей
  getAllModels: () => modelCache
};

// Явная регистрация ключевых моделей для гарантии доступности
register('User', require('./user'));
register('CharacterStats', require('./character-stats'));
register('Combat', require('./combat'));

// Регистрируем модели инвентаря
register('ItemImage', require('./item-image'));
register('InventoryItem', require('./inventory-item'));

// Регистрируем модели PvP
register('PvPMode', require('./pvp-mode'));
register('PvPRoom', require('./pvp-room'));
register('PvPParticipant', require('./pvp-participant'));
register('PvPAction', require('./pvp-action'));
register('PvPRating', require('./pvp-rating'));
register('PvPHistory', require('./pvp-history'));
register('PvPReward', require('./pvp-reward'));
register('PvPPlayerStats', require('./pvp-player-stats'));

// Регистрируем модель каталога предметов
register('ItemCatalog', require('./item-catalog'));

// Регистрируем модели для духовных питомцев через централизованный модуль
const spiritPetModels = require('./init-spirit-pet-models');
register('SpiritPetCatalog', spiritPetModels.SpiritPetCatalog);
register('UserSpiritPet', spiritPetModels.UserSpiritPet);
register('SpiritPetFood', spiritPetModels.SpiritPetFood);

// Регистрируем модели предметов экипировки
const equipmentItemModels = require('./equipment-item');
register('EquipmentItem', equipmentItemModels);
register('EquipmentItemEffect', require('./equipment-item-effect'));
register('EquipmentItemRequirement', require('./equipment-item-requirement'));
register('EquipmentItemSpecialEffect', require('./equipment-item-special-effect'));

// Регистрируем модели эффектов
register('Effect', require('./effect'));
register('ActivePlayerEffect', require('./active-player-effect'));

// Регистрируем модель локаций
register('Location', require('./location'));

