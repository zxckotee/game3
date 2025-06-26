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

class Technique extends Model {
  static associate(models) {
    // Определение связей с другими моделями
    Technique.hasMany(models.TechniqueEffect, {
      foreignKey: 'technique_id', // Используем snake_case
      as: 'effects',
      constraints: true,
      onDelete: 'CASCADE'
    });
    Technique.hasMany(models.LearnedTechnique, {
      foreignKey: 'techniqueId', // Здесь оставляем camelCase, так как в LearnedTechnique используется userId и techniqueId
      as: 'learnedBy',
      constraints: true,
      onDelete: 'CASCADE'
    });
  }
}

// Исправление: не используем super за пределами класса
Technique.init = async function() {
  const sequelize = await getSequelize();
  
  // Вызываем метод init стандартным образом
  return Model.init.call(this, {
    id: { // Соответствует id в SQL
      type: DataTypes.STRING(30),
      primaryKey: true,
      allowNull: false
    },
    name: { // Соответствует name в SQL
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: { // Соответствует description в SQL
      type: DataTypes.TEXT
    },
    icon: { // Соответствует icon в SQL
      type: DataTypes.STRING(10)
    },
    level: { // Соответствует level в SQL
      type: DataTypes.INTEGER,
      defaultValue: 0  // Изменено с 1 на 0, чтобы соответствовать SQL-определению
    },
    damage: { // Соответствует damage в SQL
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    damageType: { // Соответствует damage_type в SQL
      type: DataTypes.STRING(20),
      field: 'damage_type'
    },
    energyCost: { // Соответствует energy_cost в SQL
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'energy_cost'
    },
    cooldown: { // Соответствует cooldown в SQL
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    maxLevel: { // Соответствует max_level в SQL
      type: DataTypes.INTEGER,
      defaultValue: 5,
      field: 'max_level'
    },
    type: { // Соответствует type в SQL
      type: DataTypes.STRING(20)
    },
    requiredLevel: { // Соответствует required_level в SQL
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'required_level'
    },
    healing: { // Соответствует healing в SQL
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
    // Поле element удалено
  }, {
    sequelize,
    modelName: 'Technique',
    tableName: 'techniques', // Исправлено: имя таблицы в lowercase
    timestamps: false       // В SQL нет полей created_at, updated_at
  });
};

// Больше не используем самоинициализацию через IIFE
// Инициализация будет происходить централизованно через src/models/initializeModels.js

module.exports = Technique;
