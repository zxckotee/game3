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

class EnemyLoot extends Model {
  static associate(models) {
    // Связь с врагом
    this.belongsTo(models.Enemy, {
      foreignKey: 'enemy_id',
      as: 'enemy'
    });
  }
}

EnemyLoot.init = async function() {
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
    itemId: { // Соответствует item_id в SQL
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'item_id' // Явно указываем поле
    },
    name: { // Соответствует name в SQL
      type: DataTypes.STRING(100),
      allowNull: false
    },
    chance: { // Соответствует chance в SQL
      type: DataTypes.INTEGER,
      allowNull: false
    },
    icon: { // Соответствует icon в SQL
      type: DataTypes.STRING(10),
      allowNull: true // В SQL нет NOT NULL, значит может быть NULL
    }
  }, {
    sequelize,
    modelName: 'EnemyLoot',
    tableName: 'enemy_loot', // Имя таблицы в lowercase
    timestamps: false,      // Соответствует SQL
    underscored: true       // Добавлено для консистентности
  });
};

// Инициализируем модель сразу для применения изменений
(async () => {
  try {
    await EnemyLoot.init();
    console.log('EnemyLoot модель инициализирована');
  } catch (error) {
    console.error('Ошибка инициализации модели EnemyLoot:', error);
    console.error(error.stack);
  }
})();

module.exports = EnemyLoot;
