const { Model, DataTypes } = require('../services/database');

class Quest extends Model {
  static associate(models) {
    // Связь с целями квеста
    Quest.hasMany(models.QuestObjective, {
      foreignKey: 'quest_id',
      as: 'objectives'
    });
    // Связь с наградами за квест
    Quest.hasMany(models.QuestReward, {
      foreignKey: 'quest_id',
      as: 'rewards'
    });
    // Связь с категориями квестов
    Quest.belongsTo(models.QuestCategory, {
      foreignKey: 'category',
      as: 'category'
    });
  }
}

// Определяем схему модели, но не инициализируем
const schema = {
  id: { // Соответствует id в SQL
    type: DataTypes.STRING(20),
    primaryKey: true
  },
  title: { // Соответствует title в SQL
    type: DataTypes.STRING(100),
    allowNull: false
  },
  category: { // Соответствует category в SQL
    type: DataTypes.STRING(50),
    references: { model: 'quest_categories', key: 'id' } // Ссылка на таблицу категорий
  },
  difficulty: { // Соответствует difficulty в SQL
    type: DataTypes.STRING(20)
  },
  description: { // Соответствует description в SQL
    type: DataTypes.TEXT
  },
  status: { // Соответствует status в SQL
    type: DataTypes.STRING(20)
  },
  requiredLevel: { // Соответствует required_level в SQL
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'required_level'
  },
  repeatable: { // Соответствует repeatable в SQL
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
  // Поле rewards удалено, так как награды в отдельной таблице
};

// Опции модели
const options = {
  modelName: 'Quest',
  tableName: 'quests', // Исправлено: имя таблицы в lowercase
  timestamps: false,   // В SQL нет полей created_at, updated_at
  underscored: true    // Используем snake_case для имен полей и ассоциаций
};

// Экспортируем функцию инициализации для централизованного вызова
Quest.initialize = function(sequelize) {
  Quest.init(schema, {
    ...options,
    sequelize
  });
  console.log('Quest модель инициализирована');
  return Quest;
};

module.exports = Quest;
