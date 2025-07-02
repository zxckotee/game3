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

class EnemyStats extends Model {
  static associate(models) {
    // Связь с врагом
    this.belongsTo(models.Enemy, {
      foreignKey: 'enemy_id',
      as: 'enemy'
    });
  }
}

EnemyStats.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    enemyId: { // Соответствует enemy_id в SQL
      type: DataTypes.STRING(30),
      primaryKey: true,
      field: 'enemy_id', // Явно указываем поле для внешнего ключа
      references: {
        model: 'enemies', // Имя таблицы в lowercase
        key: 'id'
      }
      // onDelete/onUpdate не указаны в SQL, оставляем по умолчанию
    },
    health: { // Соответствует health в SQL
      type: DataTypes.INTEGER,
      allowNull: false
    },
    energy: { // Соответствует energy в SQL
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    physicalDefense: { // Соответствует physical_defense в SQL
      type: DataTypes.INTEGER,
      defaultValue: 0
      // field убран, так как underscored: true
    },
    spiritualDefense: { // Соответствует spiritual_defense в SQL
      type: DataTypes.INTEGER,
      defaultValue: 0
      // field убран, так как underscored: true
    },
    accuracy: { // Соответствует accuracy в SQL
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    evasion: { // Соответствует evasion в SQL
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'EnemyStats',
    tableName: 'enemy_stats', // Имя таблицы в lowercase
    timestamps: false,       // Соответствует SQL
    underscored: true        // Добавлено для консистентности
  });
};


module.exports = EnemyStats;
