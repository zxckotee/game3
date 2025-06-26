/**
 * Клиентская версия данных о торговцах без серверных зависимостей
 * Использует API для получения данных с сервера
 * Обновленная версия без циклических зависимостей, напрямую работающая с API
 */

// Импортируем константы из общего файла
const { merchantTypes, merchantRarityLevels } = require('./merchant-constants');
const MerchantAPI = require('../services/merchant-api');

// Кэш для хранения данных о торговцах (для оптимизации)
let merchantsCache = [];
let merchantsById = {};
let initialized = false;

/**
 * Загружает всех торговцев с сервера
 * @returns {Promise<Array>} Промис с массивом торговцев
 */
async function getAllMerchants() {
  try {
    // Получаем данные с сервера
    const merchants = await MerchantAPI.getAllMerchants();
    
    // Обновляем кэш
    merchantsCache = merchants;
    merchantsById = merchants.reduce((acc, merchant) => {
      acc[merchant.id] = merchant;
      return acc;
    }, {});
    
    initialized = true;
    
    return merchants;
  } catch (error) {
    console.error('Ошибка при загрузке торговцев через API:', error);
    return merchantsCache;
  }
}

/**
 * Получает торговца по ID
 * @param {number} id - ID торговца
 * @returns {Promise<Object|null>} Промис с торговцем или null, если не найден
 */
async function getMerchantById(id) {
  // Если есть в кэше и мы уже инициализированы, используем кэш
  if (initialized && merchantsById[id]) {
    return merchantsById[id];
  }
  
  try {
    const merchant = await MerchantAPI.getMerchantById(id);
    
    // Если нашли, добавляем в кэш
    if (merchant) {
      merchantsById[id] = merchant;
      
      // Если есть массив кэша, проверяем и добавляем туда тоже
      if (merchantsCache.length > 0) {
        const index = merchantsCache.findIndex(m => m.id === id);
        if (index >= 0) {
          merchantsCache[index] = merchant;
        } else {
          merchantsCache.push(merchant);
        }
      }
    }
    
    return merchant;
  } catch (error) {
    console.error(`Ошибка при получении торговца с ID ${id} через API:`, error);
    return merchantsById[id] || null;
  }
}

/**
 * Получает торговцев по специализации
 * @param {string} specialization - Специализация торговцев
 * @returns {Promise<Array>} Промис с массивом торговцев указанной специализации
 */
async function getMerchantsByType(specialization) {
  // Если у нас есть кэшированные данные, используем их
  if (initialized && merchantsCache.length > 0) {
    const filteredMerchants = merchantsCache.filter(merchant => 
      merchant.specialization === specialization
    );
    
    if (filteredMerchants.length > 0) {
      return filteredMerchants;
    }
  }
  
  try {
    return await MerchantAPI.getMerchantsByType(specialization);
  } catch (error) {
    console.error(`Ошибка при получении торговцев специализации ${specialization} через API:`, error);
    // Если есть кэш, пробуем фильтровать его
    if (merchantsCache.length > 0) {
      return merchantsCache.filter(merchant => merchant.specialization === specialization);
    }
    return [];
  }
}

/**
 * Получает торговцев по локации
 * @param {string} location - Локация торговцев
 * @returns {Promise<Array>} Промис с массивом торговцев в указанной локации
 */
async function getMerchantsByLocation(location) {
  // Если у нас есть кэшированные данные, используем их
  if (initialized && merchantsCache.length > 0) {
    const filteredMerchants = merchantsCache.filter(merchant => 
      merchant.location === location
    );
    
    if (filteredMerchants.length > 0) {
      return filteredMerchants;
    }
  }
  
  try {
    return await MerchantAPI.getMerchantsByLocation(location);
  } catch (error) {
    console.error(`Ошибка при получении торговцев в локации ${location} через API:`, error);
    // Если есть кэш, пробуем фильтровать его
    if (merchantsCache.length > 0) {
      return merchantsCache.filter(merchant => merchant.location === location);
    }
    return [];
  }
}

/**
 * Получает инвентарь торговца
 * @param {number} merchantId - ID торговца
 * @returns {Promise<Array>} Промис с массивом предметов в инвентаре торговца
 */
async function getMerchantInventory(merchantId) {
  // Для инвентаря не используем кэш, так как он может часто меняться
  try {
    return await MerchantAPI.getMerchantInventory(merchantId);
  } catch (error) {
    console.error(`Ошибка при получении инвентаря торговца ${merchantId} через API:`, error);
    // Если есть кэшированный торговец, возвращаем его инвентарь
    const merchant = merchantsById[merchantId];
    return merchant && merchant.inventory ? merchant.inventory : [];
  }
}

/**
 * Получает скидку для пользователя у торговца
 * @param {number} merchantId - ID торговца
 * @returns {Promise<number>} Промис со скидкой (от 0 до 1)
 */
