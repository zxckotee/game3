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

class Achievement extends Model {
  static associate(models) {
    // Связь с прогрессом достижений пользователей
    Achievement.hasMany(models.AchievementProgress, {
      foreignKey: 'achievement_id',
      as: 'progress'
    });
  } 
}
 
Achievement.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    // Идентификатор достижения
    id: {
      type: DataTypes.STRING(30),
      primaryKey: true,
      allowNull: false
    },
    // Название достижения
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    // Описание достижения
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    // Иконка достижения
    icon: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    // Категория достижения
    category: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    // Награды за достижение в формате JSON
    rewards: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('rewards');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('rewards', JSON.stringify(value));
      }
    },
    // Требуемое значение для выполнения достижения
    required_value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    // Скрытое ли достижение
    is_hidden: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    // Порядок отображения достижения
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Achievement',
    tableName: 'achievements',
    timestamps: true,
    underscored: true
  });
};

// Больше не используем самоинициализацию через IIFE
// Инициализация будет происходить централизованно через src/models/initializeModels.js

module.exports = Achievement;