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
    // Проверяем, существует ли ResourceService и метод перед вызовом
    if (ResourceService && typeof ResourceService.getAllResources === 'function') {
      return ResourceService.getAllResources.apply(ResourceService, arguments);
    } else {
      // Возвращаем пустой массив без вывода предупреждения
      return Promise.resolve([]);
    }
  } catch (error) {
    // Подавляем ошибки, возвращаем пустой массив
    return Promise.resolve([]);
  }
};

adapter.getResourceById = function() {
  try {
    if (ResourceService && typeof ResourceService.getResourceById === 'function') {
      return ResourceService.getResourceById.apply(ResourceService, arguments);
    } else {
      return Promise.resolve(null);
    }
  } catch (error) {
    return Promise.resolve(null);
  }
};

adapter.getResourcesByType = function() {
  try {
    if (ResourceService && typeof ResourceService.getResourcesByType === 'function') {
      return ResourceService.getResourcesByType.apply(ResourceService, arguments);
    } else {
      return Promise.resolve([]);
    }
  } catch (error) {
    return Promise.resolve([]);
  }
};

adapter.getResourcesByRarity = function() {
  try {
    if (ResourceService && typeof ResourceService.getResourcesByRarity === 'function') {
      return ResourceService.getResourcesByRarity.apply(ResourceService, arguments);
    } else {
      return Promise.resolve([]);
    }
  } catch (error) {
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
    if (ResourceService && typeof ResourceService.addNewResource === 'function') {
      return ResourceService.addNewResource.apply(ResourceService, arguments);
    } else {
      return Promise.reject(new Error('Метод не поддерживается в текущей среде'));
    }
  } catch (error) {
    return Promise.reject(new Error('Метод не поддерживается в текущей среде'));
  }
};

adapter.updateResource = function() {
  try {
    if (ResourceService && typeof ResourceService.updateResource === 'function') {
      return ResourceService.updateResource.apply(ResourceService, arguments);
    } else {
      return Promise.reject(new Error('Метод не поддерживается в текущей среде'));
    }
  } catch (error) {
    return Promise.reject(new Error('Метод не поддерживается в текущей среде'));
  }
};

adapter.deleteResource = function() {
  try {
    if (ResourceService && typeof ResourceService.deleteResource === 'function') {
      return ResourceService.deleteResource.apply(ResourceService, arguments);
    } else {
      return Promise.reject(new Error('Метод не поддерживается в текущей среде'));
    }
  } catch (error) {
    return Promise.reject(new Error('Метод не поддерживается в текущей среде'));
  }
};

/**
 * Получает необходимые ресурсы для прорыва культивации
 */
adapter.getBreakthroughResources = function() {
  try {
    if (ResourceService && typeof ResourceService.getBreakthroughResources === 'function') {
      return ResourceService.getBreakthroughResources.apply(ResourceService, arguments);
    } else {
      return Promise.resolve({});
    }
  } catch (error) {
    return Promise.resolve({});
  }
};

// Экспортируем готовый адаптер
module.exports = adapter;