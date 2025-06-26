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

class LearnedTechnique extends Model {
  static associate(models) {
    // Определение связей с другими моделями
    LearnedTechnique.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      constraints: true,
      onDelete: 'CASCADE'
    });
    
    LearnedTechnique.belongsTo(models.Technique, {
      foreignKey: 'techniqueId',
      as: 'technique',
      constraints: true,
      onDelete: 'CASCADE'
    });
  }
}

// Исправление: не используем super за пределами класса
LearnedTechnique.init = async function() {
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
    references: {
      model: 'users', // Имя таблицы в lowercase
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  techniqueId: {
    type: DataTypes.STRING(30), // Исправлено на VARCHAR(30) согласно SQL скрипту
    references: {
      model: 'techniques', // Имя таблицы в lowercase
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  level: { // Поле level из SQL скрипта
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  masteryLevel: { // Соответствует mastery_level в SQL скрипте
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  experience: { // Соответствует experience в SQL скрипте
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isMastered: { // Добавлено поле is_mastered из SQL скрипта (вместо isEquipped)
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  learnedAt: { // Соответствует learned_at в SQL скрипте
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  lastUsed: { // Соответствует last_used в SQL скрипте
    type: DataTypes.DATE
  }
  // Sequelize автоматически добавит createdAt и updatedAt
  }, {
    sequelize,
    modelName: 'LearnedTechnique',
    tableName: 'learned_techniques', // Исправлено: имя таблицы в snake_case
    timestamps: true,               // Явно указываем использование временных меток
    underscored: true               // Используем snake_case для createdAt и updatedAt (created_at, updated_at)
  });
};

// Больше не используем самоинициализацию через IIFE
// Инициализация будет происходить централизованно через src/models/initializeModels.js

module.exports = LearnedTechnique;
