/**
 * Адаптер для выбора подходящей версии resources.js в зависимости от среды выполнения
 * Предотвращает включение серверных зависимостей в клиентскую сборку
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем клиентскую версию для браузера
const ClientResources = require('./client-resources');

// Определение объекта в зависимости от окружения
let Resources;

// В браузере всегда используем клиентскую версию
if (!isServerEnvironment) {
  Resources = ClientResources;
} else {
  // В серверном окружении используем оригинальную версию с доступом к БД
  try {
    // Используем динамический импорт только для сервера
    // Через функцию, чтобы webpack не пытался его включить в клиентскую сборку
    const serverPath = './resources';
    // Функция для загрузки модуля в рантайме только на сервере
    const loadServerModule = new Function('modulePath', 'return require(modulePath)');
    
    // На сервере должен быть доступен require
    const ServerResources = loadServerModule(serverPath);
    Resources = ServerResources;
  } catch (error) {
    console.error('Ошибка при импорте серверной версии resources:', error);
    console.warn('Используем клиентскую версию из-за ошибки импорта');
    
    // В случае ошибки используем клиентскую версию
    Resources = ClientResources;
  }
}

// Экспортируем константы и функции
const RESOURCE_TYPES = Resources.RESOURCE_TYPES;
const RARITY = Resources.RARITY;

// Экспортируем методы для работы с ресурсами
const getAllResources = Resources.getAllResources;
const getResourceById = Resources.getResourceById;
const getResourcesByType = Resources.getResourcesByType;
const getResourcesByRarity = Resources.getResourcesByRarity;

// Методы, которые могут быть только в клиентской или серверной версии
const saveResourcesToStorage = Resources.saveResourcesToStorage;
const addNewResource = Resources.addNewResource;
const updateResource = Resources.updateResource;

// Экспортируем по умолчанию весь объект для совместимости с require
module.exports = Resources;