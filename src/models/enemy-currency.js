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

class EnemyCurrency extends Model {
  static associate(models) {
    // Связь с врагом
    this.belongsTo(models.Enemy, {
      foreignKey: 'enemy_id',
      as: 'enemy'
    });
  }
}

EnemyCurrency.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    enemyId: { // Соответствует enemy_id в SQL
      type: DataTypes.STRING(30),
      primaryKey: true,
      field: 'enemy_id', // Явно указываем поле
      references: {
        model: 'enemies', // Имя таблицы в lowercase
        key: 'id'
      }
      // onDelete/onUpdate не указаны в SQL, оставляем по умолчанию
    },
    minAmount: { // Соответствует min_amount в SQL
      type: DataTypes.INTEGER,
      allowNull: false
      // field убран, так как underscored: true
    },
    maxAmount: { // Соответствует max_amount в SQL
      type: DataTypes.INTEGER,
      allowNull: false
      // field убран, так как underscored: true
    }
  }, {
    sequelize,
    modelName: 'EnemyCurrency',
    tableName: 'enemy_currency', // Имя таблицы в lowercase
    timestamps: false,          // Соответствует SQL
    underscored: true           // Добавлено для консистентности
  });
};

// Инициализируем модель сразу для применения изменений
(async () => {
  try {
    await EnemyCurrency.init();
    console.log('EnemyCurrency модель инициализирована');
  } catch (error) {
    console.error('Ошибка инициализации модели EnemyCurrency:', error);
    console.error(error.stack);
  }
})();

module.exports = EnemyCurrency;
