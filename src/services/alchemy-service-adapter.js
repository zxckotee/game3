/**
 * Адаптер для выбора подходящей версии alchemy-service.js в зависимости от среды выполнения
 * Модифицировано для устранения циклических зависимостей
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем константы напрямую из модуля констант
const AlchemyConstants = require('../constants/alchemy-constants');

// Импортируем клиентскую версию для браузера
const AlchemyServiceAPI = require('./alchemy-service-api');

// Определение объекта в зависимости от окружения
let AlchemyService;

// В браузере всегда используем клиентскую версию
if (!isServerEnvironment) {
  AlchemyService = AlchemyServiceAPI;
} else {
  // В серверном окружении используем оригинальную версию с доступом к БД
  try {
    // Используем прямой импорт на сервере
    const ServerAlchemyService = require('./alchemy-service');
    AlchemyService = ServerAlchemyService;
  } catch (error) {
    console.error('Ошибка при импорте серверной версии alchemy-service:', error);
    console.warn('Используем клиентскую версию из-за ошибки импорта');
    
    // В случае ошибки используем клиентскую версию
    AlchemyService = AlchemyServiceAPI;
  }
}

// Создаем адаптер для экспорта
const adapter = {};

// Используем константы напрямую из модуля констант
adapter.ITEM_TYPES = AlchemyConstants.ITEM_TYPES;
adapter.RARITY = AlchemyConstants.RARITY;
adapter.EFFECT_TYPES = AlchemyConstants.EFFECT_TYPES;
adapter.RECIPE_CATEGORIES = AlchemyConstants.RECIPE_CATEGORIES;

// Данные, которые могут содержаться в сервисе
adapter.alchemyItems = AlchemyService.alchemyItems || [];

// Безопасные методы с проверкой существования и try-catch
adapter.getAllRecipes = function() {
  try {
    if (typeof AlchemyService.getAllRecipes === 'function') {
      return AlchemyService.getAllRecipes.apply(AlchemyService, arguments);
    }
    console.warn('Метод getAllRecipes не существует');
    return Promise.resolve([]);
  } catch (error) {
    console.warn('Ошибка в getAllRecipes:', error);
    return Promise.resolve([]);
  }
};

adapter.getRecipeById = function() {
  try {
    if (typeof AlchemyService.getRecipeById === 'function') {
      return AlchemyService.getRecipeById.apply(AlchemyService, arguments);
    }
    console.warn('Метод getRecipeById не существует');
    return Promise.resolve(null);
  } catch (error) {
    console.warn('Ошибка в getRecipeById:', error);
    return Promise.resolve(null);
  }
};

adapter.getRecipesByType = function() {
  try {
    if (typeof AlchemyService.getRecipesByType === 'function') {
      return AlchemyService.getRecipesByType.apply(AlchemyService, arguments);
    }
    console.warn('Метод getRecipesByType не существует');
    return Promise.resolve([]);
  } catch (error) {
    console.warn('Ошибка в getRecipesByType:', error);
    return Promise.resolve([]);
  }
};

adapter.getRecipesByRarity = function() {
  try {
    if (typeof AlchemyService.getRecipesByRarity === 'function') {
      return AlchemyService.getRecipesByRarity.apply(AlchemyService, arguments);
    }
    console.warn('Метод getRecipesByRarity не существует');
    return Promise.resolve([]);
  } catch (error) {
    console.warn('Ошибка в getRecipesByRarity:', error);
    return Promise.resolve([]);
  }
};

adapter.craftItem = function() {
  try {
    if (typeof AlchemyService.craftItem === 'function') {
      return AlchemyService.craftItem.apply(AlchemyService, arguments);
    }
    console.warn('Метод craftItem не существует');
    return Promise.resolve(null);
  } catch (error) {
    console.warn('Ошибка в craftItem:', error);
    return Promise.resolve(null);
  }
};

adapter.getUserAlchemyItems = function() {
  try {
    if (typeof AlchemyService.getUserAlchemyItems === 'function') {
      return AlchemyService.getUserAlchemyItems.apply(AlchemyService, arguments);
    }
    console.warn('Метод getUserAlchemyItems не существует');
    return Promise.resolve([]);
  } catch (error) {
    console.warn('Ошибка в getUserAlchemyItems:', error);
    return Promise.resolve([]);
  }
};

adapter.useAlchemyItem = function() {
  try {
    if (typeof AlchemyService.useAlchemyItem === 'function') {
      return AlchemyService.useAlchemyItem.apply(AlchemyService, arguments);
    }
    console.warn('Метод useAlchemyItem не существует');
    return Promise.resolve(null);
  } catch (error) {
    console.warn('Ошибка в useAlchemyItem:', error);
    return Promise.resolve(null);
  }
};

adapter.getItemTypes = function() {
  try {
    if (typeof AlchemyService.getItemTypes === 'function') {
      return AlchemyService.getItemTypes.apply(AlchemyService, arguments);
    }
    console.warn('Метод getItemTypes не существует');
    return {};
  } catch (error) {
    console.warn('Ошибка в getItemTypes:', error);
    return {};
  }
};

adapter.getRarityLevels = function() {
  try {
    if (typeof AlchemyService.getRarityLevels === 'function') {
      return AlchemyService.getRarityLevels.apply(AlchemyService, arguments);
    }
    console.warn('Метод getRarityLevels не существует');
    return {};
  } catch (error) {
    console.warn('Ошибка в getRarityLevels:', error);
    return {};
  }
};

// Экспортируем адаптер вместо прямого экспорта сервиса
module.exports = adapter;

// Для совместимости со старым кодом
for (const key in AlchemyService) {
  if (Object.prototype.hasOwnProperty.call(AlchemyService, key) &&
      !Object.prototype.hasOwnProperty.call(module.exports, key)) {
    try {
      // Безопасное копирование неопределенных свойств
      Object.defineProperty(module.exports, key, {
        get: function() {
          try {
            return AlchemyService[key];
          } catch (error) {
            console.warn(`Ошибка при доступе к свойству ${key}:`, error);
            return undefined;
          }
        },
        enumerable: true,
        configurable: true
      });
    } catch (error) {
      console.warn(`Не удалось экспортировать свойство ${key}:`, error);
    }
  }
}