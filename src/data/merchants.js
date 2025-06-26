/**
 * Данные о NPC-торговцах в игре
 * Модуль для получения данных о торговцах напрямую через API
 * Обновленная версия без циклических зависимостей
 */

// Импортируем необходимые зависимости
const { calculateMerchantDiscount, applyLoyaltyDiscount } = require('../utils/sectRelationshipSyncer');

// Импортируем константы из общего файла
const { merchantTypes, merchantRarityLevels } = require('./merchant-constants');

// Импортируем API
const MerchantAPI = require('../services/merchant-api');

// Для обратной совместимости и локального кэширования
let merchants = [];

/**
 * Функция для получения всех торговцев
 * @returns {Promise<Array>} Массив всех торговцев
 */
async function getAllMerchants() {
  try {
    // Получаем данные напрямую из API
    const result = await MerchantAPI.getAllMerchants();
    merchants = result; // Обновляем кэш
    console.log(`Получено ${result.length} торговцев из API`);
    return result;
  } catch (error) {
    console.error('Ошибка при загрузке торговцев через API:', error);
    return merchants; // В случае ошибки возвращаем кэшированные данные
  }
}

/**
 * Функция для получения торговца по ID
 * @param {number} id ID торговца
 * @returns {Promise<Object|null>} Объект торговца или null, если торговец не найден
 */
async function getMerchantById(id) {
  try {
    // Сначала проверяем, есть ли торговец в кэше
    const cachedMerchant = merchants.find(m => m.id === id);
    if (cachedMerchant) {
      return cachedMerchant;
    }
    
    // Если торговца нет в кэше, но есть другие, обновляем кэш и ищем снова
    if (merchants.length === 0) {
      await getAllMerchants();
      return merchants.find(m => m.id === id) || null;
    }
    
    return null;
  } catch (error) {
    console.error(`Ошибка при загрузке торговца с ID ${id}:`, error);
    // Возвращаем торговца из кэша, если он есть
    return merchants.find(m => m.id === id) || null;
  }
}

/**
 * Функция для получения торговцев по локации
 * @param {string} location Название локации
 * @returns {Promise<Array>} Массив торговцев в указанной локации
 */
async function getMerchantsByLocation(location) {
  try {
    // Если кэш пуст, обновляем его
    if (merchants.length === 0) {
      await getAllMerchants();
    }
    
    // Фильтруем торговцев из кэша по локации
    return merchants.filter(m => m.location === location);
  } catch (error) {
    console.error(`Ошибка при загрузке торговцев из локации ${location}:`, error);
    // В случае ошибки возвращаем из текущего кэша
    return merchants.filter(m => m.location === location);
  }
}

/**
 * Функция для получения торговцев по специализации
 * @param {string} specialization Специализация торговца
 * @returns {Promise<Array>} Массив торговцев с указанной специализацией
 */
async function getMerchantsBySpecialization(specialization) {
  try {
    // Если кэш пуст, обновляем его
    if (merchants.length === 0) {
      await getAllMerchants();
    }
    
    // Фильтруем торговцев из кэша по специализации
    return merchants.filter(m => m.specialization === specialization);
  } catch (error) {
    console.error(`Ошибка при загрузке торговцев специализации ${specialization}:`, error);
    // В случае ошибки возвращаем из текущего кэша
    return merchants.filter(m => m.specialization === specialization);
  }
}

/**
 * Функция для расчета цены предмета с учетом репутации игрока у торговца
 * @param {number} basePrice Базовая цена предмета
 * @param {number} merchantReputation Репутация торговца
 * @param {number} playerReputation Репутация игрока у торговца
 * @returns {number} Итоговая цена предмета
 */
function calculatePrice(basePrice, merchantReputation, playerReputation) {  
  // Базовый множитель цены зависит от репутации торговца
  const basePriceMultiplier = 1 + (100 - merchantReputation) / 100;
  const adjustedBasePrice = Math.round(basePrice * basePriceMultiplier);
  
  // Используем нашу систему скидок/наценок на основе лояльности
  const { finalPrice } = applyLoyaltyDiscount(adjustedBasePrice, playerReputation);
  
  // Итоговая цена
  return Math.round(finalPrice);
}

