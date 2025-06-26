/**
 * Файл с данными о предметах экипировки
 * Содержит информацию о всех предметах экипировки, их свойствах и эффектах
 * Получает данные через адаптер
 */

// Импортируем адаптер для работы с экипировкой
const EquipmentAdapter = require('../services/equipment-service-adapter');

// В CommonJS нельзя деструктурировать методы из класса напрямую
// Определяем функции-обертки для методов адаптера
const adapterGetAllEquipment = EquipmentAdapter.getAllEquipment || function() { return []; };
const adapterGetEquipmentById = EquipmentAdapter.getEquipmentById || function() { return null; };
const adapterGetEquipmentByType = EquipmentAdapter.getEquipmentByType || function() { return []; };
const adapterGetEquipmentByRarity = EquipmentAdapter.getEquipmentByRarity || function() { return []; };
const adapterCalculateBonuses = EquipmentAdapter.calculateBonuses || function() { return {}; };
const adapterCreateEquipment = EquipmentAdapter.createEquipment || function() { return null; };
const adapterUpdateEquipment = EquipmentAdapter.updateEquipment || function() { return false; };
const adapterDeleteEquipment = EquipmentAdapter.deleteEquipment || function() { return false; };

// Типы предметов экипировки
const EQUIPMENT_TYPES = {
  WEAPON: 'weapon',        // Оружие
  ARMOR: 'armor',          // Броня
  ACCESSORY: 'accessory',  // Аксессуары
  SET: 'set'               // Комплекты
};

// Подтипы для каждого типа экипировки
const EQUIPMENT_SUBTYPES = {
  WEAPON: {
    SWORD: 'sword',          // Мечи
    SPEAR: 'spear',          // Копья
    STAFF: 'staff',          // Посохи
    DAGGER: 'dagger',        // Кинжалы
    BOW: 'bow',              // Луки
    FAN: 'fan',              // Веера
    WHIP: 'whip'             // Кнуты
  },
  ARMOR: {
    ROBE: 'robe',            // Одеяния
    LIGHT: 'light',          // Легкая броня
    MEDIUM: 'medium',        // Средняя броня
    HEAVY: 'heavy'           // Тяжелая броня
  },
  ACCESSORY: {
    RING: 'ring',            // Кольца
    NECKLACE: 'necklace',    // Ожерелья
    BELT: 'belt',            // Пояса
    BRACELET: 'bracelet',    // Браслеты
    TALISMAN: 'talisman'     // Талисманы
  }
};

// Редкость предметов
const EQUIPMENT_RARITY = {
  COMMON: 'common',           // Обычный
  UNCOMMON: 'uncommon',       // Необычный
  RARE: 'rare',               // Редкий
  EPIC: 'epic',               // Эпический
  LEGENDARY: 'legendary',     // Легендарный
  ARTIFACT: 'artifact',       // Артефакт
  MYTHIC: 'mythic'            // Мифический
};

// Кэш для хранения данных
let equipmentItems = [];

// Экспортируем константы для совместимости
exports.EQUIPMENT_TYPES = EQUIPMENT_TYPES;
exports.EQUIPMENT_SUBTYPES = EQUIPMENT_SUBTYPES;
exports.EQUIPMENT_RARITY = EQUIPMENT_RARITY;

/**
 * Получение всех предметов экипировки
 * @returns {Promise<Array>} Список всех предметов
 */
exports.getAllEquipment = async function() {
  try {
    const items = await adapterGetAllEquipment();
    equipmentItems = items; // Обновляем кэш
    return items;
  } catch (error) {
    console.error('Ошибка при получении предметов экипировки:', error);
    return equipmentItems; // В случае ошибки возвращаем кэшированные данные
  }
};

/**
 * Получение предмета экипировки по ID
 * @param {number} id ID предмета
 * @returns {Promise<Object|null>} Данные предмета или null
 */
exports.getEquipmentById = async function(id) {
  try {
    return await adapterGetEquipmentById(id);
  } catch (error) {
    console.error(`Ошибка при получении предмета экипировки с ID ${id}:`, error);
    // Пытаемся найти в кэше
    return equipmentItems.find(item => item.id === id) || null;
  }
};

/**
 * Получение предметов экипировки по типу
 * @param {string} type Тип предмета из EQUIPMENT_TYPES
 * @param {string} subtype Подтип предмета (опционально)
 * @returns {Promise<Array>} Список предметов указанного типа
 */
