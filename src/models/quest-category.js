const { Model, DataTypes } = require('../services/database');

class QuestCategory extends Model {
  static associate(models) {
    // Связь с квестами
    QuestCategory.hasMany(models.Quest, {
      foreignKey: 'category',
      as: 'quests'  // Это определение обратной связи, не меняем
    });
  }
}

// Определяем схему модели, но не инициализируем
const schema = {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
  // Поле description удалено, так как его нет в таблице quest_categories
};

// Опции модели
const options = {
  modelName: 'QuestCategory',
  tableName: 'quest_categories',
  timestamps: false,
  underscored: true  // Используем snake_case для имен полей и ассоциаций
};

// Экспортируем функцию инициализации для централизованного вызова
QuestCategory.initialize = function(sequelize) {
  QuestCategory.init(schema, {
    ...options,
    sequelize
  });
  console.log('QuestCategory модель инициализирована');
  return QuestCategory;
};

module.exports = QuestCategory;