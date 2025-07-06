const { Model, DataTypes } = require('../services/database');

class QuestObjectiveProgress extends Model {
  static associate(models) {
    // Связь с пользователем
    QuestObjectiveProgress.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    
    // Связь с целью квеста
    QuestObjectiveProgress.belongsTo(models.QuestObjective, {
      foreignKey: 'objective_id',
      as: 'objective'
    });
  }
}

// Определяем схему модели, но не инициализируем
const schema = {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    field: 'user_id',
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  objectiveId: {
    type: DataTypes.STRING(30),
    field: 'objective_id',
    allowNull: false,
    references: {
      model: 'quest_objectives',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  currentProgress: {
    type: DataTypes.INTEGER,
    field: 'current_progress',
    defaultValue: 0
  },
  requiredProgress: {
    type: DataTypes.INTEGER,
    field: 'required_progress',
    allowNull: false
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  startedAt: {
    type: DataTypes.DATE,
    field: 'started_at',
    defaultValue: DataTypes.NOW
  },
  completedAt: {
    type: DataTypes.DATE,
    field: 'completed_at',
    allowNull: true
  }
  // Sequelize автоматически добавит createdAt и updatedAt
};

// Опции модели
const options = {
  modelName: 'QuestObjectiveProgress',
  tableName: 'quest_objective_progress',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'objective_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['objective_id']
    },
    {
      fields: ['completed']
    },
    {
      fields: ['user_id', 'completed']
    }
  ]
};

// Экспортируем функцию инициализации для централизованного вызова
QuestObjectiveProgress.initialize = function(sequelize) {
  QuestObjectiveProgress.init(schema, {
    ...options,
    sequelize
  });
  console.log('QuestObjectiveProgress модель инициализирована');
  return QuestObjectiveProgress;
};

module.exports = QuestObjectiveProgress;