exports.getEquipmentByType = async function(type, subtype = null) {
  try {
    return await adapterGetEquipmentByType(type, subtype);
  } catch (error) {
    console.error(`Ошибка при получении предметов экипировки типа ${type}:`, error);
    // Фильтруем кэш
    let filteredItems = equipmentItems.filter(item => item.type === type);
    if (subtype) {
      filteredItems = filteredItems.filter(item => item.subtype === subtype);
    }
    return filteredItems;
  }
};

/**
 * Получение предметов экипировки по редкости
 * @param {string} rarity Редкость предмета из EQUIPMENT_RARITY
 * @returns {Promise<Array>} Список предметов указанной редкости
 */
exports.getEquipmentByRarity = async function(rarity) {
  try {
    return await adapterGetEquipmentByRarity(rarity);
  } catch (error) {
    console.error(`Ошибка при получении предметов экипировки редкости ${rarity}:`, error);
    // Фильтруем кэш
    return equipmentItems.filter(item => item.rarity === rarity);
  }
};

/**
 * Расчет бонусов от экипировки
 * @param {Array} equippedItems Массив ID экипированных предметов
 * @returns {Promise<Object>} Объект с бонусами от экипировки
 */
exports.calculateBonuses = async function(equippedItems) {
  try {
    return await adapterCalculateBonuses(equippedItems);
  } catch (error) {
    console.error('Ошибка при расчете бонусов от экипировки:', error);
    
    // Если произошла ошибка, считаем бонусы на клиенте
    // Получаем информацию о предметах из кэша
    const items = [];
    for (const id of equippedItems) {
      const item = equipmentItems.find(i => i.id === id);
      if (item) {
        items.push(item);
      }
    }
    
    // Упрощенный расчет бонусов
    const bonuses = {};
    items.forEach(item => {
      if (item.properties && item.properties.effects) {
        item.properties.effects.forEach(effect => {
          if (effect.target && effect.value) {
            if (!bonuses[effect.target]) {
              bonuses[effect.target] = 0;
            }
            
            if (effect.operation === 'multiply') {
              bonuses[effect.target] *= effect.value;
            } else {
              bonuses[effect.target] += effect.value;
            }
          }
        });
      }
    });
    
    return bonuses;
  }
};

/**
 * Создание нового предмета экипировки
 * @param {Object} itemData Данные предмета
 * @returns {Promise<Object>} Созданный предмет
 */
exports.createEquipment = async function(itemData) {
  try {
    const newItem = await adapterCreateEquipment(itemData);
    // Обновляем кэш
    equipmentItems.push(newItem);
    return newItem;
  } catch (error) {
    console.error('Ошибка при создании предмета экипировки:', error);
    throw error;
  }
};

/**
 * Обновление существующего предмета экипировки
 * @param {number} id ID предмета
 * @param {Object} updates Обновляемые поля
 * @returns {Promise<Object>} Обновленный предмет
 */
exports.updateEquipment = async function(id, updates) {
  try {
    const updatedItem = await adapterUpdateEquipment(id, updates);
    // Обновляем кэш
    const index = equipmentItems.findIndex(item => item.id === id);
    if (index !== -1) {
      equipmentItems[index] = updatedItem;
    }
    return updatedItem;
  } catch (error) {
    console.error(`Ошибка при обновлении предмета экипировки с ID ${id}:`, error);
    throw error;
  }
};

/**
 * Удаление предмета экипировки
 * @param {number} id ID предмета
 * @returns {Promise<boolean>} Результат операции
 */
exports.deleteEquipment = async function(id) {
  try {
    const result = await adapterDeleteEquipment(id);
    // Обновляем кэш
    const index = equipmentItems.findIndex(item => item.id === id);
    if (index !== -1) {
      equipmentItems.splice(index, 1);
    }
    return result;
  } catch (error) {
    console.error(`Ошибка при удалении предмета экипировки с ID ${id}:`, error);
    throw error;
  }
};

// Инициализация кэша при загрузке модуля
(async function() {
  try {
    equipmentItems = await exports.getAllEquipment();
    console.log(`Загружено ${equipmentItems.length} предметов экипировки`);
  } catch (error) {
    console.error('Ошибка при инициализации данных предметов экипировки:', error);
  }
})();

// Экспорт массива предметов для обратной совместимости
exports.equipmentItems = equipmentItems;
