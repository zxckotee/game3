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

class MarketItem extends Model {
  static associate(models) {
    // Связь с продавцом (User)
    MarketItem.belongsTo(models.User, {
      foreignKey: 'sellerId', // Оставляем camelCase
      as: 'seller'
    });
    // Возможно, связь с InventoryItem, если itemId ссылается на него
    // MarketItem.belongsTo(models.InventoryItem, { foreignKey: 'itemId', as: 'item' });
  }
}

MarketItem.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    itemId: {
      type: DataTypes.INTEGER, // Предполагаем, что это ID из InventoryItems
      allowNull: false,
      field: 'item_id' // Добавляем field для snake_case
      // references: { model: 'inventory_items', key: 'id' } // Добавить, если есть связь
    },
    itemType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'item_type' // Добавляем field для snake_case
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sellerId: {
      type: DataTypes.INTEGER, // Предполагаем, что это ID из Users
      allowNull: false,
      field: 'seller_id', // Добавляем field для snake_case
      references: {
        model: 'users', // Имя таблицы в lowercase
        key: 'id'
      }
    }
    // createdAt будет добавлено автоматически
  }, {
    sequelize,
    modelName: 'MarketItem',
    tableName: 'market_items', // Имя таблицы в snake_case
    timestamps: true,         // Используем timestamps
    updatedAt: false,         // Отключаем updatedAt, если он не нужен
    underscored: true         // Используем snake_case для createdAt (created_at)
  });
};

// Больше не используем самоинициализацию через IIFE
// Инициализация будет происходить централизованно через src/models/initializeModels.js

module.exports = MarketItem;
