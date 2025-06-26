/**
 * Клиентская версия MerchantService без серверных зависимостей
 * Используется в браузере вместо оригинального merchant-service.js и merchant-service-db.js
 */

// Импортируем данные о торговцах из адаптера данных
const { merchants } = require('../data/merchants-adapter');
const { equipmentItems } = require('../data/equipment-items-adapter');

// Моковые данные для инвентаря торговцев, теперь привязаны к пользователю
const mockMerchantInventory = {};

// Функция для инициализации инвентаря торговца для конкретного пользователя
function initMerchantInventoryForUser(userId) {
  if (!mockMerchantInventory[userId]) {
    mockMerchantInventory[userId] = {};
    
    // Для каждого торговца создаем инвентарь для этого пользователя
    merchants.forEach(merchant => {
      const merchantId = merchant.id;
      mockMerchantInventory[userId][merchantId] = [];
      
      // Добавляем предметы каждому торговцу на основе его специализации
      if (merchant.specialization === 'weapons') {
        // Оружие
        mockMerchantInventory[userId][merchantId] = equipmentItems
          .filter(item => item.type === 'weapon')
          .slice(0, 5) // Берем первые 5 предметов
          .map(item => ({
            id: `${userId}_${merchantId}_${item.id}`,
            userId,
            merchantId,
            itemId: item.id,
            itemType: 'equipment',
            name: item.name,
            description: item.description || '',
            price: item.price || Math.floor(Math.random() * 100) + 50,
            quantity: Math.floor(Math.random() * 5) + 1,
            rarity: item.rarity || 'common',
            attributes: item
          }));
      } else if (merchant.specialization === 'armor') {
        // Броня
        mockMerchantInventory[userId][merchantId] = equipmentItems
          .filter(item => item.type === 'armor')
          .slice(0, 5)
          .map(item => ({
            id: `${userId}_${merchantId}_${item.id}`,
            userId,
            merchantId,
            itemId: item.id,
            itemType: 'equipment',
            name: item.name,
            description: item.description || '',
            price: item.price || Math.floor(Math.random() * 100) + 50,
            quantity: Math.floor(Math.random() * 5) + 1,
            rarity: item.rarity || 'common',
            attributes: item
          }));
      } else if (merchant.specialization === 'potions') {
        // Зелья
        mockMerchantInventory[userId][merchantId] = [
          {
            id: `${userId}_${merchantId}_health_potion`,
            userId,
            merchantId,
            itemId: 'health_potion',
            itemType: 'consumable',
            name: 'Зелье здоровья',
            description: 'Восстанавливает 50 здоровья',
            price: 25,
            quantity: 10,
            rarity: 'common',
            attributes: {
              effect: 'health',
              value: 50
            }
          },
          {
            id: `${userId}_${merchantId}_energy_potion`,
            userId,
            merchantId,
            itemId: 'energy_potion',
            itemType: 'consumable',
            name: 'Зелье энергии',
            description: 'Восстанавливает 30 энергии',
            price: 30,
            quantity: 8,
            rarity: 'common',
            attributes: {
              effect: 'energy',
              value: 30
            }
          },
          {
            id: `${userId}_${merchantId}_strength_potion`,
            userId,
            merchantId,
            itemId: 'strength_potion',
            itemType: 'consumable',
            name: 'Зелье силы',
            description: 'Увеличивает силу на 5 на 10 минут',
            price: 40,
            quantity: 5,
            rarity: 'uncommon',
            attributes: {
              effect: 'strength',
              value: 5,
              duration: 600
            }
          }
        ];
      } else {
        // Для других специализаций - смешанные товары
        mockMerchantInventory[userId][merchantId] = [
          {
            id: `${userId}_${merchantId}_spirit_stone`,
            userId,
            merchantId,
            itemId: 'spirit_stone',
            itemType: 'material',
            name: 'Духовный камень',
            description: 'Базовый материал для культивации',
            price: 15,
            quantity: 20,
            rarity: 'common',
            attributes: {
              quality: 1
            }
          },
          {
            id: `${userId}_${merchantId}_spiritual_herb`,
            userId,
            merchantId,
            itemId: 'spiritual_herb',
            itemType: 'material',
            name: 'Духовная трава',
            description: 'Используется в алхимии',
            price: 10,
            quantity: 30,
            rarity: 'common',
            attributes: {
              quality: 1
            }
          }
        ];
      }
    });
  }
  
  return mockMerchantInventory[userId];
}

// Моковые данные о репутации с торговцами
const mockMerchantReputation = {};

class MerchantServiceAPI {
  /**
   * Получает всех торговцев
   * @returns {Promise<Array>} Массив всех торговцев
   */
  static async getAllMerchants() {
    return Promise.resolve([...merchants]);
  }

