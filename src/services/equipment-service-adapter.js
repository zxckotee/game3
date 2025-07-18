/**
 * Адаптер для работы с экипировкой
 * Использует только API для обеспечения совместимости с браузером
 * Исправлено: убран импорт серверного сервиса для предотвращения ошибок crypto-browserify
 */

// Импортируем константы напрямую из модуля констант
const EquipmentConstants = require('../constants/equipment-constants');

// Импортируем только API-версию для всех сред
const EquipmentServiceAPI = require('./equipment-service-api');

// Всегда используем API-версию для предотвращения проблем с crypto-browserify
const EquipmentService = EquipmentServiceAPI;

// Создаем адаптер для экспорта
const adapter = {};

// Используем константы напрямую из модуля констант
adapter.EQUIPMENT_TYPES = EquipmentConstants.EQUIPMENT_TYPES;
adapter.WEAPON_CATEGORIES = EquipmentConstants.WEAPON_CATEGORIES;
adapter.ARMOR_CATEGORIES = EquipmentConstants.ARMOR_CATEGORIES;
adapter.RARITY = EquipmentConstants.RARITY;
adapter.QUALITY = EquipmentConstants.QUALITY;
adapter.BONUS_TYPES = EquipmentConstants.BONUS_TYPES;
adapter.STARTER_GEAR = EquipmentConstants.STARTER_GEAR;

// Методы из сервиса с защитой от ошибок
adapter.getUserEquipment = function() {
  if (typeof EquipmentService.getUserEquipment === 'function') {
    try {
      return EquipmentService.getUserEquipment.apply(EquipmentService, arguments);
    } catch (error) {
      console.warn('Ошибка в getUserEquipment:', error);
      return Promise.resolve([]);
    }
  }
  return Promise.resolve([]);
};

adapter.getEquippedItems = function() {
  if (typeof EquipmentService.getEquippedItems === 'function') {
    try {
      return EquipmentService.getEquippedItems.apply(EquipmentService, arguments);
    } catch (error) {
      console.warn('Ошибка в getEquippedItems:', error);
      return Promise.resolve([]);
    }
  }
  return Promise.resolve([]);
};

adapter.equipItem = function() {
  if (typeof EquipmentService.equipItem === 'function') {
    try {
      return EquipmentService.equipItem.apply(EquipmentService, arguments);
    } catch (error) {
      console.warn('Ошибка в equipItem:', error);
      return Promise.resolve(false);
    }
  }
  return Promise.resolve(false);
};

adapter.unequipItem = function() {
  if (typeof EquipmentService.unequipItem === 'function') {
    try {
      return EquipmentService.unequipItem.apply(EquipmentService, arguments);
    } catch (error) {
      console.warn('Ошибка в unequipItem:', error);
      return Promise.resolve(false);
    }
  }
  return Promise.resolve(false);
};

adapter.calculateEquipmentBonuses = function() {
  if (typeof EquipmentService.calculateEquipmentBonuses === 'function') {
    try {
      return EquipmentService.calculateEquipmentBonuses.apply(EquipmentService, arguments);
    } catch (error) {
      console.warn('Ошибка в calculateEquipmentBonuses:', error);
      return {};
    }
  }
  return {};
};

adapter.createEquipmentItem = function() {
  if (typeof EquipmentService.createEquipmentItem === 'function') {
    try {
      return EquipmentService.createEquipmentItem.apply(EquipmentService, arguments);
    } catch (error) {
      console.warn('Ошибка в createEquipmentItem:', error);
      return Promise.resolve(null);
    }
  }
  return Promise.resolve(null);
};

adapter.removeEquipmentItem = function() {
  if (typeof EquipmentService.removeEquipmentItem === 'function') {
    try {
      return EquipmentService.removeEquipmentItem.apply(EquipmentService, arguments);
    } catch (error) {
      console.warn('Ошибка в removeEquipmentItem:', error);
      return Promise.resolve(false);
    }
  }
  return Promise.resolve(false);
};

adapter.addEquipmentToUser = function() {
  if (typeof EquipmentService.addEquipmentToUser === 'function') {
    try {
      return EquipmentService.addEquipmentToUser.apply(EquipmentService, arguments);
    } catch (error) {
      console.warn('Ошибка в addEquipmentToUser:', error);
      return Promise.resolve(false);
    }
  }
  return Promise.resolve(false);
};

adapter.updateEquipmentItem = function() {
  if (typeof EquipmentService.updateEquipmentItem === 'function') {
    try {
      return EquipmentService.updateEquipmentItem.apply(EquipmentService, arguments);
    } catch (error) {
      console.warn('Ошибка в updateEquipmentItem:', error);
      return Promise.resolve(false);
    }
  }
  return Promise.resolve(false);
};

// Добавляем проверку требований
adapter.DEBUG_EQUIPMENT = true; // Включаем отладку работы адаптера

adapter.checkItemRequirements = function(item, user) {
  if (this.DEBUG_EQUIPMENT) {
    console.log('🔍 [EquipmentService Adapter] Вызов checkItemRequirements');
    console.log('📦 Предмет:', item && (item.name || item.id || 'Unnamed item'));
  }

  if (typeof EquipmentService.checkItemRequirements === 'function') {
    try {
      // Проверяем, имеет ли EquipmentService статическую переменную DEBUG_REQUIREMENTS
      if (this.DEBUG_EQUIPMENT && EquipmentService.DEBUG_REQUIREMENTS !== undefined) {
        console.log('✅ EquipmentService имеет DEBUG_REQUIREMENTS =', EquipmentService.DEBUG_REQUIREMENTS);
      }
      
      // Включаем отладку в базовом сервисе
      if (typeof EquipmentService.DEBUG_REQUIREMENTS !== 'undefined') {
        EquipmentService.DEBUG_REQUIREMENTS = true;
      }
      
      // Теперь вызываем метод базового сервиса
      const result = EquipmentService.checkItemRequirements.call(EquipmentService, item, user);
      
      if (this.DEBUG_EQUIPMENT) {
        console.log('🏁 [EquipmentService Adapter] Результат проверки требований:',
          result.canEquip ? '✅ Можно экипировать' : '❌ Нельзя экипировать');
        if (!result.canEquip) {
          console.log('📋 Причины:', result.failedRequirements);
        }
      }
      
      return result;
    } catch (error) {
      console.warn('❌ Ошибка в checkItemRequirements:', error);
      return { canEquip: true, failedRequirements: [] };
    }
  }
  
  if (this.DEBUG_EQUIPMENT) {
    console.warn('⚠️ Метод checkItemRequirements не найден в EquipmentService');
  }
  
  // По умолчанию разрешаем экипировку, если функция недоступна
  return { canEquip: true, failedRequirements: [] };
};

// Экспортируем адаптер
module.exports = adapter;