/**
 * Модель для единого каталога предметов игры
 */
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

class ItemCatalog extends Model {
  static associate(models) {
    // Связи с другими моделями можно добавить здесь при необходимости
  }
}

// Определяем инициализацию модели асинхронно
ItemCatalog.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    item_id: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
      field: 'item_id'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'name'
    },
    type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: 'type'
    },
    rarity: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'common',
      field: 'rarity'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'description'
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'price'
    },
    source_table: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: 'source_table'
    }
  }, {
    sequelize,
    modelName: 'ItemCatalog',
    tableName: 'item_catalog',
    timestamps: false,
    underscored: true
  });
};

module.exports = ItemCatalog;