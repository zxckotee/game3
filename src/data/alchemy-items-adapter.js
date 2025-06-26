/**
 * Адаптер для выбора подходящей версии alchemy-items.js в зависимости от среды выполнения
 * Предотвращает включение серверных зависимостей в клиентскую сборку
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем клиентскую версию для браузера
const ClientAlchemyItems = require('./client-alchemy-items');

// Определение объекта в зависимости от окружения
let AlchemyItems;

// В браузере всегда используем клиентскую версию
if (!isServerEnvironment) {
  AlchemyItems = ClientAlchemyItems;
} else {
  // В серверном окружении используем оригинальную версию с доступом к БД
  try {
    // Используем динамический импорт только для сервера
    // Через функцию, чтобы webpack не пытался его включить в клиентскую сборку
    const serverPath = './alchemy-items';
    // Функция для загрузки модуля в рантайме только на сервере
    const loadServerModule = new Function('modulePath', 'return require(modulePath)');
    
    // На сервере должен быть доступен require
    const ServerAlchemyItems = loadServerModule(serverPath);
    AlchemyItems = ServerAlchemyItems;
  } catch (error) {
    console.error('Ошибка при импорте серверной версии alchemy-items:', error);
    console.warn('Используем клиентскую версию из-за ошибки импорта');
    
    // В случае ошибки используем клиентскую версию
    AlchemyItems = ClientAlchemyItems;
  }
}

// Экспортируем константы и функции из выбранной реализации
const ITEM_TYPES = AlchemyItems.ITEM_TYPES;
const RARITY = AlchemyItems.RARITY;
const getAllAlchemyItems = AlchemyItems.getAllAlchemyItems;
const getAlchemyItemById = AlchemyItems.getAlchemyItemById;
const getAlchemyItemsByType = AlchemyItems.getAlchemyItemsByType;
const getAlchemyItemsByRarity = AlchemyItems.getAlchemyItemsByRarity;

// Серверные методы могут отсутствовать в клиентской версии
const saveItemsToStorage = AlchemyItems.saveItemsToStorage;
const addNewAlchemyItem = AlchemyItems.addNewAlchemyItem;

// Экспортируем по умолчанию весь объект для совместимости с require
module.exports = AlchemyItems;