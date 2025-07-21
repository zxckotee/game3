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

class EnemyAttackEffect extends Model {
  static associate(models) {
    // Связь с атакой
    this.belongsTo(models.EnemyAttack, {
      foreignKey: 'attack_id',
      as: 'attack'
    });
  }
}

EnemyAttackEffect.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    id: { // Соответствует id в SQL
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    attackId: { // Соответствует attack_id в SQL
      type: DataTypes.INTEGER,
      field: 'attack_id', // Явно указываем поле
      references: {
        model: 'enemy_attacks', // Имя таблицы в lowercase
        key: 'id'
      }
      // onDelete/onUpdate не указаны в SQL, оставляем по умолчанию
    },
    type: { // Соответствует type в SQL
      type: DataTypes.STRING(30),
      allowNull: false
    },
    duration: { // Соответствует duration в SQL
      type: DataTypes.INTEGER,
      allowNull: true // Оставляем allowNull: true для гибкости
    },
    statName: { // Соответствует stat_name в SQL
      type: DataTypes.STRING(50),
      allowNull: true // Оставляем allowNull: true для гибкости
      // field убран, так как underscored: true
    },
    statValue: { // Соответствует stat_value в SQL
      type: DataTypes.INTEGER,
      allowNull: true // Оставляем allowNull: true для гибкости
      // field убран, так как underscored: true
    }
  }, {
    sequelize,
    modelName: 'EnemyAttackEffect',
    tableName: 'enemy_attacks_effects', // Имя таблицы в lowercase
    timestamps: false,                 // Соответствует SQL
    underscored: true                  // Добавлено для консистентности
  });
};

// Больше не используем самоинициализацию через IIFE
// Инициализация будет происходить централизованно через src/models/initializeModels.js

module.exports = EnemyAttackEffect;
