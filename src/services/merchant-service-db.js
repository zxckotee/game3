const { Merchant, MerchantInventory } = require('../models');
const InventoryService = require('./inventory-service');
const { getInitializedUserModel } = require('../models/user');

/**
 * Сервис для работы с торговцами (версия для БД)
 */
class MerchantServiceDB {
  /**
   * Получить всех торговцев
   * @returns {Promise<Array>} Массив всех торговцев
   */
  async getAllMerchants() {
    try {
      return await Merchant.findAll();
    } catch (error) {
      console.error('Ошибка при получении списка торговцев:', error);
      throw error;
    }
  }

  /**
   * Получить торговца по ID
   * @param {number} id ID торговца
   * @returns {Promise<Object|null>} Объект торговца или null, если торговец не найден
   */
  async getMerchantById(id) {
    try {
      return await Merchant.findByPk(id);
    } catch (error) {
      console.error(`Ошибка при получении торговца с ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Получить торговцев по локации
   * @param {string} location Название локации
   * @returns {Promise<Array>} Массив торговцев в указанной локации
   */
  async getMerchantsByLocation(location) {
    try {
      return await Merchant.findAll({
        where: { location }
      });
    } catch (error) {
      console.error(`Ошибка при получении торговцев из локации ${location}:`, error);
      throw error;
    }
  }

  /**
   * Получить торговцев по специализации
   * @param {string} specialization Специализация торговца
   * @returns {Promise<Array>} Массив торговцев с указанной специализацией
   */
  async getMerchantsBySpecialization(specialization) {
    try {
      return await Merchant.findAll({
        where: { specialization }
      });
    } catch (error) {
      console.error(`Ошибка при получении торговцев специализации ${specialization}:`, error);
      throw error;
    }
  }

  /**
   * Получить товары торговца с учетом репутации игрока
   * @param {number} merchantId ID торговца
   * @param {number} userId ID пользователя (для учета репутации)
   * @returns {Promise<Array>} Массив товаров с рассчитанными ценами
   */
  async getMerchantItems(merchantId, userId = null) {
    try {
      // Получаем торговца
      const merchant = await this.getMerchantById(merchantId);
      
      if (!merchant) {
        throw new Error('Торговец не найден');
      }
      
      // Получаем инвентарь торговца
      const inventoryItems = await MerchantInventory.findAll({
        where: { merchantId }
      });
      
      // Получаем репутацию пользователя у торговца (если указан userId)
      let playerReputation = 0;
      if (userId) {
        // Здесь должен быть код получения репутации пользователя у торговца
        // Например: const userReputation = await MerchantReputation.findOne({ where: { merchantId, userId } });
        // playerReputation = userReputation ? userReputation.value : 0;
      }
      
      // Преобразуем данные для клиента с учетом репутации
      return inventoryItems.map(item => {
        // Рассчитываем цену с учетом скидки
        const finalPrice = this.calculatePrice(item.price, merchant.defaultDiscount, playerReputation);
        
        // Получаем тип валюты на основе редкости предмета
        const currencyType = this.getCurrencyTypeByRarity(item.rarity || 'common');
        
        return {
          id: item.id,
          itemId: item.itemId,
          itemType: item.itemType,
          name: item.name,
          description: item.description,
          rarity: item.rarity,
          quantity: item.quantity,
          price: finalPrice,
          originalPrice: item.price,
          currencyType: currencyType // Вычисляем динамически
        };
      });
    } catch (error) {
      console.error(`Ошибка при получении товаров торговца с ID ${merchantId}:`, error);
      throw error;
    }
  }

  /**
   * Купить предмет у торговца
   * @param {number} merchantId ID торговца
   * @param {string} itemId ID предмета
   * @param {number} quantity Количество покупаемых предметов
   * @param {number} userId ID пользователя
   * @returns {Promise<Object>} Результат покупки
   */
  async buyFromMerchant(merchantId, itemId, quantity = 1, userId) {
    try {
      // Получаем торговца
      const merchant = await this.getMerchantById(merchantId);
      
      if (!merchant) {
        throw new Error('Торговец не найден');
      }
      
      // Получаем предмет из инвентаря торговца
      const merchantItem = await MerchantInventory.findOne({
        where: { 
          merchantId,
          itemId
        }
      });
      
      if (!merchantItem) {
        throw new Error('Предмет не найден у торговца');
      }
      
      // Проверяем количество предметов у торговца
      if (merchantItem.quantity !== -1 && merchantItem.quantity < quantity) {
        throw new Error('Недостаточно предметов у торговца');
      }
      
      // Получаем репутацию пользователя у торговца
      let playerReputation = 0;
      // Здесь должен быть код получения репутации пользователя у торговца
      
      // Рассчитываем итоговую цену
      const finalPrice = this.calculatePrice(merchantItem.price, merchant.defaultDiscount, playerReputation) * quantity;
      
      // Получаем данные пользователя для проверки баланса
      const UserModel = await getInitializedUserModel();
      const user = await UserModel.findByPk(userId);
      
      if (!user) {
        throw new Error('Пользователь не найден');
      }
      
      // Проверяем, достаточно ли денег у пользователя
      if (user.gold < finalPrice) {
        throw new Error('Недостаточно золота для покупки');
      }
      
      // Списываем деньги у пользователя
      user.gold -= finalPrice;
      await user.save();
      
      // Уменьшаем количество предметов у торговца (если не бесконечное)
      if (merchantItem.quantity !== -1) {
        merchantItem.quantity -= quantity;
        
        if (merchantItem.quantity <= 0) {
          // Если предметов больше нет, удаляем запись
          await merchantItem.destroy();
        } else {
          await merchantItem.save();
        }
      }
      
      // Создаем объект предмета для добавления в инвентарь
      const itemData = {
        id: merchantItem.itemId,
        name: merchantItem.name,
        type: merchantItem.itemType,
        rarity: merchantItem.rarity,
        quantity: quantity,
        description: merchantItem.description,
        // При необходимости добавьте другие свойства предмета
      };
      
      // Добавляем предмет в инвентарь пользователя
      await InventoryService.addInventoryItem(userId, itemData);
      
      return {
        success: true,
        message: `Вы успешно купили ${quantity} шт. предмета ${merchantItem.name}`,
        item: {
          itemId: merchantItem.itemId,
          name: merchantItem.name,
          type: merchantItem.itemType,
          quantity,
          price: finalPrice
        }
      };
    } catch (error) {
      console.error('Ошибка при покупке предмета:', error);
      throw error;
    }
  }

  /**
   * Продать предмет торговцу
   * @param {number} merchantId ID торговца
   * @param {string} itemId ID предмета
   * @param {number} quantity Количество продаваемых предметов
   * @param {number} userId ID пользователя
   * @returns {Promise<Object>} Результат продажи
   */
  async sellToMerchant(merchantId, itemId, quantity = 1, userId) {
    try {
      // Получаем торговца
      const merchant = await this.getMerchantById(merchantId);
      
      if (!merchant) {
        throw new Error('Торговец не найден');
      }
      
      // Получаем предмет из инвентаря пользователя
      const userItems = await InventoryService.getInventoryItems(userId);
      const userItem = userItems.find(item => item.id === itemId);
      
      if (!userItem) {
        throw new Error('Предмет не найден в инвентаре');
      }
      
      if (userItem.quantity < quantity) {
        throw new Error('Недостаточно предметов в инвентаре');
      }
      
      // Получаем базовую цену предмета
      // Сначала проверяем, есть ли у торговца такой же предмет
      const merchantItem = await MerchantInventory.findOne({
        where: { 
          merchantId,
          itemId
        }
      });
      
      // Определяем цену продажи (обычно 30-70% от цены покупки)
      const sellPriceMultiplier = 0.5; // 50% от цены покупки
      const basePrice = merchantItem ? merchantItem.price * sellPriceMultiplier : userItem.value || 50;
      
      // Получаем репутацию пользователя у торговца
      let playerReputation = 0;
      // Здесь должен быть код получения репутации пользователя у торговца
      
      // Рассчитываем итоговую цену
      const finalPrice = Math.round(basePrice * quantity);
      
      // Удаляем предмет из инвентаря пользователя
      await InventoryService.removeInventoryItem(userId, itemId, quantity);
      
      // Начисляем деньги пользователю
      const UserModel = await getInitializedUserModel();
      const user = await UserModel.findByPk(userId);
      user.gold += finalPrice;
      await user.save();
      
      return {
        success: true,
        message: `Вы успешно продали ${quantity} шт. предмета ${userItem.name}`,
        item: {
          itemId,
          name: userItem.name,
          quantity,
          price: finalPrice
        }
      };
    } catch (error) {
      console.error('Ошибка при продаже предмета:', error);
      throw error;
    }
  }

  /**
   * Рассчитать итоговую цену предмета с учетом репутации
   * @param {number} basePrice Базовая цена предмета
   * @param {number} merchantDiscount Базовая скидка у торговца
   * @param {number} playerReputation Репутация игрока у торговца
   * @returns {number} Итоговая цена предмета
   */
  calculatePrice(basePrice, merchantDiscount, playerReputation) {
    // Базовая скидка торговца (от 0 до 1)
    const baseDiscountMultiplier = 1 - (merchantDiscount || 0);
    
    // Скидка от репутации игрока (от 0 до 0.25)
    const reputationDiscountMultiplier = 1 - (playerReputation / 400);
    
    // Итоговая цена
    return Math.round(basePrice * baseDiscountMultiplier * reputationDiscountMultiplier);
  }

  /**
   * Обновить предметы торговца в базе данных
   * @param {number} merchantId ID торговца
   * @param {Array} items Массив предметов для торговца
   * @returns {Promise<Object>} Обновленный торговец
   */
  async updateMerchantItems(merchantId, items) {
    try {
      // Получаем торговца
      const merchant = await this.getMerchantById(merchantId);
      
      if (!merchant) {
        throw new Error(`Торговец с ID ${merchantId} не найден`);
      }
      
      // Удаляем текущие предметы торговца
      await MerchantInventory.destroy({
        where: { merchantId }
      });
      
      // Создаем массив новых предметов для добавления
      const merchantItems = items.map(item => ({
        merchantId,
        itemId: item.itemId,
        itemType: item.itemType || 'unknown',
        name: item.name,
        description: item.description || '',
        rarity: item.rarity || 'common',
        price: item.basePrice || 100,
        quantity: typeof item.quantity === 'number' ? item.quantity : -1, // -1 означает бесконечное количество
        properties: JSON.stringify(item.properties || {})
      }));
      
      // Добавляем новые предметы
      if (merchantItems.length > 0) {
        await MerchantInventory.bulkCreate(merchantItems);
      }
      
      // Обновляем информацию о торговце
      merchant.lastUpdated = new Date();
      await merchant.save();
      
      return merchant;
    } catch (error) {
      console.error(`Ошибка при обновлении предметов торговца с ID ${merchantId}:`, error);
      throw error;
    }
  }

  /**
   * Функция для определения типа валюты по редкости предмета
   * @param {string} rarity Редкость предмета
   * @returns {string} Тип валюты
   */
  getCurrencyTypeByRarity(rarity) {
    switch(rarity) {
      case 'common': return 'copper';
      case 'uncommon': return 'silver';
      case 'rare': return 'gold';
      case 'epic': return 'gold+spiritStones';
      case 'legendary': return 'spiritStones';
      default: return 'gold';
    }
  }
}

module.exports = new MerchantServiceDB();
