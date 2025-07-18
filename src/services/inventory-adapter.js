/**
 * Адаптер для работы с инвентарем
 * Использует только API для обеспечения совместимости с браузером
 * Исправлено: убран импорт серверного сервиса для предотвращения ошибок crypto-browserify
 */

// Импортируем только API-версию для всех сред
const InventoryServiceAPI = require('./inventory-api');

// Всегда используем API-версию для предотвращения проблем с crypto-browserify
const InventoryService = InventoryServiceAPI;

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