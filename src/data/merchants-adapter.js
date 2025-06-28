/**
 * Адаптер для выбора подходящего источника данных о торговцах
 * Обновленная версия без циклических зависимостей, использующая напрямую API
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем константы из общего файла
const { merchantTypes, merchantRarityLevels } = require('./merchant-constants');

// Импортируем API напрямую
const MerchantAPI = require('../services/merchant-api');

// Для управления кэшем торговцев
let merchantsCache = [];

// Создаем объект с нужными методами
const Merchants = {
  merchantTypes,
  merchantRarityLevels,
  merchants: merchantsCache,
  
  // Функция для получения всех торговцев
  getAllMerchants: async function(userId) { // Добавляем userId
    try {
      const merchants = await MerchantAPI.getAllMerchants(userId); // Передаем userId в API
      merchantsCache = merchants;
      return merchants;
    } catch (error) {
      console.error('Ошибка при получении торговцев через API:', error);
      return merchantsCache;
    }
  },
  
  // Функция для получения торговца по ID
  getMerchantById: async function(id) {
    try {
      // Проверяем кэш сначала
      if (merchantsCache.length > 0) {
        const merchant = merchantsCache.find(m => m.id === id);
        if (merchant) return merchant;
      }
      
      // Если в кэше нет, обновляем кэш
      await this.getAllMerchants();
      return merchantsCache.find(m => m.id === id) || null;
    } catch (error) {
      console.error(`Ошибка при получении торговца с ID ${id}:`, error);
      return merchantsCache.find(m => m.id === id) || null;
    }
  },
  
  // Функция для получения торговцев по типу (специализации)
  getMerchantsByType: async function(specialization) {
    try {
      // Если кэш пуст, обновляем его
      if (merchantsCache.length === 0) {
        await this.getAllMerchants();
      }
      
      return merchantsCache.filter(m => m.specialization === specialization);
    } catch (error) {
      console.error(`Ошибка при получении торговцев по типу ${specialization}:`, error);
      return merchantsCache.filter(m => m.specialization === specialization);
    }
  },
  
  // Функция для получения торговцев по локации
  getMerchantsByLocation: async function(location) {
    try {
      // Если кэш пуст, обновляем его
      if (merchantsCache.length === 0) {
        await this.getAllMerchants();
      }
      
      return merchantsCache.filter(m => m.location === location);
    } catch (error) {
      console.error(`Ошибка при получении торговцев по локации ${location}:`, error);
      return merchantsCache.filter(m => m.location === location);
    }
  },
  
  // Заглушки для методов, которые пока не реализованы через API
  getMerchantInventory: async function() { return []; },
  getMerchantDiscount: async function() { return 0; },
  restockMerchantItems: async function() { return true; }
};

// Экспортируем по умолчанию весь объект для совместимости с require
module.exports = Merchants;

// Для обратной совместимости добавляем явные экспорты
module.exports.merchantTypes = merchantTypes;
module.exports.merchantRarityLevels = merchantRarityLevels;
module.exports.merchants = merchantsCache;
module.exports.getAllMerchants = Merchants.getAllMerchants;
module.exports.getMerchantById = Merchants.getMerchantById;
module.exports.getMerchantsByType = Merchants.getMerchantsByType;
module.exports.getMerchantsByLocation = Merchants.getMerchantsByLocation;
module.exports.getMerchantInventory = Merchants.getMerchantInventory;
module.exports.getMerchantDiscount = Merchants.getMerchantDiscount;
module.exports.restockMerchantItems = Merchants.restockMerchantItems;
module.exports.initMerchantData = async function() {
  await Merchants.getAllMerchants();
  return merchantsCache;
};