/**
 * Сервис для работы с торговцами
 * Обрабатывает запросы от API и взаимодействует с базой данных через ORM
 */

// Заменяем импорт unifiedDatabase на connectionProvider
const connectionProvider = require('../utils/connection-provider');
const { calculateMerchantDiscount, applyLoyaltyDiscount } = require('../utils/sectRelationshipSyncer');

// Константы для типов торговцев
const merchantTypes = {
  WEAPON_SMITH: 'weapon_smith',
  ARMOR_SMITH: 'armor_smith',
  ALCHEMIST: 'alchemist',
  GENERAL_GOODS: 'general_goods',
  SPIRIT_STONES: 'spirit_stones',
  HERBALIST: 'herbalist',
  PET_SUPPLIES: 'pet_supplies',
  FOOD_VENDOR: 'food_vendor',
  ARTIFACT_DEALER: 'artifact_dealer',
  TECHNIQUE_SCROLLS: 'technique_scrolls'
};

// Константы для уровней редкости торговцев
const merchantRarityLevels = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

// Кэш для хранения данных (для оптимизации)
let merchantsCache = [];
let merchantsById = {};

/**
 * Получает всех торговцев из базы данных
 * @returns {Promise<Array>} Массив торговцев
 */
exports.getAllMerchants = async function() {
  try {
    // Получаем экземпляр Sequelize через connectionProvider
    const { db } = await connectionProvider.getSequelizeInstance();
    
    // Получаем модели напрямую через Sequelize
    const Merchant = db.model('Merchant');
    const MerchantInventory = db.model('MerchantInventory');
    const MerchantReputation = db.model('MerchantReputation');
    
    // Загружаем всех торговцев с их связями
    const merchants = await Merchant.findAll({
      include: [
        { model: MerchantInventory, as: 'inventory' },
        { model: MerchantReputation, as: 'reputations' }
      ]
    });
    
    // Преобразуем в нужный формат для клиента
    const formattedMerchants = merchants.map(merchant => formatMerchant(merchant));
    
    // Обновляем кэш
    merchantsCache = formattedMerchants;
    merchantsById = formattedMerchants.reduce((acc, merchant) => {
      acc[merchant.id] = merchant;
      return acc;
    }, {});
    
    return formattedMerchants;
  } catch (error) {
    console.error('Ошибка при получении торговцев:', error);
    // В случае ошибки возвращаем кэшированные данные
    return merchantsCache;
  }
};

/**
 * Получает торговца по ID
 * @param {number} id - ID торговца
 * @returns {Promise<Object|null>} Торговец или null, если не найден
 */
exports.getMerchantById = async function(id) {
  try {
    // Проверяем, есть ли в кэше
    if (merchantsById[id]) {
      return merchantsById[id];
    }
    
    // Получаем экземпляр Sequelize через connectionProvider
    const { db } = await connectionProvider.getSequelizeInstance();
    
    // Получаем модели напрямую через Sequelize
    const Merchant = db.model('Merchant');
    const MerchantInventory = db.model('MerchantInventory');
    const MerchantReputation = db.model('MerchantReputation');
    
    // Загружаем торговца с его связями
    const merchant = await Merchant.findByPk(id, {
      include: [
        { model: MerchantInventory, as: 'inventory' },
        { model: MerchantReputation, as: 'reputations' }
      ]
    });
    
    if (!merchant) {
      return null;
    }
    
    // Преобразуем в нужный формат для клиента
    const formattedMerchant = formatMerchant(merchant);
    
    // Добавляем в кэш
    merchantsById[id] = formattedMerchant;
    
    return formattedMerchant;
  } catch (error) {
    console.error(`Ошибка при получении торговца с ID ${id}:`, error);
    // В случае ошибки проверяем кэш
    return merchantsById[id] || null;
  }
};

/**
 * Получает торговцев по специализации
 * @param {string} specialization - Специализация торговцев
 * @returns {Promise<Array>} Массив торговцев указанной специализации
 */
