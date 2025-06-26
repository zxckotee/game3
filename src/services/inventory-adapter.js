/**
 * Адаптер для выбора подходящего InventoryService в зависимости от среды выполнения
 * Безопасная версия, предотвращающая включение серверного кода в клиентскую сборку
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем API-версию для клиента
const InventoryServiceAPI = require('./inventory-api'); // Через API (для браузера)

// Определение объекта сервиса в зависимости от окружения
let InventoryService;

// В браузере всегда используем API-версию
if (!isServerEnvironment) {
  InventoryService = InventoryServiceAPI;
} else {
  // В серверном окружении используем прямой доступ к БД
  try {
    // Используем прямой импорт на сервере
    const InventoryServiceDirect = require('./inventory-service');
    InventoryService = InventoryServiceDirect.default || InventoryServiceDirect;
  } catch (error) {
    console.error('Ошибка при импорте серверного InventoryService:', error);
    console.warn('Используем API версию из-за ошибки импорта');
    
    // В случае ошибки используем API-версию
    InventoryService = InventoryServiceAPI;
  }
}

// Создаем единственный экземпляр для использования методов экземпляра (если такие есть)
const serviceInstance = new (function() {
  this.getInventoryItems = function(userId) {
    return InventoryService.getInventoryItems(userId);
  };
  
  this.addInventoryItem = function(userId, item) {
    return InventoryService.addInventoryItem(userId, item);
  };
  
  this.removeInventoryItem = function(userId, itemId, quantity) {
    return InventoryService.removeInventoryItem(userId, itemId, quantity);
  };
  
  this.toggleEquipItem = function(userId, itemId, equipped) {
    return InventoryService.toggleEquipItem(userId, itemId, equipped);
  };
  
  this.clearUserInventory = function(userId) {
    return InventoryService.clearUserInventory(userId);
  };
  
  this.addBatchInventoryItems = function(userId, items) {
    return InventoryService.addBatchInventoryItems(userId, items);
  };
  
  this.saveInventory = function(userId, items) {
    return InventoryService.saveInventory(userId, items);
  };
})();

// Экспортируем методы напрямую
module.exports = {
  // Статические методы
  getInventoryItems: InventoryService.getInventoryItems,
  addInventoryItem: InventoryService.addInventoryItem,
  removeInventoryItem: InventoryService.removeInventoryItem,
  toggleEquipItem: InventoryService.toggleEquipItem,
  clearUserInventory: InventoryService.clearUserInventory,
  addBatchInventoryItems: InventoryService.addBatchInventoryItems,
  saveInventory: InventoryService.saveInventory,
  
  // Экспортируем также экземпляр для обратной совместимости
  // для кода, который ожидает экземпляр класса
  getInstance: function() {
    return serviceInstance;
  },
  
  // Экспортируем оригинальный сервис для совместимости
  _service: InventoryService
};

// Для обратной совместимости добавляем конструктор
module.exports.constructor = function(models) {
  console.warn('Создание экземпляра InventoryService через конструктор устарело. Используйте статические методы.');
  return serviceInstance;
};