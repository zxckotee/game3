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

class EnemySpawn extends Model {
  static associate(models) {
    // Связь с врагом
    this.belongsTo(models.Enemy, {
      foreignKey: 'enemy_id',
      as: 'enemy'
    });
  }
}

EnemySpawn.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    id: { // Соответствует id в SQL
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    locationId: { // Соответствует location_id в SQL
      type: DataTypes.STRING(30),
      allowNull: false
      // field убран
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
    minLevel: { // Соответствует min_level в SQL
      type: DataTypes.INTEGER,
      defaultValue: 1
      // field убран
    },
    maxLevel: { // Соответствует max_level в SQL
      type: DataTypes.INTEGER,
      defaultValue: 1
      // field убран
    },
    weight: { // Соответствует weight в SQL
      type: DataTypes.INTEGER,
      allowNull: false
    },
    timeOfDay: { // Соответствует time_of_day в SQL
      type: DataTypes.STRING(20)
      // allowNull убран, так как в SQL нет NOT NULL
      // field убран
    },
    weatherCondition: { // Соответствует weather_condition в SQL
      type: DataTypes.STRING(20)
      // allowNull убран, так как в SQL нет NOT NULL
      // field убран
    }
  }, {
    sequelize,
    modelName: 'EnemySpawn',
    tableName: 'enemy_spawns', // Имя таблицы в lowercase
    timestamps: false,        // Соответствует SQL
    underscored: true         // Добавлено для консистентности
  });
};

// Инициализируем модель сразу для применения изменений
(async () => {
  try {
    await EnemySpawn.init();
    console.log('EnemySpawn модель инициализирована');
  } catch (error) {
    console.error('Ошибка инициализации модели EnemySpawn:', error);
    console.error(error.stack);
  }
})();

module.exports = EnemySpawn;
