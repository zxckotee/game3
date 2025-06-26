/**
 * Клиентская версия MarketService без серверных зависимостей
 * Используется в браузере вместо оригинального market-service.js
 */

// Моковые данные для рынка
const mockMarketItems = [
  {
    id: 1,
    name: 'Духовная трава',
    description: 'Обычная трава с небольшим количеством духовной энергии',
    type: 'resource',
    rarity: 'common',
    price: 50,
    quantity: 20,
    sellerId: 101,
    sellerName: 'Торговец Лу',
    postedAt: new Date(Date.now() - 86400000) // Выставлено 1 день назад
  },
  {
    id: 2,
    name: 'Меч начинающего культиватора',
    description: 'Базовый меч для начинающих культиваторов',
    type: 'weapon',
    rarity: 'common',
    price: 200,
    quantity: 1,
    sellerId: 102,
    sellerName: 'Мастер Чжан',
    postedAt: new Date(Date.now() - 172800000) // Выставлено 2 дня назад
  },
  {
    id: 3,
    name: 'Пилюля очищения',
    description: 'Помогает очистить тело от примесей',
    type: 'pill',
    rarity: 'uncommon',
    price: 350,
    quantity: 5,
    sellerId: 103,
    sellerName: 'Алхимик Ву',
    postedAt: new Date(Date.now() - 43200000) // Выставлено 12 часов назад
  },
  {
    id: 4,
    name: 'Кристалл огня',
    description: 'Содержит концентрированную огненную энергию',
    type: 'material',
    rarity: 'rare',
    price: 1200,
    quantity: 2,
    sellerId: 104,
    sellerName: 'Торговец редкостями',
    postedAt: new Date(Date.now() - 21600000) // Выставлено 6 часов назад
  }
];

// Типы предметов на рынке
const MARKET_ITEM_TYPES = {
  RESOURCE: 'resource',
  WEAPON: 'weapon',
  ARMOR: 'armor',
  PILL: 'pill',
  ELIXIR: 'elixir',
  MATERIAL: 'material',
  TALISMAN: 'talisman',
  ACCESSORY: 'accessory',
  TECHNIQUE: 'technique'
};

// Сортировка товаров
const SORT_OPTIONS = {
  PRICE_ASC: 'price_asc',
  PRICE_DESC: 'price_desc',
  RARITY_ASC: 'rarity_asc',
  RARITY_DESC: 'rarity_desc',
  NEWEST: 'newest',
  OLDEST: 'oldest'
};

class MarketServiceAPI {
  /**
   * Получает все товары на рынке
   * @returns {Promise<Array>} Массив товаров
   */
  static async getAllItems() {
    return Promise.resolve([...mockMarketItems]);
  }

  /**
   * Получает товар по ID
   * @param {number} itemId ID товара
   * @returns {Promise<Object|null>} Объект товара или null, если не найден
   */
  static async getItemById(itemId) {
    const item = mockMarketItems.find(item => item.id === itemId);
    return Promise.resolve(item ? {...item} : null);
  }

  /**
   * Получает товары по типу
   * @param {string} type Тип товара
   * @returns {Promise<Array>} Массив товаров указанного типа
   */
  static async getItemsByType(type) {
    const items = mockMarketItems.filter(item => item.type === type);
    return Promise.resolve([...items]);
  }

  /**
   * Получает товары по критериям поиска
   * @param {Object} criteria Критерии поиска
   * @param {string} criteria.type Тип товара (опционально)
   * @param {string} criteria.rarity Редкость товара (опционально)
   * @param {number} criteria.minPrice Минимальная цена (опционально)
   * @param {number} criteria.maxPrice Максимальная цена (опционально)
   * @param {string} criteria.sort Сортировка результатов (опционально)
   * @param {number} criteria.limit Лимит результатов (опционально)
   * @returns {Promise<Array>} Массив товаров, соответствующих критериям
   */
  static async searchItems(criteria = {}) {
    let items = [...mockMarketItems];
    
    // Фильтрация по типу
    if (criteria.type) {
      items = items.filter(item => item.type === criteria.type);
    }
    
    // Фильтрация по редкости
    if (criteria.rarity) {
      items = items.filter(item => item.rarity === criteria.rarity);
    }
    
    // Фильтрация по цене
    if (criteria.minPrice !== undefined) {
      items = items.filter(item => item.price >= criteria.minPrice);
    }
    
    if (criteria.maxPrice !== undefined) {
      items = items.filter(item => item.price <= criteria.maxPrice);
    }
    
    // Сортировка
    if (criteria.sort) {
      switch (criteria.sort) {
        case SORT_OPTIONS.PRICE_ASC:
          items.sort((a, b) => a.price - b.price);
          break;
        case SORT_OPTIONS.PRICE_DESC:
          items.sort((a, b) => b.price - a.price);
          break;
        case SORT_OPTIONS.RARITY_ASC:
          // Сортировка по возрастанию редкости (common -> mythic)
          items.sort((a, b) => {
            const rarityOrder = {common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, mythic: 5};
            return rarityOrder[a.rarity] - rarityOrder[b.rarity];
          });
          break;
        case SORT_OPTIONS.RARITY_DESC:
          // Сортировка по убыванию редкости (mythic -> common)
          items.sort((a, b) => {
            const rarityOrder = {common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, mythic: 5};
            return rarityOrder[b.rarity] - rarityOrder[a.rarity];
          });
          break;
        case SORT_OPTIONS.NEWEST:
          items.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
          break;
        case SORT_OPTIONS.OLDEST:
          items.sort((a, b) => new Date(a.postedAt) - new Date(b.postedAt));
          break;
      }
    }
    
    // Ограничение количества результатов
    if (criteria.limit && criteria.limit > 0) {
      items = items.slice(0, criteria.limit);
    }
    
    return Promise.resolve(items);
  }

