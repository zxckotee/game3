const { Model, DataTypes } = require('../services/database');

class QuestObjective extends Model {
  static associate(models) {
    // Связь с квестом
    QuestObjective.belongsTo(models.Quest, {
      foreignKey: 'quest_id',
      as: 'quest'
    });
  }
}

// Определяем схему модели, но не инициализируем
const schema = {
  id: { // Соответствует id в SQL
    type: DataTypes.STRING(30),
    primaryKey: true
  },
  quest_id: { // Соответствует quest_id в SQL
    type: DataTypes.STRING(20),
    allowNull: false,
    references: {
      model: 'quests', // Имя таблицы в lowercase
      key: 'id'
    }
  },
  text: { // Соответствует objective_text в SQL, но сервис использует название text
    type: DataTypes.TEXT,
    field: 'objective_text', // Маппинг на поле в БД
    allowNull: false
  },
  requiredProgress: {
    type: DataTypes.INTEGER,
    field: 'required_progress',
    defaultValue: 1
  },
  type: {
    type: DataTypes.STRING(50),
    field: 'type'
  },
  target: {
    type: DataTypes.STRING(100),
    field: 'target'
  }
  // Поле completed удалено, т.к. прогресс хранится индивидуально для каждого пользователя
  // в таблице quest_progress
};

// Опции модели
const options = {
  modelName: 'QuestObjective',
  tableName: 'quest_objectives', // Имя таблицы в lowercase
  timestamps: false, // В SQL нет полей created_at, updated_at
  underscored: true  // Используем snake_case для имен полей и ассоциаций
};

// Экспортируем функцию инициализации для централизованного вызова
QuestObjective.initialize = function(sequelize) {
  QuestObjective.init(schema, {
    ...options,
    sequelize
  });
  console.log('QuestObjective модель инициализирована');
  return QuestObjective;
};

module.exports = QuestObjective;
