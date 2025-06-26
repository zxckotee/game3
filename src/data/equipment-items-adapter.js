/**
 * Адаптер для выбора подходящей версии equipment-items.js в зависимости от среды выполнения
 * Модифицирован для устранения циклических зависимостей
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем константы напрямую из модуля констант
const EquipmentConstants = require('../constants/equipment-constants');

// Импортируем клиентскую версию для браузера
const ClientEquipmentItems = require('./client-equipment-items');

// Определение объекта в зависимости от окружения
let EquipmentItems;

// В браузере всегда используем клиентскую версию
if (!isServerEnvironment) {
  EquipmentItems = ClientEquipmentItems;
} else {
  // В серверном окружении используем оригинальную версию с доступом к БД
  try {
    // Используем прямой импорт на сервере
    const ServerEquipmentItems = require('./equipment-items');
    EquipmentItems = ServerEquipmentItems;
  } catch (error) {
    console.error('Ошибка при импорте серверной версии equipment-items:', error);
    console.warn('Используем клиентскую версию из-за ошибки импорта');
    
    // В случае ошибки используем клиентскую версию
    EquipmentItems = ClientEquipmentItems;
  }
}

// Создаем адаптер для экспорта
const adapter = {};

// Используем константы напрямую из модуля констант
adapter.EQUIPMENT_TYPES = EquipmentConstants.EQUIPMENT_TYPES;
adapter.EQUIPMENT_RARITY = EquipmentConstants.RARITY;
adapter.WEAPON_SUBTYPES = EquipmentConstants.WEAPON_CATEGORIES;
adapter.ARMOR_SUBTYPES = EquipmentConstants.ARMOR_CATEGORIES;
adapter.BONUS_TYPES = EquipmentConstants.BONUS_TYPES;

// Эти данные могут быть взяты из сервиса
adapter.ACCESSORY_SUBTYPES = EquipmentItems.ACCESSORY_SUBTYPES || {};
adapter.EQUIPMENT_SLOTS = EquipmentItems.EQUIPMENT_SLOTS || {};
adapter.equipmentItems = EquipmentItems.equipmentItems || [];
adapter.equipmentSets = EquipmentItems.equipmentSets || [];

// Методы из сервиса
adapter.loadEquipmentItems = function() {
  if (typeof EquipmentItems.loadEquipmentItems === 'function') {
    try {
      return EquipmentItems.loadEquipmentItems.apply(EquipmentItems, arguments);
    } catch (error) {
      console.warn('Ошибка в loadEquipmentItems:', error);
      return Promise.resolve([]);
    }
  }
  return Promise.resolve([]);
};

adapter.getEquipmentItemById = function() {
  if (typeof EquipmentItems.getEquipmentItemById === 'function') {
    try {
      return EquipmentItems.getEquipmentItemById.apply(EquipmentItems, arguments);
    } catch (error) {
      console.warn('Ошибка в getEquipmentItemById:', error);
      return null;
    }
  }
  return null;
};

adapter.getEquipmentItemsByType = function() {
  if (typeof EquipmentItems.getEquipmentItemsByType === 'function') {
    try {
      return EquipmentItems.getEquipmentItemsByType.apply(EquipmentItems, arguments);
    } catch (error) {
      console.warn('Ошибка в getEquipmentItemsByType:', error);
      return [];
    }
  }
  return [];
};

adapter.getEquipmentItemsByRarity = function() {
  if (typeof EquipmentItems.getEquipmentItemsByRarity === 'function') {
    try {
      return EquipmentItems.getEquipmentItemsByRarity.apply(EquipmentItems, arguments);
    } catch (error) {
      console.warn('Ошибка в getEquipmentItemsByRarity:', error);
      return [];
    }
  }
  return [];
};

adapter.getEquipmentSet = function() {
  if (typeof EquipmentItems.getEquipmentSet === 'function') {
    try {
      return EquipmentItems.getEquipmentSet.apply(EquipmentItems, arguments);
    } catch (error) {
      console.warn('Ошибка в getEquipmentSet:', error);
      return null;
    }
  }
  return null;
};

adapter.getAllEquipmentSets = function() {
  if (typeof EquipmentItems.getAllEquipmentSets === 'function') {
    try {
      return EquipmentItems.getAllEquipmentSets.apply(EquipmentItems, arguments);
    } catch (error) {
      console.warn('Ошибка в getAllEquipmentSets:', error);
      return [];
    }
  }
  return [];
};

adapter.getEquipmentSetItems = function() {
  if (typeof EquipmentItems.getEquipmentSetItems === 'function') {
    try {
      return EquipmentItems.getEquipmentSetItems.apply(EquipmentItems, arguments);
    } catch (error) {
      console.warn('Ошибка в getEquipmentSetItems:', error);
      return [];
    }
  }
  return [];
};

adapter.initEquipmentItems = function() {
  if (typeof EquipmentItems.initEquipmentItems === 'function') {
    try {
      return EquipmentItems.initEquipmentItems.apply(EquipmentItems, arguments);
    } catch (error) {
      console.warn('Ошибка в initEquipmentItems:', error);
      return Promise.resolve();
    }
  }
  return Promise.resolve();
};

// Экспортируем адаптер вместо прямого экспорта объекта
module.exports = adapter;