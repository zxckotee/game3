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

class CultivationProgress extends Model {
  static associate(models) {
    // Определение связей с другими моделями
    CultivationProgress.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  }
}

// Исправление: не используем super за пределами класса
CultivationProgress.init = async function() {
  const sequelize = await getSequelize();

  // Вызываем метод init стандартным образом
  return Model.init.call(this, {
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',  // Имя таблицы в lowercase
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    unique: true
  },
  stage: {
    type: DataTypes.ENUM('Закалка тела', 'Очищение Ци', 'Золотое ядро', 'Формирование души'),
    defaultValue: 'Закалка тела'
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  experience: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  experienceToNextLevel: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  breakthroughProgress: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  dailyCultivationLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 1000
  },
  dailyCultivationUsed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastCultivationReset: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  energy: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  maxEnergy: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  // Новые поля для расширенной системы культивации
  tribulationCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  insightPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  bottleneckProgress: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  requiredBottleneckProgress: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  lastInsightTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  cultivationEfficiency: {
    type: DataTypes.FLOAT,
    defaultValue: 1.0
  },
  requiredResources: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
  }, {
    sequelize,
    modelName: 'CultivationProgress',
    tableName: 'cultivation_progresses', // Правильное имя таблицы во множественном числе
    underscored: true                    // Использование snake_case для полей
  });
};

// Больше не используем самоинициализацию через IIFE
// Инициализация будет происходить централизованно через src/models/initializeModels.js

module.exports = CultivationProgress;