  /**
   * Получает торговцев по локации
   * @param {string} location Местоположение торговцев
   * @returns {Promise<Array>} Массив торговцев в указанной локации
   */
  static async getMerchantsByLocation(location) {
    const filteredMerchants = merchants.filter(m => m.location === location);
    return Promise.resolve([...filteredMerchants]);
  }

  /**
   * Получает торговцев по специализации
   * @param {string} specialization Специализация торговцев
   * @returns {Promise<Array>} Массив торговцев с указанной специализацией
   */
  static async getMerchantsBySpecialization(specialization) {
    const filteredMerchants = merchants.filter(m => m.specialization === specialization);
    return Promise.resolve([...filteredMerchants]);
  }

  /**
   * Получает инвентарь торговца
   * @param {number} merchantId ID торговца
   * @param {number} userId ID пользователя (для учета репутации)
   * @returns {Promise<Object>} Инвентарь торговца и информация о репутации
   */
  static async getMerchantInventory(merchantId, userId) {
    // Проверяем, что userId был предоставлен
    if (!userId) {
      return Promise.reject(new Error('User ID is required to get merchant inventory'));
    }
    
    // Инициализируем инвентарь для пользователя, если он еще не создан
    if (!mockMerchantInventory[userId]) {
      initMerchantInventoryForUser(userId);
    }
    
    const inventory = mockMerchantInventory[userId][merchantId] || [];
    
    // Получаем репутацию пользователя с торговцем
    let playerReputation = 0;
    if (mockMerchantReputation[`${userId}_${merchantId}`]) {
      playerReputation = mockMerchantReputation[`${userId}_${merchantId}`];
    }
    
    // Применяем скидки в зависимости от репутации
    const discountedInventory = inventory.map(item => {
      let discount = 0;
      
      if (playerReputation >= 70) discount = 0.15;      // 15% для "Уважаемый"
      else if (playerReputation >= 30) discount = 0.05; // 5% для "Дружелюбный"
      else if (playerReputation <= -30) discount = -0.1; // +10% для "Недружелюбный"
      
      const discountedPrice = Math.round(item.price * (1 - discount));
      
      return {
        ...item,
        originalPrice: item.price,
        price: discountedPrice,
        discount: discount !== 0 ? `${Math.abs(discount * 100)}%${discount > 0 ? ' скидка' : ' надбавка'}` : null
      };
    });
    
    return Promise.resolve({
      inventory: discountedInventory,
      playerReputation
    });
  }

  /**
   * Покупает предмет у торговца
   * @param {number} userId ID пользователя
   * @param {number} merchantId ID торговца
   * @param {string} itemId ID предмета
   * @param {number} quantity Количество предметов для покупки
   * @returns {Promise<Object>} Результат покупки
   */
  static async buyItemFromMerchant(userId, merchantId, itemId, quantity = 1) {
    // Проверяем, что userId был предоставлен
    if (!userId) {
      return Promise.reject(new Error('User ID is required to buy items from merchant'));
    }
    
    // Получаем инвентарь торговца для конкретного пользователя
    const { inventory } = await this.getMerchantInventory(merchantId, userId);
    
    // Находим предмет в инвентаре
    const merchantItem = inventory.find(item => item.id === itemId || item.itemId === itemId);
    
    if (!merchantItem) {
      return Promise.reject(new Error('Предмет не найден в инвентаре торговца'));
    }
    
    if (merchantItem.quantity < quantity) {
      return Promise.reject(new Error(`У торговца недостаточно предметов (доступно: ${merchantItem.quantity})`));
    }
    
    // В клиентской версии у нас нет доступа к балансу пользователя напрямую
    // Предполагаем, что проверка баланса будет выполнена на сервере
    
    // Уменьшаем количество предметов у торговца
    merchantItem.quantity -= quantity;
    
    // Если пользователь приобрел предмет успешно, увеличиваем его репутацию
    const reputationKey = `${userId}_${merchantId}`;
    if (!mockMerchantReputation[reputationKey]) {
      mockMerchantReputation[reputationKey] = 0;
    }
    mockMerchantReputation[reputationKey] += Math.min(5, quantity); // +5 репутации максимум за одну покупку
    
    return Promise.resolve({
      success: true,
      message: `Вы успешно приобрели ${merchantItem.name} (${quantity} шт.)`,
      item: {
        ...merchantItem,
        quantity
      },
      merchant: merchants.find(m => m.id === merchantId),
      totalCost: merchantItem.price * quantity
    });
  }

