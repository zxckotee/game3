/**
 * Клиентская версия EquipmentService без серверных зависимостей
 * Используется в браузере вместо оригинального equipment-service.js
 */

// Импортируем данные об экипировке
const { equipmentItems } = require('../data/equipment-items-adapter');

// Используем локальное хранилище для имитации инвентаря пользователя
const LOCAL_STORAGE_KEY = 'mock_user_inventory';

/**
 * Получает моковый инвентарь пользователя из localStorage
 * @param {number} userId ID пользователя
 * @returns {Array} Массив предметов инвентаря
 */
function getMockInventory(userId) {
  try {
    const storageData = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
    if (storageData) {
      return JSON.parse(storageData);
    }
  } catch (error) {
    console.error('Ошибка при чтении из localStorage:', error);
  }
  
  // Если данных нет, возвращаем пустой массив
  return [];
}

/**
 * Сохраняет моковый инвентарь пользователя в localStorage
 * @param {number} userId ID пользователя
 * @param {Array} inventory Массив предметов инвентаря
 */
function saveMockInventory(userId, inventory) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(inventory));
  } catch (error) {
    console.error('Ошибка при сохранении в localStorage:', error);
  }
}

/**
 * Создает базовый набор экипировки для нового пользователя
 * @returns {Array} Массив базовых предметов экипировки
 */
function createInitialEquipment() {
  // Находим базовые предметы для новичка
  const starterItems = equipmentItems.filter(item => 
    item.requiredLevel <= 1 && 
    (item.type === 'weapon' || item.type === 'armor') && 
    item.rarity === 'common'
  );
  
  // Создаем минимальный набор: оружие и одежда
  const basicEquipment = [
    // Базовый меч
    {
      id: 'starter_sword',
      itemId: starterItems.find(item => item.type === 'weapon')?.id || 'basic_sword',
      userId: null,
      name: 'Тренировочный меч новичка',
      type: 'weapon',
      slot: 'weapon',
      equipped: false,
      quantity: 1,
      rarity: 'common',
      attributes: {
        damage: 5,
        durability: 100
      },
      bonuses: [
        { type: 'strength', value: 1 },
        { type: 'attack', value: 5 }
      ]
    },
    // Базовая одежда
    {
      id: 'starter_clothes',
      itemId: starterItems.find(item => item.type === 'armor' && item.slot === 'body')?.id || 'basic_clothes',
      userId: null,
      name: 'Одежда ученика',
      type: 'armor',
      slot: 'body',
      equipped: false,
      quantity: 1,
      rarity: 'common',
      attributes: {
        defense: 3,
        durability: 100
      },
      bonuses: [
        { type: 'defense', value: 3 }
      ]
    }
  ];
  
  return basicEquipment;
}

class EquipmentServiceAPI {
  /**
   * Получает все предметы экипировки пользователя
   * @param {number} userId ID пользователя
   * @returns {Promise<Array>} Массив предметов экипировки
   */
  static async getUserEquipment(userId) {
    let inventory = getMockInventory(userId);
    
    // Если инвентарь пустой, создаем базовый набор
    if (!inventory || inventory.length === 0) {
      inventory = createInitialEquipment();
      saveMockInventory(userId, inventory);
    }
    
    // Фильтруем только предметы экипировки
    const equipment = inventory.filter(item => 
      item.type === 'weapon' || 
      item.type === 'armor' || 
      item.type === 'accessory'
    );
    
    return Promise.resolve(equipment);
  }

  /**
   * Получает экипированные предметы пользователя
   * @param {number} userId ID пользователя
   * @returns {Promise<Array>} Массив экипированных предметов
   */
  static async getEquippedItems(userId) {
    const equipment = await this.getUserEquipment(userId);
    const equippedItems = equipment.filter(item => item.equipped);
    return Promise.resolve(equippedItems);
  }

  /**
   * Экипирует предмет
   * @param {number} userId ID пользователя
   * @param {string} itemId ID предмета
   * @returns {Promise<Object>} Результат экипировки
   */
  static async equipItem(userId, itemId) {
    const inventory = getMockInventory(userId);
    
    // Находим предмет в инвентаре
    const itemIndex = inventory.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return Promise.reject(new Error('Предмет не найден в инвентаре'));
    }
    
    const item = inventory[itemIndex];
    
    // Проверяем, можно ли экипировать предмет
    if (item.type !== 'weapon' && item.type !== 'armor' && item.type !== 'accessory') {
      return Promise.reject(new Error('Этот предмет нельзя экипировать'));
    }
    
    // Если у предмета есть слот, снимаем другие предметы из этого слота
    if (item.slot) {
      for (let i = 0; i < inventory.length; i++) {
        if (i !== itemIndex && 
            inventory[i].slot === item.slot && 
            inventory[i].equipped) {
          inventory[i].equipped = false;
        }
      }
    }
    
    // Экипируем предмет
    inventory[itemIndex].equipped = true;
    
    // Сохраняем обновленный инвентарь
    saveMockInventory(userId, inventory);
    
