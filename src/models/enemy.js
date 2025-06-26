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

class Enemy extends Model {
  static associate(models) {
    // Связь с характеристиками врага
    this.hasOne(models.EnemyStats, {
      foreignKey: 'enemy_id', // Используем snake_case
      as: 'stats'
    });

    // Связь с атаками врага
    this.hasMany(models.EnemyAttack, {
      foreignKey: 'enemy_id', // Используем snake_case
      as: 'attacks'
    });

    // Связь с добычей врага
    this.hasMany(models.EnemyLoot, {
      foreignKey: 'enemy_id', // Используем snake_case
      as: 'loot'
    });

    // Связь с валютой врага
    this.hasOne(models.EnemyCurrency, {
      foreignKey: 'enemy_id', // Используем snake_case
      as: 'currency'
    });

    // Связь с точками появления врага
    this.hasMany(models.EnemySpawn, {
      foreignKey: 'enemy_id', // Используем snake_case
      as: 'spawns'
    });
  }
}

Enemy.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    id: { // Соответствует id в SQL
      type: DataTypes.STRING(30),
      primaryKey: true,
      allowNull: false // Добавлено allowNull: false
    },
    name: { // Соответствует name в SQL
      type: DataTypes.STRING(100),
      allowNull: false
    },
    icon: { // Соответствует icon в SQL
      type: DataTypes.STRING(10)
    },
    description: { // Соответствует description в SQL
      type: DataTypes.TEXT
    },
    level: { // Соответствует level в SQL
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    category: { // Соответствует category в SQL
      type: DataTypes.STRING(30),
      allowNull: false
    },
    experience: { // Соответствует experience в SQL
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Enemy',
    tableName: 'enemies', // Имя таблицы в lowercase
    timestamps: false,   // Соответствует SQL
    underscored: true    // Добавлено для корректной работы связей
  });
};

// Больше не используем самоинициализацию через IIFE
// Инициализация будет происходить централизованно через src/models/initializeModels.js

module.exports = Enemy;
