/**
 * Сервис для создания начальных данных экипировки
 */
// Импортируем модели с учетом возможных разных форматов экспорта
let InventoryItem, MerchantInventory, Merchant;

// Импортируем централизованные данные об экипировке
const { getAllEquipmentItems } = require('../data/equipment-items');

try {
  // Пробуем прямой импорт
  InventoryItem = require('../models/inventory-item');
  MerchantInventory = require('../models/merchant-inventory');
  Merchant = require('../models/merchant');
} catch (error) {
  // Если не сработало, пробуем импорт через индекс моделей
  const models = require('../models');
  InventoryItem = models.InventoryItem;
  MerchantInventory = models.MerchantInventory;
  Merchant = models.Merchant;
  
  console.log('Использование импорта моделей через индекс');
}

class EquipmentSeeder {
  /**
   * Создание предметов экипировки в БД
   */
  static async seedEquipment() {
    try {
      console.log('Начало заполнения данных экипировки...');
      
      // Проверяем, есть ли уже данные в БД
      const existingItems = await InventoryItem.findAll({
        where: {
          userId: null, // Шаблоны предметов не привязаны к пользователю
          type: ['weapon', 'armor', 'accessory', 'artifact']
        }
      });
      
      if (existingItems.length > 0) {
        console.log(`Найдено ${existingItems.length} существующих предметов экипировки. Пропускаем создание.`);
        return existingItems;
      }
      
      // Получаем данные из централизованного источника
      const equipmentItems = getAllEquipmentItems();
      
      // Создаем предметы в базе данных
      const createdItems = [];
      
      for (const item of equipmentItems) {
        const newItem = await InventoryItem.create({
          userId: null, // Шаблоны предметов не привязаны к пользователю
          itemId: item.itemId,
          name: item.name,
          type: item.type,
          rarity: item.rarity,
          quantity: 0, // Будет обновлено при покупке
          equipped: false,
          properties: item.properties,
          calculatedBonuses: require('../services/equipment-service').calculateItemBonuses(item)
        });
        
        createdItems.push(newItem);
      }
      
      console.log(`Создано ${createdItems.length} предметов экипировки`);
      
      // Теперь добавим предметы в инвентарь торговцев
      await this.addItemsToMerchants();
      
      return createdItems;
    } catch (error) {
      console.error('Ошибка при создании предметов экипировки:', error);
      throw error;
    }
  }
  
  /**
   * Добавление предметов в инвентарь торговцев
   */
  static async addItemsToMerchants() {
    try {
      console.log('Добавление предметов в инвентарь торговцев...');
      
      // Получаем торговцев
      const merchants = await Merchant.findAll();
      
      if (!merchants || merchants.length === 0) {
        console.log('Торговцы не найдены. Пропускаем добавление предметов в инвентарь.');
        return;
      }
      
      // Получаем предметы экипировки
      const items = await InventoryItem.findAll({
        where: {
          userId: null,
          type: ['weapon', 'armor', 'accessory', 'artifact']
        }
      });
      
      if (!items || items.length === 0) {
        console.log('Предметы экипировки не найдены. Пропускаем добавление в инвентарь торговцев.');
        return;
      }
      
      // Проверяем, есть ли уже предметы в инвентаре торговцев
      const existingMerchantItems = await MerchantInventory.findAll();
      
      if (existingMerchantItems.length > 0) {
        console.log(`Найдено ${existingMerchantItems.length} предметов в инвентаре торговцев. Пропускаем добавление.`);
        return;
      }
      
      // Распределяем предметы по торговцам в зависимости от их специализации
      const merchantItems = [];
      
      for (const merchant of merchants) {
        let merchantEquipment = [];
        
        if (merchant.specialization === 'оружие' || merchant.name === 'Мастер Ли') {
          // Для оружейника добавляем оружие и доспехи
          merchantEquipment = items.filter(item => {
            return item.type === 'weapon' || 
                  (item.type === 'armor' && 
                   ['body', 'head', 'hands', 'legs'].includes(item.properties.armorType));
          });
        } else if (merchant.specialization === 'талисманы' || merchant.name === 'Госпожа Юнь') {
          // Для торговца талисманами добавляем аксессуары и артефакты
          merchantEquipment = items.filter(item => 
            item.type === 'accessory' || item.type === 'artifact'
          );
        }
        
        // Добавляем предметы в инвентарь торговца
        for (const item of merchantEquipment) {
          // Определяем цену в зависимости от редкости
          const price = 
            item.rarity === 'common' ? 50 + Math.floor(Math.random() * 50) :
            item.rarity === 'uncommon' ? 150 + Math.floor(Math.random() * 100) :
            item.rarity === 'rare' ? 400 + Math.floor(Math.random() * 200) :
            item.rarity === 'epic' ? 1000 + Math.floor(Math.random() * 500) : 
            100;
          
          merchantItems.push({
            merchantId: merchant.id,
            itemId: item.itemId,
            itemType: item.type,
            name: item.name,
            description: item.properties.description,
            rarity: item.rarity,
            quantity: item.rarity === 'epic' ? 1 : -1, // -1 означает бесконечное количество
            price: price,
            currencyType: 'gold',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
      
      // Создаем записи в базе данных
      if (merchantItems.length > 0) {
        await MerchantInventory.bulkCreate(merchantItems);
        console.log(`Добавлено ${merchantItems.length} предметов в инвентарь торговцев`);
      }
    } catch (error) {
      console.error('Ошибка при добавлении предметов в инвентарь торговцев:', error);
      throw error;
    }
  }
}

module.exports = EquipmentSeeder;
