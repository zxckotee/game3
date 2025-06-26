/**
 * Адаптер для работы с ресурсами
 * Выбирает подходящую реализацию в зависимости от среды выполнения
 * Модифицировано для устранения циклических зависимостей
 */

const { isServerEnvironment } = require('../sequelize-config');
const ResourceAPI = require('./resource-api');

// Импортируем константы напрямую, а не через сервис
const ResourceConstants = require('../constants/resource-constants');

// Определяем сервис
let ResourceService;

// В браузере всегда используем API для запросов к серверу
if (!isServerEnvironment) {
  ResourceService = ResourceAPI;
} else {
  // На сервере используем прямое взаимодействие с базой данных
  try {
    // Используем прямой импорт на сервере
    const ServerResourceService = require('./resource-service');
    ResourceService = ServerResourceService;
  } catch (error) {
    console.error('Ошибка при импорте серверной версии resource-service:', error);
    console.warn('Используем клиентскую версию из-за ошибки импорта');
    ResourceService = ResourceAPI;
  }
}

// Создаём кэш для значений
const valueCache = {};

// Экспортируем простой объект вместо прямого экспорта сервиса
const adapter = {};

// ВАЖНО: Создаем безопасные методы вручную, без использования геттеров
// Это предотвращает бесконечную рекурсию

// Методы для работы с ресурсами - проверяем наличие методов перед вызовом
adapter.getAllResources = function() {
  try {
    // Проверяем, существует ли метод перед вызовом apply
    if (typeof ResourceService.getAllResources === 'function') {
      return ResourceService.getAllResources.apply(ResourceService, arguments);
    } else {
      console.warn('Метод getAllResources не существует в ResourceService');
      return Promise.resolve([]);
    }
  } catch (error) {
    console.warn('Ошибка в getAllResources:', error);
    return Promise.resolve([]);
  }
};

adapter.getResourceById = function() {
  try {
    if (typeof ResourceService.getResourceById === 'function') {
      return ResourceService.getResourceById.apply(ResourceService, arguments);
    } else {
      console.warn('Метод getResourceById не существует в ResourceService');
      return Promise.resolve(null);
    }
  } catch (error) {
    console.warn('Ошибка в getResourceById:', error);
    return Promise.resolve(null);
  }
};

adapter.getResourcesByType = function() {
  try {
    if (typeof ResourceService.getResourcesByType === 'function') {
      return ResourceService.getResourcesByType.apply(ResourceService, arguments);
    } else {
      console.warn('Метод getResourcesByType не существует в ResourceService');
      return Promise.resolve([]);
    }
  } catch (error) {
    console.warn('Ошибка в getResourcesByType:', error);
    return Promise.resolve([]);
  }
};

adapter.getResourcesByRarity = function() {
  try {
    if (typeof ResourceService.getResourcesByRarity === 'function') {
      return ResourceService.getResourcesByRarity.apply(ResourceService, arguments);
    } else {
      console.warn('Метод getResourcesByRarity не существует в ResourceService');
      return Promise.resolve([]);
    }
  } catch (error) {
    console.warn('Ошибка в getResourcesByRarity:', error);
    return Promise.resolve([]);
  }
};

// Константы - используем прямой импорт из отдельного модуля констант
// Это полностью разрывает циклическую зависимость
adapter.RESOURCE_TYPES = ResourceConstants.RESOURCE_TYPES;
adapter.RARITY = ResourceConstants.RARITY;

// Другие методы могут быть опциональными
adapter.addNewResource = function() {
  try {
    if (typeof ResourceService.addNewResource === 'function') {
      return ResourceService.addNewResource.apply(ResourceService, arguments);
    } else {
      return Promise.reject(new Error('Метод не поддерживается в текущей среде'));
    }
  } catch (error) {
    console.warn('Ошибка в addNewResource:', error);
    return Promise.reject(new Error('Метод не поддерживается в текущей среде'));
  }
};

adapter.updateResource = function() {
  try {
    if (typeof ResourceService.updateResource === 'function') {
      return ResourceService.updateResource.apply(ResourceService, arguments);
    } else {
      return Promise.reject(new Error('Метод не поддерживается в текущей среде'));
    }
  } catch (error) {
    console.warn('Ошибка в updateResource:', error);
    return Promise.reject(new Error('Метод не поддерживается в текущей среде'));
  }
};

adapter.deleteResource = function() {
  try {
    if (typeof ResourceService.deleteResource === 'function') {
      return ResourceService.deleteResource.apply(ResourceService, arguments);
    } else {
      return Promise.reject(new Error('Метод не поддерживается в текущей среде'));
    }
  } catch (error) {
    console.warn('Ошибка в deleteResource:', error);
    return Promise.reject(new Error('Метод не поддерживается в текущей среде'));
  }
};

/**
 * Получает необходимые ресурсы для прорыва культивации
 */
adapter.getBreakthroughResources = function() {
  try {
    if (typeof ResourceService.getBreakthroughResources === 'function') {
      return ResourceService.getBreakthroughResources.apply(ResourceService, arguments);
    } else {
      console.warn('Метод getBreakthroughResources не существует в ResourceService');
      return Promise.resolve({});
    }
  } catch (error) {
    console.warn('Ошибка в getBreakthroughResources:', error);
    return Promise.resolve({});
  }
};

// Экспортируем готовый адаптер
module.exports = adapter;