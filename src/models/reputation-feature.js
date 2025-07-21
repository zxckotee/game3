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

class ReputationFeature extends Model {
  static associate(models) {
    // Связи могут быть добавлены позже, если потребуется
    // Например, связь с Reputation или другими сущностями
  }
}

ReputationFeature.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    requiredLevel: {
      type: DataTypes.ENUM(
        'дружелюбный', 'уважаемый', 'почитаемый', 'легендарный'
      ),
      allowNull: false,
      field: 'required_level' // Добавляем field для snake_case
    },
    entityType: {
      type: DataTypes.ENUM('city', 'faction', 'global'),
      allowNull: false,
      field: 'entity_type' // Добавляем field для snake_case
    },
    entityId: {
      type: DataTypes.INTEGER, // Может потребоваться UUID в зависимости от сущности
      allowNull: true,
      field: 'entity_id' // Добавляем field для snake_case
    },
    sphere: {
      type: DataTypes.ENUM('combat', 'trade', 'spiritual', 'alchemy', 'political', 'general'),
      allowNull: false
    },
    featureType: {
      type: DataTypes.ENUM('discount', 'access', 'quest', 'item', 'training', 'title'),
      allowNull: false,
      field: 'feature_type' // Добавляем field для snake_case
    },
    data: {
      type: DataTypes.JSONB, // Используем JSONB для PostgreSQL
      defaultValue: {}
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active' // Добавляем field для snake_case
    }
    // createdAt и updatedAt будут добавлены автоматически
  }, {
    sequelize,
    modelName: 'ReputationFeature',
    tableName: 'reputation_features', // Имя таблицы в snake_case
    timestamps: true,                // Используем timestamps
    underscored: true                // Используем snake_case для createdAt и updatedAt
  });
};

// Больше не используем самоинициализацию через IIFE
// Инициализация будет происходить централизованно через src/models/initializeModels.js

module.exports = ReputationFeature;