async function getMerchantDiscount(merchantId) {
  try {
    return await MerchantAPI.getMerchantDiscount(merchantId);
  } catch (error) {
    console.error(`Ошибка при получении скидки у торговца ${merchantId} через API:`, error);
    // Если есть кэшированный торговец, возвращаем его скидку по умолчанию
    const merchant = merchantsById[merchantId];
    return merchant ? (merchant.defaultDiscount || 0) : 0;
  }
}

/**
 * Пополняет запасы торговца (только для администраторов)
 * @param {number} merchantId - ID торговца
 * @returns {Promise<boolean>} Промис с результатом операции
 */
async function restockMerchantItems(merchantId) {
  try {
    const result = await MerchantAPI.restockMerchantItems(merchantId);
    // Если успешно, сбрасываем кэш для этого торговца
    if (result.success) {
      delete merchantsById[merchantId];
      const index = merchantsCache.findIndex(m => m.id === merchantId);
      if (index >= 0) {
        merchantsCache.splice(index, 1);
      }
    }
    return result.success;
  } catch (error) {
    console.error(`Ошибка при пополнении запасов торговца ${merchantId} через API:`, error);
    return false;
  }
}

/**
 * Покупает предмет у торговца
 * @param {number} merchantId - ID торговца
 * @param {number} itemId - ID предмета
 * @param {number} quantity - Количество предметов для покупки
 * @returns {Promise<Object>} Промис с результатом операции
 */
async function buyItemFromMerchant(merchantId, itemId, quantity = 1) {
  try {
    const result = await MerchantAPI.buyItemFromMerchant(merchantId, itemId, quantity);
    // Если успешно, сбрасываем кэш инвентаря
    if (result.success) {
      // Обновляем торговца, так как инвентарь изменился
      delete merchantsById[merchantId];
      const index = merchantsCache.findIndex(m => m.id === merchantId);
      if (index >= 0) {
        merchantsCache.splice(index, 1);
      }
    }
    return result;
  } catch (error) {
    console.error(`Ошибка при покупке предмета ${itemId} у торговца ${merchantId} через API:`, error);
    return { success: false, message: 'Произошла ошибка при покупке предмета' };
  }
}

/**
 * Продает предмет торговцу
 * @param {number} merchantId - ID торговца
 * @param {Object} itemData - Данные о предмете
 * @param {number} quantity - Количество предметов для продажи
 * @returns {Promise<Object>} Промис с результатом операции
 */
async function sellItemToMerchant(merchantId, itemData, quantity = 1) {
  try {
    const result = await MerchantAPI.sellItemToMerchant(merchantId, itemData, quantity);
    return result;
  } catch (error) {
    console.error(`Ошибка при продаже предмета торговцу ${merchantId} через API:`, error);
    return { success: false, message: 'Произошла ошибка при продаже предмета' };
  }
}

// Функция для инициализации системы и проверки API-соединения
async function initSystem() {
  console.log('Инициализация клиентской системы торговцев');
  try {
    // Проверяем API, загружая список торговцев
    await getAllMerchants();
    console.log('Система торговцев инициализирована успешно');
    return true;
  } catch (error) {
    console.error('Ошибка при инициализации системы торговцев:', error);
    return false;
  }
}

/**
 * Инициализирует данные о торговцах, загружая их через API
 */
async function initMerchantData() {
  console.log('Инициализация данных о торговцах через API...');
  try {
    await getAllMerchants();
    console.log(`Загружено ${merchantsCache.length} торговцев через API`);
    
    // Пытаемся установить соединение с системой
    await initSystem();
    
    return true;
  } catch (error) {
    console.error('Ошибка при инициализации данных о торговцах:', error);
    return false;
  }
}

// Инициализируем данные при загрузке модуля
initMerchantData().catch(error => {
  console.error('Ошибка при автоматической инициализации торговцев:', error);
});

// Экспорт по умолчанию для совместимости со старым кодом
module.exports = {
  merchantTypes,
  merchantRarityLevels,
  merchants: merchantsCache,
  getAllMerchants,
  getMerchantById,
  getMerchantsByType,
  getMerchantsByLocation,
  getMerchantInventory,
  getMerchantDiscount,
  restockMerchantItems,
  initMerchantData,
  buyItemFromMerchant,
  sellItemToMerchant
};

// Экспортируем отдельные свойства для совместимости
module.exports.merchantTypes = merchantTypes;
module.exports.merchantRarityLevels = merchantRarityLevels;
module.exports.merchants = merchantsCache;
module.exports.getAllMerchants = getAllMerchants;
module.exports.getMerchantById = getMerchantById;
module.exports.getMerchantsByType = getMerchantsByType;
module.exports.getMerchantsByLocation = getMerchantsByLocation;
module.exports.getMerchantInventory = getMerchantInventory;
module.exports.getMerchantDiscount = getMerchantDiscount;
module.exports.restockMerchantItems = restockMerchantItems;
module.exports.initMerchantData = initMerchantData;
module.exports.buyItemFromMerchant = buyItemFromMerchant;
module.exports.sellItemToMerchant = sellItemToMerchant;
module.exports.initSystem = initSystem;