exports.getMerchantsByType = async function(specialization) {
  try {
    // Проверяем кэш для оптимизации
    if (merchantsCache.length > 0) {
      const cachedMerchants = merchantsCache.filter(merchant => merchant.specialization === specialization);
      if (cachedMerchants.length > 0) {
        return cachedMerchants;
      }
    }
    
    // Получаем экземпляр Sequelize через connectionProvider
    const { db } = await connectionProvider.getSequelizeInstance();
    
    // Получаем модели напрямую через Sequelize
    const Merchant = db.model('Merchant');
    const MerchantInventory = db.model('MerchantInventory');
    
    // Загружаем торговцев с их связями
    const merchants = await Merchant.findAll({
      where: { specialization },
      include: [
        { model: MerchantInventory, as: 'inventory' }
      ]
    });
    
    // Преобразуем в нужный формат для клиента
    return merchants.map(merchant => formatMerchant(merchant));
  } catch (error) {
    console.error(`Ошибка при получении торговцев специализации ${specialization}:`, error);
    // В случае ошибки фильтруем кэш
    return merchantsCache.filter(merchant => merchant.specialization === specialization);
  }
};

/**
 * Получает торговцев по локации
 * @param {string} location - Локация торговцев
 * @returns {Promise<Array>} Массив торговцев в указанной локации
 */
exports.getMerchantsByLocation = async function(location) {
  try {
    // Проверяем кэш для оптимизации
    if (merchantsCache.length > 0) {
      const cachedMerchants = merchantsCache.filter(merchant => merchant.location === location);
      if (cachedMerchants.length > 0) {
        return cachedMerchants;
      }
    }
    
    // Получаем экземпляр Sequelize через connectionProvider
    const { db } = await connectionProvider.getSequelizeInstance();
    
    // Получаем модели напрямую через Sequelize
    const Merchant = db.model('Merchant');
    const MerchantInventory = db.model('MerchantInventory');
    
    // Загружаем торговцев с их связями
    const merchants = await Merchant.findAll({
      where: { location },
      include: [
        { model: MerchantInventory, as: 'inventory' }
      ]
    });
    
    // Преобразуем в нужный формат для клиента
    return merchants.map(merchant => formatMerchant(merchant));
  } catch (error) {
    console.error(`Ошибка при получении торговцев в локации ${location}:`, error);
    // В случае ошибки фильтруем кэш
    return merchantsCache.filter(merchant => merchant.location === location);
  }
};

/**
 * Получает инвентарь торговца
 * @param {number} merchantId - ID торговца
 * @param {string} userId - ID пользователя для расчета скидок
 * @returns {Promise<Array>} Массив предметов в инвентаре торговца с учетом скидок
 */
exports.getMerchantInventory = async function(merchantId, userId) {
  try {
    // Получаем торговца
    const merchant = await exports.getMerchantById(merchantId);
    if (!merchant) {
      return [];
    }
    
    // Получаем экземпляр Sequelize через connectionProvider
    const { db } = await connectionProvider.getSequelizeInstance();
    
    // Получаем модели напрямую через Sequelize
    const MerchantInventory = db.model('MerchantInventory');
    const MerchantReputation = db.model('MerchantReputation');
    
    // Загружаем инвентарь торговца
    const inventory = await MerchantInventory.findAll({
      where: { merchantId }
    });
    
    // Загружаем репутацию пользователя с торговцем
    let discount = merchant.defaultDiscount || 0;
    if (userId) {
      const reputation = await MerchantReputation.findOne({
        where: { merchantId, userId }
      });
      
      if (reputation) {
        discount = reputation.discountRate;
      }
    }
    
    // Применяем скидки к ценам
    return inventory.map(item => {
      const itemData = item.get({ plain: true });
      const finalPrice = Math.floor(itemData.price * (1 - discount));
      
      return {
        ...itemData,
        basePrice: itemData.price,
        price: finalPrice,
        discount
      };
    });
  } catch (error) {
    console.error(`Ошибка при получении инвентаря торговца ${merchantId}:`, error);
    return [];
  }
};

