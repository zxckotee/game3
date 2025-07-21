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

class InventoryItem extends Model {
  static associate(models) {
    // Определение связей с другими моделями
    InventoryItem.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  }
}

// Исправление: не используем super за пределами класса
InventoryItem.init = async function() {
  const sequelize = await getSequelize();
  
  // Вызываем метод init стандартным образом
  return Model.init.call(this, {
  // Явно определяем ID для соответствия миграции
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    field: 'user_id', // Явно указываем соответствие с полем user_id в БД
    references: {
      model: 'users', // Имя таблицы в lowercase
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
    // Поле userId не primaryKey и не unique, один пользователь может иметь много предметов
  },
  itemId: { // Добавляем поле itemId, соответствующее item_id в таблице
    type: DataTypes.STRING(45),
    field: 'item_id',
    allowNull: true
  },
  name: { // Соответствует name в миграции
    type: DataTypes.STRING,
    allowNull: false
  },
  description: { // Добавлено поле description из миграции
    type: DataTypes.TEXT
  },
  type: { // Соответствует item_type в миграции
    type: DataTypes.STRING(30), // Используем STRING вместо ENUM, чтобы разрешить любые типы предметов
    allowNull: false,
    field: 'item_type' // Явно указываем соответствие с полем item_type в БД
  },
  rarity: { // Соответствует rarity в миграции
    type: DataTypes.STRING(20), // Используем STRING вместо ENUM, чтобы разрешить любые значения редкости
    defaultValue: 'common'
  },
  stats: { // Переименовано из properties, соответствует stats в миграции
    type: DataTypes.JSONB, // Используем JSONB для PostgreSQL
    defaultValue: {}
  },
  quantity: { // Соответствует quantity в миграции
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  equipped: { // Соответствует equipped в миграции
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  slot: { // Добавляем поле slot из таблицы
    type: DataTypes.STRING(30),
    allowNull: true
  }
  // Поле calculatedBonuses удалено
  // Sequelize автоматически добавит createdAt и updatedAt
  }, {
    sequelize,
    modelName: 'InventoryItem',
    tableName: 'inventory_items', // Исправлено: имя таблицы в snake_case
    timestamps: true,           // Явно указываем использование временных меток
    underscored: true           // Используем snake_case для createdAt и updatedAt (created_at, updated_at)
  });
};

// Больше не используем самоинициализацию через IIFE
// Инициализация будет происходить централизованно через src/models/initializeModels.js

module.exports = InventoryItem;