  /**
   * Продает предмет торговцу
   * @param {number} userId ID пользователя
   * @param {number} merchantId ID торговца
   * @param {string} inventoryItemId ID предмета в инвентаре пользователя
   * @param {number} quantity Количество предметов для продажи
   * @returns {Promise<Object>} Результат продажи
   */
  static async sellItemToMerchant(userId, merchantId, inventoryItemId, quantity = 1) {
    // Проверяем, что userId был предоставлен
    if (!userId) {
      return Promise.reject(new Error('User ID is required to sell items to merchant'));
    }
    
    // В клиентской версии у нас нет доступа к инвентарю пользователя напрямую
    // Предполагаем, что проверка наличия предмета будет выполнена на сервере
    
    // Моделируем базовую цену покупки торговцем (обычно 50-70% от цены продажи)
    const price = Math.floor(Math.random() * 50) + 10; // Случайная цена от 10 до 60
    const totalPrice = price * quantity;
    
    // Немного увеличиваем репутацию при продаже
    const reputationKey = `${userId}_${merchantId}`;
    if (!mockMerchantReputation[reputationKey]) {
      mockMerchantReputation[reputationKey] = 0;
    }
    mockMerchantReputation[reputationKey] += Math.min(2, quantity); // +2 репутации максимум за одну продажу
    
    return Promise.resolve({
      success: true,
      message: `Вы успешно продали предмет торговцу за ${totalPrice} золота`,
      goldGained: totalPrice,
      merchant: merchants.find(m => m.id === merchantId)
    });
  }

  /**
   * Обновляет инвентарь торговца
   * @param {number} merchantId ID торговца
   * @param {Array} items Новые предметы
   * @returns {Promise<Object>} Результат обновления
   */
  static async updateMerchantItems(merchantId, items, userId) {
    if (!items || !Array.isArray(items)) {
      return Promise.reject(new Error('Некорректный формат данных'));
    }
    
    // Проверяем, что userId был предоставлен
    if (!userId) {
      return Promise.reject(new Error('User ID is required to update merchant items'));
    }
    
    // Проверяем существование торговца
    const merchant = merchants.find(m => m.id === merchantId);
    if (!merchant) {
      return Promise.reject(new Error('Торговец не найден'));
    }
    
    // Инициализируем инвентарь для пользователя, если он еще не создан
    if (!mockMerchantInventory[userId]) {
      initMerchantInventoryForUser(userId);
    }
    
    // Обновляем инвентарь торговца для конкретного пользователя
    mockMerchantInventory[userId][merchantId] = items.map(item => ({
      id: `${userId}_${merchantId}_${item.itemId || item.id}`,
      userId,
      merchantId,
      itemId: item.itemId || item.id,
      itemType: item.itemType || 'equipment',
      name: item.name,
      description: item.description || '',
      price: item.price,
      quantity: item.quantity,
      rarity: item.rarity || 'common',
      attributes: item.attributes || {}
    }));
    
    return Promise.resolve({
      success: true,
      message: `Инвентарь торговца ${merchant.name} обновлен`,
      inventory: mockMerchantInventory[merchantId]
    });
  }

  /**
   * Получает репутацию пользователя у торговца
   * @param {number} userId ID пользователя
   * @param {number} merchantId ID торговца
   * @returns {Promise<number>} Значение репутации
   */
  static async getMerchantReputation(userId, merchantId) {
    const reputationKey = `${userId}_${merchantId}`;
    return Promise.resolve(mockMerchantReputation[reputationKey] || 0);
  }

  /**
   * Изменяет репутацию пользователя у торговца
   * @param {number} userId ID пользователя
   * @param {number} merchantId ID торговца
   * @param {number} change Величина изменения
   * @returns {Promise<Object>} Результат изменения
   */
  static async changeMerchantReputation(userId, merchantId, change) {
    const reputationKey = `${userId}_${merchantId}`;
    
    if (!mockMerchantReputation[reputationKey]) {
      mockMerchantReputation[reputationKey] = 0;
    }
    
    const oldValue = mockMerchantReputation[reputationKey];
    mockMerchantReputation[reputationKey] = Math.min(100, Math.max(-100, oldValue + change));
    const newValue = mockMerchantReputation[reputationKey];
    
    return Promise.resolve({
      success: true,
      oldValue,
      newValue,
      change
    });
  }
}

// Экспортируем класс через CommonJS
module.exports = MerchantServiceAPI;

// Экспортируем отдельные методы для совместимости
module.exports.getAllMerchants = MerchantServiceAPI.getAllMerchants;
module.exports.getMerchantsByLocation = MerchantServiceAPI.getMerchantsByLocation;
module.exports.getMerchantsBySpecialization = MerchantServiceAPI.getMerchantsBySpecialization;
module.exports.getMerchantInventory = MerchantServiceAPI.getMerchantInventory;
module.exports.buyItemFromMerchant = MerchantServiceAPI.buyItemFromMerchant;
module.exports.sellItemToMerchant = MerchantServiceAPI.sellItemToMerchant;
module.exports.updateMerchantItems = MerchantServiceAPI.updateMerchantItems;
module.exports.getMerchantReputation = MerchantServiceAPI.getMerchantReputation;
module.exports.changeMerchantReputation = MerchantServiceAPI.changeMerchantReputation;