/**
 * Обновляет инвентарь торговца
 * @param {number} merchantId - ID торговца
 * @returns {Promise<boolean>} Результат операции
 */
exports.restockMerchantItems = async function(merchantId) {
  try {
    // Получаем экземпляр Sequelize через connectionProvider
    const { db } = await connectionProvider.getSequelizeInstance();
    
    // Получаем модели напрямую через Sequelize
    const Merchant = db.model('Merchant');
    const MerchantInventory = db.model('MerchantInventory');
    
    // Проверяем существование торговца
    const merchant = await Merchant.findByPk(merchantId);
    if (!merchant) {
      return false;
    }
    
    // Получаем инвентарь торговца
    const inventory = await MerchantInventory.findAll({
      where: { merchantId }
    });
    
    // Обновляем каждый предмет
    const now = new Date();
    
    for (const item of inventory) {
      // Если время пополнения запасов наступило
      if (item.restockTime && new Date(item.restockTime) <= now) {
        // Обновляем количество и время следующего пополнения
        const nextRestockTime = new Date();
        nextRestockTime.setHours(nextRestockTime.getHours() + 24); // Пополнение раз в 24 часа
        
        await item.update({
          quantity: item.maxQuantity || 10, // Пополняем до максимального или до 10
          restockTime: nextRestockTime
        });
      }
    }
    
    // Обновляем кэш
    delete merchantsById[merchantId];
    
    return true;
  } catch (error) {
    console.error(`Ошибка при пополнении инвентаря торговца ${merchantId}:`, error);
    return false;
  }
};

/**
 * Покупка предмета у торговца
 * @param {number} merchantId - ID торговца
 * @param {number} itemId - ID предмета
 * @param {string} userId - ID пользователя
 * @param {number} quantity - Количество предметов для покупки
 * @returns {Promise<Object>} Результат операции
 */