    return Promise.resolve({
      success: true,
      message: `Предмет ${item.name} экипирован`,
      item: inventory[itemIndex],
      unequippedItems: inventory.filter(i => i.slot === item.slot && i.id !== itemId && i.equipped === false)
    });
  }

  /**
   * Снимает экипировку с предмета
   * @param {number} userId ID пользователя
   * @param {string} itemId ID предмета
   * @returns {Promise<Object>} Результат снятия экипировки
   */
  static async unequipItem(userId, itemId) {
    const inventory = getMockInventory(userId);
    
    // Находим предмет в инвентаре
    const itemIndex = inventory.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return Promise.reject(new Error('Предмет не найден в инвентаре'));
    }
    
    const item = inventory[itemIndex];
    
    // Проверяем, экипирован ли предмет
    if (!item.equipped) {
      return Promise.reject(new Error('Предмет не экипирован'));
    }
    
    // Снимаем экипировку
    inventory[itemIndex].equipped = false;
    
    // Сохраняем обновленный инвентарь
    saveMockInventory(userId, inventory);
    
    return Promise.resolve({
      success: true,
      message: `Предмет ${item.name} снят`,
      item: inventory[itemIndex]
    });
  }

  /**
   * Рассчитывает бонусы от экипировки
   * @param {number} userId ID пользователя
   * @returns {Promise<Object>} Бонусы от экипировки
   */
  static async calculateEquipmentBonuses(userId) {
    // Получаем экипированные предметы
    const equippedItems = await this.getEquippedItems(userId);
    
    // Инициализируем объект для хранения бонусов
    const bonuses = {};
    
    // Собираем бонусы со всех экипированных предметов
    for (const item of equippedItems) {
      if (item.bonuses) {
        for (const bonus of item.bonuses) {
          if (bonuses[bonus.type]) {
            bonuses[bonus.type] += bonus.value;
          } else {
            bonuses[bonus.type] = bonus.value;
          }
        }
      }
    }
    
    // Создаем полный объект с бонусами и источниками
    const result = {
      totalBonuses: bonuses,
      sources: equippedItems.map(item => ({
        id: item.id,
        name: item.name,
        slot: item.slot,
        bonuses: item.bonuses || []
      }))
    };
    
    return Promise.resolve(result);
  }

  /**
   * Создает новый предмет экипировки
   * @param {Object} itemData Данные о предмете
   * @returns {Promise<Object>} Созданный предмет
   */
  static async createEquipmentItem(itemData) {
    // Генерируем уникальный ID для предмета
    const itemId = `equipment_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    const newItem = {
      id: itemId,
      itemId: itemData.itemId || itemId,
      userId: itemData.userId || null,
      name: itemData.name,
      description: itemData.description || '',
      type: itemData.type || 'weapon',
      slot: itemData.slot || 'weapon',
      equipped: false,
      quantity: itemData.quantity || 1,
      rarity: itemData.rarity || 'common',
      level: itemData.level || 1,
      attributes: itemData.attributes || {},
      bonuses: itemData.bonuses || []
    };
    
    // Если указан userId, добавляем предмет в инвентарь
    if (itemData.userId) {
      const inventory = getMockInventory(itemData.userId);
      inventory.push(newItem);
      saveMockInventory(itemData.userId, inventory);
    }
    
    return Promise.resolve(newItem);
  }

  /**
   * Удаляет предмет экипировки
   * @param {number} userId ID пользователя
   * @param {string} itemId ID предмета
   * @returns {Promise<boolean>} Результат удаления
   */
  static async removeEquipmentItem(userId, itemId) {
    const inventory = getMockInventory(userId);
    
    // Находим предмет в инвентаре
    const itemIndex = inventory.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return Promise.reject(new Error('Предмет не найден в инвентаре'));
    }
    
    // Удаляем предмет
    inventory.splice(itemIndex, 1);
    
    // Сохраняем обновленный инвентарь
    saveMockInventory(userId, inventory);
    
    return Promise.resolve(true);
  }

  /**
   * Добавляет предмет экипировки в инвентарь пользователя
   * @param {number} userId ID пользователя
   * @param {Object} item Предмет экипировки
   * @returns {Promise<Object>} Добавленный предмет
   */
  static async addEquipmentToUser(userId, item) {
    const inventory = getMockInventory(userId);
    
    // Присваиваем предмету ID пользователя
    const itemToAdd = {
      ...item,
      userId,
      id: item.id || `equipment_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    };
    
    // Добавляем предмет в инвентарь
    inventory.push(itemToAdd);
    
    // Сохраняем обновленный инвентарь
    saveMockInventory(userId, inventory);
    
    return Promise.resolve(itemToAdd);
  }

  /**
   * Обновляет предмет экипировки
   * @param {number} userId ID пользователя
   * @param {string} itemId ID предмета
   * @param {Object} updateData Данные для обновления
   * @returns {Promise<Object>} Обновленный предмет
   */
  static async updateEquipmentItem(userId, itemId, updateData) {
    const inventory = getMockInventory(userId);
    
    // Находим предмет в инвентаре
    const itemIndex = inventory.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return Promise.reject(new Error('Предмет не найден в инвентаре'));
    }
    
    // Обновляем предмет
    inventory[itemIndex] = {
      ...inventory[itemIndex],
      ...updateData
    };
    
    // Сохраняем обновленный инвентарь
    saveMockInventory(userId, inventory);
    
    return Promise.resolve(inventory[itemIndex]);
  }
}

// Экспортируем класс через CommonJS
module.exports = EquipmentServiceAPI;

// Экспортируем отдельные методы для совместимости
module.exports.getUserEquipment = EquipmentServiceAPI.getUserEquipment;
module.exports.getEquippedItems = EquipmentServiceAPI.getEquippedItems;
module.exports.equipItem = EquipmentServiceAPI.equipItem;
module.exports.unequipItem = EquipmentServiceAPI.unequipItem;
module.exports.calculateEquipmentBonuses = EquipmentServiceAPI.calculateEquipmentBonuses;
module.exports.createEquipmentItem = EquipmentServiceAPI.createEquipmentItem;
module.exports.removeEquipmentItem = EquipmentServiceAPI.removeEquipmentItem;
module.exports.addEquipmentToUser = EquipmentServiceAPI.addEquipmentToUser;
module.exports.updateEquipmentItem = EquipmentServiceAPI.updateEquipmentItem;