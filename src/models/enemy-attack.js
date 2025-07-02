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

class EnemyAttack extends Model {
  static associate(models) {
    // Связь с врагом
    this.belongsTo(models.Enemy, {
      foreignKey: 'enemy_id',
      as: 'enemy'
    });

    // Связь с эффектами атаки
    this.hasMany(models.EnemyAttackEffect, {
      foreignKey: 'attack_id',
      as: 'effects'
    });
  }
}

EnemyAttack.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    id: { // Соответствует id в SQL
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    enemyId: { // Соответствует enemy_id в SQL
      type: DataTypes.STRING(30),
      field: 'enemy_id', // Явно указываем поле
      references: {
        model: 'enemies', // Имя таблицы в lowercase
        key: 'id'
      }
      // onDelete/onUpdate не указаны в SQL, оставляем по умолчанию
    },
    name: { // Соответствует name в SQL
      type: DataTypes.STRING(50),
      allowNull: false
    },
    damage: { // Соответствует damage в SQL
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: { // Соответствует type в SQL
      type: DataTypes.STRING(20),
      allowNull: false
    },
    chance: { // Соответствует chance в SQL
      type: DataTypes.INTEGER,
      allowNull: false
    },
    energyCost: { // Соответствует energy_cost в SQL
      type: DataTypes.INTEGER,
      defaultValue: 0
      // field убран, так как underscored: true
    }
  }, {
    sequelize,
    modelName: 'EnemyAttack',
    tableName: 'enemy_attacks', // Имя таблицы в lowercase
    timestamps: false,         // Соответствует SQL
    underscored: true          // Добавлено для консистентности
  });
};


module.exports = EnemyAttack;
