'use strict';

const { Model, DataTypes } = require('../services/database');
const { unifiedDatabase } = require('../services/database-connection-manager');

// Получаем экземпляр Sequelize асинхронно
let sequelizeInstance = null;
async function getSequelize() {
  if (!sequelizeInstance) {
    const result = await unifiedDatabase.getSequelizeInstance();
    sequelizeInstance = result.db;
  }
  return sequelizeInstance;
}

class MerchantInventory extends Model {
  static associate(models) {
    // Связь с торговцем
    this.belongsTo(models.Merchant, {
      foreignKey: 'merchantId', // Оставляем camelCase
      as: 'merchant'
    });
  }

  /**
   * Получение итоговой цены с учетом скидки
   * @param {number} discount - Скидка (от 0 до 1)
   * @returns {number} Итоговая цена
   */
  getFinalPrice(discount) {
    return Math.floor(this.price * (1 - discount));
  }

  /**
   * Уменьшение количества предметов в инвентаре
   * @param {number} quantity - Количество предметов для уменьшения
   * @returns {Promise<MerchantInventory>} Обновленный инвентарь
   */
  async decreaseQuantity(quantity) {
    if (this.quantity < quantity) {
      throw new Error('Недостаточное количество предметов в инвентаре');
    }
    
    this.quantity -= quantity;
    
    // Если количество стало 0, все равно оставляем предмет просто с нулевым количеством, чтобы оставались данные
    /*if (this.quantity <= 0) {
      await this.destroy();
      return null;
    }*/
    
    return this.save();
  }

  /**
   * Увеличение количества предметов в инвентаре
   * @param {number} quantity - Количество предметов для увеличения
   * @returns {Promise<MerchantInventory>} Обновленный инвентарь
   */
  async increaseQuantity(quantity) {
    this.quantity += quantity;
    return this.save();
  }
}

MerchantInventory.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    // Идентификатор записи инвентаря
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    // Идентификатор торговца
    merchantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'merchant_id', // Добавляем field для snake_case
      references: {
        model: 'merchants', // Имя таблицы в lowercase
        key: 'id'
      }
    },
    // Идентификатор пользователя
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id', // Соответствующее поле в базе данных использует snake_case
      references: {
        model: 'users', // Имя таблицы в lowercase
        key: 'id'
      }
    },
    // Идентификатор предмета
    itemId: {
      type: DataTypes.STRING, // Изменяем на STRING, т.к. используются строковые ID как "celestial_perception_ring"
      allowNull: false,
      field: 'item_id' // Добавляем field для snake_case
      // Удаляем references, т.к. теперь это не ссылка на числовой ID
    },
    // Тип предмета (оружие, броня, ресурс и т.д.)
    itemType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'item_type' // Добавляем field для snake_case
    },
    // Название предмета
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // Описание предмета
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Редкость предмета (обычное, необычное, редкое и т.д.)
    rarity: {
      type: DataTypes.STRING, // Возможно, ENUM, если есть фиксированный список
      allowNull: false,
      defaultValue: 'common'
    },
    // Количество предметов в инвентаре торговца
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    // Цена предмета
    price: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    // Время следующего пополнения запасов
    restockTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'restock_time' // Добавляем field для snake_case
    }
    // createdAt и updatedAt будут добавлены автоматически
  }, {
    sequelize,
    modelName: 'MerchantInventory',
    tableName: 'merchant_inventories', // Имя таблицы в snake_case
    timestamps: true,                 // Используем timestamps
    underscored: true                 // Используем snake_case для createdAt и updatedAt
  });
};

// Инициализируем модель сразу для применения изменений
(async () => {
  try {
    await MerchantInventory.init();
    console.log('MerchantInventory модель инициализирована');
  } catch (error) {
    console.error('Ошибка инициализации модели MerchantInventory:', error);
    console.error(error.stack);
  }
})();

module.exports = MerchantInventory;
