/**
 * Модель экземпляра групповой активности
 * Отслеживает конкретный запуск активности определенной группой
 */
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

class GroupActivityInstance extends Model {
  static associate(models) {
    // Связь с группой
    GroupActivityInstance.belongsTo(models.Group, {
      foreignKey: 'groupId', // Оставляем camelCase
      as: 'group'
    });
    // Связь с типом активности
    GroupActivityInstance.belongsTo(models.GroupActivity, {
      foreignKey: 'activityId', // Оставляем camelCase
      as: 'activity'
    });
    // Связь с наградами
    GroupActivityInstance.hasMany(models.GroupReward, {
      foreignKey: 'activityInstanceId', // Оставляем camelCase
      as: 'rewards'
    });
  }
}

GroupActivityInstance.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  groupId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'groups', // Имя таблицы в lowercase
      key: 'id'
    }
    // onDelete/onUpdate не указаны в миграции, оставляем по умолчанию
  },
  activityId: { // Соответствует activityId в миграции
    type: DataTypes.UUID,
    allowNull: false,
    field: 'activity_id', // Добавляем field для snake_case
    references: {
      model: 'group_activities', // Имя таблицы в lowercase
      key: 'id'
    }
    // onDelete/onUpdate не указаны в миграции, оставляем по умолчанию
  },
  status: { // Соответствует status в миграции
    type: DataTypes.ENUM,
    values: ['preparing', 'in_progress', 'completed', 'failed', 'abandoned'],
    allowNull: false,
    defaultValue: 'preparing'
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  currentStage: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Текущий этап прохождения активности'
  },
  totalStages: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Общее количество этапов активности'
  },
  progress: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Прогресс выполнения в процентах (0-100)'
  },
  difficulty: {
    type: DataTypes.ENUM,
    values: ['easy', 'medium', 'hard', 'extreme', 'legendary'],
    allowNull: false,
    comment: 'Выбранная сложность для данного запуска активности'
  },
  participants: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Список ID участников с их ролями'
  },
  battleLog: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Лог сражений во время активности'
  },
  rewardsDistributed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  specialConditions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Особые условия для конкретного запуска активности'
  },
  weatherConditions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Погодные условия во время активности'
  }
  // Поля createdAt и updatedAt удалены, так как timestamps: true и underscored: true их обработают
}, {
  sequelize,
  modelName: 'GroupActivityInstance',
  tableName: 'group_activity_instances', // Имя таблицы в lowercase
  timestamps: true,                     // Явно указываем использование временных меток
  underscored: true                     // Используем snake_case для createdAt и updatedAt (created_at, updated_at)
});
};

// Инициализируем модель сразу для применения изменений
(async () => {
  try {
    await GroupActivityInstance.init();
    console.log('GroupActivityInstance модель инициализирована');
  } catch (error) {
    console.error('Ошибка инициализации модели GroupActivityInstance:', error);
    console.error(error.stack);
  }
})();

module.exports = GroupActivityInstance;
