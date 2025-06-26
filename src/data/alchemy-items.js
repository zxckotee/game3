/**
 * Файл с данными об алхимических предметах
 * Получает информацию о предметах через адаптер
 */

// Импортируем адаптер для работы с алхимическими предметами
const AlchemyAdapter = require('../services/alchemy-service-adapter');

// Определяем функции-обертки для методов адаптера
const adapterGetAllItems = AlchemyAdapter.getAllItems || function() { return []; };
const adapterGetItemById = AlchemyAdapter.getItemById || function() { return null; };
const adapterGetItemsByType = AlchemyAdapter.getItemsByType || function() { return []; };
const adapterGetItemsByRarity = AlchemyAdapter.getItemsByRarity || function() { return []; };
const adapterCreateItem = AlchemyAdapter.createItem || function() { return null; };
const adapterUpdateItem = AlchemyAdapter.updateItem || function() { return false; };
const adapterDeleteItem = AlchemyAdapter.deleteItem || function() { return false; };

// Типы алхимических предметов
const ITEM_TYPES = {
  PILL: 'pill',         // Пилюли
  ELIXIR: 'elixir',     // Эликсиры
  POWDER: 'powder',     // Порошки
  TALISMAN: 'talisman', // Талисманы
  INGREDIENT: 'ingredient' // Ингредиенты
};

// Редкость предметов
const RARITY = {
  COMMON: 'common',           // Обычный
  UNCOMMON: 'uncommon',       // Необычный
  RARE: 'rare',               // Редкий
  VERY_RARE: 'very_rare',     // Очень редкий
  LEGENDARY: 'legendary',     // Легендарный
  MYTHICAL: 'mythical'        // Мифический
};

// Кэш для хранения данных
let alchemyItems = [];

// Экспортируем константы для совместимости
exports.ITEM_TYPES = ITEM_TYPES;
exports.RARITY = RARITY;

/**
 * Получение всех алхимических предметов
 * @returns {Promise<Array>} Список всех предметов
 */
exports.getAllAlchemyItems = async function() {
  try {
    const items = await adapterGetAllItems();
    alchemyItems = items; // Обновляем кэш
    return items;
  } catch (error) {
    console.error('Ошибка при получении алхимических предметов:', error);
    return alchemyItems; // В случае ошибки возвращаем кэшированные данные
  }
};

/**
 * Получение предмета по ID
 * @param {number} id ID предмета
 * @returns {Promise<Object|null>} Данные предмета или null
 */
exports.getAlchemyItemById = async function(id) {
  try {
    return await adapterGetItemById(id);
  } catch (error) {
    console.error(`Ошибка при получении алхимического предмета с ID ${id}:`, error);
    // Пытаемся найти в кэше
    return alchemyItems.find(item => item.id === id) || null;
  }
};

/**
 * Получение предметов по типу
 * @param {string} type Тип предмета из ITEM_TYPES
 * @returns {Promise<Array>} Список предметов указанного типа
 */
exports.getAlchemyItemsByType = async function(type) {
  try {
    return await adapterGetItemsByType(type);
  } catch (error) {
    console.error(`Ошибка при получении алхимических предметов типа ${type}:`, error);
    // Фильтруем кэш
    return alchemyItems.filter(item => item.type === type);
  }
};

/**
 * Получение предметов по редкости
 * @param {string} rarity Редкость предмета из RARITY
 * @returns {Promise<Array>} Список предметов указанной редкости
 */
exports.getAlchemyItemsByRarity = async function(rarity) {
  try {
    return await adapterGetItemsByRarity(rarity);
  } catch (error) {
    console.error(`Ошибка при получении алхимических предметов редкости ${rarity}:`, error);
    // Фильтруем кэш
    return alchemyItems.filter(item => item.rarity === rarity);
  }
};

/**
 * Создание нового предмета
 * @param {Object} itemData Данные предмета
 * @returns {Promise<Object>} Созданный предмет
 */
