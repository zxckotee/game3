/**
 * Адаптер для выбора подходящей версии market-service.js в зависимости от среды выполнения
 * Предотвращает включение серверного кода в клиентскую сборку
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем клиентскую версию для браузера
const MarketServiceAPI = require('./market-service-api');

// Определение объекта в зависимости от окружения
let MarketService;

// В браузере всегда используем клиентскую версию
if (!isServerEnvironment) {
  MarketService = MarketServiceAPI;
} else {
  // В серверном окружении используем оригинальную версию с доступом к БД
  try {
    // Используем прямой импорт на сервере
    const ServerMarketService = require('./market-service');
    MarketService = ServerMarketService;
  } catch (error) {
    console.error('Ошибка при импорте серверной версии market-service:', error);
    console.warn('Используем клиентскую версию из-за ошибки импорта');
    
    // В случае ошибки используем клиентскую версию
    MarketService = MarketServiceAPI;
  }
}

// Экспортируем все методы и свойства из выбранной реализации
module.exports.getAllItems = MarketService.getAllItems;
module.exports.getItemById = MarketService.getItemById;
module.exports.getItemsByType = MarketService.getItemsByType;
module.exports.searchItems = MarketService.searchItems;
module.exports.buyItem = MarketService.buyItem;
module.exports.sellItem = MarketService.sellItem;
module.exports.cancelListing = MarketService.cancelListing;
module.exports.getUserListings = MarketService.getUserListings;
module.exports.getItemTypes = MarketService.getItemTypes;
module.exports.getSortOptions = MarketService.getSortOptions;

// Экспортируем константы для совместимости
module.exports.MARKET_ITEM_TYPES = MarketService.MARKET_ITEM_TYPES || MarketService.getItemTypes?.() || {};
module.exports.SORT_OPTIONS = MarketService.SORT_OPTIONS || MarketService.getSortOptions?.() || {};

// Экспортируем по умолчанию весь объект для совместимости с require
module.exports = MarketService;