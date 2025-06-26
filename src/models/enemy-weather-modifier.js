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

class EnemyWeatherModifier extends Model {
  // Определение связей с другими моделями (если есть)
  static associate(models) {
    // Здесь можно добавить связи, если они появятся
  }
}

EnemyWeatherModifier.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    weatherType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: 'weather_type'
    },
    category: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    modifier: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.0
    }
  }, {
    sequelize,
    modelName: 'EnemyWeatherModifier',
    tableName: 'enemy_weather_modifiers',
    timestamps: false,
    underscored: true
  });
};

// Больше не используем самоинициализацию через IIFE
// Инициализация будет происходить централизованно через src/models/initializeModels.js

module.exports = EnemyWeatherModifier;