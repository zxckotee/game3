/**
 * Адаптер для выбора подходящей версии merchant-service.js в зависимости от среды выполнения
 * Предотвращает включение серверных зависимостей в клиентскую сборку
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем клиентскую версию для браузера
const MerchantServiceAPI = require('./merchant-service-api');

// Определение объекта в зависимости от окружения
let MerchantService;

// В браузере всегда используем клиентскую версию
if (!isServerEnvironment) {
  MerchantService = MerchantServiceAPI;
} else {
  // В серверном окружении используем оригинальную версию с доступом к БД
  try {
    // Используем прямой импорт на сервере
    const ServerMerchantService = require('./merchant-service-db');
    MerchantService = ServerMerchantService;
  } catch (error) {
    console.error('Ошибка при импорте серверной версии merchant-service-db:', error);
    console.warn('Используем клиентскую версию из-за ошибки импорта');
    
    // В случае ошибки используем клиентскую версию
    MerchantService = MerchantServiceAPI;
  }
}

// Экспортируем все методы и свойства из выбранной реализации
module.exports.getAllMerchants = MerchantService.getAllMerchants;
module.exports.getMerchantsByLocation = MerchantService.getMerchantsByLocation;
module.exports.getMerchantsBySpecialization = MerchantService.getMerchantsBySpecialization;
module.exports.getMerchantInventory = MerchantService.getMerchantInventory;
module.exports.buyItemFromMerchant = MerchantService.buyItemFromMerchant;
module.exports.sellItemToMerchant = MerchantService.sellItemToMerchant;
module.exports.updateMerchantItems = MerchantService.updateMerchantItems;
module.exports.getMerchantReputation = MerchantService.getMerchantReputation;
module.exports.changeMerchantReputation = MerchantService.changeMerchantReputation;

// Экспортируем по умолчанию весь объект для совместимости с require
module.exports = MerchantService;