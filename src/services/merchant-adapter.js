/**
 * Адаптер для выбора подходящего MerchantService в зависимости от среды выполнения
 * Безопасная версия, предотвращающая включение серверного кода в клиентскую сборку
 * Версия без циклических зависимостей
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем константы из общего файла
const { merchantTypes, merchantRarityLevels } = require('../data/merchant-constants');

// Импортируем API-версию для клиента
const MerchantServiceAPI = require('./merchant-api'); // Через API (для браузера)

// Определение объекта сервиса в зависимости от окружения
let MerchantService;

// В браузере всегда используем API-версию
if (!isServerEnvironment) {
  MerchantService = MerchantServiceAPI;
} else {
  // В серверном окружении используем прямой доступ к БД
  try {
    // Используем прямой импорт на сервере
    const MerchantServiceDirect = require('./merchant-service');
    MerchantService = MerchantServiceDirect.default || MerchantServiceDirect;
  } catch (error) {
    console.error('Ошибка при импорте серверного MerchantService:', error);
    console.warn('Используем API версию из-за ошибки импорта');
    
    // В случае ошибки используем API-версию
    MerchantService = MerchantServiceAPI;
  }
}

// Добавляем обратную совместимость для классов, которые инстанцируют MerchantService
// Создаем класс-оболочку для статических методов
class MerchantServiceWrapper {
  constructor(models) {
    this.models = models;
    // Сохраняем ссылку на статические методы оригинального сервиса
    this.serviceInstance = MerchantService;
  }
  
  // Прокси-методы, перенаправляющие вызовы на статические методы
  getAllMerchants() {
    return this.serviceInstance.getAllMerchants();
  }
  
  getMerchantById(merchantId) {
    return this.serviceInstance.getMerchantById(merchantId);
  }
  
  getMerchantsByType(specialization) {
    return this.serviceInstance.getMerchantsByType(specialization);
  }
  
  getMerchantsByLocation(location) {
    return this.serviceInstance.getMerchantsByLocation(location);
  }
  
  getMerchantInventory(merchantId, userId) {
    return this.serviceInstance.getMerchantInventory(merchantId, userId);
  }
  
  getMerchantDiscount(merchantId) {
    return this.serviceInstance.getMerchantDiscount(merchantId);
  }
  
  restockMerchantItems(merchantId) {
    return this.serviceInstance.restockMerchantItems(merchantId);
  }
  
  buyItemFromMerchant(merchantId, itemId, userId, quantity) {
    return this.serviceInstance.buyItemFromMerchant(merchantId, itemId, userId, quantity);
  }
  
  sellItemToMerchant(merchantId, itemData, userId, quantity) {
    return this.serviceInstance.sellItemToMerchant(merchantId, itemData, userId, quantity);
  }
  
  addMerchant(merchantData) {
    return this.serviceInstance.addMerchant(merchantData);
  }
  
  updateMerchant(id, updates) {
    return this.serviceInstance.updateMerchant(id, updates);
  }
  
  deleteMerchant(id) {
    return this.serviceInstance.deleteMerchant(id);
  }
}

// Добавляем статические методы класса-оболочки
Object.keys(MerchantService).forEach(key => {
  if (typeof MerchantService[key] === 'function') {
    MerchantServiceWrapper[key] = MerchantService[key];
  }
});

// Экспортируем константы и методы для CommonJS
module.exports = MerchantServiceWrapper;

// Используем константы из общего файла вместо получения их из сервиса
module.exports.merchantTypes = merchantTypes;
module.exports.merchantRarityLevels = merchantRarityLevels;

// Экспортируем отдельные методы
module.exports.getAllMerchants = MerchantService.getAllMerchants;
module.exports.getMerchantById = MerchantService.getMerchantById;
module.exports.getMerchantsByType = MerchantService.getMerchantsByType;
module.exports.getMerchantsByLocation = MerchantService.getMerchantsByLocation;
module.exports.getMerchantInventory = MerchantService.getMerchantInventory;
module.exports.getMerchantDiscount = MerchantService.getMerchantDiscount;
module.exports.restockMerchantItems = MerchantService.restockMerchantItems;
module.exports.buyItemFromMerchant = MerchantService.buyItemFromMerchant;
module.exports.sellItemToMerchant = MerchantService.sellItemToMerchant;
module.exports.addMerchant = MerchantService.addMerchant;
module.exports.updateMerchant = MerchantService.updateMerchant;
module.exports.deleteMerchant = MerchantService.deleteMerchant;