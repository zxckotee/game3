const { Model, DataTypes } = require('../services/database');

class QuestProgress extends Model {
  static associate(models) {
    // Определение связей с другими моделями
    QuestProgress.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    QuestProgress.belongsTo(models.Quest, {
      foreignKey: 'questId',
      as: 'quest'
    });
  }
}

// Определяем схему модели, но не инициализируем
const schema = {
  // Явно определяем ID для соответствия миграции
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    field: 'user_id', // Маппинг на snake_case в базе данных
    references: {
      model: 'users', // Имя таблицы в lowercase
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  questId: {
    type: DataTypes.STRING(20), // Исправлен тип для соответствия модели Quest
    field: 'quest_id', // Маппинг на snake_case в базе данных
    references: {
      model: 'quests', // Имя таблицы в lowercase
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  status: { // Соответствует status в миграции
    type: DataTypes.ENUM('available', 'active', 'completed', 'failed'),
    defaultValue: 'available'
  },
  progress: { // Соответствует progress в миграции
    type: DataTypes.JSONB, // Изменен тип на JSONB для хранения JSON объекта с прогрессом
    defaultValue: {} // Значение по умолчанию - пустой объект
  },
  completedObjectives: { // Добавлено поле completedObjectives из миграции
    type: DataTypes.JSONB,
    field: 'completed_objectives', // Маппинг на snake_case в базе данных
    defaultValue: []
  },
  startedAt: { // Соответствует startedAt в миграции
    type: DataTypes.DATE,
    field: 'started_at' // Маппинг на snake_case в базе данных
  },
  completedAt: { // Соответствует completedAt в миграции
    type: DataTypes.DATE,
    field: 'completed_at' // Маппинг на snake_case в базе данных
  }
  // Sequelize автоматически добавит createdAt и updatedAt
};

// Опции модели
const options = {
  modelName: 'QuestProgress',
  tableName: 'quest_progress', // Имя таблицы в snake_case
  timestamps: true,           // Явно указываем использование временных меток
  underscored: true           // Используем snake_case для createdAt и updatedAt (created_at, updated_at)
};

// Экспортируем функцию инициализации для централизованного вызова
QuestProgress.initialize = function(sequelize) {
  QuestProgress.init(schema, {
    ...options,
    sequelize
  });
  console.log('QuestProgress модель инициализирована');
  return QuestProgress;
};

module.exports = QuestProgress;
