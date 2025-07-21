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

class AchievementProgress extends Model { 
  static associate(models) {
    // Связь с достижением
    AchievementProgress.belongsTo(models.Achievement, {
      foreignKey: 'achievement_id',
      as: 'achievement'
    });
    
    // Связь с пользователем
    AchievementProgress.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  }
}

AchievementProgress.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    // Идентификатор записи
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    // ID пользователя
    user_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // ID достижения
    achievement_id: {
      type: DataTypes.STRING(30),
      allowNull: false,
      references: {
        model: 'achievements',
        key: 'id'
      }
    },
    // Текущий прогресс
    current_value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    // Выполнено ли достижение
    is_completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    // Получена ли награда
    is_rewarded: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    // Дата выполнения
    completion_date: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'AchievementProgress',
    tableName: 'achievement_progress',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'achievement_id']
      }
    ]
  });
};

// Больше не используем самоинициализацию через IIFE
// Инициализация будет происходить централизованно через src/models/initializeModels.js

module.exports = AchievementProgress;