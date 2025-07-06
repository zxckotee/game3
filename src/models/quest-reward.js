const { Model, DataTypes } = require('../services/database');

class QuestReward extends Model {
  static associate(models) {
    // Связь с квестом
    QuestReward.belongsTo(models.Quest, {
      foreignKey: 'questId',
      as: 'quest'
    });
  }
}

// Определяем схему модели, но не инициализируем
const schema = {
  id: { // Соответствует id в SQL
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  questId: { // Используем camelCase для Sequelize
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'quest_id', // Маппинг на snake_case в БД
    references: {
      model: 'quests', // Имя таблицы в lowercase
      key: 'id'
    }
  },
  type: { // Соответствует type в SQL
    type: DataTypes.STRING(20),
    allowNull: false
  },
  itemId: { // Соответствует item_id в SQL
    type: DataTypes.STRING(50)
  },
  amount: { // Соответствует amount в SQL
    type: DataTypes.INTEGER
  },
  gold: { // Соответствует gold в SQL
    type: DataTypes.INTEGER
  },
  silver: { // Соответствует silver в SQL
    type: DataTypes.INTEGER
  },
  copper: { // Соответствует copper в SQL
    type: DataTypes.INTEGER
  },
  icon: { // Соответствует icon в SQL
    type: DataTypes.STRING(10)
  }
};

// Опции модели
const options = {
  modelName: 'QuestReward',
  tableName: 'quest_rewards', // Имя таблицы в lowercase
  timestamps: false, // В SQL нет полей created_at, updated_at
  underscored: true  // Используем snake_case для имен полей и ассоциаций
};

// Экспортируем функцию инициализации для централизованного вызова
QuestReward.initialize = function(sequelize) {
  QuestReward.init(schema, {
    ...options,
    sequelize
  });
  console.log('QuestReward модель инициализирована');
  return QuestReward;
};

module.exports = QuestReward;