exports.buyItemFromMerchant = async function(merchantId, itemId, userId, quantity = 1) {
  try {
    // Получаем экземпляр Sequelize через connectionProvider
    const { db } = await connectionProvider.getSequelizeInstance();
    
    // Получаем модели напрямую через Sequelize
    const MerchantInventory = db.model('MerchantInventory');
    const MerchantReputation = db.model('MerchantReputation');
    
    // Начинаем транзакцию
    const transaction = await db.transaction();
    
    try {
      // Находим предмет в инвентаре торговца
      const item = await MerchantInventory.findOne({
        where: { merchantId, id: itemId },
        transaction
      });
      
      if (!item) {
        await transaction.rollback();
        return { success: false, message: 'Предмет не найден в инвентаре торговца' };
      }
      
      // Проверяем, достаточно ли предметов
      if (item.quantity < quantity) {
        await transaction.rollback();
        return { success: false, message: 'Недостаточное количество предметов у торговца' };
      }
      
      // Получаем скидку для пользователя
      let discount = 0;
      if (userId) {
        const reputation = await MerchantReputation.findOne({
          where: { merchantId, userId },
          transaction
        });
        
        if (reputation) {
          discount = reputation.discountRate;
        }
      }
      
      // Рассчитываем итоговую цену
      const basePrice = item.price;
      const finalPrice = Math.floor(basePrice * (1 - discount) * quantity);
      
      // Обновляем количество предметов
      await item.decreaseQuantity(quantity);
      
      // Увеличиваем репутацию пользователя с торговцем
      if (userId) {
        await updateMerchantReputation(merchantId, userId, finalPrice * 0.01, transaction);
      }
      
      // Фиксируем транзакцию
      await transaction.commit();
      
      // Возвращаем информацию о покупке
      return {
        success: true,
        message: 'Покупка успешно совершена',
        item: {
          id: item.id,
          name: item.name,
          description: item.description,
          itemType: item.itemType,
          basePrice,
          finalPrice,
          quantity,
          totalPrice: finalPrice
        }
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error(`Ошибка при покупке предмета ${itemId} у торговца ${merchantId}:`, error);
    return { success: false, message: 'Произошла ошибка при покупке предмета' };
  }
};

/**
 * Продажа предмета торговцу
 * @param {number} merchantId - ID торговца
 * @param {Object} itemData - Данные о предмете
 * @param {string} userId - ID пользователя
 * @param {number} quantity - Количество предметов для продажи
 * @returns {Promise<Object>} Результат операции
 */
exports.sellItemToMerchant = async function(merchantId, itemData, userId, quantity = 1) {
  try {
    // Получаем экземпляр Sequelize через connectionProvider
    const { db } = await connectionProvider.getSequelizeInstance();
    
    // Получаем модели напрямую через Sequelize
    const Merchant = db.model('Merchant');
    const MerchantReputation = db.model('MerchantReputation');
    
    // Проверяем существование торговца
    const merchant = await Merchant.findByPk(merchantId);
    if (!merchant) {
      return { success: false, message: 'Торговец не найден' };
    }
    
    // Начинаем транзакцию
    const transaction = await db.transaction();
    
    try {
      // Рассчитываем цену продажи (обычно 50% от базовой)
      const sellPrice = Math.floor(itemData.basePrice * 0.5 * quantity);
      
      // Увеличиваем репутацию пользователя с торговцем
      if (userId) {
        await updateMerchantReputation(merchantId, userId, sellPrice * 0.01, transaction);
      }
      
      // Фиксируем транзакцию
      await transaction.commit();
      
      // Возвращаем информацию о продаже
      return {
        success: true,
        message: 'Продажа успешно совершена',
        item: {
          ...itemData,
          quantity,
          sellPrice
        }
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error(`Ошибка при продаже предмета торговцу ${merchantId}:`, error);
    return { success: false, message: 'Произошла ошибка при продаже предмета' };
  }
};

/**
 * Обновляет репутацию пользователя с торговцем
 * @param {number} merchantId - ID торговца
 * @param {string} userId - ID пользователя
 * @param {number} reputationChange - Изменение репутации
 * @param {Transaction} transaction - Транзакция Sequelize
 * @returns {Promise<Object>} Обновленная репутация
 * @private
 */
async function updateMerchantReputation(merchantId, userId, reputationChange, transaction) {
  try {
    // Получаем экземпляр Sequelize через connectionProvider
    const { db } = await connectionProvider.getSequelizeInstance();
    
    // Получаем модели напрямую через Sequelize
    const MerchantReputation = db.model('MerchantReputation');
    
    // Ищем существующую репутацию
    let reputation = await MerchantReputation.findOne({
      where: { merchantId, userId },
      transaction
    });
    
    // Если нет, создаем новую
    if (!reputation) {
      reputation = await MerchantReputation.create({
        merchantId,
        userId,
        reputationPoints: 0,
        discountRate: 0
      }, { transaction });
    }
    
    // Обновляем репутацию
    const newPoints = reputation.reputationPoints + reputationChange;
    
    // Рассчитываем новую скидку (например, 1% скидки за каждые 100 очков репутации, максимум 30%)
    const newDiscount = Math.min(0.3, Math.floor(newPoints / 100) * 0.01);
    
    // Обновляем запись
    await reputation.update({
      reputationPoints: newPoints,
      discountRate: newDiscount
    }, { transaction });
    
    return reputation;
  } catch (error) {
    console.error(`Ошибка при обновлении репутации с торговцем ${merchantId}:`, error);
    throw error;
  }
}

/**
 * Добавляет нового торговца
 * @param {Object} merchantData - Данные о торговце
 * @returns {Promise<Object>} Созданный торговец
 */
exports.addMerchant = async function(merchantData) {
  try {
    // Получаем экземпляр Sequelize через connectionProvider
    const { db } = await connectionProvider.getSequelizeInstance();
    
    // Получаем модели напрямую через Sequelize
    const Merchant = db.model('Merchant');
    
    // Создаем нового торговца
    const merchant = await Merchant.create({
      name: merchantData.name,
      description: merchantData.description,
      location: merchantData.location,
      specialization: merchantData.specialization,
      image: merchantData.image,
      rarity: merchantData.rarity || merchantRarityLevels.COMMON,
      defaultDiscount: merchantData.defaultDiscount || 0
    });
    
    // Добавляем товары в инвентарь, если они предоставлены
    if (merchantData.inventory && merchantData.inventory.length > 0) {
      // Получаем модель для инвентаря
      const MerchantInventory = db.model('MerchantInventory');
      
      // Добавляем каждый товар
      for (const item of merchantData.inventory) {
        await MerchantInventory.create({
          merchantId: merchant.id,
          name: item.name,
          description: item.description,
          price: item.price,
          quantity: item.quantity || 10,
          maxQuantity: item.maxQuantity || item.quantity || 10,
          itemType: item.itemType,
          itemStats: item.itemStats || {},
          restockTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // Через 24 часа
        });
      }
    }
    
    // Возвращаем созданного торговца
    return exports.getMerchantById(merchant.id);
  } catch (error) {
    console.error('Ошибка при добавлении нового торговца:', error);
    throw error;
  }
};

/**
 * Обновляет данные торговца
 * @param {number} id - ID торговца
 * @param {Object} updates - Данные для обновления
 * @returns {Promise<Object|null>} Обновленный торговец или null, если не найден
 */
exports.updateMerchant = async function(id, updates) {
  try {
    // Получаем экземпляр Sequelize через connectionProvider
    const { db } = await connectionProvider.getSequelizeInstance();
    
    // Получаем модели напрямую через Sequelize
    const Merchant = db.model('Merchant');
    
    // Находим торговца
    const merchant = await Merchant.findByPk(id);
    if (!merchant) {
      return null;
    }
    
    // Обновляем данные
    await merchant.update({
      name: updates.name !== undefined ? updates.name : merchant.name,
      description: updates.description !== undefined ? updates.description : merchant.description,
      location: updates.location !== undefined ? updates.location : merchant.location,
      specialization: updates.specialization !== undefined ? updates.specialization : merchant.specialization,
      image: updates.image !== undefined ? updates.image : merchant.image,
      rarity: updates.rarity !== undefined ? updates.rarity : merchant.rarity,
      defaultDiscount: updates.defaultDiscount !== undefined ? updates.defaultDiscount : merchant.defaultDiscount
    });
    
    // Удаляем из кэша
    delete merchantsById[id];
    merchantsCache = merchantsCache.filter(m => m.id !== id);
    
    // Возвращаем обновленного торговца
    return exports.getMerchantById(id);
  } catch (error) {
    console.error(`Ошибка при обновлении торговца с ID ${id}:`, error);
    return null;
  }
};

/**
 * Преобразует торговца в формат для клиента
 * @param {Object} merchant - Объект торговца из базы данных
 * @returns {Object} Торговец в формате для клиента
 * @private
 */
function formatMerchant(merchant) {
  // Преобразуем объект в чистый JS-объект
  const plainMerchant = merchant.get ? merchant.get({ plain: true }) : merchant;
  
  return {
    id: plainMerchant.id,
    name: plainMerchant.name,
    description: plainMerchant.description,
    location: plainMerchant.location,
    specialization: plainMerchant.specialization,
    image: plainMerchant.image,
    rarity: plainMerchant.rarity,
    defaultDiscount: plainMerchant.defaultDiscount,
    inventory: plainMerchant.inventory ? plainMerchant.inventory.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      quantity: item.quantity,
      itemType: item.itemType,
      itemStats: item.itemStats
    })) : []
  };
}

// Экспортируем константы
exports.merchantTypes = merchantTypes;
exports.merchantRarityLevels = merchantRarityLevels;