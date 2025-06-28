/**
 * Сервис для работы с торговцами
 * Обрабатывает запросы от API и взаимодействует с базой данных через ORM
 * Обновленная версия без циклических зависимостей
 */

// Импортируем реестр моделей и базу данных
const connectionProvider = require('../utils/connection-provider');
const modelRegistry = require('../models/registry');
const { calculateMerchantDiscount, applyLoyaltyDiscount } = require('../utils/sectRelationshipSyncer');
const { sequelize } = require('../services/database'); // Импортируем sequelize для транзакций
const InventoryService = require('./inventory-service'); // Импортируем сервис инвентаря для обновления инвентаря пользователя
const ItemImage = require('../models/item-image');
// Импортируем константы из общего файла
const { merchantTypes, merchantRarityLevels } = require('../data/merchant-constants');
const { checkItemRequirements } = require('./equipment-service');

// Кэш для хранения данных (для оптимизации)
let merchantsCache = [];
let merchantsById = {};

/**
 * Получает всех торговцев из базы данных
 * @returns {Promise<Array>} Массив торговцев
 */
exports.getAllMerchants = async function() {
  try {
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модели через реестр
    const Merchant = modelRegistry.getModel('Merchant');
    const MerchantInventory = modelRegistry.getModel('MerchantInventory');
    const MerchantReputation = modelRegistry.getModel('MerchantReputation');
    
    // Загружаем всех торговцев с их связями, явно указывая атрибуты
    const merchants = await Merchant.findAll({
      include: [
        { model: MerchantInventory, as: 'inventory' },
        { model: MerchantReputation, as: 'reputations' }
      ],
      // Явно указываем атрибуты для выборки, чтобы избежать неявных присоединений
      attributes: ['id', 'name', 'description', 'location', 'specialization',
                  'image', 'defaultDiscount', 'createdAt', 'updatedAt']
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
    
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модели через реестр
    const Merchant = modelRegistry.getModel('Merchant');
    const MerchantInventory = modelRegistry.getModel('MerchantInventory');
    const MerchantReputation = modelRegistry.getModel('MerchantReputation');
    
    // Загружаем торговца с его связями, явно указывая атрибуты
    const merchant = await Merchant.findByPk(id, {
      include: [
        { model: MerchantInventory, as: 'inventory' },
        { model: MerchantReputation, as: 'reputations' }
      ],
      // Явно указываем атрибуты для выборки, чтобы избежать неявных присоединений
      attributes: ['id', 'name', 'description', 'location', 'specialization',
                  'image', 'defaultDiscount', 'createdAt', 'updatedAt']
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
    
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модели через реестр
    const Merchant = modelRegistry.getModel('Merchant');
    const MerchantInventory = modelRegistry.getModel('MerchantInventory');
    
    // Загружаем торговцев с их связями, явно указывая атрибуты
    const merchants = await Merchant.findAll({
      where: { specialization },
      include: [
        { model: MerchantInventory, as: 'inventory' }
      ],
      // Явно указываем атрибуты для выборки, чтобы избежать неявных присоединений
      attributes: ['id', 'name', 'description', 'location', 'specialization',
                  'image', 'defaultDiscount', 'createdAt', 'updatedAt']
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
    
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модели через реестр
    const Merchant = modelRegistry.getModel('Merchant');
    const MerchantInventory = modelRegistry.getModel('MerchantInventory');
    
    // Загружаем торговцев с их связями, явно указывая атрибуты
    const merchants = await Merchant.findAll({
      where: { location },
      include: [
        { model: MerchantInventory, as: 'inventory' }
      ],
      // Явно указываем атрибуты для выборки, чтобы избежать неявных присоединений
      attributes: ['id', 'name', 'description', 'location', 'specialization',
                  'image', 'defaultDiscount', 'createdAt', 'updatedAt']
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
    // Проверяем, что userId предоставлен
    if (!userId) {
      throw new Error('User ID is required to fetch merchant inventory');
    }

    // Получаем торговца
    const merchant = await exports.getMerchantById(merchantId);
    if (!merchant) {
      return [];
    }
    
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модели через реестр
    const MerchantInventory = modelRegistry.getModel('MerchantInventory');
    const MerchantReputation = modelRegistry.getModel('MerchantReputation');
    const InventoryService = require("./inventory-service");
    
    // Загружаем инвентарь торговца для конкретного пользователя
    const inventory = await MerchantInventory.findAll({
      where: { merchantId, userId }
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
    // Возврат с "обогащением"
    const merchantPromises = inventory.map(async (item) => {
      let item_image = await ItemImage.findByPk(item.itemId);

      if (item_image !== null){
        item.dataValues.image_url = item_image.image_url;
      }
      const itemDetails = await InventoryService.getItemDetails(item.itemId);
      const itemData = item.get({ plain: true });
      // Применяем скидки к ценам
      const finalPrice = Math.floor(itemData.price * (1 - discount));

      return { 
        ...itemDetails.item,
        ...itemData,
        basePrice: itemData.price,
        price: finalPrice,
        discount
      };
      
    }); 
    const merchant_inventory = Promise.all(merchantPromises);
   // console.log(await merchant_inventory);
    return merchant_inventory;
    // Применяем скидки к ценам
    /*return inventory.map(item => {
      const itemData = item.get({ plain: true });
      console.log(itemData);
      const finalPrice = Math.floor(itemData.price * (1 - discount));
      console.log({
        ...itemData,
        basePrice: itemData.price,
        price: finalPrice,
        discount
      });
      return {
        ...itemData,
        basePrice: itemData.price,
        price: finalPrice,
        discount
      };
    });*/

    
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
exports.restockMerchantItems = async function(merchantId, userId) {
  try {
    // Проверяем, что userId предоставлен
    if (!userId) {
      throw new Error('User ID is required to restock merchant items');
    }
    
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модели через реестр
    const Merchant = modelRegistry.getModel('Merchant');
    const MerchantInventory = modelRegistry.getModel('MerchantInventory');
    
    // Проверяем существование торговца
    const merchant = await Merchant.findByPk(merchantId);
    if (!merchant) {
      return false;
    }
    
    // Получаем инвентарь торговца для конкретного пользователя
    const inventory = await MerchantInventory.findAll({
      where: { merchantId, userId }
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
    // Проверяем, что userId предоставлен
    if (!userId) {
      throw new Error('User ID is required to buy items from merchant');
    }
    
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модели через реестр
    const MerchantInventory = modelRegistry.getModel('MerchantInventory');
    const MerchantReputation = modelRegistry.getModel('MerchantReputation');
    
    // Получаем экземпляр sequelize из connectionProvider для гарантии инициализации
    const connection = await connectionProvider.getSequelizeInstance();
    const sequelizeInstance = connection.db;
    
    // Начинаем транзакцию, используя гарантированно инициализированный экземпляр
    const transaction = await sequelizeInstance.transaction();
    
    try {
      // Находим предмет в инвентаре торговца для конкретного пользователя
      const item = await MerchantInventory.findOne({
        where: { merchantId, item_id: itemId, userId },
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
        try {
          console.log(`Начинаем обновление репутации при покупке: merchantId=${merchantId}, userId=${userId}, цена=${finalPrice}`);
          await updateMerchantReputation(merchantId, userId, finalPrice * 0.01, transaction);
        } catch (repError) {
          console.error(`Ошибка при обновлении репутации: ${repError.message}`);
          // Продолжаем выполнение, не прерывая основную транзакцию покупки
        }
      }
      
      // Подготовка данных для добавления в инвентарь пользователя
      const itemForInventory = {
        item_id: item.itemId, // Используем item_id вместо id
        name: item.name,
        type: item.itemType,
        description: item.description,
        rarity: item.rarity,
        quantity: quantity,
        stats: item.stats || {},
        price: item.price
      };
      
      // Добавляем предмет в инвентарь пользователя
      const inventoryResult = await InventoryService.addInventoryItem(userId, itemForInventory);
      
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
        },
        inventoryUpdated: true,
        inventoryItem: inventoryResult
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
    // Проверяем, что userId предоставлен
    if (!userId) {
      throw new Error('User ID is required to sell items to merchant');
    }
    
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модели через реестр
    const Merchant = modelRegistry.getModel('Merchant');
    const MerchantReputation = modelRegistry.getModel('MerchantReputation');
    
    // Проверяем существование торговца
    const merchant = await Merchant.findByPk(merchantId);
    if (!merchant) {
      return { success: false, message: 'Торговец не найден' };
    }
    
    // Получаем экземпляр sequelize из connectionProvider для гарантии инициализации
    const connection = await connectionProvider.getSequelizeInstance();
    const sequelizeInstance = connection.db;
    
    // Начинаем транзакцию, используя гарантированно инициализированный экземпляр
    const transaction = await sequelizeInstance.transaction();
    
    try {
      // Проверяем наличие предмета в инвентаре пользователя
      // и его достаточное количество
      const itemId = itemData.item_id || itemData.itemId || itemData.id; // Пробуем все возможные поля
      const inventoryCheck = await InventoryService.checkInventoryItem(userId, itemId, quantity);
      if (!inventoryCheck.success) {
        await transaction.rollback();
        return inventoryCheck; // Возвращаем ошибку проверки инвентаря
      }
      
      // Рассчитываем цену продажи (обычно 50% от базовой)
      const sellPrice = Math.floor(itemData.basePrice * 0.5 * quantity);
      
      // Увеличиваем репутацию пользователя с торговцем
      if (userId) {
        try {
          console.log(`Начинаем обновление репутации при продаже: merchantId=${merchantId}, userId=${userId}, цена=${sellPrice}`);
          await updateMerchantReputation(merchantId, userId, sellPrice * 0.01, transaction);
        } catch (repError) {
          console.error(`Ошибка при обновлении репутации: ${repError.message}`);
          // Продолжаем выполнение, не прерывая основную транзакцию продажи
        }
      }
      
      // Удаляем предмет из инвентаря пользователя
      const removeResult = await InventoryService.removeInventoryItem(userId, itemId, quantity);
      if (!removeResult) {
        await transaction.rollback();
        return { success: false, message: 'Ошибка при удалении предмета из инвентаря' };
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
        },
        inventoryUpdated: true
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
 * Обновляет количество предмета у торговца для конкретного пользователя
 * @param {number} merchantId - ID торговца
 * @param {string} itemId - ID предмета
 * @param {string} userId - ID пользователя
 * @param {number} quantity - Количество для изменения
 * @param {string} action - Тип операции: 'set', 'add', 'subtract'
 * @returns {Promise<Object>} Результат операции и обновленные данные
 */
exports.updateMerchantItemQuantity = async function(merchantId, itemId, userId, quantity, action = 'set') {
  try {
    // Проверяем аргументы
    if (!merchantId || !itemId || !userId) {
      throw new Error('Необходимы merchantId, itemId и userId');
    }
    
    console.log(`updateMerchantItemQuantity: Получены аргументы: merchantId=${merchantId} (${typeof merchantId}), itemId=${itemId} (${typeof itemId}), userId=${userId}, quantity=${quantity}, action=${action}`);
    
    // Инициализируем реестр моделей
    await modelRegistry.initializeRegistry();
    
    // Получаем экземпляр sequelize из connectionProvider для гарантии инициализации
    const connection = await connectionProvider.getSequelizeInstance();
    const sequelizeInstance = connection.db;
    
    // Получаем модель через реестр
    const MerchantInventory = modelRegistry.getModel('MerchantInventory');
    
    // Начинаем транзакцию, используя гарантированно инициализированный экземпляр
    const transaction = await sequelizeInstance.transaction();
    
    try {
      console.log(`updateMerchantItemQuantity: вызов для merchantId=${merchantId}, itemId=${itemId}, action=${action}, quantity=${quantity}`);
      console.log(`Тип для merchantId: ${typeof merchantId}, тип для itemId: ${typeof itemId}, значение: ${itemId}`);
      
      // Проверяем, строковый ли идентификатор предмета
      const isStringItemId = typeof itemId === 'string' && isNaN(parseInt(itemId, 10));
      let numericItemId = itemId;
      
      // Специальная обработка для известных проблемных предметов
      const knownItems = {
        // Таблетки и эликсиры
        'basic_pill': 1001,
        'breakthrough_pill': 1002,
        'mental_calm_pill': 1003,
        
        // Травы и ингредиенты
        'uncommon_herb': 2001,
        'common_herb_low': 2002,
        'common_herb': 2003,
        'jade_essence': 2004,
        'spirit_core': 2005,
        
        // Еда для питомцев
        'basic_pet_food': 3001,
        'improved_pet_food': 3002,
        'deluxe_pet_food': 3003,
        
        // Оружие
        'bronze_sword': 4001,
        'iron_sword': 4002,
        'east_wind_blade': 4003,
        
        // Одежда и броня
        'linen_robe': 5001,
        'steel_breastplate': 5002,
        'cultivator_silk_robe': 5003
      };
      
      // Если itemId строковый (не числовой), проверяем известные предметы
      if (isStringItemId) {
        console.log(`Получен строковый идентификатор предмета: ${itemId}, попытка найти числовой ID`);
        
        // Проверяем в нашем словаре известных предметов
        if (knownItems[itemId]) {
          numericItemId = knownItems[itemId];
          console.log(`Найден предустановленный ID ${numericItemId} для строкового идентификатора ${itemId}`);
        } else {
          // Получаем модель InventoryItem для поиска числового ID
          const InventoryItem = modelRegistry.getModel('InventoryItem');
        
        if (InventoryItem) {
          const item = await InventoryItem.findOne({
            where: {
              itemId: itemId // В InventoryItem это поле фактически строка, а не число
            },
            transaction
          });
          
          if (item) {
            numericItemId = item.id;
            console.log(`Найден числовой ID ${numericItemId} для строкового идентификатора ${itemId}`);
          } else {
            console.log(`Не найден предмет с кодом ${itemId} в таблице InventoryItem`);
          }
        } else {
          console.log('Модель InventoryItem недоступна для поиска числового ID');
        }
      }
      
      // Находим запись в инвентаре торговца (без учета userId)
      // Преобразуем itemId в строковое значение для соответствия типу в базе данных
      // item_id в базе данных имеет тип character varying(100)
      const itemIdForDb = typeof itemId === 'string' ? itemId : String(itemId);
      
      console.log(`Поиск записи в базе данных с itemId=${itemIdForDb} (${typeof itemIdForDb})`);
      
      let inventoryItem = await MerchantInventory.findOne({
        where: {
          merchantId,
          itemId: itemIdForDb
        },
        transaction
      });
      
      if (!inventoryItem) {
        // Вместо ошибки, получаем информацию о торговце и предмете
        const Merchant = modelRegistry.getModel('Merchant');
        const merchant = await Merchant.findByPk(merchantId, { transaction });
        
        if (!merchant) {
          await transaction.rollback();
          return {
            success: false,
            message: 'Торговец не найден'
          };
        }
        
        // Получаем информацию о предмете, если была найдена
        let itemDetails = {
          itemType: 'item',
          name: `Item ${itemId}`,
          description: 'Generated item',
          rarity: 'common',
          price: 100
        };
        
        // Если у нас есть данные о предмете из InventoryItem, используем их
        if (isStringItemId && InventoryItem) {
          try {
            const detailedItem = await InventoryItem.findOne({
              where: { itemId: itemId },
              transaction
            });
            
            if (detailedItem) {
              itemDetails = {
                itemType: detailedItem.type || 'item',
                name: detailedItem.name || `Item ${itemId}`,
                description: detailedItem.description || 'No description',
                rarity: detailedItem.rarity || 'common',
                price: detailedItem.basePrice || detailedItem.price || 100
              };
              console.log(`Получены детали предмета для ${itemId}:`, itemDetails);
            }
          } catch (error) {
            console.error(`Ошибка при получении деталей предмета ${itemId}:`, error);
          }
        }
        
        // Если мы не смогли найти нормализованный ID для строкового идентификатора,
        // используем сам строковый идентификатор или создаем новый
        
        // Проверяем, нужно ли генерировать ID (если не нашли в knownItems и не нашли в InventoryItem)
        if (isStringItemId && typeof numericItemId === 'string') {
          console.log(`Не удалось найти ID для ${itemId} в базе данных или в словаре известных предметов`);
          
          // В таблице теперь используются строковые ID, поэтому мы можем использовать исходный ID
          numericItemId = itemId;
          
          // Для генерических предметов можем создать более читаемые идентификаторы
          // Сначала проверяем конкретные подстроки в порядке специфичности
          if (itemId.includes('common_herb_low')) {
            numericItemId = 'common_herb_low';
            console.log(`Предмет ${itemId} определен как common_herb_low`);
          }
          else if (itemId.includes('common_herb')) {
            numericItemId = 'common_herb';
            console.log(`Предмет ${itemId} определен как common_herb`);
          }
          else if (itemId.includes('uncommon_herb')) {
            numericItemId = 'uncommon_herb';
            console.log(`Предмет ${itemId} определен как uncommon_herb`);
          }
          // Затем проверяем более общие категории
          else if (itemId.includes('herb')) {
            numericItemId = `herb_${Date.now().toString(36)}`;
            console.log(`Предмет ${itemId} определен как трава (herb), назначен ID: ${numericItemId}`);
          }
          else if (itemId.includes('pill')) {
            numericItemId = `pill_${Date.now().toString(36)}`;
            console.log(`Предмет ${itemId} определен как таблетка (pill), назначен ID: ${numericItemId}`);
          }
          else if (itemId.includes('pet_food')) {
            numericItemId = `pet_food_${Date.now().toString(36)}`;
            console.log(`Предмет ${itemId} определен как еда для питомцев (pet_food), назначен ID: ${numericItemId}`);
          }
          else if (itemId.includes('sword') || itemId.includes('blade')) {
            numericItemId = `weapon_${Date.now().toString(36)}`;
            console.log(`Предмет ${itemId} определен как оружие (sword/blade), назначен ID: ${numericItemId}`);
          }
          else if (itemId.includes('robe') || itemId.includes('plate')) {
            numericItemId = `armor_${Date.now().toString(36)}`;
            console.log(`Предмет ${itemId} определен как броня/одежда (robe/plate), назначен ID: ${numericItemId}`);
          } else {
            // Для всех остальных - генерируем читаемый ID
            numericItemId = `item_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`;
            console.log(`Сгенерирован строковый ID ${numericItemId} для идентификатора ${itemId}`);
          }
        }
        
        try {
          // Обрабатываем ID предмета для сохранения в БД
          let finalItemId;
          
          // После обновления базы данных мы используем строковые ID напрямую
          // без преобразования в числовые
          if (typeof numericItemId === 'string') {
            // Строковый ID, нормализуем его
            finalItemId = String(numericItemId);
            
            // Специальная обработка для миграции - преобразуем устаревшие названия
            // в новые форматы строковых ID
            if (numericItemId === 'basic_pill') {
              finalItemId = 'basic_cultivation_manual';
            } else if (numericItemId === 'mental_calm_pill') {
              finalItemId = 'mind_calming_pill';
            } else if (numericItemId === 'east_wind_blade') {
              finalItemId = 'eastern_wind_blade';
            }
            
            console.log(`Используем строковый ID: ${finalItemId}`);
          } else {
            // Если это число - преобразуем его в строку
            finalItemId = String(numericItemId);
            console.log(`Преобразуем числовой ID в строку: ${finalItemId}`);
          }
          
          console.log(`Создаем новую запись в инвентаре торговца ${merchantId} с ID предмета: ${finalItemId} (исходный: ${itemId})`);
          
          // Перед созданием проверяем, нет ли уже такой записи с точными параметрами
          // Преобразуем itemId в строку для соответствия типу character varying в базе данных
          const itemIdForDb = String(finalItemId);
          console.log(`Поиск существующей записи с merchant_id=${merchantId}, item_id=${itemIdForDb} (${typeof itemIdForDb})`);
          
          const existingItem = await MerchantInventory.findOne({
            where: {
              merchantId: merchantId,
              itemId: itemIdForDb
            },
            transaction
          });
          
          if (existingItem) {
            console.log(`Найдена существующая запись для merchantId=${merchantId}, itemId=${finalItemId}`);
            inventoryItem = existingItem;
          } else {
            // Создаем новую запись с полученными или дефолтными данными
            try {
              // Преобразуем itemId в строку для соответствия типу в базе данных
              const itemIdForDb = String(finalItemId);
              console.log(`Создание новой записи с merchant_id=${merchantId}, item_id=${itemIdForDb} (${typeof itemIdForDb})`);
              
              const newItem = await MerchantInventory.create({
                merchantId,
                itemId: itemIdForDb,  // Используем строковое представление ID
                ...itemDetails,
                quantity: 0 // Начальное количество
              }, { transaction });
              
              console.log(`Успешно создана новая запись с ID: ${newItem.id}`);
              inventoryItem = newItem;
            } catch (createError) {
              console.error(`Ошибка при создании записи в инвентаре торговца:`, createError);
              
              // Преобразуем itemId в строку для соответствия типу в базе данных
              const itemIdForDb = String(finalItemId);
              console.log(`Запасной вариант: создание записи с merchant_id=${merchantId}, item_id=${itemIdForDb} (${typeof itemIdForDb})`);
              
              // В случае ошибки, пробуем создать с минимальным набором параметров
              const fallbackItem = await MerchantInventory.create({
                merchantId: merchantId,
                itemId: itemIdForDb,  // Используем строковое представление ID
                itemType: 'item',
                name: `Item ${finalItemId}`,
                description: 'Auto-generated item',
                rarity: 'common',
                quantity: 0,
                price: 100
              }, { transaction });
              
              console.log(`Создана запасная запись с ID: ${fallbackItem.id}`);
              inventoryItem = fallbackItem;
            }
          }
        } catch (outerError) {
          console.error(`Критическая ошибка при обработке инвентаря:`, outerError);
          await transaction.rollback();
          return {
            success: false,
            message: `Критическая ошибка при обработке инвентаря: ${outerError.message}`
          };
        }
        
        // Используем созданную запись для обновления
        inventoryItem = newItem;
      }
      
      // Вывод текущего состояния предмета перед изменением
      console.log(`Текущее количество предмета ${inventoryItem.name} (ID: ${inventoryItem.itemId}): ${inventoryItem.quantity}`);
      console.log(`Запрошенное действие: ${action}, количество: ${quantity}`);

      // Определяем новое количество в зависимости от действия
      let newQuantity;
      switch (action) {
        case 'set':
          console.log(`Установка точного количества: ${quantity}`);
          newQuantity = quantity;
          break;
        case 'add':
          console.log(`Добавление ${quantity} к текущему количеству ${inventoryItem.quantity}`);
          newQuantity = inventoryItem.quantity + quantity;
          break;
        case 'subtract':
          console.log(`Вычитание ${quantity} из текущего количества ${inventoryItem.quantity}`);
          newQuantity = inventoryItem.quantity - quantity;
          
          // Предотвращаем отрицательное количество
          if (newQuantity < 0) {
            console.log(`Предотвращение отрицательного количества: было ${newQuantity}, устанавливаем 0`);
            newQuantity = 0;
          }
          break;
        default:
          console.error(`Неизвестное действие: ${action}`);
          await transaction.rollback();
          return {
            success: false,
            message: 'Неизвестное действие. Используйте set, add или subtract'
          };
      }
      
      try {
        // Обновляем запись
        console.log(`Обновляем количество предмета ${inventoryItem.name} (ID: ${inventoryItem.itemId}) с ${inventoryItem.quantity} на ${newQuantity}`);
        
        await inventoryItem.update({
          quantity: newQuantity
        }, { transaction });
        
        // Фиксируем транзакцию
        await transaction.commit();
        console.log(`Транзакция успешно завершена. Новое количество: ${newQuantity}`);
      } catch (updateError) {
        console.error(`Ошибка при обновлении количества:`, updateError);
        await transaction.rollback();
        return {
          success: false,
          message: `Ошибка при обновлении количества предмета: ${updateError.message}`
        };
      }
      
      try {
        // Получаем обновленные данные для всех предметов этого торговца
        console.log(`Получаем актуальный список предметов торговца ${merchantId} после обновления`);
        const updatedItems = await MerchantInventory.findAll({
          where: { merchantId }
        });
        
        console.log(`Найдено ${updatedItems.length} предметов в инвентаре торговца ${merchantId}`);
        
        // Формируем человекочитаемое сообщение об операции
        const actionText = action === 'set' ? 'установлено' :
                          action === 'add' ? 'увеличено' : 'уменьшено';
        
        const plainItem = inventoryItem.get({ plain: true });
        
        // Возвращаем результат с дополнительной информацией
        return {
          success: true,
          message: `Количество предмета успешно ${actionText}`,
          item: plainItem,
          updatedItems: updatedItems.map(item => item.get({ plain: true })),
          // Дополнительные поля для диагностики и информации
          details: {
            previousQuantity: inventoryItem.quantity !== newQuantity ?
                             inventoryItem.quantity - (action === 'add' ? quantity :
                                                     (action === 'subtract' ? -quantity : 0)) :
                             inventoryItem.quantity,
            newQuantity: newQuantity,
            itemName: plainItem.name,
            itemId: plainItem.itemId,
            merchantId: merchantId,
            action: action,
            timestamp: new Date().toISOString()
          }
        };
      } catch (listError) {
        console.error('Ошибка при получении списка обновленных предметов:', listError);
        
        // Даже если не удалось получить полный список, вернем успешный результат с текущим предметом
        return {
          success: true,
          message: `Количество предмета успешно обновлено, но возникла ошибка при получении полного списка`,
          item: inventoryItem.get({ plain: true }),
          error: listError.message
        };
      }
    } 
  } catch (error) {
    console.error(`Ошибка при обновлении количества предмета ${itemId} у торговца ${merchantId}:`, error);
    
    // Классифицируем типы ошибок для более понятных сообщений пользователю
    let userMessage = 'Произошла ошибка при обновлении количества предмета';
    let errorType = 'UNKNOWN_ERROR';
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      userMessage = 'Запись с такими параметрами уже существует';
      errorType = 'UNIQUE_CONSTRAINT';
    } else if (error.name === 'SequelizeForeignKeyConstraintError') {
      userMessage = 'Ссылка на несуществующий объект (торговец или предмет не найдены)';
      errorType = 'FOREIGN_KEY_CONSTRAINT';
    } else if (error.name === 'SequelizeValidationError') {
      userMessage = 'Неверные данные для обновления записи';
      errorType = 'VALIDATION_ERROR';
    } else if (error.message.includes('недостаточное количество')) {
      userMessage = `Недостаточное количество предметов в инвентаре торговца`;
      errorType = 'INSUFFICIENT_QUANTITY';
    } else if (error.message.includes('merchantId')) {
      userMessage = `Проблема с идентификатором торговца: ${error.message}`;
      errorType = 'MERCHANT_ID_ERROR';
    } else if (error.message.includes('itemId')) {
      userMessage = `Проблема с идентификатором предмета: ${error.message}`;
      errorType = 'ITEM_ID_ERROR';
    }
    
    return {
      success: false,
      message: userMessage,
      error: error.message,
      errorType: errorType,
      details: {
        itemId: itemId,
        merchantId: merchantId,
        action: action,
        quantity: quantity,
        errorName: error.name || 'Unknown',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    };
  } 
} catch (error){console.error(error);}
};

/**
 * Обновляет инвентарь торговца (алиас для updateMerchantItemQuantity)
 * @param {number} merchantId - ID торговца
 * @param {string} itemId - ID предмета
 * @param {string} userId - ID пользователя
 * @param {number} quantity - Количество для изменения
 * @param {string} action - Тип операции: 'set', 'add', 'subtract'
 * @returns {Promise<Object>} Результат операции и обновленные данные
 */
exports.updateMerchantInventory = async function(merchantId, itemId, userId, quantity, action = 'set') {
  return exports.updateMerchantItemQuantity(merchantId, itemId, userId, quantity, action);
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
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модели через реестр
    const MerchantReputation = modelRegistry.getModel('MerchantReputation');
    
    // Ищем существующую репутацию
    let reputation = await MerchantReputation.findOne({
      where: { merchantId, userId },
      transaction
    });
    
    // Если репутация не найдена, создаем новую запись
    if (!reputation) {
      reputation = await MerchantReputation.create({
        merchantId,
        userId,
        level: 0,
        points: 0,
        discountRate: 0
      }, { transaction });
    }
    
    // Рассчитываем новые значения репутации
    const newPoints = reputation.points + reputationChange;
    
    // Определяем новый уровень репутации
    let newLevel = reputation.level;
    let newDiscountRate = reputation.discountRate;
    
    // Простая логика повышения уровня (можно доработать)
    if (newPoints >= 100 && newLevel < 1) {
      newLevel = 1;
      newDiscountRate = 0.05; // 5% скидка
    } else if (newPoints >= 300 && newLevel < 2) {
      newLevel = 2;
      newDiscountRate = 0.1; // 10% скидка
    } else if (newPoints >= 600 && newLevel < 3) {
      newLevel = 3;
      newDiscountRate = 0.15; // 15% скидка
    } else if (newPoints >= 1000 && newLevel < 4) {
      newLevel = 4;
      newDiscountRate = 0.2; // 20% скидка
    } else if (newPoints >= 1500 && newLevel < 5) {
      newLevel = 5;
      newDiscountRate = 0.25; // 25% скидка
    }
    
    // Обновляем репутацию
    await reputation.update({
      points: newPoints,
      level: newLevel,
      discountRate: newDiscountRate
    }, { transaction });
    
    return reputation;
  } catch (error) {
    console.error('Ошибка при обновлении репутации:', error);
    throw error;
  }
}

/**
 * Создает нового торговца
 * @param {Object} merchantData - Данные о торговце
 * @returns {Promise<Object>} Созданный торговец
 */
exports.createMerchant = async function(merchantData) {
  try {
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модели через реестр
    const Merchant = modelRegistry.getModel('Merchant');
    const MerchantInventory = modelRegistry.getModel('MerchantInventory');
    
    // Получаем экземпляр sequelize из connectionProvider для гарантии инициализации
    const connection = await connectionProvider.getSequelizeInstance();
    const sequelizeInstance = connection.db;
    
    // Начинаем транзакцию, используя гарантированно инициализированный экземпляр
    const transaction = await sequelizeInstance.transaction();
    
    try {
      // Создаем торговца
      const merchant = await Merchant.create({
        name: merchantData.name,
        description: merchantData.description || '',
        location: merchantData.location || 'central_market',
        specialization: merchantData.specialization || 'general',
        image: merchantData.image || 'default_merchant.png',
        defaultDiscount: merchantData.defaultDiscount || 0
      }, { transaction });
      
      // Если есть данные об инвентаре, создаем записи
      if (merchantData.inventory && Array.isArray(merchantData.inventory)) {
        for (const item of merchantData.inventory) {
          await MerchantInventory.create({
            merchantId: merchant.id,
            itemId: item.itemId,
            itemType: item.itemType || 'item',
            name: item.name,
            description: item.description || '',
            rarity: item.rarity || 'common',
            quantity: item.quantity || 10,
            price: item.price,
            maxQuantity: item.maxQuantity || 10,
            restockRate: item.restockRate || 1
          }, { transaction });
        }
      }
      
      // Фиксируем транзакцию
      await transaction.commit();
      
      // Сбрасываем кэш
      merchantsCache = [];
      merchantsById = {};
      
      return merchant;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Ошибка при создании торговца:', error);
    throw error;
  }
};

/**
 * Обновляет данные торговца
 * @param {number} merchantId - ID торговца
 * @param {Object} merchantData - Новые данные о торговце
 * @returns {Promise<Object>} Обновленный торговец
 */
exports.updateMerchant = async function(merchantId, merchantData) {
  try {
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модели через реестр
    const Merchant = modelRegistry.getModel('Merchant');
    
    // Проверяем существование торговца
    const merchant = await Merchant.findByPk(merchantId);
    if (!merchant) {
      throw new Error('Торговец не найден');
    }
    
    // Обновляем данные торговца
    await merchant.update({
      name: merchantData.name !== undefined ? merchantData.name : merchant.name,
      description: merchantData.description !== undefined ? merchantData.description : merchant.description,
      location: merchantData.location !== undefined ? merchantData.location : merchant.location,
      specialization: merchantData.specialization !== undefined ? merchantData.specialization : merchant.specialization,
      image: merchantData.image !== undefined ? merchantData.image : merchant.image,
      defaultDiscount: merchantData.defaultDiscount !== undefined ? merchantData.defaultDiscount : merchant.defaultDiscount
    });
    
    // Сбрасываем кэш
    delete merchantsById[merchantId];
    merchantsCache = [];
    
    return merchant;
  } catch (error) {
    console.error(`Ошибка при обновлении торговца ${merchantId}:`, error);
    throw error;
  }
};

/**
 * Преобразует объект торговца в формат для клиента
 * @param {Object} merchant - Объект торговца из базы данных
 * @returns {Object} Форматированный объект торговца
 * @private
 */
function formatMerchant(merchant) {
  const plainMerchant = merchant.get ? merchant.get({ plain: true }) : merchant;
  
  return {
    id: plainMerchant.id,
    name: plainMerchant.name,
    description: plainMerchant.description,
    location: plainMerchant.location,
    specialization: plainMerchant.specialization,
    image: plainMerchant.image,
    defaultDiscount: plainMerchant.defaultDiscount,
    createdAt: plainMerchant.createdAt,
    updatedAt: plainMerchant.updatedAt,
    inventory: plainMerchant.inventory ? plainMerchant.inventory.map(item => ({
      id: item.id,
      itemId: item.itemId,
      itemType: item.itemType,
      name: item.name,
      description: item.description,
      rarity: item.rarity,
      quantity: item.quantity,
      price: item.price
    })) : []
  };
}