  /**
   * Покупает товар с рынка
   * @param {number} userId ID пользователя
   * @param {number} itemId ID товара
   * @param {number} quantity Количество товара для покупки
   * @returns {Promise<Object>} Результат покупки
   */
  static async buyItem(userId, itemId, quantity = 1) {
    const item = await this.getItemById(itemId);
    
    if (!item) {
      return Promise.reject(new Error('Товар не найден'));
    }
    
    if (item.quantity < quantity) {
      return Promise.reject(new Error('Недостаточное количество товара'));
    }
    
    // В клиентской версии симулируем успешную покупку
    // В реальной версии нужна проверка баланса, обновление БД и т.д.
    return Promise.resolve({
      success: true,
      message: `Успешно куплен товар: ${item.name} x${quantity}`,
      transaction: {
        itemId,
        itemName: item.name,
        quantity,
        totalPrice: item.price * quantity,
        timestamp: new Date()
      }
    });
  }

  /**
   * Выставляет товар на продажу
   * @param {number} userId ID пользователя
   * @param {Object} itemData Данные о товаре
   * @returns {Promise<Object>} Результат выставления товара
   */
  static async sellItem(userId, itemData) {
    // В клиентской версии просто возвращаем успешный результат
    const newItemId = Math.max(...mockMarketItems.map(item => item.id), 0) + 1;
    
    const newItem = {
      id: newItemId,
      name: itemData.name,
      description: itemData.description || '',
      type: itemData.type,
      rarity: itemData.rarity || 'common',
      price: itemData.price,
      quantity: itemData.quantity || 1,
      sellerId: userId,
      sellerName: 'Вы', // В клиентской версии просто "Вы"
      postedAt: new Date()
    };
    
    return Promise.resolve({
      success: true,
      message: `Товар ${newItem.name} успешно выставлен на продажу`,
      item: newItem
    });
  }

  /**
   * Отменяет продажу товара
   * @param {number} userId ID пользователя
   * @param {number} itemId ID товара
   * @returns {Promise<Object>} Результат отмены продажи
   */
  static async cancelListing(userId, itemId) {
    const item = await this.getItemById(itemId);
    
    if (!item) {
      return Promise.reject(new Error('Товар не найден'));
    }
    
    if (item.sellerId !== userId) {
      return Promise.reject(new Error('Вы не можете отменить продажу чужого товара'));
    }
    
    return Promise.resolve({
      success: true,
      message: `Продажа товара ${item.name} отменена`,
      item
    });
  }

  /**
   * Получает товары пользователя, выставленные на продажу
   * @param {number} userId ID пользователя
   * @returns {Promise<Array>} Массив товаров пользователя
   */
  static async getUserListings(userId) {
    const items = mockMarketItems.filter(item => item.sellerId === userId);
    return Promise.resolve([...items]);
  }

  /**
   * Возвращает константы типов товаров
   */
  static getItemTypes() {
    return MARKET_ITEM_TYPES;
  }

  /**
   * Возвращает константы опций сортировки
   */
  static getSortOptions() {
    return SORT_OPTIONS;
  }
}

// Экспортируем класс через CommonJS
module.exports = MarketServiceAPI;

// Экспортируем константы для совместимости
const MARKET_ITEM_TYPES_EXPORT = MARKET_ITEM_TYPES;
const SORT_OPTIONS_EXPORT = SORT_OPTIONS;

// Экспортируем отдельные методы для совместимости
module.exports.getAllItems = MarketServiceAPI.getAllItems;
module.exports.getItemById = MarketServiceAPI.getItemById;
module.exports.getItemsByType = MarketServiceAPI.getItemsByType;
module.exports.searchItems = MarketServiceAPI.searchItems;
module.exports.buyItem = MarketServiceAPI.buyItem;
module.exports.sellItem = MarketServiceAPI.sellItem;
module.exports.cancelListing = MarketServiceAPI.cancelListing;
module.exports.getUserListings = MarketServiceAPI.getUserListings;