/**
 * Функция для восстановления количества товаров у торговцев с течением игрового времени
 * @param {number} currentGameTime Текущее игровое время (в часах)
 * @returns {Promise<boolean>} Возвращает true, если были восстановлены товары
 */
async function restockMerchantItems(currentGameTime) {
  try {
    // Заглушка так как в MerchantAPI пока нет такого метода
    // Для полной реализации нужно добавить этот метод в MerchantAPI
    console.log('Restock запрошен через API для игрового времени', currentGameTime);
    
    // Обновляем кэш после восстановления товаров
    merchants = await getAllMerchants();
    return true;
  } catch (error) {
    console.error('Ошибка при восстановлении товаров через API:', error);
    
    // В случае ошибки выполняем локальное восстановление в кэше
    let cacheRestockHappened = false;
    
    merchants.forEach(merchant => {
      if (merchant.items && merchant.items.length > 0) {
        merchant.items.forEach(item => {
          if (item.maxQuantity !== undefined &&
              item.restockRate !== undefined &&
              item.lastRestockTime !== undefined &&
              item.quantity < item.maxQuantity) {
            
            const daysSinceLastRestock = (currentGameTime - item.lastRestockTime) / 24;
            
            if (daysSinceLastRestock >= 0.1) {
              const unitsToRestock = Math.floor(daysSinceLastRestock * item.restockRate);
              
              if (unitsToRestock > 0) {
                const oldQuantity = item.quantity;
                item.quantity = Math.min(item.maxQuantity, item.quantity + unitsToRestock);
                item.lastRestockTime = currentGameTime;
                
                if (oldQuantity !== item.quantity) {
                  cacheRestockHappened = true;
                }
              }
            }
          }
        });
      }
    });
    
    return cacheRestockHappened;
  }
}

/**
 * Функция для добавления предметов экипировки в инвентарь торговца
 * @param {Object} merchant Торговец, которому нужно добавить предметы
 * @returns {Promise<Object>} Обновленный объект торговца
 */
async function addEquipmentToMerchant(merchant) {
  console.log(`Вызвана функция addEquipmentToMerchant для торговца: ${merchant?.name || 'неизвестен'}`);
  
  if (!merchant) {
    console.warn('Передан пустой объект торговца, возвращаем без изменений');
    return merchant;
  }
  
  try {
    // Получаем торговца через API
    const updatedMerchant = await apiGetMerchantById(merchant.id);
    
    if (!updatedMerchant) {
      console.warn(`Торговец с ID ${merchant.id} не найден, возвращаем без изменений`);
      return merchant;
    }
    
    return updatedMerchant;
  } catch (error) {
    console.error(`Ошибка при добавлении предметов экипировки торговцу ${merchant.name} через API:`, error);
    return merchant;
  }
}

/**
 * Функция для добавления алхимических ингредиентов к торговцам в игре
 * @param {Array} merchantsArray Массив торговцев
 * @returns {Promise<Array>} Обновленный массив торговцев с добавленными алхимическими ингредиентами
 */
async function addAlchemyItemsToMerchants(merchantsArray) {
  try {
    // Обновляем список торговцев
    return await getAllMerchants();
  } catch (error) {
    console.error('Ошибка при добавлении алхимических ингредиентов:', error);
    return merchantsArray;
  }
}

// Инициализация данных
async function initMerchantData() {
  try {
    merchants = await getAllMerchants();
    return merchants;
  } catch (error) {
    console.error('Ошибка при инициализации данных торговцев:', error);
    return merchants;
  }
}

// Инициализируем данные при импорте модуля
initMerchantData().catch(error => {
  console.error('Ошибка при инициализации данных торговцев:', error);
});

module.exports = {
  merchantTypes,
  merchantRarityLevels,
  merchants,
  getAllMerchants,
  getMerchantById,
  getMerchantsByLocation,
  getMerchantsBySpecialization,
  calculatePrice,
  restockMerchantItems,
  addEquipmentToMerchant,
  addAlchemyItemsToMerchants
};