exports.createAlchemyItem = async function(itemData) {
  try {
    const newItem = await adapterCreateItem(itemData);
    // Обновляем кэш
    alchemyItems.push(newItem);
    return newItem;
  } catch (error) {
    console.error('Ошибка при создании алхимического предмета:', error);
    throw error;
  }
};

/**
 * Обновление существующего предмета
 * @param {number} id ID предмета
 * @param {Object} updates Обновляемые поля
 * @returns {Promise<Object>} Обновленный предмет
 */
exports.updateAlchemyItem = async function(id, updates) {
  try {
    const updatedItem = await adapterUpdateItem(id, updates);
    // Обновляем кэш
    const index = alchemyItems.findIndex(item => item.id === id);
    if (index !== -1) {
      alchemyItems[index] = updatedItem;
    }
    return updatedItem;
  } catch (error) {
    console.error(`Ошибка при обновлении алхимического предмета с ID ${id}:`, error);
    throw error;
  }
};

/**
 * Удаление предмета
 * @param {number} id ID предмета
 * @returns {Promise<boolean>} Результат операции
 */
exports.deleteAlchemyItem = async function(id) {
  try {
    const result = await adapterDeleteItem(id);
    // Обновляем кэш
    const index = alchemyItems.findIndex(item => item.id === id);
    if (index !== -1) {
      alchemyItems.splice(index, 1);
    }
    return result;
  } catch (error) {
    console.error(`Ошибка при удалении алхимического предмета с ID ${id}:`, error);
    throw error;
  }
};

// Инициализация кэша при загрузке модуля
(async function() {
  try {
    alchemyItems = await exports.getAllAlchemyItems();
    console.log(`Загружено ${alchemyItems.length} алхимических предметов`);
  } catch (error) {
    console.error('Ошибка при инициализации данных алхимических предметов:', error);
  }
})();

/**
 * Расчет вероятности успеха создания предмета на основе его типа и редкости
 * @param {string} type Тип предмета
 * @param {string} rarity Редкость предмета
 * @returns {number} Вероятность успеха в процентах (0-100)
 */
exports.calculateSuccessRate = function(type, rarity) {
  // Базовая вероятность успеха
  let baseRate = 90;
  
  // Модификаторы в зависимости от типа предмета
  const typeModifiers = {
    [ITEM_TYPES.PILL]: 0,           // Нет модификатора для пилюль
    [ITEM_TYPES.ELIXIR]: -5,        // Эликсиры немного сложнее
    [ITEM_TYPES.POWDER]: 5,         // Порошки немного проще
    [ITEM_TYPES.TALISMAN]: -10,     // Талисманы значительно сложнее
    [ITEM_TYPES.INGREDIENT]: 10     // Ингредиенты проще всего
  };
  
  // Модификаторы в зависимости от редкости предмета
  const rarityModifiers = {
    [RARITY.COMMON]: 5,           // Обычные предметы проще
    [RARITY.UNCOMMON]: 0,         // Нет модификатора для необычных
    [RARITY.RARE]: -10,           // Редкие предметы сложнее
    [RARITY.VERY_RARE]: -20,      // Очень редкие предметы значительно сложнее
    [RARITY.LEGENDARY]: -30,      // Легендарные предметы очень сложны
    [RARITY.MYTHICAL]: -50        // Мифические предметы крайне сложны
  };
  
  // Применяем модификаторы
  const typeModifier = typeModifiers[type] || 0;
  const rarityModifier = rarityModifiers[rarity] || 0;
  
  // Рассчитываем итоговую вероятность с учетом модификаторов
  let finalRate = baseRate + typeModifier + rarityModifier;
  
  // Ограничиваем значение в диапазоне 5-95% (всегда есть минимальный шанс успеха и неудачи)
  return Math.max(5, Math.min(95, finalRate));
};

// Экспорт массива предметов для обратной совместимости
exports.alchemyItems = alchemyItems;
