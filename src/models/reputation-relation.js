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

class ReputationRelation extends Model {
  static associate(models) {
    // Связи могут быть добавлены позже, если потребуется
  }
}

ReputationRelation.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sourceType: {
      type: DataTypes.ENUM('city', 'faction', 'global'),
      allowNull: false,
      field: 'source_type' // Добавляем field для snake_case
    },
    sourceId: {
      type: DataTypes.INTEGER, // Может потребоваться UUID
      allowNull: true,
      field: 'source_id' // Добавляем field для snake_case
    },
    sourceSphere: {
      type: DataTypes.ENUM('combat', 'trade', 'spiritual', 'alchemy', 'political', 'general'),
      allowNull: false,
      field: 'source_sphere' // Добавляем field для snake_case
    },
    targetType: {
      type: DataTypes.ENUM('city', 'faction', 'global'),
      allowNull: false,
      field: 'target_type' // Добавляем field для snake_case
    },
    targetId: {
      type: DataTypes.INTEGER, // Может потребоваться UUID
      allowNull: true,
      field: 'target_id' // Добавляем field для snake_case
    },
    targetSphere: {
      type: DataTypes.ENUM('combat', 'trade', 'spiritual', 'alchemy', 'political', 'general'),
      allowNull: false,
      field: 'target_sphere' // Добавляем field для snake_case
    },
    impactFactor: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: 'impact_factor', // Добавляем field для snake_case
      validate: {
        min: -1.0,
        max: 1.0
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active' // Добавляем field для snake_case
    }
    // createdAt и updatedAt будут добавлены автоматически
  }, {
    sequelize,
    modelName: 'ReputationRelation',
    tableName: 'reputation_relations', // Имя таблицы в snake_case
    timestamps: true,                 // Используем timestamps
    underscored: true                 // Используем snake_case для createdAt и updatedAt
  });
};

// Инициализируем модель сразу для применения изменений
(async () => {
  try {
    await ReputationRelation.init();
    console.log('ReputationRelation модель инициализирована');
  } catch (error) {
    console.error('Ошибка инициализации модели ReputationRelation:', error);
    console.error(error.stack);
  }
})();

module.exports = ReputationRelation;
